const http = require("http");

const options = {
  hostname: "localhost",
  port: 5173,
  path: "/api/health",
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    try {
      const response = JSON.parse(data);
      console.log("Response:", response);
      if (response.db === "ok") {
        console.log("✅ HEALTH CHECK PASSED");
        process.exit(0);
      } else {
        console.log("❌ HEALTH CHECK FAILED - DB NOT OK");
        process.exit(1);
      }
    } catch (e) {
      console.log("❌ HEALTH CHECK FAILED - INVALID JSON");
      process.exit(1);
    }
  });
});

req.on("error", (e) => {
  console.log("❌ HEALTH CHECK FAILED - NETWORK ERROR:", e.message);
  process.exit(1);
});

req.end();
