import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { CustomField } from "@shared/types";

// Get all custom fields
export const getAllCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    const fields = await collection.find({}).sort({ order: 1 }).toArray();
    
    res.json({
      success: true,
      data: fields,
      count: fields.length
    });
  } catch (error: any) {
    console.error("Error fetching custom fields:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch custom fields"
    });
  }
};

// Create new custom field
export const createCustomField: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    const {
      name,
      slug,
      type,
      label,
      placeholder,
      required = false,
      active = true,
      order = 999,
      options = [],
      categories = [],
      description
    } = req.body;

    // Validate required fields
    if (!name || !slug || !type || !label) {
      return res.status(400).json({
        success: false,
        error: "Name, slug, type, and label are required"
      });
    }

    // Check if slug already exists
    const existingField = await collection.findOne({ slug });
    if (existingField) {
      return res.status(400).json({
        success: false,
        error: "A field with this slug already exists"
      });
    }

    const newField: CustomField = {
      name,
      slug,
      type,
      label,
      placeholder,
      required: Boolean(required),
      active: Boolean(active),
      order: Number(order),
      options: Array.isArray(options) ? options.filter(Boolean) : [],
      categories: Array.isArray(categories) ? categories : [],
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(newField);
    
    if (result.insertedId) {
      const createdField = await collection.findOne({ _id: result.insertedId });
      res.status(201).json({
        success: true,
        data: createdField,
        message: "Custom field created successfully"
      });
    } else {
      throw new Error("Failed to create custom field");
    }
  } catch (error: any) {
    console.error("Error creating custom field:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create custom field"
    });
  }
};

// Update custom field
export const updateCustomField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    if (!ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid field ID"
      });
    }

    const {
      name,
      slug,
      type,
      label,
      placeholder,
      required,
      active,
      order,
      options,
      categories,
      description
    } = req.body;

    // Check if field exists
    const existingField = await collection.findOne({ _id: new ObjectId(fieldId) });
    if (!existingField) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found"
      });
    }

    // Check if slug already exists (but allow current field to keep its slug)
    if (slug && slug !== existingField.slug) {
      const slugExists = await collection.findOne({ 
        slug, 
        _id: { $ne: new ObjectId(fieldId) } 
      });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          error: "A field with this slug already exists"
        });
      }
    }

    const updateData: Partial<CustomField> = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (type !== undefined) updateData.type = type;
    if (label !== undefined) updateData.label = label;
    if (placeholder !== undefined) updateData.placeholder = placeholder;
    if (required !== undefined) updateData.required = Boolean(required);
    if (active !== undefined) updateData.active = Boolean(active);
    if (order !== undefined) updateData.order = Number(order);
    if (options !== undefined) updateData.options = Array.isArray(options) ? options.filter(Boolean) : [];
    if (categories !== undefined) updateData.categories = Array.isArray(categories) ? categories : [];
    if (description !== undefined) updateData.description = description;

    const result = await collection.updateOne(
      { _id: new ObjectId(fieldId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found"
      });
    }

    const updatedField = await collection.findOne({ _id: new ObjectId(fieldId) });
    
    res.json({
      success: true,
      data: updatedField,
      message: "Custom field updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating custom field:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update custom field"
    });
  }
};

// Delete custom field
export const deleteCustomField: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    if (!ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid field ID"
      });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(fieldId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found"
      });
    }

    res.json({
      success: true,
      message: "Custom field deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting custom field:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete custom field"
    });
  }
};

// Update custom field status (active/inactive)
export const updateCustomFieldStatus: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { active } = req.body;
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    if (!ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid field ID"
      });
    }

    if (typeof active !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "Active status must be a boolean"
      });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(fieldId) },
      { 
        $set: { 
          active: active,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found"
      });
    }

    const updatedField = await collection.findOne({ _id: new ObjectId(fieldId) });
    
    res.json({
      success: true,
      data: updatedField,
      message: `Custom field ${active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error("Error updating custom field status:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update custom field status"
    });
  }
};

// Get custom field by ID
export const getCustomFieldById: RequestHandler = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    if (!ObjectId.isValid(fieldId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid field ID"
      });
    }

    const field = await collection.findOne({ _id: new ObjectId(fieldId) });

    if (!field) {
      return res.status(404).json({
        success: false,
        error: "Custom field not found"
      });
    }

    res.json({
      success: true,
      data: field
    });
  } catch (error: any) {
    console.error("Error fetching custom field:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch custom field"
    });
  }
};

// Get active custom fields (public endpoint)
export const getActiveCustomFields: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const collection = db.collection("customFields");
    
    const fields = await collection
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();
    
    res.json({
      success: true,
      data: fields,
      count: fields.length
    });
  } catch (error: any) {
    console.error("Error fetching active custom fields:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch active custom fields"
    });
  }
};
