// server/controllers/phonepe-payments.ts
import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import crypto from "crypto";
import { ObjectId } from "mongodb";

// ---------------- Types ----------------
interface PhonePeConfig {
  enabled: boolean;
  merchantId: string;
  saltKey: string;
  saltIndex: string; // string per PhonePe docs
  testMode: boolean;
}

// ---------------- Utils ----------------
const getBaseUrl = (req: any) => {
  const proto =
    (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
  const host = req.get("host");
  return `${proto}://${host}`;
};

/** Load config from DB: admin_settings.payment.phonePe */
const getPhonePeConfig = async (): Promise<PhonePeConfig | null> => {
  try {
    const db = getDatabase();
    const settings = await db.collection("admin_settings").findOne({});
    const cfg = settings?.payment?.phonePe as PhonePeConfig | undefined;
    if (!cfg?.enabled) return null;

    if (!cfg.merchantId || !cfg.saltKey || !cfg.saltIndex) {
      console.error("❌ PhonePe config incomplete", {
        hasMerchantId: !!cfg?.merchantId,
        hasSaltKey: !!cfg?.saltKey,
        hasSaltIndex: !!cfg?.saltIndex,
      });
      return null;
    }

    return {
      enabled: true,
      merchantId: cfg.merchantId,
      saltKey: cfg.saltKey,
      saltIndex: String(cfg.saltIndex),
      testMode: !!cfg.testMode,
    };
  } catch (e) {
    console.error("Error reading PhonePe config:", e);
    return null;
  }
};

/** sha256(base64Payload + APIPath + saltKey) + "###" + saltIndex */
const generateChecksum = (
  base64Payload: string,
  endpoint: string,
  saltKey: string,
  saltIndex: string
) => {
  const data = base64Payload + endpoint + saltKey;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return `${hash}###${saltIndex}`;
};

/** For callback/status verify: sha256(responseBase64 + saltKey) == x-verify(before ###) */
const verifyChecksum = (responseBase64: string, xVerify: string, saltKey: string) => {
  try {
    const [hash] = (xVerify || "").split("###");
    const calc = crypto.createHash("sha256").update(responseBase64 + saltKey).digest("hex");
    return calc === hash;
  } catch {
    return false;
  }
};

// ---------------- Handlers ----------------

/**
 * POST /api/payments/phonepe/create
 * Body:
 *  { packageId, propertyId?, paymentMethod?, paymentDetails?, mode?: "redirect" | "qr" }
 */
export const createPhonePeTransaction: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const userIdRaw = (req as any).userId as string | undefined;
    if (!userIdRaw) {
      return res.status(401).json({ success: false, error: "Please login to continue" });
    }
    const userId = new ObjectId(userIdRaw);

    const { packageId, propertyId, paymentMethod, paymentDetails, mode } = (req.body ||
      {}) as {
      packageId: string;
      propertyId?: string | null;
      paymentMethod?: string;
      paymentDetails?: { merchantTransactionId?: string; [k: string]: any };
      mode?: "redirect" | "qr";
    };

    if (!packageId) {
      return res.status(400).json({ success: false, error: "Missing required field: packageId" });
    }

    const finalPaymentMethod = paymentMethod || "phonepe";
    const merchantTransactionId =
      paymentDetails?.merchantTransactionId ||
      `ap_${userId.toString()}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

    const config = await getPhonePeConfig();
    if (!config) {
      return res.status(400).json({
        success: false,
        error: "PhonePe is not configured/enabled. Please contact support.",
      });
    }

    let pkgId: ObjectId;
    try {
      pkgId = new ObjectId(packageId);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid package ID" });
    }

    const pack = await db.collection("ad_packages").findOne({ _id: pkgId });
    if (!pack) return res.status(404).json({ success: false, error: "Package not found" });

    const propId = propertyId ? new ObjectId(propertyId) : undefined;
    const now = new Date();

    // Create local transaction (pending)
    const insertRes = await db.collection("transactions").insertOne({
      userId,
      packageId: pkgId,
      propertyId: propId,
      amount: Number(pack.price || 0), // rupees in our DB
      currency: "INR",
      paymentMethod: finalPaymentMethod,
      paymentDetails: paymentDetails || {},
      merchantTransactionId,
      phonepeTxnId: null as null | string,
      status: "pending",
      packageName: pack.name,
      packageDuration: pack.duration,
      createdAt: now,
      updatedAt: now,
    });

    // ---- PhonePe request build ----
    const baseUrl = getBaseUrl(req);
    const payEndpoint = "/pg/v1/pay";

    const useQR = (mode || "").toLowerCase() === "qr";
    const paymentInstrument = useQR ? { type: "UPI_QR" } : { type: "PAY_PAGE" };

    const payRequest = {
      merchantId: config.merchantId,
      merchantTransactionId,
      merchantUserId: userId.toString(),
      amount: Math.max(100, Math.round(Number(pack.price) * 100)), // paise, >= ₹1.00
      redirectUrl: `${baseUrl}/payment-callback?packageId=${pkgId.toString()}&propertyId=${propId?.toString() || ""}&transactionId=${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${baseUrl}/api/payments/phonepe/callback`,
      mobileNumber: (req as any).userPhone || undefined,
      paymentInstrument,
    };

    // Prepare signature
    const payload = Buffer.from(JSON.stringify(payRequest)).toString("base64");
    const xVerify = generateChecksum(payload, payEndpoint, config.saltKey, config.saltIndex);

    const apiRoot = config.testMode
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/hermes";

    const resp = await fetch(`${apiRoot}${payEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": config.merchantId,
      },
      body: JSON.stringify({ request: payload }),
    });

    const respText = await resp.text();
    let respJson: any = null;
    try {
      respJson = JSON.parse(respText);
    } catch {
      // ignore
    }
    console.log("PhonePe /pg/v1/pay RAW:", respText);

    if (!resp.ok || !respJson?.success) {
      const code = respJson?.code || resp.status;
      const message = respJson?.message || "PhonePe pay failed";
      console.error("PhonePe init failed:", code, message, respJson);
      return res.status(200).json({ success: false, error: `PhonePe: ${code} - ${message}` });
    }

    const instrumentResponse = respJson?.data?.instrumentResponse || {};
    const redirectUrl =
      instrumentResponse?.redirectInfo?.url || respJson?.data?.redirectUrl || null;
    const qrBase64 = instrumentResponse?.qrData || null;

    const out: ApiResponse<{
      transactionId: string;
      status: string;
      redirectUrl?: string | null;
      qrBase64?: string | null;
      merchantTransactionId: string;
    }> = {
      success: true,
      data: {
        transactionId: insertRes.insertedId.toString(),
        status: "pending",
        redirectUrl,
        qrBase64,
        merchantTransactionId,
      },
    };
    return res.json(out);
  } catch (err: any) {
    console.error("Error creating PhonePe transaction:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to create transaction" });
  }
};

