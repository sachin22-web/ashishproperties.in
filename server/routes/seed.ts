import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import bcrypt from "bcrypt";

// Database seeding endpoint
export const seedDatabase: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    console.log("Starting database seeding...");

    // Categories data
    const categories = [
      {
        name: "Residential",
        slug: "residential",
        icon: "🏠",
        description: "Residential properties for living",
        subcategories: [
          { id: "1bhk", name: "1 BHK Apartment", slug: "1bhk" },
          { id: "2bhk", name: "2 BHK Apartment", slug: "2bhk" },
          { id: "3bhk", name: "3 BHK Apartment", slug: "3bhk" },
          { id: "4bhk", name: "4 BHK Apartment", slug: "4bhk" },
          { id: "villa", name: "Villa", slug: "villa" },
          {
            id: "independent-house",
            name: "Independent House",
            slug: "independent-house",
          },
          { id: "builder-floor", name: "Builder Floor", slug: "builder-floor" },
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
          { id: "office", name: "Office Space", slug: "office" },
          { id: "shop", name: "Shop/Retail", slug: "shop" },
          { id: "warehouse", name: "Warehouse", slug: "warehouse" },
          { id: "showroom", name: "Showroom", slug: "showroom" },
          { id: "restaurant", name: "Restaurant Space", slug: "restaurant" },
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
          },
          {
            id: "commercial-plot",
            name: "Commercial Plot",
            slug: "commercial-plot",
          },
          {
            id: "agricultural-land",
            name: "Agricultural Land",
            slug: "agricultural-land",
          },
          {
            id: "industrial-plot",
            name: "Industrial Plot",
            slug: "industrial-plot",
          },
        ],
        order: 3,
        active: true,
      },
    ];

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      db.collection("categories").deleteMany({}),
      db.collection("users").deleteMany({ userType: { $ne: "admin" } }), // Keep admin users
      db.collection("properties").deleteMany({}),
      db.collection("conversations").deleteMany({}),
      db.collection("messages").deleteMany({}),
    ]);

    // Seed categories
    console.log("Seeding categories...");
    await db.collection("categories").insertMany(categories);

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
          rating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
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
    ];

    const sectors = [
      "Sector 1",
      "Sector 2",
      "Sector 3",
      "Sector 4",
      "Sector 5",
    ];
    const mohallas = [
      "Prem Nagar",
      "Shastri Nagar",
      "DLF Colony",
      "Model Town",
    ];

    for (let i = 0; i < 25; i++) {
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
        description: `Beautiful ${propertyType} property located in ${location}, Rohtak. Well-maintained and ready for immediate possession.`,
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
          facing: ["North", "South", "East", "West"][
            Math.floor(Math.random() * 4)
          ],
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
        ].slice(0, Math.floor(Math.random() * 4) + 2),
        ownerId: seller._id.toString(),
        ownerType: "seller",
        contactInfo: {
          name: seller.name,
          phone: seller.phone,
          email: seller.email,
        },
        status: Math.random() > 0.1 ? "active" : "inactive",
        featured: Math.random() > 0.8,
        views: Math.floor(Math.random() * 500) + 10,
        approvalStatus: Math.random() > 0.5 ? "pending" : (Math.random() > 0.5 ? "approved" : "rejected"),
        approvedAt: null,
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

    // Initialize advertisement packages
    const existingPackages = await db
      .collection("ad_packages")
      .countDocuments();
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
            "Enhanced property details",
            "Contact information display",
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
            "Enhanced property details",
            "Multiple image gallery",
            "Contact information display",
            "Analytics dashboard",
            "Priority customer support",
          ],
          type: "premium",
          category: "property",
          location: "rohtak",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("ad_packages").insertMany(defaultPackages);
      console.log(`Created ${defaultPackages.length} advertisement packages`);
    }

    // Initialize banner ads
    const existingBanners = await db.collection("banners").countDocuments();
    if (existingBanners === 0) {
      const defaultBanners = [
        {
          title: "Welcome to Aashish Property",
          description: "Find your dream property in Rohtak",
          image:
            "https://via.placeholder.com/1200x300?text=Welcome+to+Aashish+Property",
          position: "homepage_top",
          active: true,
          priority: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Premium Properties in Rohtak",
          description: "Explore premium residential and commercial properties",
          image: "https://via.placeholder.com/600x200?text=Premium+Properties",
          position: "homepage_middle",
          active: true,
          priority: 9,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection("banners").insertMany(defaultBanners);
      console.log(`Created ${defaultBanners.length} banner ads`);
    }

    const response: ApiResponse<any> = {
      success: true,
      message: "Database seeded successfully",
      data: {
        categories: categories.length,
        users: sampleUsers.length,
        properties: sampleProperties.length,
        packages: "initialized",
        banners: "initialized",
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error seeding database:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed database",
    });
  }
};
