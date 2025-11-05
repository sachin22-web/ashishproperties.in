import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const username = "Aashishpropeorty";
const password = "ANILSHARMA";
const cluster = "property.zn2cowc.mongodb.net";
const databaseName = "aashish_property";

const connectionString = `mongodb+srv://${username}:${password}@${cluster}/?retryWrites=true&w=majority&appName=Property`;

async function seedFreshData() {
  const client = new MongoClient(connectionString);
  
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");
    await client.connect();
    
    const db = client.db(databaseName);
    console.log(`✅ Connected to database: ${databaseName}`);

    // Create test user
    console.log("👤 Creating test user...");
    const hashedPassword = await bcrypt.hash("testuser123", 10);
    
    const testUser = {
      name: "Test User",
      email: "testuser@aashishproperty.com",
      phone: "+91 9876543210",
      password: hashedPassword,
      userType: "buyer",
      preferences: {
        propertyTypes: ["apartment", "house"],
        priceRange: { min: 1000000, max: 5000000 },
        locations: ["Rohtak", "Delhi"],
      },
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if test user already exists
    const existingUser = await db.collection("users").findOne({ email: testUser.email });
    if (!existingUser) {
      const userResult = await db.collection("users").insertOne(testUser);
      console.log(`✅ Test user created with ID: ${userResult.insertedId}`);
    } else {
      console.log("ℹ️ Test user already exists");
    }

    // Fresh recommendation properties with real images
    console.log("🏠 Adding fresh recommendation properties...");
    
    const freshProperties = [
      {
        title: "Luxurious 3 BHK Apartment in Rohtak",
        price: 4500000,
        propertyType: "apartment",
        subCategory: "3-bhk",
        description: "Beautiful 3 BHK apartment with modern amenities, parking, and 24/7 security in prime location of Rohtak.",
        location: {
          city: "Rohtak",
          state: "Haryana",
          address: "Sector 14, Model Town",
          pincode: "124001",
          coordinates: { lat: 28.8955, lng: 76.6066 }
        },
        features: {
          bedrooms: 3,
          bathrooms: 2,
          area: 1200,
          areaUnit: "sqft",
          furnished: "semi-furnished",
          parking: true,
          balcony: 2,
          floor: 3,
          totalFloors: 5
        },
        amenities: ["Swimming Pool", "Gym", "Security", "Power Backup", "Lift"],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800"
        ],
        contactInfo: {
          name: "Rajesh Kumar",
          phone: "+91 9876543210",
          email: "rajesh@example.com",
          verified: true
        },
        status: "active",
        featured: true,
        verified: true,
        views: 245,
        inquiries: 18,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Modern 2 BHK Independent House",
        price: 3200000,
        propertyType: "house",
        subCategory: "2-bhk",
        description: "Spacious 2 BHK independent house with garden, covered parking, and peaceful neighborhood.",
        location: {
          city: "Rohtak",
          state: "Haryana",
          address: "Civil Lines, Near MDU",
          pincode: "124001",
          coordinates: { lat: 28.8955, lng: 76.6066 }
        },
        features: {
          bedrooms: 2,
          bathrooms: 2,
          area: 900,
          areaUnit: "sqft",
          furnished: "unfurnished",
          parking: true,
          balcony: 1,
          floor: 0,
          totalFloors: 2
        },
        amenities: ["Garden", "Parking", "Security", "Water Supply"],
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"
        ],
        contactInfo: {
          name: "Priya Sharma",
          phone: "+91 9876543211",
          email: "priya@example.com",
          verified: true
        },
        status: "active",
        featured: false,
        verified: true,
        views: 156,
        inquiries: 12,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        title: "Commercial Shop for Rent - Prime Location",
        price: 25000,
        propertyType: "commercial",
        subCategory: "shop",
        description: "Well-located commercial shop on main road, perfect for retail business with high footfall.",
        location: {
          city: "Rohtak",
          state: "Haryana",
          address: "Railway Road, Main Market",
          pincode: "124001",
          coordinates: { lat: 28.8955, lng: 76.6066 }
        },
        features: {
          bedrooms: 0,
          bathrooms: 1,
          area: 400,
          areaUnit: "sqft",
          furnished: "unfurnished",
          parking: false,
          balcony: 0,
          floor: 0,
          totalFloors: 1
        },
        amenities: ["Main Road", "High Footfall", "24/7 Access"],
        images: [
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800",
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"
        ],
        contactInfo: {
          name: "Amit Singh",
          phone: "+91 9876543212",
          email: "amit@example.com",
          verified: true
        },
        status: "active",
        featured: false,
        verified: true,
        views: 89,
        inquiries: 5,
        createdAt: new Date(Date.now() - 172800000),
        updatedAt: new Date(Date.now() - 172800000)
      },
      {
        title: "4 BHK Luxury Villa with Swimming Pool",
        price: 8500000,
        propertyType: "villa",
        subCategory: "4-bhk",
        description: "Stunning 4 BHK villa with private swimming pool, landscaped garden, and premium finishes.",
        location: {
          city: "Rohtak",
          state: "Haryana",
          address: "Mansarovar Park, Sector 1",
          pincode: "124001",
          coordinates: { lat: 28.8955, lng: 76.6066 }
        },
        features: {
          bedrooms: 4,
          bathrooms: 4,
          area: 2500,
          areaUnit: "sqft",
          furnished: "fully-furnished",
          parking: true,
          balcony: 3,
          floor: 0,
          totalFloors: 2
        },
        amenities: ["Swimming Pool", "Garden", "Security", "Power Backup", "Gym", "Club House"],
        images: [
          "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=800",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"
        ],
        contactInfo: {
          name: "Vikash Yadav",
          phone: "+91 9876543213",
          email: "vikash@example.com",
          verified: true
        },
        status: "active",
        featured: true,
        verified: true,
        views: 320,
        inquiries: 25,
        createdAt: new Date(Date.now() - 259200000),
        updatedAt: new Date(Date.now() - 259200000)
      },
      {
        title: "1 BHK Studio Apartment Near College",
        price: 1800000,
        propertyType: "apartment",
        subCategory: "1-bhk",
        description: "Compact 1 BHK studio apartment perfect for students and young professionals, near MDU.",
        location: {
          city: "Rohtak",
          state: "Haryana",
          address: "Near MDU, University Road",
          pincode: "124001",
          coordinates: { lat: 28.8955, lng: 76.6066 }
        },
        features: {
          bedrooms: 1,
          bathrooms: 1,
          area: 450,
          areaUnit: "sqft",
          furnished: "semi-furnished",
          parking: false,
          balcony: 1,
          floor: 2,
          totalFloors: 4
        },
        amenities: ["Wi-Fi", "Security", "Lift", "Near College"],
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
        ],
        contactInfo: {
          name: "Sunita Devi",
          phone: "+91 9876543214",
          email: "sunita@example.com",
          verified: true
        },
        status: "active",
        featured: false,
        verified: true,
        views: 123,
        inquiries: 8,
        createdAt: new Date(Date.now() - 345600000),
        updatedAt: new Date(Date.now() - 345600000)
      }
    ];

    // Clear existing properties first
    await db.collection("properties").deleteMany({});
    console.log("🗑️ Cleared existing properties");

    // Insert fresh properties
    const propertyResult = await db.collection("properties").insertMany(freshProperties);
    console.log(`✅ Added ${propertyResult.insertedIds.length} fresh properties with images`);

    // Create categories if they don't exist
    console.log("📂 Setting up categories...");
    const categories = [
      {
        name: "Apartments",
        slug: "apartments",
        icon: "🏢",
        description: "Residential apartments and flats",
        subcategories: [
          { name: "1 BHK", slug: "1-bhk" },
          { name: "2 BHK", slug: "2-bhk" },
          { name: "3 BHK", slug: "3-bhk" },
          { name: "4+ BHK", slug: "4-bhk" }
        ],
        order: 1,
        active: true
      },
      {
        name: "Houses",
        slug: "houses",
        icon: "🏠",
        description: "Independent houses and villas",
        subcategories: [
          { name: "Independent House", slug: "independent-house" },
          { name: "Villa", slug: "villa" },
          { name: "Row House", slug: "row-house" }
        ],
        order: 2,
        active: true
      },
      {
        name: "Commercial",
        slug: "commercial",
        icon: "🏢",
        description: "Commercial properties",
        subcategories: [
          { name: "Office", slug: "office" },
          { name: "Shop", slug: "shop" },
          { name: "Warehouse", slug: "warehouse" }
        ],
        order: 3,
        active: true
      }
    ];

    for (const category of categories) {
      const existingCategory = await db.collection("categories").findOne({ slug: category.slug });
      if (!existingCategory) {
        await db.collection("categories").insertOne(category);
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`ℹ️ Category already exists: ${category.name}`);
      }
    }

    // Initialize packages
    console.log("📦 Setting up packages...");
    const existingPackages = await db.collection("ad_packages").countDocuments();
    if (existingPackages === 0) {
      const defaultPackages = [
        {
          name: "Basic Listing",
          description: "Standard property listing with basic visibility",
          price: 0,
          duration: 30,
          features: [
            "30 days listing",
            "Standard visibility",
            "Basic property details",
            "Contact information display",
          ],
          type: "basic",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Featured Listing",
          description: "Enhanced visibility with featured badge",
          price: 299,
          duration: 30,
          features: [
            "30 days listing",
            "Featured badge",
            "Top of search results",
            "Homepage visibility",
            "Priority in category",
          ],
          type: "featured",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Premium Listing",
          description: "Maximum visibility with premium features",
          price: 599,
          duration: 30,
          features: [
            "30 days listing",
            "Premium badge",
            "Top priority in all searches",
            "Homepage banner slot",
            "Featured in category top",
            "Analytics dashboard",
          ],
          type: "premium",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      await db.collection("ad_packages").insertMany(defaultPackages);
      console.log(`✅ Created ${defaultPackages.length} default packages`);
    } else {
      console.log("ℹ️ Packages already exist");
    }

    console.log("🎉 Fresh data seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   - Properties: ${freshProperties.length} with real images`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Test User: testuser@aashishproperty.com`);
    console.log(`   - Password: testuser123`);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await client.close();
  }
}

// Run the seed function
seedFreshData().catch(console.error);
