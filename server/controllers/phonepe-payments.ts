const getPhonePeConfig = async (): Promise<PhonePeConfig | null> => {
  try {
    const db = getDatabase();
    const settings = await db.collection("admin_settings").findOne({});
    const cfg = settings?.payment?.phonePe as Partial<PhonePeConfig> | undefined;

    // Use DB if complete & enabled
    if (cfg?.enabled && cfg.merchantId && cfg.saltKey && String(cfg.saltIndex ?? "").trim() !== "") {
      return {
        enabled: true,
        merchantId: String(cfg.merchantId).trim(),
        saltKey: String(cfg.saltKey).trim(),
        saltIndex: String(cfg.saltIndex).trim(), // always string
        testMode: !!cfg.testMode,
      };
    }

    // ENV fallback (trim everything)
    const envMerchant = (process.env.PHONEPE_MERCHANT_ID ?? "").trim();
    const envSaltKey  = (process.env.PHONEPE_SALT_KEY ?? "").trim();
    const envSaltIdx  = String(process.env.PHONEPE_SALT_INDEX ?? "").trim();
    const baseUrlRaw  = (process.env.PHONEPE_BASE_URL ?? "").trim().toLowerCase();

    // If no base URL provided, assume sandbox (safer for prod accidents)
    const envTestMode = baseUrlRaw
      ? (baseUrlRaw.includes("pg-sandbox") || baseUrlRaw.includes("preprod"))
      : true;

    if (envMerchant && envSaltKey && envSaltIdx) {
      return {
        enabled: true,
        merchantId: envMerchant,
        saltKey: envSaltKey,
        saltIndex: envSaltIdx,
        testMode: envTestMode,
      };
    }

    console.error("❌ PhonePe config not found in DB or ENV");
    return null;
  } catch (e) {
    console.error("Error reading PhonePe config:", e);
    return null;
  }
};
