import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { User, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendWelcomeNotification } from "./notifications";
import { getAdmin } from "../firebaseAdmin";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 10;

/* --------------------------------- Helpers -------------------------------- */

function toE164(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

function pickIdTokenFromReq(req: any): { idToken?: string; userType?: string } {
  const authHeader: string = req.headers?.authorization || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const bodyToken = req.body?.idToken;
  const userType = req.body?.userType;
  return { idToken: bodyToken || bearer || undefined, userType };
}

function signAppJwt(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify Firebase ID token and ensure same project.
 * Returns decoded + (email,name,phone) hydrated from Firebase if needed.
 */
async function verifyFirebaseIdTokenStrict(idToken: string) {
  const admin = getAdmin();
  const decoded = await admin.auth().verifyIdToken(idToken);

  // Helpful diagnostics for mismatch issues
  const expectedProject =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    (admin.app?.options?.projectId as string | undefined);

  if (expectedProject && decoded.aud && decoded.aud !== expectedProject) {
    console.warn("[auth] Token audience != expected project", {
      token_aud: decoded.aud,
      expectedProject,
    });
  }

  // hydrate identity if missing
  let email = decoded.email || "";
  let name = decoded.name || "";
  let phone = decoded.phone_number ? toE164(decoded.phone_number) : "";
  if (!email || !name) {
    try {
      const rec = await admin.auth().getUser(decoded.uid);
      email = email || rec.email || "";
      name = name || rec.displayName || "";
    } catch (e) {
      // ignore
    }
  }

  return { decoded, email, name, phone };
}

/**
 * Upsert user by phone (pref) or email; returns { user, isNew }
 */
async function upsertUserFromFirebaseIdentity(
  email: string,
  phone: string,
  name: string,
  uid: string,
  rawUserType?: string,
) {
  const db = getDatabase();

  let user =
    (phone && (await db.collection("users").findOne({ phone }))) ||
    (email && (await db.collection("users").findOne({ email })));

  const resolvedType = ((): string => {
    const t = (rawUserType || "").toLowerCase();
    if (["seller", "buyer", "agent", "admin", "staff"].includes(t)) return t;
    return "seller";
  })();

  const now = new Date();

  if (!user) {
    const newUser: any = {
      name: name || (phone ? `User ${phone.slice(-4)}` : email?.split("@")[0] || "User"),
      email,
      phone,
      userType: resolvedType,
      firebaseUid: uid,
      createdAt: now,
      updatedAt: now,
    };
    const ins = await db.collection("users").insertOne(newUser);
    user = { _id: ins.insertedId, ...newUser };
    return { user, isNew: true };
  } else {
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { firebaseUid: uid, lastLogin: now, updatedAt: now } },
    );
    return { user, isNew: false };
  }
}

function makeAuthResponse(user: any) {
  const token = signAppJwt({
    userId: String(user._id),
    userType: user.userType,
    email: user.email,
    phone: user.phone,
  });

  const api: ApiResponse<{ token: string; user: any }> = {
    success: true,
    data: {
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
      },
    },
    message: "Authentication successful",
  };

  // keep backward-compat (flat fields)
  return { ...api, token, user: api.data.user };
}

