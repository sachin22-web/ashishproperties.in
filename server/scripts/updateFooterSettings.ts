#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function updateFooterSettings() {
  console.log("🛠️ Updating Footer Settings");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    const updatedSettings = {
      $set: {
        socialLinks: {
          facebook: "https://facebook.com/posttrr",
          twitter: "https://twitter.com/posttrr", 
          instagram: "https://instagram.com/posttrr",
          youtube: "https://youtube.com/posttrr"
        },
        contactInfo: {
          phone: "+91 98765 43210",
          email: "info@posttrr.com",
          address: "Mumbai, Maharashtra, India"
        },
        updatedAt: new Date()
      }
    };

    const result = await db.collection("footer_settings").updateOne({}, updatedSettings);
    
    if (result.modifiedCount > 0) {
      console.log("✅ Footer settings updated successfully!");
      
      // Verify the update
      const updated = await db.collection("footer_settings").findOne({});
      console.log("\n📱 Updated Social Links:");
      console.log(`   Facebook: ${updated?.socialLinks?.facebook}`);
      console.log(`   Twitter: ${updated?.socialLinks?.twitter}`);
      console.log(`   Instagram: ${updated?.socialLinks?.instagram}`);
      console.log(`   YouTube: ${updated?.socialLinks?.youtube}`);
      
      console.log("\n📞 Updated Contact Info:");
      console.log(`   Phone: ${updated?.contactInfo?.phone}`);
      console.log(`   Email: ${updated?.contactInfo?.email}`);
      console.log(`   Address: ${updated?.contactInfo?.address}`);
      
    } else {
      console.log("❌ No settings were updated");
    }

  } catch (error) {
    console.error("❌ Error updating footer settings:", error);
  } finally {
    await closeDatabaseConnection();
  }
}

updateFooterSettings();
