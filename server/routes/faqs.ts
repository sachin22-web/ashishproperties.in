import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface FAQ {
  _id?: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Get all FAQs (admin)
export const getAllFAQs: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", category, active } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (active !== undefined) {
      filter.active = active === "true";
    }

    const faqs = await db
      .collection("faqs")
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("faqs").countDocuments(filter);

    // Get categories
    const categories = await db
      .collection("faqs")
      .distinct("category");

    const response: ApiResponse<{
      faqs: FAQ[];
      categories: string[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        faqs: faqs as FAQ[],
        categories,
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
    console.error("Error fetching FAQs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch FAQs",
    });
  }
};

// Get public FAQs
export const getPublicFAQs: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    const filter: any = { active: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const faqs = await db
      .collection("faqs")
      .find(filter)
      .sort({ featured: -1, order: 1 })
      .toArray();

    // Group by category
    const groupedFAQs = faqs.reduce((acc: any, faq: any) => {
      if (!acc[faq.category]) {
        acc[faq.category] = [];
      }
      acc[faq.category].push(faq);
      return acc;
    }, {});

    const response: ApiResponse<{
      faqs: FAQ[];
      groupedFAQs: Record<string, FAQ[]>;
      categories: string[];
    }> = {
      success: true,
      data: {
        faqs: faqs as FAQ[],
        groupedFAQs,
        categories: Object.keys(groupedFAQs),
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public FAQs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch FAQs",
    });
  }
};

// Create FAQ (admin)
export const createFAQ: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { question, answer, category, order = 999, featured = false } = req.body;

    const faq: Omit<FAQ, "_id"> = {
      question,
      answer,
      category,
      order,
      active: true,
      featured,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("faqs").insertOne(faq);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create FAQ",
    });
  }
};

// Update FAQ (admin)
export const updateFAQ: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { faqId } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    delete updateData._id;

    const result = await db
      .collection("faqs")
      .updateOne({ _id: new ObjectId(faqId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "FAQ not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "FAQ updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update FAQ",
    });
  }
};

// Delete FAQ (admin)
export const deleteFAQ: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { faqId } = req.params;

    const result = await db
      .collection("faqs")
      .deleteOne({ _id: new ObjectId(faqId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "FAQ not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "FAQ deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete FAQ",
    });
  }
};

// Initialize default FAQs
export const initializeFAQs: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if FAQs already exist
    const existingCount = await db.collection("faqs").countDocuments();
    if (existingCount > 0) {
      return res.json({
        success: true,
        message: "FAQs already initialized",
      });
    }

    const defaultFAQs: Omit<FAQ, "_id">[] = [
      {
        question: "How do I list my property?",
        answer: "To list your property, first register as a seller, then click on 'Add Property' and fill in all the required details including photos, description, and contact information.",
        category: "Listing",
        order: 1,
        active: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        question: "What are the charges for listing a property?",
        answer: "We offer various packages starting from free basic listing to premium featured listings. Check our packages section for detailed pricing.",
        category: "Pricing",
        order: 2,
        active: true,
        featured: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        question: "How can I contact the property owner?",
        answer: "You can contact property owners through the contact details provided in the listing or use our built-in messaging system.",
        category: "Communication",
        order: 3,
        active: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        question: "Is my personal information safe?",
        answer: "Yes, we take privacy seriously. Your personal information is encrypted and only shared with genuine interested buyers/sellers.",
        category: "Privacy",
        order: 4,
        active: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        question: "How do I verify a property listing?",
        answer: "All our property listings go through a verification process. Look for the 'Verified' badge on listings that have been checked by our team.",
        category: "Verification",
        order: 5,
        active: true,
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("faqs").insertMany(defaultFAQs);

    res.json({
      success: true,
      message: "FAQs initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing FAQs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize FAQs",
    });
  }
};
