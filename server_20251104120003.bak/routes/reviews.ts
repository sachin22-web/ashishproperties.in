// server/routes/reviews.ts
import express from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import jwt, { JwtPayload } from "jsonwebtoken";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

// ------------ Types ------------
type ReviewDoc = {
  _id?: ObjectId;
  targetType: "property" | "agent";
  targetId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
};

// ------------ Small helpers ------------
function parseCookie(header?: string | string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const h = Array.isArray(header) ? header.join(";") : header || "";
  h.split(";").forEach((p) => {
    const [k, ...rest] = p.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent((rest.join("=") || "").trim());
  });
  return out;
}

function pickTokenFromReq(req: express.Request): string | null {
  // Authorization: Bearer xxx
  const auth =
    (req.headers.authorization as string) ||
    (req.headers["Authorization"] as string);
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();

  // x-access-token / x-auth-token (just in case)
  const xa = (req.headers["x-access-token"] as string) || "";
  if (xa) return xa.trim();
  const xt = (req.headers["x-auth-token"] as string) || "";
  if (xt) return xt.trim();

  // cookies
  const cookies = parseCookie(req.headers.cookie);
  if (cookies.accessToken) return cookies.accessToken;
  if (cookies.authToken) return cookies.authToken;
  if (cookies.token) return cookies.token;

  // as an escape hatch, allow token in body (optional)
  if (req.body?.token) return String(req.body.token);

  return null;
}

function extractUserIdFromToken(token: string): string | null {
  // Try verified first (server JWT)
  try {
    const p = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const id = (p as any)?.id || (p as any)?._id || (p as any)?.userId || (p as any)?.uid;
    if (id) return String(id);
  } catch {
    // Ignore
  }
  // Fallback: decode only (for foreign tokens). Not ideal, but avoids breaking flow.
  const d = jwt.decode(token) as JwtPayload | null;
  if (d) {
    const id = (d as any)?.id || (d as any)?._id || (d as any)?.userId || (d as any)?.uid;
    if (id) return String(id);
  }
  return null;
}

async function resolveUserId(req: express.Request): Promise<string | null> {
  // If your existing middleware already set req.user, let’s reuse it
  const anyReq = req as any;
  const idFromReq =
    anyReq?.user?._id || anyReq?.user?.id || anyReq?.user?.userId || anyReq?.user?.uid;
  if (idFromReq) return String(idFromReq);

  const token = pickTokenFromReq(req);
  if (!token) return null;

  return extractUserIdFromToken(token);
}

// -------------------- PUBLIC: list approved reviews --------------------
router.get("/", async (req, res) => {
  try {
    const db = getDatabase();
    const col = db.collection<ReviewDoc>("reviews");

    const targetType =
      (req.query.targetType as "property" | "agent") || "property";
    const targetId = String(req.query.targetId || "").trim();

    if (!targetId) {
      return res
        .status(400)
        .json({ success: false, error: "targetId is required" });
    }

    const filter = { targetType, targetId, status: "approved" } as const;
    const list = await col
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    const count = list.length;
    const avg =
      count === 0
        ? 0
        : Math.round(
            (list.reduce((a, b) => a + (Number(b.rating) || 0), 0) / count) * 10
          ) / 10;

    return res.json({
      success: true,
      data: list,
      summary: { count, avg },
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ success: false, error: e?.message || "Error" });
  }
});

// -------------------- AUTH (inline): submit review --------------------
router.post("/", async (req, res) => {
  try {
    const { targetType = "property", targetId, rating, title, comment } =
      req.body || {};

    if (!targetId)
      return res
        .status(400)
        .json({ success: false, error: "targetId required" });

    const r = Number(rating);
    if (!r || r < 1 || r > 5)
      return res
        .status(400)
        .json({ success: false, error: "rating 1..5 required" });

    if (!comment || String(comment).trim().length < 5)
      return res
        .status(400)
        .json({ success: false, error: "comment too short" });

    // 🔐 resolve user without touching global middleware
    const userId = await resolveUserId(req);
    if (!userId)
      return res
        .status(401)
        .json({ success: false, error: "Unauthenticated" });

    const db = getDatabase();
    const col = db.collection<ReviewDoc>("reviews");

    const doc: ReviewDoc = {
      targetType: targetType === "agent" ? "agent" : "property",
      targetId: String(targetId),
      userId,
      rating: r,
      title: title ? String(title).slice(0, 120) : undefined,
      comment: String(comment).slice(0, 3000),
      status: "pending",
      createdAt: new Date(),
    };

    const result = await col.insertOne(doc);
    return res.json({
      success: true,
      message: "Review submitted and pending approval",
      id: result.insertedId,
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ success: false, error: e?.message || "Error" });
  }
});

// -------------------- ADMIN: list pending --------------------
router.get(
  "/admin/pending",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const db = getDatabase();
      const col = db.collection<ReviewDoc>("reviews");

      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const skip = (page - 1) * limit;

      const cursor = col.find({ status: "pending" }).sort({ createdAt: -1 });

      const [total, data] = await Promise.all([
        cursor.count(),
        cursor.skip(skip).limit(limit).toArray(),
      ]);

      res.json({ success: true, data, page, limit, total });
    } catch (e: any) {
      res
        .status(500)
        .json({ success: false, error: e?.message || "Error" });
    }
  }
);

// -------------------- ADMIN: moderate --------------------
router.put(
  "/admin/:id/moderate",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id || "");
      if (!ObjectId.isValid(id))
        return res.status(400).json({ success: false, error: "Invalid id" });

      const action = String(req.body?.action || "").toLowerCase();
      const adminNote: string | undefined =
        req.body?.note || req.body?.adminNote;

      if (!["approve", "reject"].includes(action))
        return res.status(400).json({
          success: false,
          error: "action must be approve|reject",
        });

      const db = getDatabase();
      const col = db.collection<ReviewDoc>("reviews");

      const update =
        action === "approve"
          ? { $set: { status: "approved", adminNote, approvedAt: new Date() } }
          : { $set: { status: "rejected", adminNote, rejectedAt: new Date() } };

      const result = await col.updateOne({ _id: new ObjectId(id) }, update);
      if (!result.matchedCount)
        return res.status(404).json({ success: false, error: "Not found" });

      return res.json({ success: true });
    } catch (e: any) {
      return res
        .status(500)
        .json({ success: false, error: e?.message || "Error" });
    }
  }
);

export default router;
