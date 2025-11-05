#!/usr/bin/env tsx
/**
 * Initialize comprehensive property categories with proper subcategories
 * This ensures that properties are correctly categorized and displayed
 * on their respective category pages (buy, rent, commercial, agricultural, pg)
 */

import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";

interface SubcategoryData {
  name: string;
  slug: string;
  description: string;
}

interface CategoryData {
  name: string;
  slug: string;
  description: string;
  propertyTypes: string[]; // Which propertyTypes belong to this category
  priceTypes?: string[]; // Which priceTypes (sale, rent, lease) - if applicable
  subcategories: SubcategoryData[];
  sortOrder: number;
  isActive: boolean;
}

const categories: CategoryData[] = [
  {
    name: "Buy",
    slug: "buy",
    description: "Buy properties - apartments, houses, plots and more",
    propertyTypes: ["residential", "plot"],
    priceTypes: ["sale"],
    sortOrder: 1,
    isActive: true,
    subcategories: [
      { name: "1 BHK", slug: "1bhk", description: "1 Bedroom apartments" },
      { name: "2 BHK", slug: "2bhk", description: "2 Bedroom apartments" },
      { name: "3 BHK", slug: "3bhk", description: "3 Bedroom apartments" },
      {
        name: "4+ BHK",
        slug: "4bhk-plus",
        description: "4 or more bedroom apartments",
      },
      {
        name: "Independent House",
        slug: "independent-house",
        description: "Standalone houses",
      },
      { name: "Villa", slug: "villa", description: "Luxury villas" },
      {
        name: "Builder Floor",
        slug: "builder-floor",
        description: "Builder floors",
      },
      { name: "Penthouse", slug: "penthouse", description: "Penthouse units" },
      {
        name: "Studio Apartment",
        slug: "studio-apartment",
        description: "Studio apartments",
      },
      { name: "Duplex", slug: "duplex", description: "Duplex properties" },
      {
        name: "Residential Plot",
        slug: "residential-plot",
        description: "Land for residential construction",
      },
      {
        name: "Commercial Plot",
        slug: "commercial-plot",
        description: "Land for commercial development",
      },
      {
        name: "Industrial Plot",
        slug: "industrial-plot",
        description: "Land for industrial purposes",
      },
      {
        name: "Agricultural Land",
        slug: "agricultural-land",
        description: "Farmland and agricultural plots",
      },
      {
        name: "Plot/Land",
        slug: "plot",
        description: "Plots and land for sale",
      },
    ],
  },
  {
    name: "Rent",
    slug: "rent",
    description: "Rent properties - apartments, houses and more",
    propertyTypes: ["residential"],
    priceTypes: ["rent"],
    sortOrder: 2,
    isActive: true,
    subcategories: [
      {
        name: "1 BHK",
        slug: "1bhk",
        description: "1 Bedroom apartments for rent",
      },
      {
        name: "2 BHK",
        slug: "2bhk",
        description: "2 Bedroom apartments for rent",
      },
      {
        name: "3 BHK",
        slug: "3bhk",
        description: "3 Bedroom apartments for rent",
      },
      {
        name: "4+ BHK",
        slug: "4bhk-plus",
        description: "4+ Bedroom apartments for rent",
      },
      {
        name: "Independent House",
        slug: "independent-house",
        description: "Houses for rent",
      },
      { name: "Villa", slug: "villa", description: "Villas for rent" },
      {
        name: "Builder Floor",
        slug: "builder-floor",
        description: "Builder floors for rent",
      },
      {
        name: "Studio",
        slug: "studio-apartment",
        description: "Studio apartments for rent",
      },
    ],
  },
  {
    name: "Commercial",
    slug: "commercial",
    description: "Commercial properties - offices, shops, warehouses and more",
    propertyTypes: ["commercial"],
    sortOrder: 3,
    isActive: true,
    subcategories: [
      {
        name: "Office Space",
        slug: "office-space",
        description: "Commercial office units",
      },
      {
        name: "Shop/Showroom",
        slug: "shop-showroom",
        description: "Retail spaces and showrooms",
      },
      {
        name: "Warehouse",
        slug: "warehouse",
        description: "Storage and warehouse spaces",
      },
      {
        name: "Industrial Land",
        slug: "industrial-land",
        description: "Land for industrial use",
      },
      {
        name: "Business Center",
        slug: "business-center",
        description: "Shared office spaces",
      },
      {
        name: "Co-working Space",
        slug: "coworking",
        description: "Co-working environments",
      },
      {
        name: "Restaurant Space",
        slug: "restaurant-space",
        description: "Space for restaurants",
      },
      { name: "Factory", slug: "factory", description: "Industrial factories" },
    ],
  },
  {
    name: "Agricultural",
    slug: "agricultural",
    description: "Agricultural properties - farmland, orchards and more",
    propertyTypes: ["agricultural"],
    sortOrder: 4,
    isActive: true,
    subcategories: [
      {
        name: "Agricultural Land",
        slug: "agricultural-land",
        description: "Farmland and agricultural plots",
      },
      {
        name: "Farmhouse with Land",
        slug: "farmhouse-with-land",
        description: "Farmhouse with land",
      },
      {
        name: "Orchard/Plantation",
        slug: "orchard-plantation",
        description: "Orchard and plantation land",
      },
      {
        name: "Dairy Farm",
        slug: "dairy-farm",
        description: "Dairy farming land",
      },
      {
        name: "Poultry Farm",
        slug: "poultry-farm",
        description: "Poultry farming land",
      },
      {
        name: "Fish/Prawn Farm",
        slug: "fish-farm-pond",
        description: "Fish and prawn farming ponds",
      },
      {
        name: "Polyhouse/Greenhouse",
        slug: "polyhouse-greenhouse",
        description: "Polyhouse and greenhouse structures",
      },
      {
        name: "Pasture/Grazing Land",
        slug: "pasture-grazing",
        description: "Pasture and grazing land",
      },
      {
        name: "Horticulture Land",
        slug: "horticulture-land",
        description: "Horticulture farming land",
      },
    ],
  },
  {
    name: "PG/Hostel",
    slug: "pg",
    description: "Paying guest accommodations and hostels",
    propertyTypes: ["pg"],
    sortOrder: 5,
    isActive: true,
    subcategories: [
      {
        name: "Boys PG",
        slug: "boys-pg",
        description: "Paying guest accommodation for men",
      },
      {
        name: "Girls PG",
        slug: "girls-pg",
        description: "Paying guest accommodation for women",
      },
      {
        name: "Co-living Space",
        slug: "co-living",
        description: "Modern shared living spaces",
      },
      {
        name: "Shared Room",
        slug: "shared-room",
        description: "Shared room accommodation",
      },
      {
        name: "Single Room",
        slug: "single-room",
        description: "Private single room accommodation",
      },
      {
        name: "Hostel",
        slug: "hostel",
        description: "Dormitory style accommodation",
      },
    ],
  },
];

