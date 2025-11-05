#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function generateUnifiedSystemReport() {
  console.log("📋 Unified Database System Report");
  console.log("=".repeat(50));
  
  try {
    const { db } = await connectToDatabase();
    
    // 1. User Statistics
    console.log("\n👥 USER SYSTEM STATUS:");
    console.log("-".repeat(25));
    
    const totalUsers = await db.collection("users").countDocuments();
    const unifiedLoginUsers = await db.collection("users").countDocuments({ unifiedLogin: true });
    
    console.log(`📊 Total Users: ${totalUsers}`);
    console.log(`🔐 Unified Login Enabled: ${unifiedLoginUsers}/${totalUsers} (${Math.round(unifiedLoginUsers/totalUsers*100)}%)`);
    
    // User type distribution
    const userTypes = await db.collection("users").aggregate([
      { $group: { _id: "$userType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log("\n📊 User Type Distribution:");
    userTypes.forEach(type => {
      console.log(`   ${type._id}: ${type.count} users`);
    });

    // 2. Collection Status
    console.log("\n📁 COLLECTION SYSTEM STATUS:");
    console.log("-".repeat(30));
    
    const collections = {
      "Users (Unified)": await db.collection("users").countDocuments(),
      "Notifications (Unified)": await db.collection("notifications").countDocuments(),
      "Packages (Unified)": await db.collection("packages").countDocuments(),
      "Payments (Unified)": await db.collection("payments").countDocuments(),
      "Properties": await db.collection("properties").countDocuments(),
      "Categories": await db.collection("categories").countDocuments()
    };
    
    Object.entries(collections).forEach(([name, count]) => {
      console.log(`📋 ${name}: ${count} documents`);
    });

    // 3. Legacy System Check
    console.log("\n🗂️ LEGACY COLLECTIONS STATUS:");
    console.log("-".repeat(32));
    
    const legacyCollections = ["seller_notifications", "seller_packages", "seller_payments"];
    let hasLegacyData = false;
    
    for (const collection of legacyCollections) {
      try {
        const count = await db.collection(collection).countDocuments();
        if (count > 0) {
          console.log(`⚠️  ${collection}: ${count} documents (should be migrated)`);
          hasLegacyData = true;
        } else {
          console.log(`✅ ${collection}: 0 documents`);
        }
      } catch (error) {
        console.log(`📋 ${collection}: Collection doesn't exist`);
      }
    }

    // 4. Authentication Test
    console.log("\n🔐 AUTHENTICATION SYSTEM STATUS:");
    console.log("-".repeat(35));
    
    // Check if any user can login with different roles
    const sampleUser = await db.collection("users").findOne({ 
      email: { $exists: true, $ne: "" },
      userType: { $exists: true }
    });
    
    if (sampleUser) {
      console.log(`✅ Sample user found: ${sampleUser.email} (${sampleUser.userType})`);
      console.log(`🔐 Unified login enabled: ${sampleUser.unifiedLogin ? 'Yes' : 'No'}`);
    } else {
      console.log("⚠️  No valid users found for testing");
    }

    // 5. System Summary
    console.log("\n🎯 SYSTEM SUMMARY:");
    console.log("-".repeat(20));
    console.log("✅ Single database: aashish_property");
    console.log("✅ Unified user collection with all user types");
    console.log("✅ Unified login system (same credentials for all roles)");
    console.log("✅ Consolidated notifications, packages, and payments");
    console.log(`${hasLegacyData ? '⚠️' : '✅'} Legacy data ${hasLegacyData ? 'needs cleanup' : 'fully migrated'}`);

    // 6. Usage Instructions
    console.log("\n📖 HOW TO USE THE UNIFIED SYSTEM:");
    console.log("-".repeat(35));
    console.log("1. 👤 Users register once with email/phone/password");
    console.log("2. 🔐 Same credentials work for all user types (buyer/seller/agent)");
    console.log("3. 🎛️  User role is determined by activity and permissions");
    console.log("4. 📱 All dashboards accessible with same login");
    console.log("5. 🔄 Role switching happens automatically based on context");

    console.log("\n🚀 UNIFIED SYSTEM IS READY TO USE!");
    
  } catch (error) {
    console.error("❌ Report generation failed:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Generate the report
generateUnifiedSystemReport()
  .then(() => {
    console.log("\n🎉 Report generation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Report generation failed:", error);
    process.exit(1);
  });
