import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import multer from "multer";
import fs from "fs";
import path from "path";

// Storage for map images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "uploads", "maps");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const name = `map-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

export const uploadMapImage = multer({ storage }).single("image");

export interface AreaMapItem {
  _id?: string;
  title?: string;
  area?: string; // e.g., Sector 1, Rohtak
  description?: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Public: GET /api/maps?area=Rohtak
export const getPublicAreaMaps: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { area } = req.query as { area?: string };
    const q: any = { isActive: true };
    if (area) q.area = String(area);
    const items = await db
      .collection("area_maps")
      .find(q)
      .sort({ sortOrder: 1, createdAt: -1 })
      .project({})
      .toArray();

    res.json({ success: true, data: items });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Admin: GET /api/admin/maps
export const getAllAreaMaps: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const items = await db
      .collection("area_maps")
      .find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray();
    res.json({ success: true, data: items });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Admin: POST /api/admin/maps
export const createAreaMap: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      title = "",
      area = "",
      description = "",
      imageUrl = "",
      isActive = true,
      sortOrder = 0,
    } = req.body || {};
    if (!imageUrl || typeof imageUrl !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "imageUrl required" });
    }
    const now = new Date();
    const doc: AreaMapItem = {
      title: String(title).trim(),
      area: String(area).trim(),
      description: String(description).trim(),
      imageUrl: String(imageUrl).trim(),
      isActive: Boolean(isActive),
      sortOrder: Number(sortOrder) || 0,
      createdAt: now,
      updatedAt: now,
    };
    const result = await db.collection("area_maps").insertOne(doc as any);
    const created = await db
      .collection("area_maps")
      .findOne({ _id: result.insertedId });
    res.json({ success: true, data: created });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Admin: PUT /api/admin/maps/:id
export const updateAreaMap: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const { title, area, description, imageUrl, isActive, sortOrder } =
      req.body || {};
    const update: any = { updatedAt: new Date() };
    if (title !== undefined) update.title = String(title).trim();
    if (area !== undefined) update.area = String(area).trim();
    if (description !== undefined)
      update.description = String(description).trim();
    if (imageUrl !== undefined) update.imageUrl = String(imageUrl).trim();
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;

    const result = await db
      .collection("area_maps")
      .updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (!result.matchedCount)
      return res.status(404).json({ success: false, error: "Not found" });

    const updated = await db
      .collection("area_maps")
      .findOne({ _id: new ObjectId(id) });
    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Admin: DELETE /api/admin/maps/:id
export const deleteAreaMap: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });
    const result = await db
      .collection("area_maps")
      .deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Admin: POST /api/admin/maps/upload (multipart form, field: image)
export const handleMapImageUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, error: "No image file" });
    const url = `/uploads/maps/${req.file.filename}`;
    res.json({ success: true, data: { imageUrl: url } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};

// Seed defaults programmatically (idempotent)
export async function seedDefaultAreaMaps() {
  const db = getDatabase();
  const count = await db.collection("area_maps").countDocuments();
  if (count > 0) return { seeded: false, existing: count };
  const now = new Date();
  const docs: AreaMapItem[] = [
    {
      title: "Rohtak City Overview",
      area: "Rohtak",
      description: "Key sectors and landmarks",
      imageUrl:
        "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?w=1200&h=800&fit=crop",
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Sector 1 Map",
      area: "Sector 1",
      description: "Residential blocks and parks",
      imageUrl:
        "https://images.unsplash.com/photo-1504610926078-a1611febcad3?w=1200&h=800&fit=crop",
      isActive: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: "Sector 2 Map",
      area: "Sector 2",
      description: "Schools and amenities",
      imageUrl:
        "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?w=1200&h=800&fit=crop",
      isActive: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const result = await db.collection("area_maps").insertMany(docs as any);
  return { seeded: true, inserted: result.insertedCount };
}

// Public init endpoint handler
export const initializeAreaMaps: RequestHandler = async (_req, res) => {
  try {
    const out = await seedDefaultAreaMaps();
    res.json({ success: true, data: out });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};
