import fetch from "node-fetch";

async function run() {
  const base = "http://localhost:5000";
  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "seller@test.com",
        password: "password123",
      }),
    });
    const loginJson = await loginRes
      .json()
      .catch(() => ({ raw: "invalid json" }));
    console.log("LOGIN_RESPONSE");
    console.log(JSON.stringify(loginJson, null, 2));

    const token = loginJson?.data?.token;
    if (!token) {
      console.error("No token received; aborting further tests");
      return;
    }

    const endpoints = [
      "/api/seller/stats",
      "/api/seller/properties",
      "/api/seller/messages",
      "/api/seller/notifications",
    ];
    for (const ep of endpoints) {
      const res = await fetch(base + ep, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let json;
      try {
        json = await res.json();
      } catch (e) {
        json = { raw: await res.text() };
      }
      console.log("\n=== " + ep + " ===");
      console.log(JSON.stringify(json, null, 2));
    }
  } catch (err) {
    console.error("Test script error:", err);
  }
}

run();