/* ----------------------------- Register new user --------------------------- */
export const registerUser: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      name,
      email,
      phone,
      password,
      userType,
      experience,
      specializations,
      serviceAreas,
    } = req.body;

    if (!name || !email || !phone || !password || !userType) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: name, email, phone, password, and userType are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }
    if (String(phone).replace(/\D/g, "").length < 10) {
      return res
        .status(400)
        .json({ success: false, error: "Phone number must be at least 10 digits" });
    }
    if (!["seller", "buyer", "agent"].includes(userType)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid user type. Must be seller, buyer, or agent" });
    }

    const existingUser = await db
      .collection("users")
      .findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email or phone already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser: Omit<User, "_id"> = {
      name,
      email,
      phone,
      password: hashedPassword,
      userType,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
      preferences: {
        propertyTypes: [],
        priceRange: { min: 0, max: 10000000 },
        locations: [],
      },
      favorites: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (userType === "agent") {
      (newUser as any).agentProfile = {
        experience: parseInt(experience) || 0,
        specializations: specializations || [],
        rating: 0,
        reviewCount: 0,
        aboutMe: "",
        serviceAreas: serviceAreas || [],
      };
      (newUser as any).properties = [];
    }

    const result = await db.collection("users").insertOne(newUser);

    try {
      await sendWelcomeNotification(result.insertedId.toString(), name, userType);
    } catch (e) {
      console.warn("Welcome notification failed:", (e as any)?.message || e);
    }

    const token = signAppJwt({
      userId: result.insertedId.toString(),
      userType,
      email,
    });

    const verificationLink = `${
      process.env.BASE_URL || "http://localhost:8080"
    }/api/auth/verify-email?token=${emailVerificationToken}`;

    const response: ApiResponse<{
      token: string;
      user: any;
      verificationLink?: string;
    }> = {
      success: true,
      data: {
        token,
        user: {
          id: result.insertedId.toString(),
          name,
          email,
          phone,
          userType,
          emailVerified: false,
        },
        verificationLink,
      },
      message:
        "User registered successfully. Please check your email to verify your account.",
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "User with this email or phone already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: `Failed to register user: ${error.message}`,
    });
  }
};

/* ------------------------------- Password login --------------------------- */
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { email, phone, password } = req.body;
    const { username } = req.body;

    let query: any = {};
    if (username) {
      query = { username };
    } else if (email && phone) {
      const digits = String(phone || "").replace(/\D/g, "");
      const e164 = toE164(String(phone || ""));
      const spaced = digits.length >= 10 ? `+91 ${digits.slice(-10)}` : undefined;
      const plain = digits.length >= 10 ? `+91${digits.slice(-10)}` : undefined;
      query = {
        $or: [
          { email },
          ...(spaced ? [{ phone: spaced }] : []),
          ...(plain ? [{ phone: plain }] : []),
          { phone },
          { phone: e164 },
        ],
      };
    } else if (email) {
      query = { email };
    } else if (phone) {
      const digits = String(phone || "").replace(/\D/g, "");
      const e164 = toE164(String(phone || ""));
      const spaced = digits.length >= 10 ? `+91 ${digits.slice(-10)}` : undefined;
      const plain = digits.length >= 10 ? `+91${digits.slice(-10)}` : undefined;
      query = {
        $or: [
          ...(spaced ? [{ phone: spaced }] : []),
          ...(plain ? [{ phone: plain }] : []),
          { phone },
          { phone: e164 },
        ],
      };
    } else {
      return res.status(400).json({
        success: false,
        error: "Email, phone number, or username is required",
      });
    }

    const user = await db.collection("users").findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { lastLogin: new Date(), updatedAt: new Date() },
        $unset: user.isFirstLogin ? { isFirstLogin: 1 } : {},
      }
    );

    const token = signAppJwt({
      userId: user._id.toString(),
      userType: user.userType,
      email: user.email,
      role: user.role || user.userType,
    });

    const userResponse: any = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
    };

    if (user.userType === "staff" || user.role) {
      userResponse.role = user.role;
      userResponse.permissions = user.permissions || [];
      userResponse.isFirstLogin = user.isFirstLogin || false;
      userResponse.username = user.username;

      const roleInfo = {
        super_admin: { displayName: "Super Admin", color: "purple" },
        content_manager: { displayName: "Content Manager", color: "blue" },
        sales_manager: { displayName: "Sales Manager", color: "green" },
        support_executive: { displayName: "Support Executive", color: "orange" },
        admin: { displayName: "Admin", color: "gray" },
      } as Record<string, any>;

      userResponse.roleInfo = roleInfo[user.role] || {
        displayName: user.role,
        color: "gray",
      };
    }

    const response: ApiResponse<{ token: string; user: any }> = {
      success: true,
      data: { token, user: userResponse },
      message: user.isFirstLogin
        ? "First login successful - please change your password"
        : "Login successful",
    };

    res.json(response);
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ success: false, error: "Failed to login" });
  }
};

