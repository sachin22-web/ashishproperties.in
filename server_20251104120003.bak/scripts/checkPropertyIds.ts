#!/usr/bin/env tsx
import { connectToDatabase } from "../db/mongodb";

async function checkPropertyIds() {
  console.log("🔍 Checking Property IDs in MongoDB Database");
  console.log("=".repeat(50));
  
  try {
    const { db } = await connectToDatabase();
    
    // Get basic stats first
    const totalProperties = await db.collection("properties").countDocuments();
    console.log(`📊 Total Properties: ${totalProperties}`);
    
    if (totalProperties === 0) {
      console.log("\n⚠️  No properties found in the database!");
      console.log("💡 You may need to run the seed script first:");
      console.log("   npm run dev  # then visit the app to create some properties");
      console.log("   or run: npx tsx server/scripts/seedDatabase.ts");
      return;
    }
    
    // Get first 10 properties with basic info
    console.log("\n📋 Sample Properties (showing first 10):");
    console.log("-".repeat(40));
    
    const properties = await db.collection("properties").find({})
      .limit(10)
      .toArray();
    
    properties.forEach((property, index) => {
      console.log(`\n${index + 1}. Property ID: ${property._id}`);
      console.log(`   Title: ${property.title || 'No title'}`);
      console.log(`   Price: ₹${property.price?.toLocaleString() || 'Not specified'}`);
      console.log(`   Type: ${property.propertyType || 'Not specified'}`);
      console.log(`   Status: ${property.status || 'Not specified'}`);
      console.log(`   Owner ID: ${property.ownerId || 'Not specified'}`);
      console.log(`   Location: ${property.location?.sector || property.location?.address || 'Not specified'}`);
    });
    
    // Show properties by status
    console.log("\n📈 Properties by Status:");
    console.log("-".repeat(25));
    
    const statusStats = await db.collection("properties").aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    statusStats.forEach(stat => {
      console.log(`   ${stat._id || 'undefined'}: ${stat.count} properties`);
    });
    
    // Show properties by approval status if the field exists
    const sampleProperty = await db.collection("properties").findOne({});
    if (sampleProperty && 'approvalStatus' in sampleProperty) {
      console.log("\n✅ Properties by Approval Status:");
      console.log("-".repeat(33));
      
      const approvalStats = await db.collection("properties").aggregate([
        { $group: { _id: "$approvalStatus", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      approvalStats.forEach(stat => {
        console.log(`   ${stat._id || 'undefined'}: ${stat.count} properties`);
      });
    }
    
    // Show example of valid ObjectId for testing
    if (properties.length > 0) {
      console.log("\n🔗 Example Valid ObjectIds for Testing:");
      console.log("-".repeat(38));
      properties.slice(0, 3).forEach((property, index) => {
        console.log(`   ${index + 1}. ${property._id} (${property.title?.substring(0, 30)}...)`);
      });
    }
    
    console.log("\n✅ Property check completed!");
    
  } catch (error) {
    console.error("❌ Failed to check properties:", error);
    throw error;
  }
}

// Run the check
checkPropertyIds()
  .then(() => {
    console.log("\n🎉 Property ID check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Property check failed:", error);
    process.exit(1);
  });
