// classifier.js
import natural from "natural";
import fs from "fs";

// Create Naive Bayes classifier
const classifier = new natural.BayesClassifier();

// --- Training examples ---
// Debit transactions
classifier.addDocument("Amazon purchase -50.00", "DEBIT");
classifier.addDocument("ATM withdrawal -200.00", "DEBIT");
classifier.addDocument("Grocery shopping -120.75", "DEBIT");
classifier.addDocument("Electricity bill payment -90.50", "DEBIT");

// Credit transactions
classifier.addDocument("Salary credit +2000.00", "CREDIT");
classifier.addDocument("Refund from Amazon +150.00", "CREDIT");
classifier.addDocument("Interest credited +50.00", "CREDIT");
classifier.addDocument("Transfer from John +500.00", "CREDIT");

// Ignore (noise in statements)
classifier.addDocument("Balance as of", "IGNORE");
classifier.addDocument("Account Summary", "IGNORE");
classifier.addDocument("Page 1 of 3", "IGNORE");
classifier.addDocument("Available Balance", "IGNORE");
classifier.addDocument("Opening Balance", "IGNORE");

// --- Train the model ---
classifier.train();

// --- Save model to disk ---
classifier.save("classifier.json", (err) => {
  if (err) console.error("❌ Error saving classifier:", err);
  else console.log("✅ Classifier saved successfully!");
});
