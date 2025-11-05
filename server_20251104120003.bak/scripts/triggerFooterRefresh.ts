#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function triggerFooterRefresh() {
  console.log("🔄 Triggering Footer Data Refresh");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    // Update the footer settings with a new timestamp to trigger refresh
    const result = await db.collection("footer_settings").updateOne(
      {},
      {
        $set: {
          updatedAt: new Date(),
          lastRefresh: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Footer settings updated with new timestamp");
    } else {
      console.log("ℹ️ No settings were modified");
    }

    // Get the updated settings
    const settings = await db.collection("footer_settings").findOne({});
    if (settings) {
      console.log("📊 Current footer settings:");
      console.log(`   Company: ${settings.companyName}`);
      console.log(`   Updated: ${settings.updatedAt}`);
      console.log(`   Social Links: ${Object.keys(settings.socialLinks || {}).length}`);
      console.log(`   Contact Info: Phone: ${!!settings.contactInfo?.phone}, Email: ${!!settings.contactInfo?.email}`);
      console.log(`   Locations: ${settings.locations?.length || 0}`);
    }

    // Get footer links
    const links = await db.collection("footer_links").find({}).toArray();
    console.log(`🔗 Footer links: ${links.length} total, ${links.filter(l => l.isActive).length} active`);

  } catch (error) {
    console.error("❌ Error triggering footer refresh:", error);
  } finally {
    await closeDatabaseConnection();
  }
}

triggerFooterRefresh();
