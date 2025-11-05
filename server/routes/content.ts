import { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ApiResponse } from "@shared/types";
import { ObjectId } from "mongodb";

interface ContentPage {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: "published" | "draft" | "archived";
  type: "page" | "policy" | "terms" | "faq";
  featuredImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get all content pages (admin only)
export const getAllContentPages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { status, type } = req.query;

    const filter: any = {};
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;

    const pages = await db
      .collection("pages")
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    const response: ApiResponse<ContentPage[]> = {
      success: true,
      data: pages as ContentPage[],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching content pages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch content pages",
    });
  }
};

// Get single content page by slug (public)
export const getContentPageBySlug: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { slug } = req.params;

    const page = await db
      .collection("pages")
      .findOne({ slug, status: "published" });

    if (!page) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    const response: ApiResponse<ContentPage> = {
      success: true,
      data: page as ContentPage,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching content page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch content page",
    });
  }
};

// Create new content page (admin only)
export const createContentPage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      status = "draft",
      type = "page",
      featuredImage,
    } = req.body;

    // Check if slug already exists
    const existingPage = await db.collection("pages").findOne({ slug });

    if (existingPage) {
      return res.status(400).json({
        success: false,
        error: "Page with this slug already exists",
      });
    }

    const newPage: Omit<ContentPage, "_id"> = {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      status,
      type,
      featuredImage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("pages").insertOne(newPage);

    const response: ApiResponse<{ _id: string }> = {
      success: true,
      data: { _id: result.insertedId.toString() },
    };

    res.json(response);
  } catch (error) {
    console.error("Error creating content page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create content page",
    });
  }
};

// Update content page (admin only)
export const updateContentPage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { pageId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID",
      });
    }

    // Remove _id from update data if present
    delete updateData._id;
    updateData.updatedAt = new Date();

    // Check if slug is being changed and if it conflicts
    if (updateData.slug) {
      const existingPage = await db.collection("pages").findOne({
        slug: updateData.slug,
        _id: { $ne: new ObjectId(pageId) },
      });

      if (existingPage) {
        return res.status(400).json({
          success: false,
          error: "Page with this slug already exists",
        });
      }
    }

    const result = await db
      .collection("pages")
      .updateOne({ _id: new ObjectId(pageId) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Page updated successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating content page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update content page",
    });
  }
};

// Delete content page (admin only)
export const deleteContentPage: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { pageId } = req.params;

    if (!ObjectId.isValid(pageId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid page ID",
      });
    }

    const result = await db
      .collection("pages")
      .deleteOne({ _id: new ObjectId(pageId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Page not found",
      });
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Page deleted successfully" },
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting content page:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete content page",
    });
  }
};

