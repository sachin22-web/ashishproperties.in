import { Router } from "express";
import multer from "multer";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";

const r = Router();
// CSV-only multer (bypass global image-only filter)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      [
        "text/csv",
        "application/vnd.ms-excel",
        "application/csv",
        "text/plain",
      ].includes(file.mimetype) ||
      file.originalname.toLowerCase().endsWith(".csv");
    return ok ? cb(null, true) : cb(new Error("CSV file required"));
  },
});

// tiny CSV parser (quotes + commas)
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i],
      nx = text[i + 1];
    if (q) {
      if (ch === '"' && nx === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        q = false;
      } else cell += ch;
    } else {
      if (ch === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        if (cell !== "" || row.length) {
          row.push(cell.trim());
          rows.push(row);
          row = [];
          cell = "";
        }
        if (ch === "\r" && nx === "\n") i++;
      } else if (ch === '"') {
        q = true;
      } else cell += ch;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  const header = rows.shift()?.map((h) => h.trim()) || [];
  return rows
    .filter((rw) => rw.some((c) => c))
    .map((rw) => Object.fromEntries(header.map((h, i) => [h, rw[i] ?? ""])));
}

r.post("/os-listings/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file required" });
    const csv = req.file.buffer.toString("utf8");
    const rows = parseCSV(csv);

    // Normalize field names (categorySlug -> catSlug, etc.)
    const normalizedRows = rows.map((row) => {
      const normalized = { ...row };
      if (row.categorySlug && !row.catSlug)
        normalized.catSlug = row.categorySlug;
      if (row.subcategorySlug && !row.subSlug)
        normalized.subSlug = row.subcategorySlug;
      return normalized;
    });

    const required = ["catSlug", "subSlug", "name", "phone", "address"];
    const miss = required.filter((k) => !(k in (normalizedRows[0] || {})));
    if (miss.length)
      return res
        .status(400)
        .json({ error: `missing columns: ${miss.join(",")}` });

    let created = 0,
      updated = 0;
    const errors: any[] = [];
    const db = getDatabase();

    for (const r of normalizedRows) {
      try {
        const catSlug = (r.catSlug || "").toLowerCase();
        const subSlug = (r.subSlug || "").toLowerCase();
        if (!catSlug || !subSlug) throw new Error("catSlug/subSlug required");

        // Find or create category
        let cat = await db
          .collection("os_categories")
          .findOne({ slug: catSlug });
        if (!cat) {
          const catResult = await db.collection("os_categories").insertOne({
            slug: catSlug,
            name:
              r.catName ||
              catSlug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          cat = { _id: catResult.insertedId, slug: catSlug };
        }

        // Find or create subcategory
        let sub = await db
          .collection("os_subcategories")
          .findOne({ slug: subSlug, category: catSlug });
        if (!sub) {
          const subResult = await db.collection("os_subcategories").insertOne({
            slug: subSlug,
            name:
              r.subName ||
              subSlug
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
            category: catSlug,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          sub = { _id: subResult.insertedId, slug: subSlug };
        }

        const photos = [r.photo1, r.photo2, r.photo3, r.photo4].filter(Boolean);
        const geo =
          r.lat && r.lng
            ? { lat: Number(r.lat), lng: Number(r.lng) }
            : { lat: 0, lng: 0 };
        const payload = {
          category: catSlug,
          subcategory: subSlug,
          name: r.name,
          phone: r.phone,
          address: r.address,
          photos,
          geo,
          open: r.open || "09:00",
          close: r.close || "18:00",
          active: String(r.active || "true").toLowerCase() !== "false",
          updatedAt: new Date(),
        };

        const existing = await db.collection("os_listings").findOne({
          name: r.name,
          phone: r.phone,
          subcategory: subSlug,
        });

        if (existing) {
          await db
            .collection("os_listings")
            .updateOne({ _id: existing._id }, { $set: payload });
          updated++;
        } else {
          await db
            .collection("os_listings")
            .insertOne({ ...payload, createdAt: new Date() });
          created++;
        }
      } catch (e: any) {
        errors.push({ row: r, error: e.message });
      }
    }
    return res.json({ created, updated, errors });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "import failed" });
  }
});

export default r;
