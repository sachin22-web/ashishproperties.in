import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";

const toOID = (id: any) => new ObjectId(String(id));

/**
 * GET /api/favorites/my
 * Return current user's favorites (NO approval/status filtering)
 */
export const getFavorites: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const favorites = await db
      .collection("favorites")
      .aggregate([
        { $match: { userId: toOID(userId) } },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" }, // property must still exist
        // ❌ approval/status filter removed — wishlist shows ANY liked property
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            propertyId: 1,
            createdAt: 1,
            property: 1,
          },
        },
      ])
      .toArray();

    return res.json({
      success: true,
      data: favorites.map((fav: any) => ({
        _id: fav._id,
        propertyId: fav.propertyId,
        addedAt: fav.createdAt,
        property: fav.property,
      })),
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch favorites" });
  }
};

/**
 * POST /api/favorites/:propertyId
 * Add property to user's favorites (idempotent). Only checks existence, not approval.
 */
export const addToFavorites: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, error: "Invalid property ID" });
    }

    // ✅ Sirf existence check — approval/status ki zarurat nahi
    const property = await db.collection("properties").findOne({ _id: toOID(propertyId) });
    if (!property) {
      return res.status(404).json({ success: false, error: "Property not found" });
    }

    const result = await db.collection("favorites").updateOne(
      { userId: toOID(userId), propertyId: toOID(propertyId) },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    return res.status(result.upsertedCount ? 201 : 200).json({
      success: true,
      data: { isFavorite: true, propertyId },
      message: "Property added to favorites",
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return res.status(500).json({ success: false, error: "Failed to add to favorites" });
  }
};

/**
 * DELETE /api/favorites/:propertyId
 */
export const removeFromFavorites: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, error: "Invalid property ID" });
    }

    const result = await db.collection("favorites").deleteOne({
      userId: toOID(userId),
      propertyId: toOID(propertyId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Property not found in favorites" });
    }

    return res.json({ success: true, data: { isFavorite: false, propertyId }, message: "Property removed" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return res.status(500).json({ success: false, error: "Failed to remove from favorites" });
  }
};

/**
 * GET /api/favorites/:propertyId/check
 */
export const checkFavorite: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const userId = (req as any).userId;
    const { propertyId } = req.params;

    if (!userId) {
      return res.json({ success: true, data: { isFavorite: false } });
    }
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({ success: false, error: "Invalid property ID" });
    }

    const favorite = await db.collection("favorites").findOne({
      userId: toOID(userId),
      propertyId: toOID(propertyId),
    });

    return res.json({ success: true, data: { isFavorite: !!favorite } });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return res.status(500).json({ success: false, error: "Failed to check favorite status" });
  }
};
