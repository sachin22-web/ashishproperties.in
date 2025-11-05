import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";

interface NewProject {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  price: number;
  priceRange?: string;
  status: "upcoming" | "ongoing" | "completed";
  launchDate?: string;
  completionDate?: string;
  developer: string;
  amenities: string[];
  images: string[];
  brochureUrl?: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NewProjectBanner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  projectId?: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// Helper function to generate unique slug
async function generateUniqueSlug(db: any, name: string): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.collection("new_projects").findOne({ slug });
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// GET /api/admin/new-projects - Get all projects
export const getNewProjects: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { page = "1", limit = "20", search = "", status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { developer: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "all") {
      filter.status = status;
    }

    const [projects, total] = await Promise.all([
      db
        .collection("new_projects")
        .find(filter)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("new_projects").countDocuments(filter),
    ]);

    const response: ApiResponse<{
      projects: NewProject[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }> = {
      success: true,
      data: {
        projects: projects as NewProject[],
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
    console.error("Error fetching new projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
};

// POST /api/admin/new-projects - Create new project
export const createNewProject: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const projectData = req.body;

    // Validate required fields
    if (!projectData.name || !projectData.location) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, location",
      });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(db, projectData.name);

    const newProject: Omit<NewProject, "_id"> = {
      ...projectData,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("new_projects").insertOne(newProject);

    const response: ApiResponse<{ _id: string; project: NewProject }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        project: {
          ...newProject,
          _id: result.insertedId.toString(),
        } as NewProject,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating new project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create project",
    });
  }
};

// PUT /api/admin/new-projects/:id - Update project
export const updateNewProject: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID",
      });
    }

    // If name is being updated, regenerate slug
    if (updateData.name) {
      updateData.slug = await generateUniqueSlug(db, updateData.name);
    }

    updateData.updatedAt = new Date();

    const result = await db
      .collection("new_projects")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    // Get updated project
    const updatedProject = await db
      .collection("new_projects")
      .findOne({ _id: new ObjectId(id) });

    const response: ApiResponse<{ project: NewProject }> = {
      success: true,
      data: { project: updatedProject as NewProject },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating new project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update project",
    });
  }
};

