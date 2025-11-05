#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function testFooterEndpoints() {
  console.log("🔍 Testing Footer API Endpoints");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    // Test direct database access
    console.log("1️⃣ Testing Direct Database Access");
    const settings = await db.collection("footer_settings").findOne({});
    const links = await db.collection("footer_links").find({}).toArray();
    
    console.log(`   Settings found: ${!!settings}`);
    console.log(`   Links found: ${links.length}`);
    
    if (settings) {
      console.log(`   Company: ${settings.companyName}`);
      console.log(`   Has social links: ${!!settings.socialLinks}`);
    }

    // Test the API route handlers directly
    console.log("\n2️⃣ Testing Route Handlers");
    
    // Import the route handlers
    const footerRoutes = await import("../routes/footer");
    
    // Mock Express request/response objects
    const mockReq = {} as any;
    const mockRes = {
      json: (data: any) => {
        console.log("   Footer settings API response:", JSON.stringify(data, null, 2));
        return mockRes;
      },
      status: (code: number) => {
        console.log(`   Status code: ${code}`);
        return mockRes;
      }
    } as any;

    // Test the getFooterSettings handler
    console.log("   Testing getFooterSettings handler...");
    await footerRoutes.getFooterSettings(mockReq, mockRes);

    // Test the getActiveFooterLinks handler
    const mockRes2 = {
      json: (data: any) => {
        console.log("   Footer links API response:", JSON.stringify(data, null, 2));
        return mockRes2;
      },
      status: (code: number) => {
        console.log(`   Status code: ${code}`);
        return mockRes2;
      }
    } as any;

    console.log("   Testing getActiveFooterLinks handler...");
    await footerRoutes.getActiveFooterLinks(mockReq, mockRes2);

  } catch (error) {
    console.error("❌ Error testing footer endpoints:", error);
  } finally {
    await closeDatabaseConnection();
  }
}

testFooterEndpoints();
