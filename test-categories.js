const baseUrl = "http://localhost:5173";

// Test Categories Module
async function testCategoriesModule() {
  console.log("🧪 TESTING CATEGORIES MODULE");

  // Step 1: Login as admin to get token
  console.log("Step 1: Getting admin token...");
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@aashishproperty.com",
      password: "admin123",
    }),
  });

  const loginData = await loginResponse.json();
  if (!loginData.success) {
    console.error("❌ Failed to login:", loginData.error);
    return false;
  }

  const token = loginData.data.token;
  console.log("✅ Admin login successful");

  // Step 2: Get current categories (cache check)
  console.log("Step 2: Fetching current categories...");
  const categoriesResponse = await fetch(`${baseUrl}/api/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const categoriesData = await categoriesResponse.json();
  if (!categoriesData.success) {
    console.error("❌ Failed to fetch categories:", categoriesData.error);
    return false;
  }

  const initialCount = categoriesData.data.length;
  console.log(`✅ Current categories count: ${initialCount}`);

  // Step 3: Create new test category
  console.log("Step 3: Creating test category...");
  const testCategory = {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    icon: "🧪",
    description: "Test category for admin testing",
    subcategories: [],
    order: 999,
    active: true,
  };

  const createResponse = await fetch(`${baseUrl}/api/admin/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testCategory),
  });

  const createData = await createResponse.json();
  if (!createData.success) {
    console.error("❌ Failed to create category:", createData.error);
    return false;
  }

  console.log("✅ Test category created successfully");
  const newCategoryId = createData.data._id;

  // Step 4: Verify cache invalidation - fetch categories again
  console.log("Step 4: Verifying cache invalidation...");
  const updatedCategoriesResponse = await fetch(
    `${baseUrl}/api/admin/categories`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const updatedCategoriesData = await updatedCategoriesResponse.json();
  if (!updatedCategoriesData.success) {
    console.error("❌ Failed to fetch updated categories");
    return false;
  }

  const newCount = updatedCategoriesData.data.length;
  if (newCount !== initialCount + 1) {
    console.error(
      `❌ Cache not invalidated. Expected ${initialCount + 1}, got ${newCount}`,
    );
    return false;
  }

  console.log("✅ Cache invalidated - category count increased");

  // Step 5: Test category update
  console.log("Step 5: Testing category update...");
  const updateResponse = await fetch(
    `${baseUrl}/api/admin/categories/${newCategoryId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: false }),
    },
  );

  const updateData = await updateResponse.json();
  if (!updateData.success) {
    console.error("❌ Failed to update category:", updateData.error);
    return false;
  }

  console.log("✅ Category updated successfully");

  // Step 6: Test category deletion
  console.log("Step 6: Testing category deletion...");
  const deleteResponse = await fetch(
    `${baseUrl}/api/admin/categories/${newCategoryId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const deleteData = await deleteResponse.json();
  if (!deleteData.success) {
    console.error("❌ Failed to delete category:", deleteData.error);
    return false;
  }

  console.log("✅ Category deleted successfully");

  // Step 7: Final verification
  console.log("Step 7: Final verification...");
  const finalCategoriesResponse = await fetch(
    `${baseUrl}/api/admin/categories`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const finalCategoriesData = await finalCategoriesResponse.json();
  const finalCount = finalCategoriesData.data.length;

  if (finalCount !== initialCount) {
    console.error(
      `❌ Final count mismatch. Expected ${initialCount}, got ${finalCount}`,
    );
    return false;
  }

  console.log("✅ Final verification passed");
  console.log("🎉 PASS: Categories module test completed successfully");

  return true;
}

// Run the test
testCategoriesModule().catch(console.error);
