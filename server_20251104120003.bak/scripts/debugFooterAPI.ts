#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function debugFooterAPI() {
  console.log("🔍 Debugging Footer API Endpoints");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    // 1. Check footer_links collection
    console.log("\n📋 Step 1: Checking footer_links collection...");
    
    const allLinks = await db.collection("footer_links").find({}).toArray();
    console.log(`📊 Total footer links in DB: ${allLinks.length}`);
    
    const activeLinks = await db.collection("footer_links").find({ isActive: true }).toArray();
    console.log(`✅ Active footer links: ${activeLinks.length}`);
    
    if (activeLinks.length > 0) {
      console.log("\n🔗 Active Links Details:");
      activeLinks.forEach(link => {
        console.log(`   - ${link.title} (${link.section}) → ${link.url} [Order: ${link.order}]`);
      });
      
      // Group by section
      const linksBySection = activeLinks.reduce((acc, link) => {
        if (!acc[link.section]) acc[link.section] = [];
        acc[link.section].push(link);
        return acc;
      }, {});
      
      console.log("\n📂 Links by Section:");
      Object.entries(linksBySection).forEach(([section, links]) => {
        console.log(`   ${section}: ${links.length} links`);
      });
    }

    // 2. Check footer_settings collection
    console.log("\n⚙️ Step 2: Checking footer_settings...");
    
    const settings = await db.collection("footer_settings").findOne({});
    if (settings) {
      console.log("✅ Footer settings found:");
      console.log(`   Company: ${settings.companyName}`);
      console.log(`   Locations: ${settings.locations?.length || 0}`);
      console.log(`   Social Links: ${Object.keys(settings.socialLinks || {}).length}`);
    } else {
      console.log("❌ No footer settings found");
    }

    // 3. Check content_pages collection
    console.log("\n📄 Step 3: Checking content_pages...");
    
    const publishedPages = await db.collection("content_pages")
      .find({ status: "published" })
      .toArray();
    
    console.log(`📊 Published pages: ${publishedPages.length}`);
    if (publishedPages.length > 0) {
      publishedPages.forEach(page => {
        console.log(`   - ${page.title} (/page/${page.slug}) [${page.type}]`);
      });
    }

    // 4. Test API simulation
    console.log("\n🌐 Step 4: Simulating API calls...");
    
    console.log("API Endpoints that should work:");
    console.log("✅ GET /api/footer/links - Returns active footer links");
    console.log("✅ GET /api/footer/settings - Returns footer settings");
    console.log("✅ GET /api/content/pages - Returns published pages");
    
    // Test what the API would return
    const apiLinksResponse = {
      success: true,
      data: activeLinks
    };
    
    const apiSettingsResponse = {
      success: true,
      data: settings
    };
    
    const apiPagesResponse = {
      success: true,
      data: publishedPages
    };

    console.log("\n📊 API Response Summary:");
    console.log(`   /api/footer/links → ${apiLinksResponse.data.length} active links`);
    console.log(`   /api/footer/settings → ${apiSettingsResponse.data ? 'Settings found' : 'No settings'}`);
    console.log(`   /api/content/pages → ${apiPagesResponse.data.length} published pages`);

    // 5. Check if any issues
    console.log("\n⚠️ Step 5: Potential Issues:");
    
    if (activeLinks.length === 0) {
      console.log("❌ No active footer links found - Admin needs to add links");
    }
    
    if (!settings) {
      console.log("❌ No footer settings found - Admin needs to configure footer");
    }
    
    if (publishedPages.length === 0) {
      console.log("❌ No published pages found - Admin needs to publish pages");
    }

    // 6. Recommendations
    console.log("\n💡 Recommendations:");
    
    if (activeLinks.length === 0) {
      console.log("1. Go to Admin Panel → Footer Management");
      console.log("2. Add footer links with proper sections (quick_links, legal, support)");
      console.log("3. Make sure isActive = true");
    }
    
    if (publishedPages.length === 0) {
      console.log("1. Go to Admin Panel → Page Management");
      console.log("2. Create pages and set status to 'published'");
    }

    console.log("\n🎯 Debug Complete!");

  } catch (error) {
    console.error("❌ Debug failed:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run debug
debugFooterAPI()
  .then(() => {
    console.log("\n🎉 Footer API debug completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Debug failed:", error);
    process.exit(1);
  });
