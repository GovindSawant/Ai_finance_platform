import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../transaction-form";
import { getTransaction } from "@/actions/transaction";
import BankStatementUpload from "@/components/BankStatementUpload";

export default async function AddTransactionPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const accounts = await getUserAccounts();
  const params = await searchParams;
  const editId = params?.edit || null;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="max-w-3xl mx-auto px-5 space-y-10 mb-20">
      {/* Page title */}
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title font-bold">Add Transaction</h1>
      </div>

      {/* Manual Add Transaction Form */}
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />

      {/* PDF Upload Section */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Scan Bank Statement</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a bank statement (PDF or Image) to automatically extract and add transactions.
          Powered by Gemini AI.
        </p>
        <BankStatementUpload
          accounts={accounts}
        />
      </div>
    </div>
  );
}