// Initialize default content pages
export const initializeContentPages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();

    // Check if pages already exist
    const existingPagesCount = await db.collection("pages").countDocuments();

    if (existingPagesCount > 0) {
      return res.json({
        success: true,
        message: "Content pages already exist",
      });
    }

    const defaultPages: Omit<ContentPage, "_id">[] = [
      {
        title: "About Us",
        slug: "about-us",
        content: `
          <div class="prose prose-lg">
            <h1>About Aashish Property</h1>
            <p>Welcome to Aashish Property, your trusted partner in real estate solutions in Rohtak and surrounding areas. We are committed to providing exceptional service in property buying, selling, and consultation.</p>
            
            <h2>Our Mission</h2>
            <p>To make property transactions transparent, efficient, and hassle-free for all our clients. We believe in building long-term relationships based on trust and reliability.</p>
            
            <h2>Our Services</h2>
            <ul>
              <li>Residential Property Sales</li>
              <li>Commercial Property Leasing</li>
              <li>Property Investment Consultation</li>
              <li>Legal Documentation Support</li>
              <li>Market Analysis and Valuation</li>
            </ul>
            
            <h2>Why Choose Us?</h2>
            <p>With years of experience in the Rohtak real estate market, we understand the local dynamics and can guide you to make informed decisions. Our team of experienced professionals is dedicated to your success.</p>
            
            <h2>Contact Information</h2>
            <p>
              <strong>Address:</strong> Rohtak, Haryana<br>
              <strong>Phone:</strong> +91-XXXXXXXXXX<br>
              <strong>Email:</strong> info@aashishproperty.com
            </p>
          </div>
        `,
        metaTitle:
          "About Us - Aashish Property | Trusted Real Estate Partner in Rohtak",
        metaDescription:
          "Learn more about Aashish Property, your trusted real estate partner in Rohtak. We provide residential and commercial property solutions with exceptional service.",
        status: "published",
        type: "page",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Privacy Policy",
        slug: "privacy-policy",
        content: `
          <div class="prose prose-lg">
            <h1>Privacy Policy</h1>
            <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h2>Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, list a property, or contact us for support.</p>
            
            <h3>Personal Information</h3>
            <ul>
              <li>Name and contact information</li>
              <li>Email address and phone number</li>
              <li>Property details and preferences</li>
              <li>Payment information (processed securely)</li>
            </ul>
            
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Process property listings and transactions</li>
              <li>Communicate with you about our services</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            
            <h2>Information Sharing</h2>
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
            
            <h2>Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
            
            <h2>Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@aashishproperty.com</p>
          </div>
        `,
        metaTitle: "Privacy Policy - Aashish Property",
        metaDescription:
          "Read our privacy policy to understand how Aashish Property collects, uses, and protects your personal information.",
        status: "published",
        type: "policy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Terms and Conditions",
        slug: "terms-conditions",
        content: `
          <div class="prose prose-lg">
            <h1>Terms and Conditions</h1>
            <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h2>Acceptance of Terms</h2>
            <p>By accessing and using the Aashish Property platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h2>Use License</h2>
            <p>Permission is granted to temporarily download one copy of the materials on Aashish Property's website for personal, non-commercial transitory viewing only.</p>
            
            <h2>Disclaimer</h2>
            <p>The materials on Aashish Property's website are provided on an 'as is' basis. Aashish Property makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
            
            <h2>User Responsibilities</h2>
            <p>Users are responsible for:</p>
            <ul>
              <li>Providing accurate and truthful information</li>
              <li>Maintaining the confidentiality of their account</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Respecting the intellectual property rights of others</li>
            </ul>
            
            <h2>Property Listings</h2>
            <p>All property listings must be accurate and comply with local regulations. False or misleading information may result in account suspension.</p>
            
            <h2>Limitation of Liability</h2>
            <p>In no event shall Aashish Property or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Aashish Property's website.</p>
            
            <h2>Contact Information</h2>
            <p>For questions about these Terms and Conditions, contact us at legal@aashishproperty.com</p>
          </div>
        `,
        metaTitle: "Terms and Conditions - Aashish Property",
        metaDescription:
          "Read the terms and conditions for using Aashish Property platform and services.",
        status: "published",
        type: "terms",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Refund Policy",
        slug: "refund-policy",
        content: `
          <div class="prose prose-lg">
            <h1>Refund Policy</h1>
            <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
            
            <h2>Our Commitment</h2>
            <p>At Aashish Property, we strive to provide excellent service to all our clients. Our refund policy ensures fair treatment and customer satisfaction.</p>
            
            <h2>Service Charges</h2>
            <p>Service charges for property listings and promotional features are generally non-refundable once the service has been rendered.</p>
            
            <h2>Eligibility for Refunds</h2>
            <p>Refunds may be considered in the following circumstances:</p>
            <ul>
              <li>Technical issues preventing service delivery</li>
              <li>Duplicate payments made in error</li>
              <li>Service cancellation within 24 hours of payment</li>
              <li>Failure to provide promised services</li>
            </ul>
            
            <h2>Refund Process</h2>
            <p>To request a refund:</p>
            <ol>
              <li>Contact our support team within 7 days of payment</li>
              <li>Provide transaction details and reason for refund</li>
              <li>Allow 5-10 business days for processing</li>
              <li>Refunds will be processed to the original payment method</li>
            </ol>
            
            <h2>Non-Refundable Items</h2>
            <ul>
              <li>Promotional services already delivered</li>
              <li>Featured listing placements</li>
              <li>Consultation fees for completed sessions</li>
            </ul>
            
            <h2>Contact for Refunds</h2>
            <p>For refund requests, contact our support team at support@aashishproperty.com or call our customer service helpline.</p>
          </div>
        `,
        metaTitle: "Refund Policy - Aashish Property",
        metaDescription:
          "Understanding our refund policy for Aashish Property services and charges.",
        status: "published",
        type: "policy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection("pages").insertMany(defaultPages);

    res.json({
      success: true,
      message: "Default content pages created successfully",
      data: { pagesCreated: defaultPages.length },
    });
  } catch (error) {
    console.error("Error initializing content pages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize content pages",
    });
  }
};

// Get published pages for public access
export const getPublishedPages: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { active } = req.query;

    // Support both 'active=1' and 'status=published' queries
    const filter: any = { status: "published" };
    if (active === "1") {
      filter.status = "published";
    }

    const pages = await db
      .collection("pages")
      .find(filter, {
        projection: { title: 1, slug: 1, type: 1, updatedAt: 1 },
      })
      .sort({ type: 1, title: 1 })
      .toArray();

    const response: ApiResponse<any[]> = {
      success: true,
      data: pages,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching published pages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch published pages",
    });
  }
};

// Track page view (public)
export const trackPageView: RequestHandler = async (req, res) => {
  try {
    const db = getDatabase();
    const { pageId } = req.params;

    // Increment view count
    await db.collection("pages").updateOne(
      { _id: new ObjectId(pageId) },
      {
        $inc: { views: 1 },
        $set: { lastViewed: new Date() },
      },
    );

    res.json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking page view:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track view",
    });
  }
};
