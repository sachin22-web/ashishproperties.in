import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db/mongodb";
import { sendEmail } from "../utils/mailer";

interface EnquiryData {
  propertyId: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  timestamp: string;
}

interface EnquiryDocument extends EnquiryData {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: "new" | "contacted" | "closed";
}

// POST /api/enquiries - Submit a new enquiry
export const submitEnquiry: RequestHandler = async (req, res) => {
  try {
    const { propertyId, name, phone, email, message, timestamp } =
      req.body as EnquiryData;

    // Validate required fields
    if (!propertyId || !name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: propertyId, name, phone, message",
      });
    }

    // Validate propertyId format
    if (!ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid property ID format",
      });
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Validate name (no empty or only whitespace)
    if (!name.trim() || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
      });
    }

    // Validate message (minimum length)
    if (!message.trim() || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long",
      });
    }

    const db = await getDatabase();

    // Verify property exists and is active
    const property = await db.collection("properties").findOne({
      _id: new ObjectId(propertyId),
      status: "active",
      approvalStatus: "approved",
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or not available",
      });
    }

    // Create enquiry document
    const enquiryDoc: EnquiryDocument = {
      propertyId: propertyId,
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "new",
    };

    // Add email if provided
    if (email && email.trim()) {
      (enquiryDoc as any).email = email.trim();
    }

    // Insert enquiry
    const result = await db.collection("enquiries").insertOne(enquiryDoc);

    if (!result.acknowledged) {
      return res.status(500).json({
        success: false,
        message: "Failed to save enquiry",
      });
    }

    // Update property inquiries count (analytics)
    await db.collection("properties").updateOne(
      { _id: new ObjectId(propertyId) },
      {
        $inc: { inquiries: 1 },
        $set: { updatedAt: new Date() },
      },
    );

    // Log the enquiry for analytics
    await db.collection("analytics").insertOne({
      type: "enquiry",
      propertyId: propertyId,
      enquiryId: result.insertedId,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date(),
      metadata: {
        propertyTitle: property.title,
        propertyType: property.propertyType,
        location: property.location,
      },
    });

    console.log(
      `✅ New enquiry received for property ${propertyId} from ${name} (${phone})`,
    );

    // Send email notifications asynchronously (don't block response)
    (async () => {
      try {
        // Get admin email from settings
        const adminSettings = await db.collection("admin_settings").findOne({});
        const adminEmail = adminSettings?.contact?.email || adminSettings?.general?.contactEmail || process.env.ADMIN_EMAIL || "admin@ashishproperties.in";

        // Send notification email to admin
        const adminEmailHTML = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #C70000 0%, #8B0000 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Enquiry Received!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #333; margin-top: 0;">Property Enquiry Details</h2>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>Property:</strong> ${property.title}</p>
                <p style="margin: 5px 0;"><strong>Property Type:</strong> ${property.propertyType}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> ${property.location?.city || ''}, ${property.location?.state || ''}</p>
                <p style="margin: 5px 0;"><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
              </div>
              <h3 style="color: #333;">Customer Information</h3>
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                <p style="margin: 5px 0;"><strong>Phone:</strong> <a href="tel:${phone}" style="color: #C70000;">${phone}</a></p>
                <p style="margin: 10px 0 5px 0;"><strong>Message:</strong></p>
                <p style="margin: 5px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #C70000;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404;"><strong>Action Required:</strong> Please contact the customer as soon as possible at ${phone}</p>
              </div>
            </div>
            <div style="background: #333; padding: 15px; text-align: center; color: #fff;">
              <p style="margin: 0; font-size: 12px;">Ashish Properties - Property Management System</p>
            </div>
          </div>
        `;

        await sendEmail(
          adminEmail,
          `New Enquiry: ${property.title}`,
          adminEmailHTML,
          `New enquiry from ${name} (${phone}) for ${property.title}. Message: ${message}`
        );

        console.log(`📧 Admin notification email sent for enquiry ${result.insertedId}`);

        // Send confirmation email to user if email provided
        if (email && email.trim()) {
          const userEmailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #C70000 0%, #8B0000 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Enquiry Confirmation</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${name},</p>
                <p style="color: #333; margin-bottom: 20px;">Thank you for your interest in our property. We have received your enquiry and will get back to you shortly.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #333; margin-top: 0; font-size: 18px;">Enquiry Details</h2>
                  <p style="margin: 5px 0;"><strong>Property:</strong> ${property.title}</p>
                  <p style="margin: 5px 0;"><strong>Location:</strong> ${property.location?.city || ''}, ${property.location?.state || ''}</p>
                  <p style="margin: 5px 0;"><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
                  <p style="margin: 10px 0 5px 0;"><strong>Your Message:</strong></p>
                  <p style="margin: 5px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #C70000;">${message}</p>
                </div>

                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50; margin: 20px 0;">
                  <p style="margin: 0; color: #2e7d32;"><strong>What's Next?</strong></p>
                  <p style="margin: 10px 0 0 0; color: #2e7d32;">Our team will contact you at <strong>${phone}</strong> within the next 24 hours to discuss your requirements and schedule a property visit if needed.</p>
                </div>

                <p style="color: #333; margin-top: 20px;">If you have any immediate questions, feel free to call us at <a href="tel:+917419100032" style="color: #C70000; text-decoration: none;">+91 7419100032</a></p>
                
                <p style="color: #333; margin-top: 20px;">Best regards,<br><strong>Team Ashish Properties</strong></p>
              </div>
              <div style="background: #333; padding: 15px; text-align: center; color: #fff;">
                <p style="margin: 0; font-size: 12px;">Ashish Properties - Your Trusted Property Partner</p>
                <p style="margin: 5px 0 0 0; font-size: 11px;">📞 +91 7419100032 • ✉️ info@ashishproperties.in</p>
              </div>
            </div>
          `;

          await sendEmail(
            email.trim(),
            `Enquiry Confirmation - ${property.title}`,
            userEmailHTML,
            `Dear ${name}, Thank you for your interest in ${property.title}. We have received your enquiry and will contact you soon at ${phone}.`
          );

          console.log(`📧 User confirmation email sent to ${email} for enquiry ${result.insertedId}`);
        }
      } catch (emailError) {
        console.error("⚠️ Failed to send email notifications:", emailError);
        // Don't fail the request if email fails
      }
    })();

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully! We will contact you soon.",
      data: {
        enquiryId: result.insertedId,
        propertyId: propertyId,
        propertyTitle: property.title,
        submittedAt: enquiryDoc.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error submitting enquiry:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// GET /api/enquiries - Get all enquiries (admin only)
export const getEnquiries: RequestHandler = async (req, res) => {
  try {
    const { page = "1", limit = "20", status, propertyId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const db = await getDatabase();

    // Build filter
    const filter: any = {};
    if (status && typeof status === "string") {
      filter.status = status;
    }
    if (
      propertyId &&
      typeof propertyId === "string" &&
      ObjectId.isValid(propertyId)
    ) {
      filter.propertyId = propertyId;
    }

    // Get enquiries with property details
    const enquiries = await db
      .collection("enquiries")
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property",
            pipeline: [
              {
                $project: {
                  title: 1,
                  propertyType: 1,
                  location: 1,
                  price: 1,
                  images: { $arrayElemAt: ["$images", 0] },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$property",
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .toArray();

    // Get total count
    const total = await db.collection("enquiries").countDocuments(filter);

    res.json({
      success: true,
      data: enquiries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching enquiries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// PATCH /api/enquiries/:id - Update enquiry status (admin only)
export const updateEnquiryStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID",
      });
    }

    // Validate status
    if (!status || !["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: new, contacted, or closed",
      });
    }

    const db = await getDatabase();

    const result = await db.collection("enquiries").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Enquiry status updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating enquiry status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};