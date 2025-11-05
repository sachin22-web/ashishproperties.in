// server/routes/banners.ts
import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { BannerAd, ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";
import multer from "multer";
import fs from "fs";
import path from "path";

/* =========================
   Uploads setup (disk)
========================= */

// Ensure upload dir exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "banners");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Safe filename util
const safeExt = (orig = "") => {
  const ext = path.extname(orig || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"].includes(ext)
    ? ext
    : ".jpg";
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt(
      file.originalname
    )}`;
    cb(null, name);
  },
});

// 2MB limit (change if needed)
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Upload middleware for image uploads
export const uploadBannerImage = upload.single("image");

/* =========================
   Helpers
========================= */

const toBool = (v: any) =>
  v === true || v === "true" || v === "1" || v === 1;

const buildSearchFilter = (search?: string) => {
  if (!search) return {};
  return {
    $or: [
      { title: { $regex: search, $options: "i" } },
      { link: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } },
    ],
  };
};

// some servers give image in different keys; keep client + admin consistent
const readImgKey = (b: any): string | null =>
  b?.imageUrl ?? b?.image ?? b?.img ?? b?.path ?? b?.filePath ?? b?.url ?? null;

// Normalize known external hosts (e.g., pexels slug edge cases)
function normalizeKnownHosts(u: string): string {
  try {
    const url = new URL(u);
    if (url.hostname === "images.pexels.com") {
      // Accept …/photos/<id>/<anything>.(jpg|jpeg|png|webp)
      const m = url.pathname.match(/^\/photos\/(\d+)\/[^/]+\.(?:jpe?g|png|webp)$/i);
      if (m) {
        const id = m[1];
        url.pathname = `/photos/${id}/pexels-photo-${id}.jpeg`;
        if (!url.search) url.search = "?auto=compress&cs=tinysrgb&w=1600";
      }
      return url.toString();
    }
    return u;
  } catch {
    return u;
  }
}

/**
 * Server-side hardening:
 * Convert any absolute http/https image to our nginx proxy:
 *   http(s)://host/path?query  ->  /extimg/<scheme>/<host>/<path>?query
 * Keep local /uploads/* as-is.
 */
function forceExtimgProxy(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const u = raw.trim();
  if (!u) return null;

  // already local uploads
  if (u.startsWith("/uploads/") || u.startsWith("/server/uploads/") || /^\.?\/?uploads\//i.test(u)) {
    return u
      .replace(/^\.?\/?/i, "/")
      .replace(/^\/server\/uploads\//i, "/uploads/");
  }

  // already proxied
  if (u.startsWith("/extimg/")) return u;

  // normalize pexels odd slugs
  const maybeFixed = normalizeKnownHosts(u);

  // absolute http/https → /extimg/...
  if (/^https?:\/\//i.test(maybeFixed)) {
    try {
      const url = new URL(maybeFixed);
      const scheme = url.protocol.replace(":", "");
      const pathOnly = url.pathname.replace(/^\/+/, "");
      return `/extimg/${scheme}/${url.hostname}/${pathOnly}${url.search}`;
    } catch {
      return maybeFixed; // fallback (rare)
    }
  }

  // protocol-relative //host/path
  if (maybeFixed.startsWith("//")) {
    try {
      const tmp = new URL("https:" + maybeFixed);
      const scheme = tmp.protocol.replace(":", "");
      const pathOnly = tmp.pathname.replace(/^\/+/, "");
      return `/extimg/${scheme}/${tmp.hostname}/${pathOnly}${tmp.search}`;
    } catch {
      return maybeFixed;
    }
  }

  // bare host/path → assume https
  if (/^[a-z0-9.-]+\//i.test(maybeFixed)) {
    const cleaned = maybeFixed.replace(/^\/+/, "");
    return `/extimg/https/${cleaned}`;
  }

  // relative path → keep as-is (joined on frontend to same origin)
  return maybeFixed.startsWith("/") ? maybeFixed : `/${maybeFixed}`;
}

function mapBannerOut(x: any): BannerAd {
  const raw = readImgKey(x);
  const proxied = forceExtimgProxy(String(raw || ""));
  return {
    ...x,
    imageUrl: proxied || "/uploads/placeholder.svg",
    sortOrder: typeof x?.sortOrder === "number" ? x.sortOrder : 999,
  } as BannerAd;
}

/* =========================
   Public: GET /api/banners
   Query: active=true|false, position=..., search=...
========================= */
export const getActiveBanners: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch {
      // DB not ready: return empty safely
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return res.json({ success: true, data: [] });
    }

    const { active, position, search = "", status, isFeatured } = req.query as {
      active?: string;
      position?: string;
      search?: string;
      status?: string;
      isFeatured?: string;
    };

    const filter: any = { ...buildSearchFilter(search) };
    if (active !== undefined) filter.isActive = toBool(active);
    if (position) filter.position = String(position);
    if (status) filter.status = String(status);
    if (isFeatured !== undefined) filter.isFeatured = toBool(isFeatured);

    const raw = await db
      .collection("banners")
      .find(filter)
      .sort({ createdAt: -1, sortOrder: 1 })
      .toArray();

    const banners = raw.map(mapBannerOut);

    const response: ApiResponse<BannerAd[]> = { success: true, data: banners as BannerAd[] };
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(response);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, error: "Failed to fetch banners" });
  }
};

/* =========================
   Admin: GET /api/admin/banners
   Query: search, page, limit, position, active
========================= */
export const getAllBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      search = "",
      page = "1",
      limit = "10",
      position,
      active,
      status,
      isFeatured,
    } = req.query as {
      search?: string;
      page?: string;
      limit?: string;
      position?: string;
      active?: string;
      status?: string;
      isFeatured?: string;
    };

    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { ...buildSearchFilter(search) };
    if (position) filter.position = String(position);
    if (active !== undefined) filter.isActive = toBool(active);
    if (status) filter.status = String(status);
    if (isFeatured !== undefined) filter.isFeatured = toBool(isFeatured);

    const collection = db.collection("banners");

    const [raw, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1, sortOrder: 1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    const banners = raw.map(mapBannerOut);

    const response: ApiResponse<{
      banners: BannerAd[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }> = {
      success: true,
      data: {
        banners: banners as BannerAd[],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    };

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(response);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ success: false, error: "Failed to fetch banners" });
  }
};

/* =========================
   Admin: POST /api/admin/banners
========================= */
export const createBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { title, imageUrl, link = "", isActive = true, sortOrder, position, status = "approved", isFeatured = false } =
      req.body as Partial<BannerAd> & { position?: string; status?: string; isFeatured?: boolean };

    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, imageUrl",
      });
    }

    const bannerData: Omit<BannerAd, "_id"> & { createdAt: Date; position?: string; status?: string; isFeatured?: boolean } = {
      title: String(title).trim(),
      imageUrl: String(imageUrl).trim(),
      link: String(link || "").trim(),
      isActive: Boolean(isActive),
      sortOrder: typeof sortOrder === "number" ? sortOrder : 999,
      status: String(status || "approved"),
      isFeatured: Boolean(isFeatured),
      createdAt: new Date(),
      ...(position ? { position: String(position) } : {}),
    };

    const result = await db.collection("banners").insertOne(bannerData as any);

    const response: ApiResponse<{ _id: string; banner: BannerAd }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        banner: { ...bannerData, _id: result.insertedId.toString() } as BannerAd,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ success: false, error: "Failed to create banner" });
  }
};

/* =========================
   Admin: PUT /api/admin/banners/:id
========================= */
export const updateBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid banner ID" });
    }

    const { title, imageUrl, link, isActive, sortOrder, position, status, isFeatured } =
      req.body as Partial<BannerAd> & { position?: string; status?: string; isFeatured?: boolean };

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (imageUrl !== undefined) updateData.imageUrl = String(imageUrl).trim();
    if (link !== undefined) updateData.link = String(link).trim();
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (position !== undefined) updateData.position = String(position);
    if (status !== undefined) updateData.status = String(status);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    const result = await db
      .collection("banners")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: "Banner not found" });
    }

    const updatedBanner = await db
      .collection("banners")
      .findOne({ _id: new ObjectId(id) });

    const response: ApiResponse<{ banner: BannerAd }> = {
      success: true,
      data: { banner: updatedBanner as BannerAd },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ success: false, error: "Failed to update banner" });
  }
};

/* =========================
   Admin: DELETE /api/admin/banners/:id
========================= */
export const deleteBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid banner ID" });
    }

    const result = await db
      .collection("banners")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Banner not found" });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Banner deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, error: "Failed to delete banner" });
  }
};

/* =========================
   POST /api/admin/banners/upload
   (handler after uploadBannerImage)
========================= */
export const handleImageUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided" });
    }
    // Public URL path for the saved file
    const imageUrl = `/uploads/banners/${path.basename(req.file.path)}`;

    const response: ApiResponse<{ imageUrl: string }> = {
      success: true,
      data: { imageUrl },
    };
    res.json(response);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ success: false, error: "Failed to upload image" });
  }
};

/* =========================
   Initialize defaults (optional)
========================= */
export const initializeBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { force } = req.query;

    const existingCount = await db.collection("banners").countDocuments();
    if (existingCount > 0 && force !== "true") {
      return res.json({
        success: true,
        message: "Banners already initialized",
        existingCount,
        hint: "Use ?force=true to clear and reinitialize",
      });
    }

    if (force === "true" && existingCount > 0) {
      await db.collection("banners").deleteMany({});
    }

    const now = new Date();
    const defaults: Omit<BannerAd, "_id">[] = [
      {
        title: "Welcome to Ashish Properties",
        imageUrl:
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&auto=format&fit=crop",
        link: "/properties",
        isActive: true,
        sortOrder: 1,
        createdAt: now,
        position: "homepage_top",
      } as any,
      {
        title: "Find Your Dream Home",
        imageUrl:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&auto=format&fit=crop",
        link: "/buy",
        isActive: true,
        sortOrder: 2,
        createdAt: now,
        position: "homepage_top",
      } as any,
      {
        title: "Premium Properties in Rohtak",
        imageUrl:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&auto=format&fit=crop",
        link: "/premium",
        isActive: true,
        sortOrder: 3,
        createdAt: now,
        position: "homepage_top",
      } as any,
    ];

    await db.collection("banners").insertMany(defaults as any[]);

    res.json({ success: true, message: "Default banners initialized successfully" });
  } catch (error) {
    console.error("Error initializing banners:", error);
    res.status(500).json({ success: false, error: "Failed to initialize banners" });
  }
};
