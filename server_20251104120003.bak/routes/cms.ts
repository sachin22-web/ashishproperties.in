import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";

// Helper: attempt to rename legacy collections to backup_* once
let migrationAttempted = false;
async function backupLegacyCollectionsOnce() {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    const db = getDatabase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const legacy = ["footer_settings", "admin_settings", "content_pages"];
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    for (const name of legacy) {
      if (names.includes(name)) {
        const backupName = `backup_${timestamp}_${name}`;
        try {
          await db.collection(name).rename(backupName, { dropTarget: true });
          // eslint-disable-next-line no-console
          console.log(`🗃️ Renamed ${name} -> ${backupName}`);
        } catch (e) {
          // Fallback: copy docs if rename not permitted
          try {
            const docs = await db.collection(name).find({}).toArray();
            if (docs.length) await db.collection(backupName).insertMany(docs);
            // eslint-disable-next-line no-console
            console.log(
              `📄 Copied ${docs.length} docs from ${name} to ${backupName}`,
            );
          } catch (copyErr) {
            console.warn(
              `⚠️ Backup fallback failed for ${name}:`,
              (copyErr as any)?.message,
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Legacy backup skipped:", (err as any)?.message);
  }
}

// Admin: Update site settings (upsert _id: 'site')
export const updateSiteSettings: RequestHandler = async (req, res) => {
  try {
    await backupLegacyCollectionsOnce();
    const db = getDatabase();
    const payload = req.body || {};

    // Normalize structure and increment version
    const now = new Date();
    const existing = await db
      .collection("site_settings")
      .findOne({ _id: "site" });
    const version = (existing?.version || 0) + 1;

    const updateDoc = {
      _id: "site",
      footer: payload.footer ||
        existing?.footer || { groups: [], contact: {}, social: {} },
      system: payload.system ||
        existing?.system || {
          brandName: "Ashish Properties",
          showMaps: true,
          showNewProjects: true,
        },
      updatedAt: now,
      version,
    };

    await db
      .collection("site_settings")
      .updateOne({ _id: "site" }, { $set: updateDoc }, { upsert: true });

    res.json({ success: true, data: { message: "Settings updated", version } });
  } catch (error: any) {
    console.error("Error updating site settings:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update settings" });
  }
};

// Admin: Upsert page by slug
export const upsertPageBySlug: RequestHandler = async (req, res) => {
  try {
    await backupLegacyCollectionsOnce();
    const db = getDatabase();
    const { slug } = req.params as { slug: string };
    const { title, html, status } = req.body || {};
    if (!slug)
      return res.status(400).json({ success: false, error: "Slug required" });
    if (!title)
      return res.status(400).json({ success: false, error: "Title required" });

    const now = new Date();
    const doc = {
      slug,
      title,
      html: String(html || ""),
      status: status || "draft",
      updatedAt: now,
    };

    await db
      .collection("pages")
      .updateOne(
        { slug },
        { $set: doc, $setOnInsert: { createdAt: now } },
        { upsert: true },
      );

    res.json({ success: true, data: { slug, updatedAt: now } });
  } catch (error) {
    console.error("Error upserting page:", error);
    res.status(500).json({ success: false, error: "Failed to upsert page" });
  }
};

// Admin: List pages
export const listPagesAdmin: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const pages = await db
      .collection("pages")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error("Error listing pages:", error);
    res.status(500).json({ success: false, error: "Failed to list pages" });
  }
};

// Admin: Delete page by slug
export const deletePageBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params as { slug: string };
    const result = await db.collection("pages").deleteOne({ slug });
    if (result.deletedCount === 0)
      return res.status(404).json({ success: false, error: "Page not found" });
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (error) {
    console.error("Error deleting page:", error);
    res.status(500).json({ success: false, error: "Failed to delete page" });
  }
};

// Public: Settings (no-store)
export const getSiteSettingsPublic: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const doc = await db.collection("site_settings").findOne({ _id: "site" });
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      data: doc || {
        _id: "site",
        footer: { groups: [], contact: {}, social: {} },
        system: {
          brandName: "Ashish Properties",
          showMaps: true,
          showNewProjects: true,
        },
        updatedAt: new Date(),
        version: 1,
      },
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
};

// Public: Get published page by slug (no-store)
export const getPublicPageBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params as { slug: string };
    const page = await db
      .collection("pages")
      .findOne({ slug, status: "published" });
    if (!page) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(404).json({ success: false, error: "Page not found" });
    }
    res.setHeader("Cache-Control", "no-store");
    // Provide both html and content for existing clients
    const body = {
      ...page,
      content: (page as any).html || (page as any).content,
    };
    res.json({ success: true, data: body });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ success: false, error: "Failed to fetch page" });
  }
};
