import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface Testimonial {
  _id?: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  propertyId?: string;
  sellerId?: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all testimonials (admin)
export const getAllTestimonials: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, featured } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (featured === "true") {
      filter.featured = true;
    }

    const testimonials = await db
      .collection("testimonials")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("testimonials").countDocuments(filter);

    const response: ApiResponse<{
      testimonials: Testimonial[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        testimonials: testimonials as Testimonial[],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch testimonials",
    });
  }
};

// Get public testimonials
export const getPublicTestimonials: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { featured, propertyId } = req.query as { featured?: string; propertyId?: string };

    const filter: any = { status: "approved" };
    if (featured === "true") {
      filter.featured = true;
    }
    if (propertyId) {
      filter.propertyId = propertyId;
    }

    const testimonials = await db
      .collection("testimonials")
      .find(filter, { projection: { email: 0 } })
      .sort({ featured: -1, createdAt: -1 })
      .limit(50)
      .toArray();

    const response: ApiResponse<Testimonial[]> = {
      success: true,
      data: testimonials as Testimonial[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public testimonials:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch testimonials",
    });
  }
};

// Create testimonial
export const createTestimonial: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { name, email, rating, comment, propertyId, sellerId } = req.body;

    const testimonial: Omit<Testimonial, "_id"> = {
      name,
      email,
      rating,
      comment,
      propertyId,
      sellerId,
      status: "pending",
      featured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("testimonials").insertOne(testimonial);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create testimonial",
    });
  }
};

// Update testimonial status (admin)
export const updateTestimonialStatus: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { testimonialId } = req.params;
    const { status, featured } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    const result = await db
      .collection("testimonials")
      .updateOne({ _id: new ObjectId(testimonialId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Testimonial not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Testimonial updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update testimonial",
    });
  }
};

// Delete testimonial (admin)
export const deleteTestimonial: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { testimonialId } = req.params;

    const result = await db
      .collection("testimonials")
      .deleteOne({ _id: new ObjectId(testimonialId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Testimonial not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Testimonial deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete testimonial",
    });
  }
};

// Admin: initialize dummy testimonials for testing
export const initializeTestimonials: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { propertyId } = req.body || {};

    const samples = [
      {
        name: "Ravi Kumar",
        email: "ravi@example.com",
        rating: 5,
        comment: "Excellent property, smooth experience!",
        propertyId,
        status: "approved",
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pooja Sharma",
        email: "pooja@example.com",
        rating: 4,
        comment: "Good location and owner was helpful.",
        propertyId,
        status: "approved",
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("testimonials").insertMany(samples as any[]);

    res.json({ success: true, data: { inserted: samples.length } });
  } catch (error) {
    console.error("Error initializing testimonials:", error);
    res.status(500).json({ success: false, error: "Failed to initialize testimonials" });
  }
};
