import { RequestHandler } from "express";
import { getAdmin } from "../firebaseAdmin";

export const subscribeToTopic: RequestHandler = async (req, res) => {
  try {
    const { token, topic } = req.body || {};
    if (!token || !topic) {
      return res
        .status(400)
        .json({ success: false, error: "token and topic required" });
    }

    // Initialize admin SDK (requires FIREBASE_SERVICE_ACCOUNT in env)
    const admin = getAdmin();
    await admin.messaging().subscribeToTopic([token], topic);
    return res.json({ success: true });
  } catch (e: any) {
    // If admin not configured, return 501 to indicate optional feature
    if (e && /FIREBASE_SERVICE_ACCOUNT/.test(String(e.message))) {
      return res
        .status(501)
        .json({
          success: false,
          error: "Firebase admin not configured on server",
        });
    }
    return res
      .status(500)
      .json({
        success: false,
        error: "Failed to subscribe to topic",
        details: e?.message,
      });
  }
};
