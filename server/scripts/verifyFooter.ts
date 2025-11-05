#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function verifyFooterData() {
  console.log("✅ Verifying Footer Data in Database");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    // Get footer settings
    console.log("📋 Footer Settings:");
    const settings = await db.collection("footer_settings").findOne({});
    if (settings) {
      console.log(`   Company Name: ${settings.companyName}`);
      console.log(`   Description: ${settings.companyDescription?.substring(0, 50)}...`);
      console.log(`   Logo: ${settings.companyLogo}`);
      console.log(`   Show Locations: ${settings.showLocations}`);
      console.log(`   Locations: ${settings.locations?.join(", ")}`);
      console.log(`   Social Links:`);
      console.log(`     Facebook: ${settings.socialLinks?.facebook || 'Not set'}`);
      console.log(`     Twitter: ${settings.socialLinks?.twitter || 'Not set'}`);
      console.log(`     Instagram: ${settings.socialLinks?.instagram || 'Not set'}`);
      console.log(`     YouTube: ${settings.socialLinks?.youtube || 'Not set'}`);
      console.log(`   Contact:`);
      console.log(`     Phone: ${settings.contactInfo?.phone || 'Not set'}`);
      console.log(`     Email: ${settings.contactInfo?.email || 'Not set'}`);
      console.log(`     Address: ${settings.contactInfo?.address || 'Not set'}`);
    } else {
      console.log("   ❌ No footer settings found");
    }

    // Get footer links
    console.log("\n🔗 Footer Links:");
    const links = await db.collection("footer_links").find({}).sort({ section: 1, order: 1 }).toArray();
    if (links.length > 0) {
      let currentSection = '';
      links.forEach((link) => {
        if (link.section !== currentSection) {
          currentSection = link.section;
          console.log(`\n   📂 Section: ${currentSection.toUpperCase()}`);
        }
        console.log(`     ${link.order}. ${link.title} → ${link.url} ${link.isActive ? '✅' : '❌'} ${link.isExternal ? '🔗' : '📄'}`);
      });
    } else {
      console.log("   ❌ No footer links found");
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Links: ${links.length}`);
    console.log(`   Active Links: ${links.filter(l => l.isActive).length}`);
    console.log(`   Quick Links: ${links.filter(l => l.section === 'quick_links').length}`);
    console.log(`   Legal Links: ${links.filter(l => l.section === 'legal').length}`);
    console.log(`   Settings Configured: ${settings ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error("❌ Error verifying footer data:", error);
  } finally {
    await closeDatabaseConnection();
  }
}

verifyFooterData();