async function initializePropertyCategories() {
  console.log("🏠 Initializing Property Categories and Subcategories...");
  console.log("=".repeat(60));

  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to MongoDB");

    const categoriesCollection = db.collection("categories");
    const subcategoriesCollection = db.collection("subcategories");

    let categoriesCreated = 0;
    let subcategoriesCreated = 0;

    for (const categoryData of categories) {
      try {
        // Check if category exists
        const existingCategory = await categoriesCollection.findOne({
          slug: categoryData.slug,
        });

        let categoryId: string;
        const categoryDoc = {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          propertyTypes: categoryData.propertyTypes,
          priceTypes: categoryData.priceTypes,
          sortOrder: categoryData.sortOrder,
          isActive: categoryData.isActive,
          createdAt: existingCategory?.createdAt || new Date(),
          updatedAt: new Date(),
        };

        if (existingCategory) {
          await categoriesCollection.updateOne(
            { slug: categoryData.slug },
            { $set: categoryDoc },
          );
          categoryId = existingCategory._id.toString();
          console.log(`✅ Updated category: ${categoryData.name}`);
        } else {
          const result = await categoriesCollection.insertOne(categoryDoc);
          categoryId = result.insertedId.toString();
          categoriesCreated++;
          console.log(`➕ Created category: ${categoryData.name}`);
        }

        // Now handle subcategories
        for (const subcategoryData of categoryData.subcategories) {
          const existingSubcategory = await subcategoriesCollection.findOne({
            categoryId,
            slug: subcategoryData.slug,
          });

          const subcategoryDoc = {
            categoryId,
            name: subcategoryData.name,
            slug: subcategoryData.slug,
            description: subcategoryData.description,
            isActive: true,
            createdAt: existingSubcategory?.createdAt || new Date(),
            updatedAt: new Date(),
          };

          if (existingSubcategory) {
            await subcategoriesCollection.updateOne(
              { categoryId, slug: subcategoryData.slug },
              { $set: subcategoryDoc },
            );
          } else {
            await subcategoriesCollection.insertOne(subcategoryDoc);
            subcategoriesCreated++;
          }
        }

        console.log(
          `   📋 ${categoryData.subcategories.length} subcategories for ${categoryData.name}`,
        );
      } catch (error) {
        console.error(
          `❌ Error processing category ${categoryData.name}:`,
          error,
        );
      }
    }

    // Verify the initialization
    console.log("\n📊 VERIFICATION:");
    const totalCategories = await categoriesCollection.countDocuments();
    const totalSubcategories = await subcategoriesCollection.countDocuments();

    console.log(`✅ Total categories: ${totalCategories}`);
    console.log(`✅ Total subcategories: ${totalSubcategories}`);

    // List all categories and their subcategories
    console.log("\n📋 Categories and Subcategories:");
    for (const categoryData of categories) {
      const cat = await categoriesCollection.findOne({
        slug: categoryData.slug,
      });
      if (cat) {
        const subs = await subcategoriesCollection
          .find({ categoryId: cat._id.toString() })
          .toArray();
        console.log(`   ${categoryData.name} (${subs.length} subcategories)`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Property Categories Initialized Successfully!");
    console.log(
      `✅ Categories created/updated: ${categoriesCreated || "all existing"}`,
    );
    console.log(`✅ Subcategories created: ${subcategoriesCreated}`);
  } catch (error) {
    console.error("❌ Error initializing property categories:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run if called directly
if (import.meta.url === new URL(process.argv[1], "file://").href) {
  initializePropertyCategories()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { initializePropertyCategories };
