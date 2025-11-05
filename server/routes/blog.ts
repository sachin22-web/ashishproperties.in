import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

export interface BlogPost {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  category: string;
  tags: string[];
  status: "draft" | "pending_review" | "published" | "archived";
  featured: boolean;
  seo?: {
    title?: string;
    description?: string;
  };
  publishedAt?: Date;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Get all blog posts (admin)
export const getAllBlogPosts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", status, category, author } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (author) {
      filter["author.id"] = author;
    }

    const posts = await db
      .collection("blog_posts")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("blog_posts").countDocuments(filter);

    // Get categories and authors
    const categories = await db.collection("blog_posts").distinct("category");
    const authors = await db.collection("blog_posts").distinct("author");

    const response: ApiResponse<{
      posts: BlogPost[];
      categories: string[];
      authors: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        posts: posts as BlogPost[],
        categories,
        authors,
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
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog posts",
    });
  }
};

// Get public blog posts
export const getPublicBlogPosts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "10", category, featured } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { status: "published" };
    if (category && category !== "all") {
      filter.category = category;
    }
    if (featured === "true") {
      filter.featured = true;
    }

    const posts = await db
      .collection("blog_posts")
      .find(filter, {
        projection: {
          title: 1,
          slug: 1,
          excerpt: 1,
          featuredImage: 1,
          author: 1,
          category: 1,
          tags: 1,
          publishedAt: 1,
          views: 1,
          featured: 1,
        },
      })
      .sort({ featured: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db.collection("blog_posts").countDocuments(filter);

    const response: ApiResponse<{
      posts: Partial<BlogPost>[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        posts,
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
    console.error("Error fetching public blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog posts",
    });
  }
};

// Get blog post by slug
export const getBlogPostBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params;

    const post = await db.collection("blog_posts").findOne({ slug });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    // Increment view count
    await db
      .collection("blog_posts")
      .updateOne({ _id: post._id }, { $inc: { views: 1 } });

    const response: ApiResponse<BlogPost> = {
      success: true,
      data: post as BlogPost,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blog post",
    });
  }
};

// Create blog post (admin)
export const createBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      category,
      tags = [],
      status = "draft",
      featured = false,
    } = req.body;

    // @ts-ignore - req.user is set by auth middleware
    const author = req.user;

    // Check if slug already exists
    const existingPost = await db.collection("blog_posts").findOne({ slug });
    if (existingPost) {
      return res.status(400).json({
        success: false,
        error: "Blog post with this slug already exists",
      });
    }

    const post: Omit<BlogPost, "_id"> = {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      author: {
        id: author._id,
        name: author.name,
        email: author.email,
      },
      category,
      tags,
      status,
      featured,
      publishedAt: status === "published" ? new Date() : undefined,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("blog_posts").insertOne(post);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create blog post",
    });
  }
};

// Update blog post (admin)
export const updateBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { postId } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    // If publishing for the first time, set publishedAt
    if (updateData.status === "published") {
      const existingPost = await db
        .collection("blog_posts")
        .findOne({ _id: new ObjectId(postId) });
      if (existingPost && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    delete updateData._id;

    const result = await db
      .collection("blog_posts")
      .updateOne({ _id: new ObjectId(postId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Blog post updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update blog post",
    });
  }
};

// Seller: list own blog posts
export const getSellerBlogPosts: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    // @ts-ignore
    const userId = (req as any).userId as string;
    const posts = await db
      .collection("blog_posts")
      .find({ "author.id": userId })
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<BlogPost[]> = {
      success: true,
      data: posts as BlogPost[],
    };
    res.json(response);
  } catch (error) {
    console.error("Error fetching seller blog posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts" });
  }
};

// Seller: create post -> pending_review or draft
export const createSellerBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    // @ts-ignore
    const userId = (req as any).userId as string;
    // @ts-ignore
    const email = (req as any).email as string;

    const {
      title,
      slug: incomingSlug,
      content,
      excerpt,
      featuredImage,
      category,
      tags = [],
      submit = false,
      seo = {},
    } = req.body || {};

    const makeSlug = (s: string) =>
      (s || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const slug =
      incomingSlug && incomingSlug.trim()
        ? makeSlug(incomingSlug)
        : makeSlug(title);

    // Ensure unique slug
    const existing = await db.collection("blog_posts").findOne({ slug });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: "Slug already exists" });
    }

    const now = new Date();
    const post: Omit<BlogPost, "_id"> = {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      author: {
        id: userId,
        name: email ? email.split("@")[0] : "Seller",
        email: email || "",
      },
      category,
      tags,
      status: submit ? "pending_review" : "draft",
      featured: false,
      seo: {
        title: seo.title || title,
        description: seo.description || excerpt,
      },
      publishedAt: undefined,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("blog_posts").insertOne(post);
    res.json({ success: true, data: { _id: result.insertedId.toString() } });
  } catch (error) {
    console.error("Error creating seller blog post:", error);
    res.status(500).json({ success: false, error: "Failed to create post" });
  }
};

// Seller: update own post (only draft/pending_review)
export const updateSellerBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    // @ts-ignore
    const userId = (req as any).userId as string;
    const { postId } = req.params;
    const existing = await db
      .collection("blog_posts")
      .findOne({ _id: new ObjectId(postId), "author.id": userId });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    if (existing.status === "published") {
      return res
        .status(400)
        .json({ success: false, error: "Cannot edit published post" });
    }

    const update: any = { ...req.body, updatedAt: new Date() };
    delete update._id;
    delete update.status; // seller cannot set final status

    await db
      .collection("blog_posts")
      .updateOne({ _id: new ObjectId(postId) }, { $set: update });

    res.json({ success: true, data: { message: "Updated" } });
  } catch (error) {
    console.error("Error updating seller blog post:", error);
    res.status(500).json({ success: false, error: "Failed to update post" });
  }
};

// Seller: delete own post (only draft/pending_review)
export const deleteSellerBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    // @ts-ignore
    const userId = (req as any).userId as string;
    const { postId } = req.params;

    const existing = await db
      .collection("blog_posts")
      .findOne({ _id: new ObjectId(postId), "author.id": userId });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    if (existing.status === "published") {
      return res
        .status(400)
        .json({ success: false, error: "Cannot delete published post" });
    }

    await db.collection("blog_posts").deleteOne({ _id: new ObjectId(postId) });
    res.json({ success: true, data: { message: "Deleted" } });
  } catch (error) {
    console.error("Error deleting seller blog post:", error);
    res.status(500).json({ success: false, error: "Failed to delete post" });
  }
};

// Delete blog post (admin)
export const deleteBlogPost: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { postId } = req.params;

    const result = await db
      .collection("blog_posts")
      .deleteOne({ _id: new ObjectId(postId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Blog post deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete blog post",
    });
  }
};
