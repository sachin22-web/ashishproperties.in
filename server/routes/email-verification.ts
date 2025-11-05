import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import crypto from "crypto";

// Send email verification
export const sendEmailVerification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Check if user exists
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
          updatedAt: new Date(),
        },
      },
    );

    const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${verificationToken}`;

    try {
      const { sendEmail } = await import("../utils/mailer");
      await sendEmail(
        email,
        "Verify your email - Ashish Properties",
        `<p>Welcome to Ashish Properties (dalon).</p><p>Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
      );
    } catch (e) {
      console.warn(
        "Email send failed, returning link in response for fallback",
      );
    }

    const response: ApiResponse<{ verificationLink: string }> = {
      success: true,
      data: {
        verificationLink,
      },
      message: "Verification email sent successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error sending email verification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send verification email",
    });
  }
};

// Verify email with token
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    // Find user with this verification token
    const user = await db.collection("users").findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    // Mark email as verified and remove verification token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          updatedAt: new Date(),
        },
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpiry: "",
        },
      },
    );

    // Return HTML response for successful verification
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { color: #16a34a; }
            .container { background: #f9fafb; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb; }
            .button { background: #C70000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ Email Verified Successfully!</h1>
            <p>Your email address <strong>${user.email}</strong> has been verified.</p>
            <p>You can now log in to your account with full access.</p>
            <a href="/login" class="button">Go to Login</a>
          </div>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(successHtml);
  } catch (error) {
    console.error("Error verifying email:", error);

    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; }
            .container { background: #f9fafb; padding: 40px; border-radius: 10px; border: 1px solid #e5e7eb; }
            .button { background: #C70000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Verification Failed</h1>
            <p>There was an error verifying your email address.</p>
            <p>Please try again or contact support if the problem persists.</p>
            <a href="/login" class="button">Back to Login</a>
          </div>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(errorHtml);
  }
};

// Resend email verification
export const resendEmailVerification: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId; // From auth middleware

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
          updatedAt: new Date(),
        },
      },
    );

    const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${verificationToken}`;

    try {
      const { sendEmail } = await import("../utils/mailer");
      await sendEmail(
        user.email,
        "Verify your email - Ashish Properties",
        `<p>Please verify your email by clicking the link below:</p><p><a href="${verificationLink}">Verify Email</a></p>`,
      );
    } catch (e) {
      console.warn(
        "Resend verification email failed, returning link as fallback",
      );
    }

    const response: ApiResponse<{ verificationLink: string }> = {
      success: true,
      data: {
        verificationLink,
      },
      message: "Verification email resent successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error resending email verification:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resend verification email",
    });
  }
};
