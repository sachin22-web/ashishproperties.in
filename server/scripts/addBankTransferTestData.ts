import { connectToDatabase, getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";

export const addBankTransferTestData = async () => {
  try {
    // ✅ Step 1: Connect to DB first
    await connectToDatabase();

    // ✅ Step 2: Now get the connected DB
    const db = getDatabase();

    // Check if test data already exists
    const existingTransfers = await db.collection("bank_transfers").countDocuments();

    if (existingTransfers > 0) {
      console.log(`📊 Bank transfers collection already has ${existingTransfers} records`);
      return;
    }

    console.log("📦 Adding test bank transfer data...");

    const sampleTransfers = [
      // ✅ your same test data here...
    ];

    const result = await db.collection("bank_transfers").insertMany(sampleTransfers);

    console.log(`✅ Added ${result.insertedCount} test bank transfers`);
    return result;

  } catch (error) {
    console.error("❌ Error adding bank transfer test data:", error);
    throw error;
  }
};

// 🔁 Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addBankTransferTestData()
    .then(() => {
      console.log("✅ Bank transfer test data script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Bank transfer test data script failed:", error);
      process.exit(1);
    });
}
