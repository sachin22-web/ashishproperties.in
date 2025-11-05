#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";
import { ObjectId } from "mongodb";

async function consolidateDatabase() {
  console.log("🔄 Starting database consolidation...");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    // 1. Consolidate notifications into a single collection
    console.log("\n📋 Step 1: Consolidating notifications...");
    
    // Check if seller_notifications exists
    const sellerNotifications = await db.collection("seller_notifications").find({}).toArray();
    console.log(`Found ${sellerNotifications.length} seller notifications`);
    
    if (sellerNotifications.length > 0) {
      // Transform seller notifications to unified format
      const unifiedNotifications = sellerNotifications.map(notification => ({
        ...notification,
        userId: notification.sellerId,
        userType: "seller",
        type: notification.type || "general",
        migratedFrom: "seller_notifications"
      }));
      
      // Insert into unified notifications collection
      await db.collection("notifications").insertMany(unifiedNotifications);
      console.log(`✅ Migrated ${unifiedNotifications.length} seller notifications to unified collection`);
    }

    // 2. Consolidate packages into a single collection
    console.log("\n📦 Step 2: Consolidating packages...");
    
    const sellerPackages = await db.collection("seller_packages").find({}).toArray();
    console.log(`Found ${sellerPackages.length} seller packages`);
    
    if (sellerPackages.length > 0) {
      // Transform seller packages to unified format
      const unifiedPackages = sellerPackages.map(pkg => ({
        ...pkg,
        targetUserType: "seller",
        category: "advertisement",
        migratedFrom: "seller_packages"
      }));
      
      // Insert into unified packages collection
      await db.collection("packages").insertMany(unifiedPackages);
      console.log(`✅ Migrated ${unifiedPackages.length} seller packages to unified collection`);
    }

    // 3. Consolidate payments into a single collection
    console.log("\n💳 Step 3: Consolidating payments...");
    
    const sellerPayments = await db.collection("seller_payments").find({}).toArray();
    console.log(`Found ${sellerPayments.length} seller payments`);
    
    if (sellerPayments.length > 0) {
      // Transform seller payments to unified format
      const unifiedPayments = sellerPayments.map(payment => ({
        ...payment,
        userId: payment.sellerId,
        userType: "seller",
        category: "package_purchase",
        migratedFrom: "seller_payments"
      }));
      
      // Insert into unified payments collection
      await db.collection("payments").insertMany(unifiedPayments);
      console.log(`✅ Migrated ${unifiedPayments.length} seller payments to unified collection`);
    }

    // 4. Update user collection to ensure unified structure
    console.log("\n👥 Step 4: Standardizing user collection...");
    
    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users`);
    
    // Ensure all users have consistent structure
    for (const user of users) {
      const updateData: any = {};
      
      // Ensure userType is set
      if (!user.userType) {
        updateData.userType = "buyer"; // Default to buyer if not set
      }
      
      // Ensure status is set
      if (!user.status) {
        updateData.status = "active";
      }
      
      // Ensure isVerified is set
      if (user.isVerified === undefined) {
        updateData.isVerified = false;
      }
      
      // Add unified login support flag
      updateData.unifiedLogin = true;
      updateData.updatedAt = new Date();
      
      if (Object.keys(updateData).length > 0) {
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: updateData }
        );
      }
    }
    
    console.log("✅ Standardized user collection structure");

    // 5. Create indexes for better performance
    console.log("\n🔍 Step 5: Creating indexes...");
    
    // Users collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ phone: 1 });
    await db.collection("users").createIndex({ userType: 1 });
    await db.collection("users").createIndex({ status: 1 });
    
    // Unified collections indexes
    await db.collection("notifications").createIndex({ userId: 1 });
    await db.collection("notifications").createIndex({ userType: 1 });
    await db.collection("packages").createIndex({ targetUserType: 1 });
    await db.collection("payments").createIndex({ userId: 1 });
    
    console.log("✅ Created database indexes");

    // 6. Generate consolidation report
    console.log("\n📊 Step 6: Generating consolidation report...");
    
    const report = {
      timestamp: new Date(),
      collections: {
        users: await db.collection("users").countDocuments(),
        notifications: await db.collection("notifications").countDocuments(),
        packages: await db.collection("packages").countDocuments(),
        payments: await db.collection("payments").countDocuments(),
        properties: await db.collection("properties").countDocuments(),
      },
      userTypes: {},
      oldCollectionsToRemove: [
        "seller_notifications",
        "seller_packages", 
        "seller_payments"
      ]
    };
    
    // Get user type counts
    const userTypeStats = await db.collection("users").aggregate([
      { $group: { _id: "$userType", count: { $sum: 1 } } }
    ]).toArray();
    
    userTypeStats.forEach(stat => {
      report.userTypes[stat._id] = stat.count;
    });
    
    // Save consolidation report
    await db.collection("admin_reports").insertOne({
      type: "database_consolidation",
      ...report
    });
    
    console.log("\n📋 Consolidation Report:");
    console.log("=".repeat(30));
    console.log(`📊 Users: ${report.collections.users}`);
    console.log(`📋 Notifications: ${report.collections.notifications}`);
    console.log(`📦 Packages: ${report.collections.packages}`);
    console.log(`💳 Payments: ${report.collections.payments}`);
    console.log(`🏠 Properties: ${report.collections.properties}`);
    console.log("\n👥 User Types:");
    Object.entries(report.userTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

    console.log("\n⚠️  Note: Old collections can be safely removed after verification:");
    report.oldCollectionsToRemove.forEach(collection => {
      console.log(`   - ${collection}`);
    });

    console.log("\n✅ Database consolidation completed successfully!");
    
  } catch (error) {
    console.error("❌ Database consolidation failed:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run consolidation
consolidateDatabase()
  .then(() => {
    console.log("🎉 Consolidation completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Consolidation failed:", error);
    process.exit(1);
  });
