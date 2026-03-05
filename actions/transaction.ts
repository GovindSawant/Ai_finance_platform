"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/app/lib/arcjet";
import { request } from "@arcjet/next";
import { z } from "zod";
import { calculateNextRecurringDate } from "@/lib/date-utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Default model to use
const DEFAULT_MODEL = "gemini-1.5-flash";

// Validation Schemas
const TransactionSchema = z.object({
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.date(),
  category: z.string(),
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
});

type TransactionData = z.infer<typeof TransactionSchema>;

// Helper: get a generative model with fallback
async function getGenerativeModel(preferred = DEFAULT_MODEL) {
  try {
    return genAI.getGenerativeModel({ model: preferred });
  } catch (err) {
    console.error(`Model ${preferred} not available, falling back`, err);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fallback to 1.5 if 2.0 fails
  }
}

const serializeAmount = (obj: any) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data: TransactionData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const req = await request();

    // Rate limiting with Arcjet
    const decision = await aj.protect(req, {
      userId,
      requested: 1,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: { remaining, resetInSeconds: reset },
        });
        throw new Error("Too many requests. Please try again later.");
      }
      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: { id: data.accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    // Validate data
    const validatedData = TransactionSchema.parse(data);

    const balanceChange = validatedData.type === "EXPENSE" ? -validatedData.amount : validatedData.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...validatedData,
          userId: user.id,
          nextRecurringDate:
            validatedData.isRecurring && validatedData.recurringInterval
              ? calculateNextRecurringDate(validatedData.date, validatedData.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: (error as any).errors[0].message };
    }
    console.error("createTransaction error:", error);
    throw new Error("Failed to create transaction");
  }
}

export async function getTransaction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: { id, userId: user.id },
  });
  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id: string, data: TransactionData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const validatedData = TransactionSchema.parse(data);

    const originalTransaction = await db.transaction.findUnique({
      where: { id, userId: user.id },
      include: { account: true },
    });
    if (!originalTransaction) throw new Error("Transaction not found");

    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      validatedData.type === "EXPENSE" ? -validatedData.amount : validatedData.amount;

    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id, userId: user.id },
        data: {
          ...validatedData,
          nextRecurringDate:
            validatedData.isRecurring && validatedData.recurringInterval
              ? calculateNextRecurringDate(validatedData.date, validatedData.recurringInterval)
              : null,
        },
      });

      // Handle account switch
      if (originalTransaction.accountId !== validatedData.accountId) {
        await tx.account.update({
          where: { id: originalTransaction.accountId },
          data: { balance: { decrement: oldBalanceChange } },
        });
        await tx.account.update({
          where: { id: validatedData.accountId },
          data: { balance: { increment: newBalanceChange } },
        });
      } else {
        await tx.account.update({
          where: { id: validatedData.accountId },
          data: { balance: { increment: newBalanceChange - oldBalanceChange } },
        });
      }

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${validatedData.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    console.error("updateTransaction error:", error);
    throw new Error("Failed to update transaction");
  }
}

export async function getUserTransactions(query: any = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: { userId: user.id, ...query },
      include: { account: true },
      orderBy: { date: "desc" },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("getUserTransactions error:", error);
    throw new Error("Failed to fetch transactions");
  }
}

// Scan Receipt
export async function scanReceipt(file: File) {
  try {
    const model = await getGenerativeModel();

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)

      Only respond with valid JSON:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64String, mimeType: file.type } },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    const data = JSON.parse(cleanedText);

    return {
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      merchantName: data.merchantName,
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}



// Scan Bank PDF
export async function scanBankPdf(file: File, accountId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    const model = await getGenerativeModel();

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Extract all transactions from this bank statement into an array of JSON objects.
      The statement might be an image or a PDF.

      Return JSON format:
      [
        {
          "date": "ISO date string (YYYY-MM-DD)",
          "amount": number,
          "type": "CREDIT" or "DEBIT",
          "description": "string",
          "category": "string"
        }
      ]
      
      For 'category', suggest a category based on the description (e.g., groceries, transport, utilities, etc.).
      Only respond with valid JSON.
    `;

    const result = await model.generateContent([
      { inlineData: { data: base64String, mimeType: file.type } },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text().replace(/```(?:json)?\n?/g, "").trim();

    console.log("Raw Gemini output:", text);

    let transactions;
    try {
      transactions = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini output:", text);
      throw new Error("Invalid AI response, could not parse JSON");
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error("No transactions extracted from statement");
    }

    const typeMap: Record<string, "INCOME" | "EXPENSE"> = {
      CREDIT: "INCOME",
      DEBIT: "EXPENSE",
      INCOME: "INCOME",
      EXPENSE: "EXPENSE",
    };

    let balanceChange = 0;

    const savedTransactions = await db.$transaction(async (tx) => {
      const createdTxs = [];

      for (const txData of transactions) {
        console.log("Processing transaction:", txData);

        const parsedDate = txData.date ? new Date(txData.date) : null;
        if (parsedDate && isNaN(parsedDate.getTime())) {
          console.warn("Skipping invalid date:", txData.date);
          continue;
        }

        const type = typeMap[txData.type?.toUpperCase()] || "EXPENSE";
        const amount = Number(txData.amount) || 0;

        balanceChange += type === "EXPENSE" ? -amount : amount;

        const created = await tx.transaction.create({
          data: {
            accountId,
            userId: user.id,
            date: parsedDate || new Date(),
            amount,
            type,
            description: txData.description || "",
            category: txData.category || "other-expense",
            isRecurring: false,
          },
        });

        console.log("Inserted transaction:", created);
        createdTxs.push(created);
      }

      if (createdTxs.length > 0) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: account.balance.toNumber() + balanceChange },
        });
      }

      return createdTxs;
    });

    console.log("Final saved transactions:", savedTransactions);

    revalidatePath("/dashboard");
    revalidatePath(`/account/${accountId}`);

    return { success: true, data: savedTransactions.map(serializeAmount) };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error scanning bank PDF:", error.message);
      throw new Error(`Failed to scan bank statement: ${error.message}`);
    }
    throw new Error("Failed to scan bank statement");
  }
}