/**
 * POST /api/payments/phonepe/callback
 * PhonePe server POST. Verify checksum, decode payload, update txn + property.
 */
export const phonePeCallback: RequestHandler = async (req, res) => {
  try {
    const config = await getPhonePeConfig();
    if (!config) return res.status(400).json({ success: false, error: "PhonePe not configured" });

    const { response } = req.body as { response?: string };
    const xVerify =
      (req.headers["x-verify"] as string) || (req.headers["x-VERIFY"] as string);

    if (!response || !xVerify) {
      return res.status(400).json({ success: false, error: "Invalid callback data" });
    }

    if (!verifyChecksum(response, xVerify, config.saltKey)) {
      return res.status(400).json({ success: false, error: "Invalid checksum" });
    }

    const decoded = JSON.parse(Buffer.from(response, "base64").toString("utf-8"));
    const data = decoded?.data || {};
    const merchantTransactionId: string = data.merchantTransactionId;
    const phonepeTxnId: string = data.transactionId;
    const state: string = data.state; // SUCCESS / COMPLETED / PENDING / FAILED

    const db = getDatabase();

    const tx = await db.collection("transactions").findOne({ merchantTransactionId });
    if (!tx) {
      console.error("Txn not found (callback):", merchantTransactionId);
      return res.status(200).json({ success: true }); // ack anyway
    }

    const paidStates = new Set(["SUCCESS", "COMPLETED"]);
    const newStatus =
      paidStates.has(state) ? "paid" : state === "FAILED" ? "failed" : "processing";

    await db.collection("transactions").updateOne(
      { _id: tx._id },
      {
        $set: {
          status: newStatus,
          phonepeTxnId,
          phonepeResponse: decoded,
          updatedAt: new Date(),
          ...(newStatus === "paid" ? { paidAt: new Date() } : {}),
        },
      }
    );

    // If paid and property exists → push to pending admin approval
    if (newStatus === "paid" && tx.propertyId && tx.packageId) {
      const package_ = await db.collection("ad_packages").findOne({
        _id: new ObjectId(String(tx.packageId)),
      });
      if (package_) {
        const packageExpiry = new Date();
        packageExpiry.setDate(packageExpiry.getDate() + Number(package_.duration || 0));

        await db.collection("properties").updateOne(
          { _id: new ObjectId(String(tx.propertyId)) },
          {
            $set: {
              packageId: new ObjectId(String(tx.packageId)),
              packageExpiry,
              featured: package_.type === "featured" || package_.type === "premium",
              status: "inactive",
              approvalStatus: "pending_approval",
              updatedAt: new Date(),
              premiumPaymentCompletedAt: new Date(),
            },
          }
        );
      }
    }

    return res.json({ success: true, message: "Callback processed" });
  } catch (err) {
    console.error("PhonePe callback error:", err);
    return res.status(500).json({ success: false, error: "Failed to process callback" });
  }
};

