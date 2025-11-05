#!/usr/bin/env tsx
import fetch from 'node-fetch';

async function testFooterAPI() {
  console.log("🔌 Testing Footer API Endpoints");
  console.log("=".repeat(50));

  const baseUrl = 'http://localhost:8080';

  try {
    // Test public footer settings endpoint
    console.log("1️⃣ Testing GET /api/footer/settings");
    const settingsResponse = await fetch(`${baseUrl}/api/footer/settings`);
    console.log(`   Status: ${settingsResponse.status}`);
    
    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json();
      console.log(`   Success: ${settingsData.success}`);
      console.log(`   Company: ${settingsData.data?.companyName}`);
      console.log(`   Locations: ${settingsData.data?.locations?.length || 0}`);
    } else {
      console.log(`   Error: ${settingsResponse.statusText}`);
    }

    // Test public footer links endpoint  
    console.log("\n2️⃣ Testing GET /api/footer/links");
    const linksResponse = await fetch(`${baseUrl}/api/footer/links`);
    console.log(`   Status: ${linksResponse.status}`);
    
    if (linksResponse.ok) {
      const linksData = await linksResponse.json();
      console.log(`   Success: ${linksData.success}`);
      console.log(`   Links Count: ${linksData.data?.length || 0}`);
      
      if (linksData.data && linksData.data.length > 0) {
        console.log(`   Sample Link: ${linksData.data[0].title} -> ${linksData.data[0].url}`);
      }
    } else {
      console.log(`   Error: ${linksResponse.statusText}`);
    }

    // Test footer initialization endpoint
    console.log("\n3️⃣ Testing POST /api/footer/initialize");
    const initResponse = await fetch(`${baseUrl}/api/footer/initialize`, {
      method: 'POST'
    });
    console.log(`   Status: ${initResponse.status}`);
    
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log(`   Success: ${initData.success}`);
      console.log(`   Message: ${initData.data?.message}`);
    } else {
      console.log(`   Error: ${initResponse.statusText}`);
    }

    console.log("\n✅ Footer API testing completed!");

  } catch (error) {
    console.error("❌ Error testing footer API:", error);
  }
}

testFooterAPI();