// DELETE /api/admin/new-projects/:id - Delete project
export const deleteNewProject: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID",
      });
    }

    // Check if project has associated banners
    const bannerCount = await db
      .collection("new_project_banners")
      .countDocuments({ projectId: id });

    if (bannerCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete project. It has ${bannerCount} associated banners. Delete banners first.`,
      });
    }

    const result = await db
      .collection("new_projects")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Project not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Project deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting new project:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete project",
    });
  }
};

// GET /api/admin/new-projects/banners - Get project banners
export const getNewProjectBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { projectId } = req.query;

    // Build filter
    const filter: any = {};
    if (projectId) {
      filter.projectId = projectId;
    }

    const banners = await db
      .collection("new_project_banners")
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray();

    const response: ApiResponse<NewProjectBanner[]> = {
      success: true,
      data: banners as NewProjectBanner[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching new project banners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch banners",
    });
  }
};

// POST /api/admin/new-projects/banners - Create banner
export const createNewProjectBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const bannerData = req.body;

    // Validate required fields
    if (!bannerData.title || !bannerData.imageUrl || !bannerData.link) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, imageUrl, link",
      });
    }

    const newBanner: Omit<NewProjectBanner, "_id"> = {
      ...bannerData,
      createdAt: new Date(),
    };

    const result = await db.collection("new_project_banners").insertOne(newBanner);

    const response: ApiResponse<{ _id: string; banner: NewProjectBanner }> = {
      success: true,
      data: {
        _id: result.insertedId.toString(),
        banner: {
          ...newBanner,
          _id: result.insertedId.toString(),
        } as NewProjectBanner,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating new project banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create banner",
    });
  }
};

// PUT /api/admin/new-projects/banners/:id - Update banner
export const updateNewProjectBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid banner ID",
      });
    }

    const result = await db
      .collection("new_project_banners")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Banner not found",
      });
    }

    // Get updated banner
    const updatedBanner = await db
      .collection("new_project_banners")
      .findOne({ _id: new ObjectId(id) });

    const response: ApiResponse<{ banner: NewProjectBanner }> = {
      success: true,
      data: { banner: updatedBanner as NewProjectBanner },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating new project banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update banner",
    });
  }
};

// DELETE /api/admin/new-projects/banners/:id - Delete banner
export const deleteNewProjectBanner: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid banner ID",
      });
    }

    const result = await db
      .collection("new_project_banners")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Banner not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Banner deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting new project banner:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete banner",
    });
  }
};

// PUBLIC: Get active new projects for frontend
export const getPublicNewProjects: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { featured, limit = "10" } = req.query;

    // Build filter
    const filter: any = { isActive: true };
    if (featured === "true") {
      filter.isFeatured = true;
    }

    const limitNum = parseInt(limit as string);

    const projects = await db
      .collection("new_projects")
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limitNum)
      .toArray();

    const response: ApiResponse<NewProject[]> = {
      success: true,
      data: projects as NewProject[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public new projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects",
    });
  }
};

// PUBLIC: Get active new project banners for frontend
export const getPublicNewProjectBanners: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const banners = await db
      .collection("new_project_banners")
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .toArray();

    const response: ApiResponse<NewProjectBanner[]> = {
      success: true,
      data: banners as NewProjectBanner[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public new project banners:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch banners",
    });
  }
};

// Initialize default new projects (for setup)
export const initializeNewProjects: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { force } = req.query;

    // Check if projects already exist
    const existingCount = await db.collection("new_projects").countDocuments();
    if (existingCount > 0 && force !== "true") {
      return res.json({
        success: true,
        message: "New projects already initialized",
        existingCount,
        hint: "Use ?force=true to clear and reinitialize",
      });
    }

    // If force=true, clear existing projects first
    if (force === "true" && existingCount > 0) {
      console.log("🧹 Force mode: Clearing existing new projects...");
      await Promise.all([
        db.collection("new_projects").deleteMany({}),
        db.collection("new_project_banners").deleteMany({}),
      ]);
      console.log(`�� Cleared ${existingCount} existing projects and banners`);
    }

    const defaultProjects: Omit<NewProject, "_id">[] = [
      {
        name: "Ashish Green Valley",
        slug: "ashish-green-valley",
        description: "Premium residential project with modern amenities and green spaces",
        location: "Sector 14, Rohtak",
        price: 4500000,
        priceRange: "₹45L - ₹85L",
        status: "upcoming",
        launchDate: "2024-06-01",
        completionDate: "2026-12-31",
        developer: "Ashish Properties",
        amenities: ["Swimming Pool", "Gym", "Garden", "Parking", "Security"],
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
        ],
        brochureUrl: "",
        contactInfo: {
          phone: "+91-9876543210",
          email: "sales@aashishproperties.com",
          address: "Main Road, Rohtak, Haryana",
        },
        isActive: true,
        isFeatured: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Ashish Heights",
        slug: "ashish-heights",
        description: "Luxury apartments with panoramic city views",
        location: "Civil Lines, Rohtak",
        price: 6500000,
        priceRange: "₹65L - ₹1.2Cr",
        status: "ongoing",
        launchDate: "2023-01-15",
        completionDate: "2025-06-30",
        developer: "Ashish Properties",
        amenities: ["Club House", "Elevator", "Power Backup", "Security"],
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
        ],
        brochureUrl: "",
        contactInfo: {
          phone: "+91-9876543210",
          email: "sales@aashishproperties.com",
          address: "Main Road, Rohtak, Haryana",
        },
        isActive: true,
        isFeatured: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const defaultBanners: Omit<NewProjectBanner, "_id">[] = [
      {
        title: "Discover Ashish Green Valley",
        subtitle: "Premium living spaces in Rohtak",
        imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop",
        link: "/new-projects/ashish-green-valley",
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
      },
      {
        title: "Ashish Heights - Now Booking",
        subtitle: "Luxury apartments with city views",
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=400&fit=crop",
        link: "/new-projects/ashish-heights",
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
      },
    ];

    // Insert projects
    await db.collection("new_projects").insertMany(defaultProjects);
    
    // Insert banners
    await db.collection("new_project_banners").insertMany(defaultBanners);

    res.json({
      success: true,
      message: "Default new projects and banners initialized successfully",
      data: {
        projects: defaultProjects.length,
        banners: defaultBanners.length,
      },
    });
  } catch (error) {
    console.error("Error initializing new projects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize new projects",
    });
  }
};
