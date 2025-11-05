#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";
import { ObjectId } from "mongodb";

async function testContentUpdate() {
  console.log("🧪 Testing Content Page Updates");
  console.log("=".repeat(50));

  try {
    const { db } = await connectToDatabase();

    // First, check if we have any content pages
    const pages = await db.collection("content_pages").find({}).toArray();
    console.log(`📄 Found ${pages.length} content pages in database`);

    if (pages.length === 0) {
      // Create a test page first
      console.log("�� Creating a test page...");
      const testPage = {
        title: "Test Page",
        slug: "test-page",
        content: "This is a test page content",
        metaTitle: "Test Page",
        metaDescription: "Test page description",
        status: "draft",
        type: "page",
        featuredImage: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("content_pages").insertOne(testPage);
      console.log(`✅ Test page created with ID: ${result.insertedId}`);
      pages.push({ ...testPage, _id: result.insertedId } as any);
    }

    // Test updating the first page
    const pageToUpdate = pages[0];
    console.log(`\n🔄 Testing update for page: ${pageToUpdate.title} (ID: ${pageToUpdate._id})`);

    const testUpdateData = {
      title: `${pageToUpdate.title} - Updated ${new Date().toLocaleTimeString()}`,
      content: `${pageToUpdate.content}\n\n--- Updated at ${new Date().toLocaleString()} ---`,
      updatedAt: new Date(),
    };

    console.log("📤 Update data:", testUpdateData);

    const updateResult = await db
      .collection("content_pages")
      .updateOne(
        { _id: new ObjectId(pageToUpdate._id) },
        { $set: testUpdateData }
      );

    console.log(`📊 Update result:`, updateResult);

    if (updateResult.modifiedCount > 0) {
      console.log("✅ Update successful!");
      
      // Verify the update
      const updatedPage = await db.collection("content_pages").findOne({ _id: new ObjectId(pageToUpdate._id) });
      console.log("✅ Updated page title:", updatedPage?.title);
      console.log("✅ Updated page content length:", updatedPage?.content?.length);
    } else {
      console.log("❌ No documents were modified");
    }

    // Test with invalid ID
    console.log("\n🧪 Testing with invalid ID...");
    try {
      const invalidResult = await db
        .collection("content_pages")
        .updateOne(
          { _id: new ObjectId("507f1f77bcf86cd799439011") }, // Non-existent ID
          { $set: { title: "Should not work" } }
        );
      console.log("📊 Invalid ID result:", invalidResult);
    } catch (error) {
      console.log("❌ Invalid ID error (expected):", (error as Error).message);
    }

    // List all pages
    console.log("\n📋 All pages after update:");
    const allPages = await db.collection("content_pages").find({}).toArray();
    allPages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.title} (${page.status}) - Updated: ${page.updatedAt}`);
    });

  } catch (error) {
    console.error("❌ Error testing content update:", error);
  } finally {
    await closeDatabaseConnection();
  }
}

testContentUpdate();
