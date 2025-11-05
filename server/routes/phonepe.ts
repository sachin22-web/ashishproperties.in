// server/routes/phonepe.ts
import express from "express";
import axios from "axios";
import { phonePeConfig as C } from "../config/phonepe";
import { baseUrl, xVerifyForPay, xVerifyForStatus } from "../lib/phonepe";

const router = express.Router();

/**
 * POST /api/payments/phonepe/create
 * Body: { packageId, propertyId, paymentDetails?: { merchantTransactionId?, amount?, currency? } }
 */
router.post("/create", async (req, res) => {
  try {
    if (!C.enabled) return res.status(400).json({ success: false, error: "PhonePe disabled" });

    const { packageId, propertyId, paymentDetails = {} } = req.body || {};
    if (!packageId || !propertyId)
      return res.status(400).json({ success: false, error: "packageId & propertyId required" });

    // Get amount from your DB by packageId (recommended). For now use client amount if present.
    const amountPaise =
      typeof paymentDetails.amount === "number" ? paymentDetails.amount : undefined;
    if (!amountPaise) {
      return res.status(400).json({ success: false, error: "Amount missing" });
    }

    const merchantTransactionId =
      paymentDetails.merchantTransactionId ||
      `PP_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const returnUrl = `${C.siteOrigin}/payment/phonepe/return?mtid=${encodeURIComponent(
      merchantTransactionId
    )}&status=`;

    // PAY_PAGE payload
    const payPayload = {
      merchantId: C.merchantId,
      merchantTransactionId,
      amount: amountPaise, // in paise
      merchantUserId: String(req.user?.id || "guest"), // optional
      redirectUrl: returnUrl + "success", // after success user returns here
      redirectMode: "REDIRECT",
 // or GET
      callbackUrl: `${C.siteOrigin}${C.callbackPath}`, // webhook (server receives)
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payPayload)).toString("base64");
    const xVerify = xVerifyForPay(base64Payload);

    const url = `${baseUrl()}${C.payPath}`;

    const ppResp = await axios.post(
      url,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify,
          "X-MERCHANT-ID": C.merchantId,
        },
        timeout: 15000,
      }
    );

    const data = ppResp.data || {};
    // PhonePe success code is usually "SUCCESS"
    if (data.code !== "SUCCESS") {
      return res.status(400).json({ success: false, error: data.message || "PhonePe error", raw: data });
    }

    // IMPORTANT: grab redirect URL safely (depends on PG version)
    const redirectUrl =
      data?.data?.instrumentResponse?.redirectInfo?.url ||
      data?.data?.redirectUrl ||
      data?.redirectUrl ||
      null;

    if (!redirectUrl) {
      // Return raw payload for debugging
      return res.status(500).json({
        success: false,
        error: "No redirect URL from PhonePe",
        raw: data,
      });
    }

    // Optionally, save pending order to DB here…

    return res.json({
      success: true,
      data: {
        merchantTransactionId,
        instrumentResponse: {
          redirectInfo: { url: redirectUrl },
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.response?.data?.message || err?.message || "PhonePe create failed",
      raw: err?.response?.data || null,
    });
  }
});

/**
 * GET /api/payments/phonepe/status/:mtid
 */
router.get("/status/:mtid", async (req, res) => {
  try {
    const merchantTxnId = req.params.mtid;
    const { statusPath, xVerify } = xVerifyForStatus(merchantTxnId);
    const url = `${baseUrl()}${statusPath}`;

    const ppResp = await axios.get(url, {
      headers: { "X-VERIFY": xVerify, "X-MERCHANT-ID": C.merchantId },
      timeout: 15000,
    });

    const data = ppResp.data || {};
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.response?.data?.message || err?.message || "Status check failed",
      raw: err?.response?.data || null,
    });
  }
});

/**
 * POST /api/payments/phonepe/callback
 * Make sure your PhonePe dashboard points webhook to this URL
 */
router.post("/callback", express.json(), async (req, res) => {
  try {
    const payload = req.body || {};
    // NOTE: PhonePe sends `X-VERIFY` header; you can verify signature if you want
    const mtid = payload?.data?.merchantTransactionId || payload?.merchantTransactionId;

    // Map state & mark order paid in DB
    const state = payload?.data?.state || payload?.state;
    if (state === "COMPLETED" || state === "SUCCESS") {
      // mark payment success (update your property as pending-approval etc.)
    } else if (state === "FAILED") {
      // mark failed
    }

    // PhonePe expects 200 quickly
    return res.json({ success: true });
  } catch (e) {
    return res.json({ success: true }); // still 200
  }
});

export default router;
