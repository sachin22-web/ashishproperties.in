#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

async function initializeFooterData() {
  console.log("🦶 Footer Data Initialization");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Database connected successfully");

    // Check if footer data already exists
    const existingLinks = await db.collection("footer_links").countDocuments();
    const existingSettings = await db.collection("footer_settings").countDocuments();

    console.log(`📊 Current footer data:`);
    console.log(`   Footer Links: ${existingLinks}`);
    console.log(`   Footer Settings: ${existingSettings}`);

    if (existingLinks === 0) {
      console.log("🔗 Creating default footer links...");
      
      const defaultLinks = [
        {
          title: "About Us",
          url: "/about",
          section: "quick_links",
          order: 1,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Contact Us",
          url: "/contact",
          section: "quick_links",
          order: 2,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Privacy Policy",
          url: "/privacy-policy",
          section: "legal",
          order: 1,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Terms & Conditions",
          url: "/terms",
          section: "legal",
          order: 2,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Refund Policy",
          url: "/refund-policy",
          section: "legal",
          order: 3,
          isActive: true,
          isExternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("footer_links").insertMany(defaultLinks);
      console.log(`✅ Created ${defaultLinks.length} default footer links`);
    } else {
      console.log("ℹ️ Footer links already exist, skipping creation");
    }

    if (existingSettings === 0) {
      console.log("⚙️ Creating default footer settings...");
      
      const defaultSettings = {
        companyName: "POSTTRR",
        companyDescription: "Share your unique properties, boost your sales online and connect with verified buyers. It's a community where your comfort is a priority.",
        companyLogo: "P",
        socialLinks: {
          facebook: "https://facebook.com/posttrr",
          twitter: "https://twitter.com/posttrr",
          instagram: "https://instagram.com/posttrr",
          youtube: "https://youtube.com/posttrr"
        },
        contactInfo: {
          phone: "+91 9876543210",
          email: "info@posttrr.com",
          address: "Mumbai, Maharashtra, India"
        },
        showLocations: true,
        locations: ["Kolkata", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune"],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("footer_settings").insertOne(defaultSettings);
      console.log("✅ Created default footer settings");
    } else {
      console.log("ℹ️ Footer settings already exist, skipping creation");
    }

    // Verify the data
    const finalLinks = await db.collection("footer_links").countDocuments();
    const finalSettings = await db.collection("footer_settings").countDocuments();
    
    console.log("\n📈 Final status:");
    console.log(`   Footer Links: ${finalLinks}`);
    console.log(`   Footer Settings: ${finalSettings}`);

    // Test fetching the data
    console.log("\n🧪 Testing data retrieval...");
    const settings = await db.collection("footer_settings").findOne({});
    const links = await db.collection("footer_links").find({}).toArray();
    
    console.log(`✅ Successfully retrieved settings: ${settings ? 'Yes' : 'No'}`);
    console.log(`✅ Successfully retrieved ${links.length} links`);

    if (settings) {
      console.log(`   Company: ${settings.companyName}`);
      console.log(`   Locations: ${settings.locations?.length || 0}`);
      console.log(`   Social Links: ${Object.keys(settings.socialLinks || {}).length}`);
    }

    console.log("\n🎉 Footer initialization completed successfully!");

  } catch (error) {
    console.error("❌ Error initializing footer data:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run the initialization
initializeFooterData()
  .then(() => {
    console.log("✨ Footer data initialization complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
