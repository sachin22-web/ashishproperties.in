import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { ApiResponse } from "@shared/types";

interface OtherService {
  _id?: string;
  category: string;
  name: string;
  phone: string;
  photoUrl?: string;
  openTime: string;
  closeTime: string;
  address: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Get all other services (admin)
export const getAllOtherServices: RequestHandler = async (req, res) => {
  try {
    let db;
    try {
      db = getDatabase();
    } catch (dbError) {
      return res.status(503).json({
        success: false,
        error:
          "Database connection is being established. Please try again in a moment.",
      });
    }

    const { category, search } = req.query;

    // Build filter
    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const services = await db
      .collection("otherServices")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const response: ApiResponse<OtherService[]> = {
      success: true,
      data: services as OtherService[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching other services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch other services",
    });
  }
};

// Get public other services (grouped by category)
export const getPublicOtherServices: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    // Build filter for active services only
    const filter: any = { isActive: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const services = await db
      .collection("otherServices")
      .find(filter)
      .sort({ category: 1, name: 1 })
      .toArray();

    // Group by category
    const groupedServices = services.reduce((acc: any, service: any) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

    const response: ApiResponse<any> = {
      success: true,
      data: groupedServices,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching public other services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch other services",
    });
  }
};

// Create new other service
export const createOtherService: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category, name, phone, photoUrl, openTime, closeTime, address } =
      req.body;

    // Validate required fields
    if (!category || !name || !phone || !openTime || !closeTime || !address) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: category, name, phone, openTime, closeTime, address",
      });
    }

    const serviceData: OtherService = {
      category,
      name,
      phone,
      photoUrl,
      openTime,
      closeTime,
      address,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("otherServices").insertOne(serviceData);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating other service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create other service",
    });
  }
};

// Update other service
export const updateOtherService: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { serviceId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid service ID",
      });
    }

    delete updateData._id; // Remove _id from update data
    updateData.updatedAt = new Date();

    const result = await db
      .collection("otherServices")
      .updateOne({ _id: new ObjectId(serviceId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Service updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating other service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update other service",
    });
  }
};

// Delete other service
export const deleteOtherService: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { serviceId } = req.params;

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid service ID",
      });
    }

    const result = await db
      .collection("otherServices")
      .deleteOne({ _id: new ObjectId(serviceId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Service not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Service deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting other service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete other service",
    });
  }
};

// Bulk import other services from CSV/XLSX
export const importOtherServices: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    // Parse CSV file (simplified implementation)
    // For production, you would use libraries like csv-parser or xlsx
    const fs = require("fs");
    const fileContent = fs.readFileSync(req.file.path, "utf-8");
    const lines = fileContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    // Validate headers
    const requiredHeaders = [
      "category",
      "name",
      "phone",
      "openTime",
      "closeTime",
      "address",
    ];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required columns: ${missingHeaders.join(", ")}`,
      });
    }

    const services: OtherService[] = [];
    let validRows = 0;
    let errorRows = 0;

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""));

      try {
        const serviceData: OtherService = {
          category: values[headers.indexOf("category")],
          name: values[headers.indexOf("name")],
          phone: values[headers.indexOf("phone")],
          photoUrl: values[headers.indexOf("photoUrl")] || "",
          openTime: values[headers.indexOf("openTime")],
          closeTime: values[headers.indexOf("closeTime")],
          address: values[headers.indexOf("address")],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Validate required fields
        if (
          !serviceData.category ||
          !serviceData.name ||
          !serviceData.phone ||
          !serviceData.openTime ||
          !serviceData.closeTime ||
          !serviceData.address
        ) {
          errorRows++;
          continue;
        }

        services.push(serviceData);
        validRows++;
      } catch (error) {
        errorRows++;
      }
    }

    // Insert valid services
    if (services.length > 0) {
      await db.collection("otherServices").insertMany(services);
    }

    const response: ApiResponse<{
      imported: number;
      errors: number;
      total: number;
    }> = {
      success: true,
      data: {
        imported: validRows,
        errors: errorRows,
        total: validRows + errorRows,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error importing other services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to import other services",
    });
  }
};

// Export other services to CSV
export const exportOtherServices: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { category, search } = req.query;

    // Build filter
    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const services = await db
      .collection("otherServices")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert to CSV
    const csvHeaders =
      "Category,Name,Phone,Photo URL,Open Time,Close Time,Address,Status,Created At\n";
    const csvData = services
      .map((service: any) => {
        return [
          service.category || "",
          service.name || "",
          service.phone || "",
          service.photoUrl || "",
          service.openTime || "",
          service.closeTime || "",
          service.address || "",
          service.isActive ? "Active" : "Inactive",
          service.createdAt
            ? new Date(service.createdAt).toLocaleDateString()
            : "",
        ]
          .map((field) => `"${field}"`)
          .join(",");
      })
      .join("\n");

    const csv = csvHeaders + csvData;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="other-services-export.csv"',
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting other services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export other services",
    });
  }
};

// Get service categories with counts
export const getServiceCategories: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    const categories = await db
      .collection("otherServices")
      .aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: categories,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching service categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service categories",
    });
  }
};
