// server/config/phonepe.ts
export const phonePeConfig = {
  enabled: true,
  testMode: true, // false for production

  merchantId: process.env.PHONEPE_MERCHANT_ID || "YOUR_MERCHANT_ID",
  saltKey: process.env.PHONEPE_SALT_KEY || "YOUR_SALT_KEY",
  saltIndex: process.env.PHONEPE_SALT_INDEX || "1",

  // Your website origin (used for returnUrl)
  // IMPORTANT: must be HTTPS in production and publicly reachable
  siteOrigin: process.env.SITE_ORIGIN || "https://your-domain.com",

  // Endpoints
  sandboxBase: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  // New PG base (if your merchant is on new PG), else hermes works for legacy
  prodBase: "https://api.phonepe.com/apis/hermes",

  // Fixed API paths
  payPath: "/pg/v1/pay",
  statusPathPrefix: "/pg/v1/status", // /{merchantId}/{merchantTransactionId}
  callbackPath: "/api/payments/phonepe/callback", // your server webhook
};