/* ---------------------- Deprecated demo OTP endpoints --------------------- */
export const sendOTP: RequestHandler = async (_req, res) => {
  return res.status(410).json({
    success: false,
    error:
      "Deprecated. Use Firebase phone auth on client and POST /api/auth/firebase-login with idToken.",
  });
};

export const verifyOTP: RequestHandler = async (_req, res) => {
  return res.status(410).json({
    success: false,
    error:
      "Deprecated. Use Firebase phone auth on client and POST /api/auth/firebase-login with idToken.",
  });
};

/* ---------- Firebase Phone/Google token → our session (unified) ----------- */
export const firebaseLogin: RequestHandler = async (req, res) => {
  try {
    const { idToken: bodyIdToken, userType: bodyUserType } = req.body || {};
    const { idToken: headerIdToken } = pickIdTokenFromReq(req);
    const tokenToUse = bodyIdToken || headerIdToken;

    if (!tokenToUse) {
      return res.status(400).json({ success: false, error: "idToken required" });
    }

    let decoded, email, name, phone;
    try {
      ({ decoded, email, name, phone } = await verifyFirebaseIdTokenStrict(tokenToUse));
    } catch (e: any) {
      console.error("[firebaseLogin] verifyIdToken failed", {
        message: e?.message,
        code: e?.code,
        info: e?.errorInfo,
      });
      const msg =
        e?.code === "auth/argument-error"
          ? "Token audience mismatch / wrong Firebase project"
          : e?.message || "Invalid token";
      return res.status(401).json({ success: false, error: msg });
    }

    if (!email && !phone) {
      return res
        .status(400)
        .json({ success: false, error: "Token has no email/phone" });
    }

    const { user } = await upsertUserFromFirebaseIdentity(
      email,
      phone,
      name,
      decoded.uid,
      bodyUserType,
    );

    return res.json(makeAuthResponse(user));
  } catch (err: any) {
    console.error("firebaseLogin error:", err?.message || err);
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/* ----------------------------- Google authentication ---------------------- */
/**
 * Keep /google endpoint for backward compatibility.
 * Internally do exactly what firebaseLogin does so the behaviour is identical.
 */
export const googleAuth: RequestHandler = async (req, res) => {
  try {
    const { idToken: bodyIdToken, userType: bodyUserType } = req.body || {};
    const { idToken: headerIdToken } = pickIdTokenFromReq(req);
    const idToken = bodyIdToken || headerIdToken;

    if (!idToken) {
      return res.status(400).json({ success: false, error: "Missing idToken" });
    }

    let decoded, email, name, phone;
    try {
      ({ decoded, email, name, phone } = await verifyFirebaseIdTokenStrict(idToken));
    } catch (e: any) {
      console.error("[googleAuth] verifyIdToken failed", {
        message: e?.message,
        code: e?.code,
        info: e?.errorInfo,
      });
      const msg =
        e?.code === "auth/argument-error"
          ? "Token audience mismatch / wrong Firebase project"
          : e?.message || "Invalid Google user data";
      return res.status(401).json({ success: false, error: msg });
    }

    if (!email) {
      return res
        .status(401)
        .json({ success: false, error: "Email not present in Google token" });
    }

    const { user } = await upsertUserFromFirebaseIdentity(
      email,
      phone,
      name,
      decoded.uid,
      bodyUserType,
    );

    return res.json(makeAuthResponse(user));
  } catch (err: any) {
    console.error("googleAuth verify error:", err?.message || err);
    return res
      .status(401)
      .json({ success: false, error: "Invalid Google user data" });
  }
};

/* ------------------------------ Profile APIs ------------------------------ */
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const { password, ...userWithoutPassword } = user;
    const response: ApiResponse<any> = { success: true, data: userWithoutPassword };
    res.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user profile" });
  }
};

export const updateUserProfile: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const updateData = { ...req.body };

    delete (updateData as any).password;
    delete (updateData as any)._id;

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Profile updated successfully" },
    };
    res.json(response);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
};
