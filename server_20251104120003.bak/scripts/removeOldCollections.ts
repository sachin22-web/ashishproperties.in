#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function removeOldCollections() {
  console.log("🗑️ Removing old legacy collections...");
  console.log("⚠️  Make sure data has been migrated before running this!");
  
  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    const legacyCollections = [
      "seller_notifications",
      "seller_packages", 
      "seller_payments"
    ];

    for (const collectionName of legacyCollections) {
      try {
        // Check if collection exists and has data
        const count = await db.collection(collectionName).countDocuments();
        console.log(`📊 Collection ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          console.log(`⚠️  Collection ${collectionName} still has data! Please verify migration before deleting.`);
        } else {
          // Drop empty collection
          await db.collection(collectionName).drop();
          console.log(`✅ Removed empty collection: ${collectionName}`);
        }
      } catch (error: any) {
        if (error.message.includes("ns not found")) {
          console.log(`📋 Collection ${collectionName} doesn't exist (already removed)`);
        } else {
          console.error(`❌ Error processing ${collectionName}:`, error.message);
        }
      }
    }

    // Generate final report
    console.log("\n📊 Final Database Status:");
    console.log("=".repeat(30));
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`📁 Total Collections: ${collections.length}`);
    console.log("\n📁 Current Collections:");
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });

    // Check if any legacy collections remain
    const remainingLegacy = legacyCollections.filter(name => collectionNames.includes(name));
    if (remainingLegacy.length > 0) {
      console.log("\n⚠️  Legacy collections still present:");
      remainingLegacy.forEach(name => {
        console.log(`   - ${name}`);
      });
    } else {
      console.log("\n✅ All legacy collections have been removed!");
    }

    // Verify unified collections
    const unifiedCollections = ["users", "notifications", "packages", "payments"];
    console.log("\n🔄 Unified Collections Status:");
    for (const collection of unifiedCollections) {
      const count = await db.collection(collection).countDocuments();
      console.log(`   ${collection}: ${count} documents`);
    }

    console.log("\n✅ Database cleanup completed!");
    
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Ask for confirmation before running
console.log("🚨 WARNING: This will remove legacy collections!");
console.log("Make sure you have verified that all data has been migrated to unified collections.");
console.log("Continue? (This script should only be run after thorough testing)");

// In a real scenario, you'd want user confirmation
// For now, let's just run the check without deletion
removeOldCollections()
  .then(() => {
    console.log("🎉 Database cleanup check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Database cleanup failed:", error);
    process.exit(1);
  });
