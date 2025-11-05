import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mailer";
import { getDatabase } from "../db/mongodb";

// Store email OTPs in MongoDB for reliability across restarts
// Collection: email_otps { email: string, otp: string, createdAt: Date, expiresAt: Date }

const JWT_SECRET =
  process.env.JWT_MOCK_SECRET || process.env.JWT_SECRET || "change-this";

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isExpired(ts: number) {
  return Date.now() > ts;
}

export const requestEmailOtp: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Valid email is required" });
    }

    const lower = email.toLowerCase();
    const code = generateOtp();
    const now = new Date();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Persist OTP in DB (one active code per email)
    const db = getDatabase();
    await db.collection("email_otps").deleteMany({ email: lower });
    await db.collection("email_otps").insertOne({
      email: lower,
      otp: code,
      createdAt: now,
      expiresAt,
    });

    const subject = "Your OTP | Ashish Property";
    const html = `<p>Your Ashish Property verification code is <strong style="font-size:18px">${code}</strong>.</p><p>This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>`;

    try {
      await sendEmail(email, subject, html, `Your OTP code is ${code}`);
    } catch (e: any) {
      // If email fails in production, return an error
      if (process.env.NODE_ENV === "production") {
        return res
          .status(500)
          .json({ success: false, error: "Failed to send OTP email" });
      }
      // In development, do not block login flows — return success and surface the OTP for debugging
      console.log(`[DEV] Email OTP for ${email}: ${code}`);
      return res.json({
        success: true,
        data: { message: "OTP sent (dev)", devOtp: code },
      });
    }

    return res.json({ success: true, data: { message: "OTP sent" } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Unexpected error" });
  }
};

export const verifyEmailOtp: RequestHandler = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, error: "Email and OTP are required" });
    }

    const lower = String(email).toLowerCase();
    const db = getDatabase();

    const rec = await db.collection("email_otps").findOne({
      email: lower,
      otp: String(otp),
      expiresAt: { $gt: new Date() },
    });

    if (!rec) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or expired OTP" });
    }

    // One-time use: delete after successful verification
    await db.collection("email_otps").deleteOne({ _id: rec._id });

    // Find-or-create user minimally by email
    let user = await db.collection("users").findOne({ email: lower });
    if (!user) {
      const now = new Date();
      const name = lower.split("@")[0];
      const doc = {
        name,
        email: lower,
        phone: "",
        userType: "seller",
        createdAt: now,
        updatedAt: now,
      };
      const ins = await db.collection("users").insertOne(doc as any);
      user = { _id: ins.insertedId, ...doc } as any;
    }

    const token = jwt.sign(
      {
        userId: String(user._id),
        userType: user.userType || "seller",
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          userType: user.userType || "seller",
        },
      },
      message: "OTP verified",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Unexpected error" });
  }
};
