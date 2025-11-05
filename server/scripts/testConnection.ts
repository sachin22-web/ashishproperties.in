#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function testDatabaseConnection() {
  console.log("🧪 MongoDB Atlas Connection Test");
  console.log("=".repeat(50));

  try {
    console.log("📋 Connection Information:");
    console.log("   Username: Aashishpropeorty");
    console.log("   Cluster: property.zn2cowc.mongodb.net");
    console.log("   Database: aashish_property");
    console.log("");

    console.log("🔄 Step 1: Attempting to connect to MongoDB Atlas...");
    const { client, db } = await connectToDatabase();

    console.log("🔄 Step 2: Testing database operations...");

    // Test database stats
    const stats = await db.stats();
    console.log("📊 Database Statistics:");
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
    console.log(`   Indexes: ${stats.indexes}`);
    console.log("");

    // List collections
    const collections = await db.listCollections().toArray();
    console.log("📚 Available Collections:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });
    console.log("");

    // Test a simple query on each collection
    console.log("🔍 Testing collection access:");
    for (const col of collections) {
      try {
        const count = await db.collection(col.name).countDocuments();
        console.log(`   ✅ ${col.name}: ${count} documents`);
      } catch (error: any) {
        console.log(`   ❌ ${col.name}: Error - ${error.message}`);
      }
    }
    console.log("");

    // Test admin commands
    console.log("🔄 Step 3: Testing admin commands...");
    const adminDb = client.db("admin");
    const buildInfo = await adminDb.command({ buildInfo: 1 });
    console.log("🏗️ MongoDB Server Info:");
    console.log(`   Version: ${buildInfo.version}`);
    console.log(`   Git Version: ${buildInfo.gitVersion}`);
    console.log("");

    // Test connection status
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    console.log("🖥️ Server Status:");
    console.log(`   Host: ${serverStatus.host}`);
    console.log(`   Process: ${serverStatus.process}`);
    console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 60)} minutes`);
    console.log(
      `   Connections: ${serverStatus.connections.current} current, ${serverStatus.connections.available} available`,
    );
    console.log("");

    console.log(
      "✅ All tests passed! MongoDB Atlas connection is working perfectly.",
    );
  } catch (error: any) {
    console.error("❌ Connection test failed:");
    console.error("📋 Error Details:");
    console.error(`   Name: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    if (error.code) console.error(`   Code: ${error.code}`);
    if (error.codeName) console.error(`   Code Name: ${error.codeName}`);
    console.error("");

    console.error("🔧 Troubleshooting Steps:");

    if (error.message.includes("authentication") || error.code === 18) {
      console.error("   1. ❌ Authentication failed");
      console.error("      - Check username: 'Aashishpropeorty'");
      console.error("      - Check password: 'Anilsharma'");
      console.error("      - Verify credentials in MongoDB Atlas dashboard");
    }

    if (error.message.includes("timeout") || error.code === 89) {
      console.error("   2. ⏱️ Connection timeout");
      console.error("      - Check internet connectivity");
      console.error("      - Verify cluster URL: property.zn2cowc.mongodb.net");
    }

    if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("getaddrinfo")
    ) {
      console.error("   3. 🌐 DNS resolution failed");
      console.error("      - Check cluster URL spelling");
      console.error("      - Try accessing MongoDB Atlas dashboard");
    }

    if (error.message.includes("IP") || error.message.includes("whitelist")) {
      console.error("   4. 🚫 IP not whitelisted");
      console.error("      - Add your current IP to MongoDB Atlas");
      console.error("      - Or add 0.0.0.0/0 for all IPs (development only)");
    }

    console.error("");
    console.error("🌐 MongoDB Atlas Dashboard: https://cloud.mongodb.com/");
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log("🎉 Connection test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
