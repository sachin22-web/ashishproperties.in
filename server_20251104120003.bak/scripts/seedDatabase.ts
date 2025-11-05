import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

const MONGODB_URI =
  "mongodb+srv://Aashishpropeorty:SATYAKA123@property.zn2cowc.mongodb.net/";
const DB_NAME = "aashish_property";

// Sample data with comprehensive categories for property management
const categories = [
  {
    name: "Residential",
    slug: "residential",
    icon: "🏠",
    description: "Residential properties for living",
    subcategories: [
      {
        id: "1bhk",
        name: "1 BHK Apartment",
        slug: "1bhk",
        description: "Single bedroom apartments",
      },
      {
        id: "2bhk",
        name: "2 BHK Apartment",
        slug: "2bhk",
        description: "Two bedroom apartments",
      },
      {
        id: "3bhk",
        name: "3 BHK Apartment",
        slug: "3bhk",
        description: "Three bedroom apartments",
      },
      {
        id: "4bhk",
        name: "4 BHK Apartment",
        slug: "4bhk",
        description: "Four bedroom apartments",
      },
      {
        id: "villa",
        name: "Villa",
        slug: "villa",
        description: "Independent villas",
      },
      {
        id: "independent-house",
        name: "Independent House",
        slug: "independent-house",
        description: "Standalone houses",
      },
      {
        id: "builder-floor",
        name: "Builder Floor",
        slug: "builder-floor",
        description: "Builder floor apartments",
      },
      {
        id: "duplex",
        name: "Duplex",
        slug: "duplex",
        description: "Two-story apartments",
      },
      {
        id: "penthouse",
        name: "Penthouse",
        slug: "penthouse",
        description: "Luxury penthouse apartments",
      },
      {
        id: "studio",
        name: "Studio Apartment",
        slug: "studio",
        description: "Single room apartments",
      },
    ],
    order: 1,
    active: true,
  },
  {
    name: "Commercial",
    slug: "commercial",
    icon: "🏢",
    description: "Commercial properties for business",
    subcategories: [
      {
        id: "office",
        name: "Office Space",
        slug: "office",
        description: "Office spaces for businesses",
      },
      {
        id: "shop",
        name: "Shop/Retail",
        slug: "shop",
        description: "Retail shops and stores",
      },
      {
        id: "warehouse",
        name: "Warehouse",
        slug: "warehouse",
        description: "Storage and warehouse facilities",
      },
      {
        id: "showroom",
        name: "Showroom",
        slug: "showroom",
        description: "Display and showroom spaces",
      },
      {
        id: "restaurant",
        name: "Restaurant Space",
        slug: "restaurant",
        description: "Restaurant and food service spaces",
      },
      {
        id: "factory",
        name: "Factory",
        slug: "factory",
        description: "Manufacturing facilities",
      },
      {
        id: "coworking",
        name: "Co-working Space",
        slug: "coworking",
        description: "Shared workspace facilities",
      },
    ],
    order: 2,
    active: true,
  },
  {
    name: "Plot/Land",
    slug: "plot-land",
    icon: "🌾",
    description: "Plots and land for construction",
    subcategories: [
      {
        id: "residential-plot",
        name: "Residential Plot",
        slug: "residential-plot",
        description: "Plots for residential development",
      },
      {
        id: "commercial-plot",
        name: "Commercial Plot",
        slug: "commercial-plot",
        description: "Plots for commercial development",
      },
      {
        id: "agricultural-land",
        name: "Agricultural Land",
        slug: "agricultural-land",
        description: "Farming and agricultural land",
      },
      {
        id: "industrial-plot",
        name: "Industrial Plot",
        slug: "industrial-plot",
        description: "Plots for industrial development",
      },
      {
        id: "farm-house",
        name: "Farm House",
        slug: "farm-house",
        description: "Farm houses with land",
      },
    ],
    order: 3,
    active: true,
  },
  {
    name: "PG/Hostel",
    slug: "pg-hostel",
    icon: "🏨",
    description: "Paying guest accommodations and hostels",
    subcategories: [
      {
        id: "boys-pg",
        name: "Boys PG",
        slug: "boys-pg",
        description: "PG accommodation for men",
      },
      {
        id: "girls-pg",
        name: "Girls PG",
        slug: "girls-pg",
        description: "PG accommodation for women",
      },
      {
        id: "co-living",
        name: "Co-living Space",
        slug: "co-living",
        description: "Modern co-living arrangements",
      },
      {
        id: "hostel",
        name: "Hostel",
        slug: "hostel",
        description: "Student and working hostel accommodation",
      },
    ],
    order: 4,
    active: true,
  },
  {
    name: "Rental",
    slug: "rental",
    icon: "🔑",
    description: "Properties available for rent",
    subcategories: [
      {
        id: "house-rent",
        name: "House for Rent",
        slug: "house-rent",
        description: "Independent houses for rent",
      },
      {
        id: "flat-rent",
        name: "Flat for Rent",
        slug: "flat-rent",
        description: "Apartments for rent",
      },
      {
        id: "room-rent",
        name: "Room for Rent",
        slug: "room-rent",
        description: "Single rooms for rent",
      },
      {
        id: "office-rent",
        name: "Office for Rent",
        slug: "office-rent",
        description: "Office spaces for rent",
      },
    ],
    order: 5,
    active: true,
  },
];

