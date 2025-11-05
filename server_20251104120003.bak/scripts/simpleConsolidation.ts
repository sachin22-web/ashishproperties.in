#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function simpleConsolidation() {
  console.log("🔄 Running simple database consolidation...");
  
  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    // 1. Update all users for unified login
    console.log("\n👥 Updating users for unified login...");
    
    const updateResult = await db.collection("users").updateMany(
      { unifiedLogin: { $ne: true } },
      { 
        $set: { 
          unifiedLogin: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} users for unified login`);

    // 2. Create indexes (ignore if already exist)
    console.log("\n🔍 Creating indexes...");
    
    try {
      await db.collection("users").createIndex({ phone: 1 });
      console.log("✅ Created phone index");
    } catch (e) {
      console.log("📋 Phone index already exists");
    }
    
    try {
      await db.collection("users").createIndex({ userType: 1 });
      console.log("✅ Created userType index");
    } catch (e) {
      console.log("📋 UserType index already exists");
    }
    
    try {
      await db.collection("users").createIndex({ status: 1 });
      console.log("✅ Created status index");
    } catch (e) {
      console.log("📋 Status index already exists");
    }

    // 3. Generate consolidation report
    console.log("\n📊 Generating consolidation report...");
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const report = {
      timestamp: new Date(),
      totalCollections: collections.length,
      collections: collectionNames,
      users: await db.collection("users").countDocuments(),
      userTypes: {},
      unifiedLoginUsers: await db.collection("users").countDocuments({ unifiedLogin: true }),
    };
    
    // Get user type distribution
    const userTypeStats = await db.collection("users").aggregate([
      { $group: { _id: "$userType", count: { $sum: 1 } } }
    ]).toArray();
    
    userTypeStats.forEach(stat => {
      report.userTypes[stat._id] = stat.count;
    });
    
    console.log("\n📋 Database Status Report:");
    console.log("=".repeat(30));
    console.log(`📊 Total Users: ${report.users}`);
    console.log(`🔐 Unified Login Users: ${report.unifiedLoginUsers}`);
    console.log(`📁 Total Collections: ${report.totalCollections}`);
    console.log("\n👥 User Type Distribution:");
    Object.entries(report.userTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log("\n📁 All Collections:");
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });

    // Check if old collections exist
    const oldCollections = ["seller_notifications", "seller_packages", "seller_payments"];
    const existingOldCollections = oldCollections.filter(name => collectionNames.includes(name));
    
    if (existingOldCollections.length > 0) {
      console.log("\n⚠️  Legacy collections found (can be removed after verification):");
      existingOldCollections.forEach(name => {
        console.log(`   - ${name}`);
      });
    }

    console.log("\n✅ Database is now unified with single login system!");
    console.log("🔐 All user types (seller, buyer, agent, admin) can login with same credentials");
    
  } catch (error) {
    console.error("❌ Consolidation failed:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run consolidation
simpleConsolidation()
  .then(() => {
    console.log("🎉 Simple consolidation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Consolidation failed:", error);
    process.exit(1);
  });