/**
 * GET /api/payments/phonepe/status/:merchantTransactionId
 * Poll PhonePe for status (merchantTransactionId).
 */
export const getPhonePePaymentStatus: RequestHandler = async (req, res) => {
  try {
    const config = await getPhonePeConfig();
    if (!config) return res.status(400).json({ success: false, error: "PhonePe not configured" });

    const merchantTransactionId = req.params.merchantTransactionId;
    if (!merchantTransactionId) {
      return res.status(400).json({ success: false, error: "Missing merchantTransactionId" });
    }

    const endpoint = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
    const xVerify = generateChecksum("", endpoint, config.saltKey, config.saltIndex);

    const apiRoot = config.testMode
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/hermes";

    const r = await fetch(`${apiRoot}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": config.merchantId,
      },
    });

    const text = await r.text();
    let j: any = null;
    try {
      j = JSON.parse(text);
    } catch {}
    console.log("PhonePe status RAW:", text);

    if (j?.success) {
      const db = getDatabase();
      const state = j.data?.state as string | undefined;

      const paidStates = new Set(["SUCCESS", "COMPLETED"]);
      const newStatus =
        paidStates.has(state || "") ? "paid" : state === "FAILED" ? "failed" : "processing";

      await db.collection("transactions").updateOne(
        { merchantTransactionId },
        {
          $set: {
            status: newStatus,
            phonepeResponse: j.data,
            updatedAt: new Date(),
            ...(newStatus === "paid" ? { paidAt: new Date() } : {}),
          },
        }
      );
    }

    const out: ApiResponse<any> = { success: !!j?.success, data: j?.data || j };
    return res.json(out);
  } catch (err: any) {
    console.error("Error checking PhonePe payment status:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to check payment status" });
  }
};

/**
 * POST /payment-callback
 * Browser redirect from PhonePe after payment.
 * Sends: packageId, propertyId, transactionId (merchantTransactionId)
 */
export const phonePePaymentCallback: RequestHandler = async (req, res) => {
  try {
    const packageId = (req.body?.packageId || req.query?.packageId) as string | undefined;
    const propertyId = (req.body?.propertyId || req.query?.propertyId) as string | undefined;
    const merchantTransactionId = (req.body?.transactionId || req.query?.transactionId) as
      | string
      | undefined;

    if (!merchantTransactionId) {
      return res.redirect("/?paymentStatus=error&reason=missing_transaction");
    }

    const db = getDatabase();
    const tx = await db.collection("transactions").findOne({ merchantTransactionId });

    if (!tx) {
      return res.redirect(
        `/?paymentStatus=pending&transactionId=${merchantTransactionId}&packageId=${packageId || ""}&propertyId=${
          propertyId || ""
        }`
      );
    }

    if (tx.status === "paid") {
      return res.redirect(
        `/seller-dashboard?paymentStatus=success&transactionId=${merchantTransactionId}&packageId=${packageId || ""}`
      );
    } else if (tx.status === "failed") {
      return res.redirect(
        `/?paymentStatus=failed&transactionId=${merchantTransactionId}&reason=payment_failed`
      );
    } else {
      return res.redirect(
        `/payment-status?transactionId=${merchantTransactionId}&packageId=${packageId || ""}&propertyId=${
          propertyId || ""
        }`
      );
    }
  } catch (err) {
    console.error("Error handling PhonePe payment callback:", err);
    return res.redirect("/?paymentStatus=error&reason=callback_error");
  }
};

/**
 * (Optional) GET /api/payments/methods
 */
export const getPaymentMethodsWithPhonePe: RequestHandler = async (_req, res) => {
  try {
    const cfg = await getPhonePeConfig();
    const paymentMethods = {
      upi: {
        enabled: true,
        upiId: "aashishproperty@paytm",
        qrCode: "/api/payments/upi-qr",
      },
      bankTransfer: {
        enabled: true,
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        accountHolder: "Aashish Property",
      },
      online: {
        enabled: true,
        gateways: ["razorpay", "paytm"],
      },
      phonepe: {
        enabled: !!cfg,
        merchantId: cfg?.merchantId || "",
        testMode: cfg ? cfg.testMode : true,
      },
    };

    const out: ApiResponse<any> = { success: true, data: paymentMethods };
    return res.json(out);
  } catch (err: any) {
    console.error("Error fetching payment methods:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to fetch payment methods" });
  }
};
