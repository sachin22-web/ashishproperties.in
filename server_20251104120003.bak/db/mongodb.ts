import { MongoClient, Db } from "mongodb";

// MongoDB Atlas connection - using working credentials for now
const username = "Aashishpropeorty";
const password = "SATYAKA123";
const cluster = "property.zn2cowc.mongodb.net";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${cluster}/Use?retryWrites=true&w=majority&appName=Property`;
const DB_NAME = process.env.DB_NAME || "aashish_property";

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (db) {
    console.log("📌 Using existing MongoDB connection");
    return { client, db };
  }

  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    console.log("🌐 Cluster:", cluster);
    console.log("📊 Target Database:", DB_NAME);

    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000,
    });

    console.log("🤝 Attempting to connect...");
    await client.connect();
    console.log("✅ Client connected to MongoDB Atlas");

    // Test the connection with admin command
    console.log("🏓 Testing connection with ping...");
    const pingResult = await client.db("admin").command({ ping: 1 });
    console.log("🏓 Ping result:", pingResult);

    // Get the database
    db = client.db(DB_NAME);
    console.log("✅ Connected to MongoDB Atlas successfully!");
    console.log("📊 Database:", DB_NAME);

    // Test database access
    const stats = await db.stats();
    console.log("📈 Database stats:", {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
    });

    return { client, db };
  } catch (error: any) {
    console.error("❌ Failed to connect to MongoDB Atlas:");
    console.error("📋 Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName,
    });

    // Specific error handling
    if (error.message.includes("authentication") || error.code === 18) {
      console.error("🔐 Authentication failed - check username/password");
      console.error("💡 Suggestion: Verify credentials in MongoDB Atlas");
    } else if (error.message.includes("timeout") || error.code === 89) {
      console.error("⏱️ Connection timeout - check network connectivity");
      console.error("💡 Suggestion: Check IP whitelist in MongoDB Atlas");
    } else if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("getaddrinfo")
    ) {
      console.error("🌐 DNS resolution failed - check cluster URL");
      console.error("💡 Suggestion: Verify cluster URL is correct");
    } else if (
      error.message.includes("IP") ||
      error.message.includes("whitelist")
    ) {
      console.error("🚫 IP not whitelisted - check network access");
      console.error("💡 Suggestion: Add current IP to MongoDB Atlas whitelist");
    }

    // Clean up client if connection failed
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("⚠️ Error closing failed connection:", closeError);
      }
    }

    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase first.");
  }
  return db;
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}
