// server/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** ---------- Config ---------- */
const JWT_SECRET =
  process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || "your-secret-key";

/** ---------- Types ---------- */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userType?: string;
  email?: string;
  role?: string;
}

/** ---------- Helpers ---------- */
const parseLower = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase() : v;

const pickToken = (req: Request): string | null => {
  const auth = (req.headers["authorization"] as string) || "";
  const xAuth = (req.headers["x-auth-token"] as string) || "";
  const xAdmin = (req.headers["x-admin-token"] as string) || "";

  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  if (xAuth) return xAuth.trim();
  if (xAdmin) return xAdmin.trim();

  // optional cookie support
  const cookieTok =
    (req as any)?.cookies?.token || (req as any)?.cookies?.authToken;
  if (cookieTok) return String(cookieTok).trim();

  return null;
};

const idFromPayload = (p: any): string | null => {
  const id = p?.userId ?? p?.id ?? p?._id ?? null;
  return id ? String(id) : null;
};

const roleFromPayload = (p: any): string | null => {
  const r = p?.userType ?? p?.role ?? null;
  return r ? String(r).toLowerCase() : null;
};

/** Core verifier used by all guards */
const verifyAndAttach = (req: Request, res: Response): { ok: boolean } => {
  const token = pickToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: "Access token required" });
    return { ok: false };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const uid = idFromPayload(decoded);
    if (!uid) {
      res
        .status(401)
        .json({ success: false, error: "Invalid token (no user id)" });
      return { ok: false };
    }

    (req as any).userId = uid;
    (req as any).userType = roleFromPayload(decoded) || undefined;
    (req as any).role = roleFromPayload(decoded) || undefined;
    (req as any).email = decoded?.email;

    return { ok: true };
  } catch {
    res.status(403).json({ success: false, error: "Invalid or expired token" });
    return { ok: false };
  }
};

/** ---------- Public Middlewares ---------- */

/** Backward-compatible authenticateToken (kept for existing usage) */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = verifyAndAttach(req, res);
  if (r.ok) next();
};

/** Allow ANY authenticated user (admin/seller/user/agent/customer) */
export const requireAuthAny = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = verifyAndAttach(req, res);
  if (r.ok) next();
};

/** Strict admin/staff gate */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = verifyAndAttach(req, res);
  if (!r.ok) return;

  const userType = parseLower((req as any).userType) as string | undefined;
  const role = parseLower((req as any).role) as string | undefined;

  console.log("🔐 Admin middleware check:", {
    userType,
    role,
    userId: (req as any).userId,
  });

  if (userType !== "admin" && userType !== "staff") {
    console.log("❌ Access denied - not admin or staff");
    return res
      .status(403)
      .json({ success: false, error: "Admin access required" });
  }
  console.log("✅ Admin access granted");
  next();
};

/** Sellers/Agents/Admin can access */
export const requireSellerOrAgent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = verifyAndAttach(req, res);
  if (!r.ok) return;

  const userType = parseLower((req as any).userType) || "";
  if (!["seller", "agent", "admin"].includes(userType as string)) {
    return res
      .status(403)
      .json({ success: false, error: "Seller or agent access required" });
  }
  next();
};

/** Buyer-facing actions (payments etc.): seller/user/agent allowed (admin optional) */
export const requireBuyer = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const r = verifyAndAttach(req, res);
  if (!r.ok) return;

  const userType = parseLower((req as any).userType) || "";
  if (
    !["seller", "user", "agent", "customer", "admin"].includes(userType as string)
  ) {
    return res
      .status(401)
      .json({ success: false, error: "Login with a user/seller account" });
  }
  next();
};

/** Role-based permission checking for staff */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const r = verifyAndAttach(req, res);
    if (!r.ok) return;

    const userType = parseLower((req as any).userType);
    const role = parseLower((req as any).role);

    // Admin always has all permissions
    if (userType === "admin") return next();

    // Staff role map
    if (userType === "staff") {
      const rolePermissions: Record<string, string[]> = {
        super_admin: ["*"],
        content_manager: [
          "content.view",
          "content.create",
          "content.manage",
          "blog.manage",
          "blog.view",
        ],
        sales_manager: [
          "users.view",
          "sellers.manage",
          "sellers.verify",
          "sellers.view",
          "payments.view",
          "packages.manage",
          "ads.view",
          "analytics.view",
        ],
        support_executive: [
          "users.view",
          "support.view",
          "reports.view",
          "content.view",
        ],
        admin: ["content.view", "users.view", "ads.view", "analytics.view"],
      };

      const userPermissions = rolePermissions[(role as string) || ""] || [];
      if (
        userPermissions.includes("*") ||
        userPermissions.includes(permission)
      )
        return next();
    }

    return res
      .status(403)
      .json({ success: false, error: `Permission required: ${permission}` });
  };
};
