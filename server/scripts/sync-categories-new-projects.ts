import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set; aborting");
    process.exit(1);
  }

  const client = new MongoClient(uri, { maxPoolSize: 5 });
  try {
    await client.connect();
    const dbName = process.env.DB_NAME || "aashish_property";
    const db = client.db(dbName);

    console.log("Connected to database. Running category sync...");

    const desiredCategories = [
      "Buy",
      "Sale",
      "Rent",
      "Lease",
      "PG",
      "Other Services",
      "Top Property",
      "New Projects",
    ];

    const desiredOrder: Record<string, number> = {};
    desiredCategories.forEach((name, idx) => (desiredOrder[name] = idx + 1));

    function slugify(name: string) {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    const categoriesCol = db.collection("categories");
    const subcategoriesCol = db.collection("subcategories");
    const propertiesCol = db.collection("properties");

    // Upsert desired categories
    const keepSlugs = desiredCategories.map((n) => slugify(n));
    for (const name of desiredCategories) {
      const slug = slugify(name);
      const existing = await categoriesCol.findOne({ slug });
      const now = new Date();
      const doc = {
        name,
        slug,
        iconUrl: "",
        description: name === "Other Services" ? "Service categories" : "",
        sortOrder: desiredOrder[name] || 999,
        isActive: true,
        updatedAt: now,
      };

      if (existing) {
        await categoriesCol.updateOne(
          { _id: existing._id },
          { $set: { ...doc } },
        );
      } else {
        await categoriesCol.insertOne({ ...doc, createdAt: now });
      }
    }

    // Ensure Other Services subcategories
    const otherServicesSlug = slugify("Other Services");
    const otherCat = await categoriesCol.findOne({ slug: otherServicesSlug });
    if (!otherCat) {
      throw new Error("Other Services category not found after upsert");
    }
    const otherCategoryId = otherCat._id.toString();

    const otherSubcats = [
      "Home Painting",
      "Home Cleaning",
      "Electrician",
      "Plumbing",
      "Carpentry",
      "AC Service/Repair",
      "Home Appliances Service/Repair",
      "Home Interiors",
      "Packers & Movers",
    ];

    const allowedSubSlugs = otherSubcats.map((s) => slugify(s));

    // Upsert required subcategories
    for (let i = 0; i < otherSubcats.length; i++) {
      const name = otherSubcats[i];
      const slug = slugify(name);
      const existing = await subcategoriesCol.findOne({ slug, categoryId: otherCategoryId });
      const now = new Date();
      const doc: any = {
        name,
        slug,
        categoryId: otherCategoryId,
        description: "",
        sortOrder: i + 1,
        isActive: true,
        updatedAt: now,
      };
      if (existing) {
        await subcategoriesCol.updateOne({ _id: existing._id }, { $set: doc });
      } else {
        await subcategoriesCol.insertOne({ ...doc, createdAt: now });
      }
    }

    // Delete subcategories under Other Services that are not in the allowed list
    const deletedSubRes = await subcategoriesCol.deleteMany({
      categoryId: otherCategoryId,
      slug: { $nin: allowedSubSlugs },
    });

    console.log(`Removed ${deletedSubRes.deletedCount} old subcategories from Other Services`);

    // Create New Projects category with type special
    const newProjectsSlug = slugify("New Projects");
    const existingNewProj = await categoriesCol.findOne({ slug: newProjectsSlug });
    const now = new Date();
    if (!existingNewProj) {
      await categoriesCol.insertOne({
        name: "New Projects",
        slug: newProjectsSlug,
        iconUrl: "",
        description: "Special category for new projects",
        sortOrder: desiredCategories.indexOf("New Projects") + 1,
        isActive: true,
        type: "special",
        createdAt: now,
        updatedAt: now,
      });
      console.log("Inserted New Projects category");
    } else {
      await categoriesCol.updateOne({ _id: existingNewProj._id }, { $set: { updatedAt: now, type: "special", isActive: true } });
      console.log("Updated New Projects category");
    }

    // Remove old categories not in keep list only when safe (no subcategories and no properties)
    const allCategories = await categoriesCol.find({}).toArray();
    let removedCount = 0;
    for (const cat of allCategories) {
      if (!keepSlugs.includes(cat.slug)) {
        const catIdStr = cat._id.toString();
        const subcount = await subcategoriesCol.countDocuments({ categoryId: catIdStr });

        // Find properties referencing this category by propertyType OR subCategory in sub slugs
        const subSlugs = (await subcategoriesCol.find({ categoryId: catIdStr }).toArray()).map((s: any) => s.slug).filter(Boolean);
        const propFilter: any = { $or: [{ propertyType: cat.slug }] };
        if (subSlugs.length > 0) propFilter.$or.push({ subCategory: { $in: subSlugs } });
        const propCount = await propertiesCol.countDocuments(propFilter);

        if (subcount === 0 && propCount === 0) {
          await categoriesCol.deleteOne({ _id: cat._id });
          removedCount++;
        } else {
          console.log(`Skipping deletion of category '${cat.name}' — subcount=${subcount}, propCount=${propCount}`);
        }
      }
    }

    console.log(`Removed ${removedCount} old categories (safe removals)`);

    console.log("Category and New Projects sync complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(2);
  } finally {
    try {
      await client.close();
    } catch {}
  }
}

main();