const locations = {
  countries: [{ name: "India", code: "IN", active: true }],
  states: [
    { name: "Haryana", code: "HR", countryCode: "IN", active: true },
    { name: "Delhi", code: "DL", countryCode: "IN", active: true },
    { name: "Punjab", code: "PB", countryCode: "IN", active: true },
  ],
  cities: [
    { name: "Rohtak", stateCode: "HR", active: true },
    { name: "Gurgaon", stateCode: "HR", active: true },
    { name: "Faridabad", stateCode: "HR", active: true },
    { name: "New Delhi", stateCode: "DL", active: true },
    { name: "Chandigarh", stateCode: "PB", active: true },
  ],
  areas: [
    { name: "Sector 1", city: "Rohtak", active: true },
    { name: "Sector 2", city: "Rohtak", active: true },
    { name: "Sector 3", city: "Rohtak", active: true },
    { name: "Sector 4", city: "Rohtak", active: true },
    { name: "Sector 5", city: "Rohtak", active: true },
    { name: "Sector 6", city: "Rohtak", active: true },
    { name: "Sector 7", city: "Rohtak", active: true },
    { name: "Sector 8", city: "Rohtak", active: true },
    { name: "Sector 9", city: "Rohtak", active: true },
    { name: "Sector 10", city: "Rohtak", active: true },
    { name: "Prem Nagar", city: "Rohtak", active: true },
    { name: "Shastri Nagar", city: "Rohtak", active: true },
    { name: "DLF Colony", city: "Rohtak", active: true },
    { name: "Model Town", city: "Rohtak", active: true },
    { name: "Civil Lines", city: "Rohtak", active: true },
  ],
};

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");

    const db = client.db(DB_NAME);

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      db.collection("categories").deleteMany({}),
      db.collection("countries").deleteMany({}),
      db.collection("states").deleteMany({}),
      db.collection("cities").deleteMany({}),
      db.collection("areas").deleteMany({}),
      db.collection("users").deleteMany({}),
      db.collection("properties").deleteMany({}),
      db.collection("conversations").deleteMany({}),
      db.collection("messages").deleteMany({}),
      db.collection("otps").deleteMany({}),
    ]);

    // Seed categories
    console.log("Seeding categories...");
    await db.collection("categories").insertMany(categories);

    // Seed locations
    console.log("Seeding locations...");
    await db.collection("countries").insertMany(locations.countries);
    await db.collection("states").insertMany(locations.states);
    await db.collection("cities").insertMany(locations.cities);
    await db.collection("areas").insertMany(locations.areas);

    // Create admin user
    console.log("Creating admin user...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = {
      name: "Administrator",
      email: "admin@aashishproperty.com",
      phone: "+919876543210",
      password: adminPassword,
      userType: "admin",
      profileImage: "",
      preferences: {
        propertyTypes: [],
        priceRange: { min: 0, max: 10000000 },
        locations: [],
      },
      favorites: [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const adminResult = await db.collection("users").insertOne(adminUser);
    console.log("Admin user created with ID:", adminResult.insertedId);

    // Create sample users
    console.log("Creating sample users...");
    const sampleUsers = [];

    // Sellers
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await bcrypt.hash(`seller${i}123`, 10);
      sampleUsers.push({
        name: `Seller User ${i}`,
        email: `seller${i}@example.com`,
        phone: `+9198765432${i.toString().padStart(2, "0")}`,
        password: hashedPassword,
        userType: "seller",
        profileImage: "",
        preferences: {
          propertyTypes: ["residential"],
          priceRange: { min: 1000000, max: 10000000 },
          locations: ["Rohtak"],
        },
        favorites: [],
        status: i <= 8 ? "active" : "pending",
        createdAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    // Agents
    for (let i = 1; i <= 5; i++) {
      const hashedPassword = await bcrypt.hash(`agent${i}123`, 10);
      sampleUsers.push({
        name: `Agent User ${i}`,
        email: `agent${i}@example.com`,
        phone: `+9198765433${i.toString().padStart(2, "0")}`,
        password: hashedPassword,
        userType: "agent",
        profileImage: "",
        agentProfile: {
          licenseNumber: `AGT${i.toString().padStart(4, "0")}`,
          experience: Math.floor(Math.random() * 10) + 1,
          specializations: ["residential", "commercial"],
          rating: (Math.random() * 2 + 3).toFixed(1),
          reviewCount: Math.floor(Math.random() * 50) + 5,
          aboutMe: `Experienced real estate agent with ${Math.floor(Math.random() * 10) + 1} years in the industry.`,
          serviceAreas: ["Rohtak", "Gurgaon"],
        },
        properties: [],
        preferences: {
          propertyTypes: ["residential", "commercial"],
          priceRange: { min: 500000, max: 20000000 },
          locations: ["Rohtak", "Gurgaon"],
        },
        favorites: [],
        status: "active",
        createdAt: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    // Buyers
    for (let i = 1; i <= 15; i++) {
      const hashedPassword = await bcrypt.hash(`buyer${i}123`, 10);
      sampleUsers.push({
        name: `Buyer User ${i}`,
        email: `buyer${i}@example.com`,
        phone: `+9198765434${i.toString().padStart(2, "0")}`,
        password: hashedPassword,
        userType: "buyer",
        profileImage: "",
        preferences: {
          propertyTypes: ["residential"],
          priceRange: { min: 2000000, max: 8000000 },
          locations: ["Rohtak"],
        },
        favorites: [],
        status: "active",
        createdAt: new Date(
          Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    const userResults = await db.collection("users").insertMany(sampleUsers);
    console.log(`Created ${userResults.insertedCount} sample users`);

    // Get seller IDs for properties
    const sellers = await db
      .collection("users")
      .find({ userType: "seller" })
      .toArray();
    const agents = await db
      .collection("users")
      .find({ userType: "agent" })
      .toArray();

    // Create sample properties
    console.log("Creating sample properties...");
    const sampleProperties = [];

    const propertyTitles = [
      "Luxury 3 BHK Apartment",
      "Modern 2 BHK Builder Floor",
      "Spacious 4 BHK Villa",
      "Commercial Office Space",
      "Independent House with Garden",
      "Premium 1 BHK Studio",
      "Duplex 3 BHK Apartment",
      "Retail Shop in Prime Location",
      "Furnished 2 BHK Apartment",
      "Plot for Construction",
      "Warehouse for Rent",
      "Showroom Space Available",
      "PG Accommodation",
      "Restaurant Space",
      "Industrial Plot",
    ];

    const sectors = [
      "Sector 1",
      "Sector 2",
      "Sector 3",
      "Sector 4",
      "Sector 5",
      "Sector 6",
      "Sector 7",
      "Sector 8",
      "Sector 9",
      "Sector 10",
    ];
    const mohallas = [
      "Prem Nagar",
      "Shastri Nagar",
      "DLF Colony",
      "Model Town",
      "Civil Lines",
    ];

    for (let i = 0; i < 50; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      const isCommercial = Math.random() > 0.7;
      const propertyType = isCommercial ? "commercial" : "residential";
      const isRent = Math.random() > 0.6;

      const location =
        Math.random() > 0.5
          ? sectors[Math.floor(Math.random() * sectors.length)]
          : mohallas[Math.floor(Math.random() * mohallas.length)];

      sampleProperties.push({
        title:
          propertyTitles[Math.floor(Math.random() * propertyTitles.length)] +
          ` - ${location}`,
        description: `Beautiful ${propertyType} property located in ${location}, Rohtak. Well-maintained and ready for immediate possession. Prime location with excellent connectivity.`,
        price: isCommercial
          ? Math.floor(Math.random() * 20000000) + 5000000
          : Math.floor(Math.random() * 15000000) + 2000000,
        priceType: isRent ? "rent" : "sale",
        propertyType: propertyType,
        subCategory: isCommercial
          ? ["office", "shop", "warehouse"][Math.floor(Math.random() * 3)]
          : ["1bhk", "2bhk", "3bhk", "4bhk"][Math.floor(Math.random() * 4)],
        location: {
          sector: sectors.includes(location) ? location : undefined,
          mohalla: mohallas.includes(location) ? location : undefined,
          address: `${location}, Rohtak, Haryana`,
          coordinates: {
            lat: 28.8955 + (Math.random() - 0.5) * 0.1,
            lng: 76.6066 + (Math.random() - 0.5) * 0.1,
          },
        },
        specifications: {
          bedrooms: isCommercial
            ? undefined
            : Math.floor(Math.random() * 4) + 1,
          bathrooms: isCommercial
            ? undefined
            : Math.floor(Math.random() * 3) + 1,
          area: Math.floor(Math.random() * 2000) + 500,
          facing: [
            "North",
            "South",
            "East",
            "West",
            "North-East",
            "North-West",
          ][Math.floor(Math.random() * 6)],
          floor: Math.floor(Math.random() * 10) + 1,
          totalFloors: Math.floor(Math.random() * 5) + 5,
          parking: Math.random() > 0.3,
          furnished: ["furnished", "semi-furnished", "unfurnished"][
            Math.floor(Math.random() * 3)
          ],
        },
        images: ["/placeholder.svg"],
        amenities: [
          "Power Backup",
          "Lift",
          "Security",
          "Garden",
          "Parking",
          "Water Supply",
          "Gym",
          "Swimming Pool",
          "Club House",
          "Kids Play Area",
        ].slice(0, Math.floor(Math.random() * 6) + 3),
        ownerId: seller._id.toString(),
        ownerType: Math.random() > 0.7 ? "agent" : "seller",
        contactInfo: {
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
        },
        status: ["active", "sold", "rented", "inactive"][
          Math.floor(Math.random() * 10) > 8 ? Math.floor(Math.random() * 4) : 0
        ],
        featured: Math.random() > 0.8,
        views: Math.floor(Math.random() * 500) + 10,
        createdAt: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        ),
        updatedAt: new Date(),
      });
    }

    const propertyResults = await db
      .collection("properties")
      .insertMany(sampleProperties);
    console.log(`Created ${propertyResults.insertedCount} sample properties`);

    // Create sample conversations and messages
    console.log("Creating sample conversations and messages...");
    const buyers = await db
      .collection("users")
      .find({ userType: "buyer" })
      .toArray();
    const properties = await db.collection("properties").find({}).toArray();

    const conversations = [];
    const messages = [];

    for (let i = 0; i < 20; i++) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const property =
        properties[Math.floor(Math.random() * properties.length)];
      const seller = sellers.find((s) => s._id.toString() === property.ownerId);

      if (!seller) continue;

      const conversationId = `conv_${Date.now()}_${i}`;
      const createdAt = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      );

      conversations.push({
        _id: conversationId,
        participants: [buyer._id.toString(), seller._id.toString()],
        propertyId: property._id.toString(),
        lastMessageAt: createdAt,
        createdAt: createdAt,
        updatedAt: createdAt,
      });

      // Add some messages
      const messageCount = Math.floor(Math.random() * 8) + 2;
      for (let j = 0; j < messageCount; j++) {
        const isFromBuyer = j % 2 === 0;
        const sender = isFromBuyer ? buyer : seller;
        const messageTime = new Date(createdAt.getTime() + j * 60 * 60 * 1000);

        const sampleMessages = isFromBuyer
          ? [
              "Hi, I'm interested in your property. Is it still available?",
              "Can we schedule a visit this weekend?",
              "What's the final price? Any scope for negotiation?",
              "Thank you for the information. I'll get back to you soon.",
              "Is the property ready for immediate possession?",
            ]
          : [
              "Yes, the property is still available. When would you like to visit?",
              "Sure, weekend works. How about Saturday 11 AM?",
              "The price is final, but we can discuss terms.",
              "No problem, feel free to contact me anytime.",
              "Yes, you can move in immediately after documentation.",
            ];

        messages.push({
          _id: `msg_${Date.now()}_${i}_${j}`,
          conversationId: conversationId,
          senderId: sender._id.toString(),
          senderName: sender.name,
          senderType: sender.userType,
          message:
            sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
          messageType: "text",
          readBy: [
            {
              userId: sender._id.toString(),
              readAt: messageTime,
            },
          ],
          createdAt: messageTime,
        });
      }
    }

    if (conversations.length > 0) {
      await db.collection("conversations").insertMany(conversations);
      console.log(`Created ${conversations.length} sample conversations`);
    }

    if (messages.length > 0) {
      await db.collection("messages").insertMany(messages);
      console.log(`Created ${messages.length} sample messages`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Countries: ${locations.countries.length}`);
    console.log(`- States: ${locations.states.length}`);
    console.log(`- Cities: ${locations.cities.length}`);
    console.log(`- Areas: ${locations.areas.length}`);
    console.log(`- Users: ${sampleUsers.length + 1} (including admin)`);
    console.log(`- Properties: ${sampleProperties.length}`);
    console.log(`- Conversations: ${conversations.length}`);
    console.log(`- Messages: ${messages.length}`);

    console.log("\n🔐 Admin Credentials:");
    console.log("Email: admin@aashishproperty.com");
    console.log("Phone: +919876543210");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

export default seedDatabase;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
