import express from "express";
import cors from "cors";
import "dotenv/config";

import { connectToDatabase, getDatabase } from "./db/mongodb";
import razorpayRoutes from "./routes/razorpay-payments";

import path from "path";
import {
  authenticateToken,
  requireAdmin,
  requireSellerOrAgent,
} from "./middleware/auth";
import { requireBuyer } from "./middleware/auth";
import { ChatSocketServer } from "./socketio";
import reviewsRouter from "./routes/reviews";
import phonepeRoutes from "./routes/phonepe";
import {
  getProperties,
  getPropertyById,
  createProperty,
  getFeaturedProperties,
  getUserProperties,
  getUserNotifications,
  markUserNotificationAsRead,
  deleteUserNotification,
  getPendingProperties,
  // updatePropertyApproval,
  upload,
} from "./routes/properties";

// Category routes (new system)
import {
  getCategories,
  getCategoryBySlug,
  getSubcategoriesByCategory,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  updateCategorySortOrder,
  uploadCategoryIcon,
  handleIconUpload,
} from "./routes/categories-new";

// Subcategory routes (new system)
import {
  getAllSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryActive,
  updateSubcategorySortOrder,
  uploadSubcategoryIcon,
  handleSubcategoryIconUpload,
  getSubcategoriesByCategory as getSubcategoriesByCategoryAdmin,
} from "./routes/subcategories-new";

// Service listings routes
import {
  getServiceListings,
  getAllServiceListings,
  createServiceListing,
  updateServiceListing,
  deleteServiceListing,
  bulkImportServiceListings,
} from "./routes/service-listings";

// Other Services admin routes
import {
  getOsCategories as getAdminOsCategories,
  createOsCategory,
  updateOsCategory,
  deleteOsCategory,
} from "./routes/admin-os-categories";

import {
  getOsSubcategories as getAdminOsSubcategories,
  createOsSubcategory,
  updateOsSubcategory,
  deleteOsSubcategory,
} from "./routes/admin-os-subcategories";

import {
  getOsListings as getAdminOsListings,
  createOsListing,
  updateOsListing,
  deleteOsListing,
  bulkImportOsListings,
} from "./routes/admin-os-listings";

// Other Services public routes
import {
  getOsCategories,
  getOsSubcategories,
  getOsListings,
} from "./routes/os-public";

import osImportRoutes from "./routes/osImport";
import { getPublicSettings } from "./routes/settings-public";
import {
  getWatermarkSettings,
  updateWatermarkSettings,
  uploadWatermarkLogo,
} from "./routes/watermark";
import {
  updateSiteSettings,
  upsertPageBySlug,
  listPagesAdmin,
  deletePageBySlug,
  getSiteSettingsPublic,
  getPublicPageBySlug,
} from "./routes/cms";

// Authentication routes
import {
  registerUser,
  loginUser,
  sendOTP, // (deprecated, but mounted)
  verifyOTP, // (deprecated, but mounted)
  googleAuth,
  getUserProfile,
  updateUserProfile,
  firebaseLogin, // <-- ADD THIS
} from "./routes/auth";

// Admin routes
import {
  getAllUsers,
  getUserStats,
  getUserManagementStats,
  exportUsers,
  updateUserStatus,
  deleteUser,
  bulkDeleteUsers,
  getAllProperties,
  initializeAdmin,
  getAdminCategories,
  createCategory as adminCreateCategory,
  updateCategory as adminUpdateCategory,
  deleteCategory as adminDeleteCategory,
  updateProperty,
  deleteProperty,
  createProperty as adminCreateProperty,
  getPremiumProperties,
  approvePremiumProperty,
  uploadCategoryIcon as adminUploadCategoryIcon,
  getUserAnalytics,
  updatePropertyPromotion,
  updatePropertyApproval,
  createTestProperty,
  debugProperties,
  bulkDeleteProperties,
  bulkUpdatePropertiesStatus,
  bulkUpdatePropertiesApproval,
  getDeletedProperties,
  restoreProperty,
  restoreProperties,
  permanentDeleteProperty,
  permanentDeleteProperties,
} from "./routes/admin";

// Chat routes
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  startPropertyConversation,
  getUnreadCount,
} from "./routes/chat";

// OLX-style conversation routes
import {
  createConversation,
  getMyConversations,
  getConversationMessages as getConversationMessagesNew,
  sendMessageToConversation,
  findOrCreateConversation,
  markConversationRead,
} from "./routes/conversations";

// Admin conversation routes
import {
  getAdminConversations,
  adminReplyToConversation,
  getAdminConversationStats,
  updateConversationStatus,
} from "./routes/admin-conversations";

import { handleDemo } from "./routes/demo";
import { seedDatabase } from "./routes/seed";
import { replyAsOwner } from "./routes/dev-chat";
import { initializeSystem } from "./routes/init";
import {
  getAdminSettings,
  updateAdminSettings,
  getPhonePeConfig,
  updatePhonePeConfig,
} from "./routes/admin-settings";
import {
  phonePeCallback,
  phonePePaymentCallback,
  getPhonePePaymentStatus,
  createPhonePeTransaction,
  getPaymentMethodsWithPhonePe,
} from "./routes/phonepe-payments";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPaymentStatus,
} from "./routes/razorpay-payments";
import {
  testPhonePeConfig,
  testPaymentMethods,
  testDatabaseConnection,
} from "./routes/test-phonepe";
import {
  sendEmailVerification,
  verifyEmail,
  resendEmailVerification,
} from "./routes/email-verification";

// Package routes
import {
  getAdPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  initializePackages,
} from "./routes/packages";

// Payment routes
import {
  createTransaction,
  getUserTransactions,
  getAllTransactions,
  updateTransactionStatus,
  verifyPayment,
  getPaymentMethods,
} from "./routes/payments";

// Coupon routes
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  recordCouponUsage,
} from "./routes/coupons";

// Banner routes
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  handleImageUpload,
  initializeBanners,
} from "./routes/banners";

// New Projects routes
import {
  getNewProjects,
  createNewProject,
  updateNewProject,
  deleteNewProject,
  getNewProjectBanners,
  createNewProjectBanner,
  updateNewProjectBanner,
  deleteNewProjectBanner,
  getPublicNewProjects,
  getPublicNewProjectBanners,
  initializeNewProjects,
} from "./routes/new-projects";

// Area Maps routes
import {
  getPublicAreaMaps,
  getAllAreaMaps,
  createAreaMap,
  updateAreaMap,
  deleteAreaMap,
  uploadMapImage,
  handleMapImageUpload,
  initializeAreaMaps,
} from "./routes/maps";

// Analytics routes
import {
  trackPropertyView,
  trackPropertyInquiry,
  trackPhoneClick,
  getPropertyAnalytics,
  getSellerAnalytics,
  getAdminAnalytics,
} from "./routes/analytics";

// App routes
import {
  getAppInfo,
  downloadAPK,
  uploadAPK,
  getDownloadStats,
} from "./routes/app";

// Testimonials routes
import {
  getAllTestimonials,
  getPublicTestimonials,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
  initializeTestimonials,
} from "./routes/testimonials";

// FAQ routes
import {
  getAllFAQs,
  getPublicFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  initializeFAQs,
} from "./routes/faqs";

// Blog routes
import {
  getAllBlogPosts,
  getPublicBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getSellerBlogPosts,
  createSellerBlogPost,
  updateSellerBlogPost,
  deleteSellerBlogPost,
} from "./routes/blog";

// Reports routes
import {
  getAllReportReasons,
  getPublicReportReasons,
  createReportReason,
  updateReportReason,
  deleteReportReason,
  getAllUserReports,
  createUserReport,
  updateUserReportStatus,
  initializeReportReasons,
} from "./routes/reports";

// User Packages routes
import {
  getAllUserPackages,
  getUserPackages,
  createUserPackage,
  updateUserPackageStatus,
  updatePackageUsage,
  cancelUserPackage,
  getPackageStats,
} from "./routes/user-packages";

// Content Management routes
import {
  getAllContentPages,
  getContentPageBySlug,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  initializeContentPages,
  getPublishedPages,
  trackPageView,
} from "./routes/content";

// Homepage slider routes
// import {
//   getHomepageSliders,
//   getAdminHomepageSliders,
//   createHomepageSlider,
//   updateHomepageSlider,
//   deleteHomepageSlider,
//   initializeHomepageSliders,
// } from "./routes/homepage-sliders";

// Database test routes
import {
  testDatabase,
  testAdminUser,
  testAdminStats,
} from "./routes/database-test";

// Admin fix routes
import {
  forceCreateAdmin,
  fixAdminEndpoints,
  initializeSystemData,
} from "./routes/fix-admin";

// Staff management routes
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  updateStaffPassword,
  getRolesAndPermissions,
  getAvailablePermissions,
} from "./routes/staff";

// Notification management routes
import {
  getAllNotifications,
  sendNotification,
  getUsers,
  getNotificationById,
  deleteNotification,
} from "./routes/notifications";
import { getUnreadNotificationsCount } from "./routes/notifications-unread";
import { subscribeToTopic } from "./routes/notifications-subscribe";
import { requestEmailOtp, verifyEmailOtp } from "./routes/email-otp";

// Homepage slider routes
import {
  getHomepageSliders,
  getActiveHomepageSliders,
  createHomepageSlider,
  updateHomepageSlider,
  toggleSliderStatus,
  deleteHomepageSlider,
  initializeDefaultSlider,
  //  initializeHomepageSliders
} from "./routes/homepage-slider";

// Bank transfer routes
import {
  getAllBankTransfers,
  createBankTransfer,
  updateBankTransferStatus,
  getBankTransferById,
  getUserBankTransfers,
  deleteBankTransfer,
  getBankTransferStats,
} from "./routes/bank-transfers";

// Test data utilities
import { addBankTransferTestData } from "./scripts/addBankTransferTestData";

// Seller dashboard routes
import {
  getSellerProperties,
  getSellerNotifications,
  markNotificationAsRead,
  deleteSellerNotification,
  getSellerMessages,
  sendSellerMessage,
  getSellerPackages,
  getSellerPayments,
  updateSellerProfile,
  changeSellerPassword,
  purchasePackage,
  getSellerStats,
  deleteSellerProperty,
  resubmitSellerProperty,
} from "./routes/seller";

// Chatbot routes
import {
  sendChatbotMessage,
  getAdminChatConversations,
  getAdminChatMessages,
  sendAdminMessage,
  deleteChatConversation,
  getChatStatistics,
} from "./routes/chatbot";

// Sample data routes (for testing)
import {
  createSampleTransactions,
  clearAllTransactions,
} from "./routes/sample-transactions";
import { seedChatData } from "./routes/dev-chat";

// Footer management routes
import {
  getAllFooterLinks,
  getActiveFooterLinks,
  createFooterLink,
  updateFooterLink,
  deleteFooterLink,
  getFooterSettings,
  updateFooterSettings,
  initializeFooterData,
} from "./routes/footer";
import { testFooterData } from "./routes/footerTest";

// Custom fields routes
import {
  getAllCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  updateCustomFieldStatus,
  getCustomFieldById,
  getActiveCustomFields,
} from "./routes/custom-fields";

// Subcategories routes
import {
  getSubcategories,
  getSubcategoriesWithCounts,
} from "./routes/subcategories";

// Favorites routes
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
} from "./routes/favorites";

// Tickets (support) routes
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  getTicketMessages,
  addTicketMessage,
  updateTicketStatus,
} from "./routes/tickets";

// Enquiries routes
import {
  submitEnquiry,
  getEnquiries,
  updateEnquiryStatus,
} from "./routes/enquiries";

// Other Services routes
import {
  getAllOtherServices,
  getPublicOtherServices,
  createOtherService,
  updateOtherService,
  deleteOtherService,
  importOtherServices,
  exportOtherServices,
  getServiceCategories,
} from "./routes/other-services";

let socketServer: ChatSocketServer;

export function createServer() {
  const app = express();

  const allowedOrigins = [
    "https://ashishproperties.in",
    "http://localhost:5173",
    "http://localhost:5000",
    "https://localhost:5000",
    "http://127.0.0.1:5000",
    "https://127.0.0.1:5000",
  ];

  const allowedOriginPatterns = [
    /^(https?:\/\/)?([a-z0-9-]+\.)*localhost(:\d+)?$/i,
    /^(https?:\/\/)?127\.0\.0\.1(:\d+)?$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*replit\.dev$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*pike\.replit\.dev$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*fly\.dev(\.projects\.builder\.codes)?$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*projects\.builder\.codes$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*builder\.codes$/i,
    /^(https?:\/\/)?([a-z0-9-]+\.)*netlify\.app$/i,
    /^https?:\/\/aashish\.posttrr\.com$/i,
    /^http?:\/\/aashish\.posttrr\.com$/i,
    // Allow the dutiful-soliloquy domain and any subdomain
    /^(https?:\/\/)?([a-z0-9-]+\.)*dutiful-soliloquy\.net$/i,
    // Allow Builder preview domains like vast-reconsideration.com
    /^(https?:\/\/)?[a-z0-9-]+-reconsideration\.com$/i,
  ];

  // Allow configuring additional origins via env and provide an escape hatch for staging/demo deployments
  const envAllowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const allowAllOrigins = process.env.CORS_ALLOW_ALL === "true";

  app.use(
    cors({
      origin: function (origin, callback) {
        // Non-browser requests like curl will not send origin
        if (!origin) return callback(null, true);

        // If allow-all is enabled (useful for staging/demo), allow and log a warning
        if (allowAllOrigins) {
          console.warn(
            "⚠️ CORS_ALLOW_ALL=true - allowing request from:",
            origin,
          );
          return callback(null, true);
        }

        // Merge built-in allowed origins with environment-provided ones
        const combinedAllowed = [...allowedOrigins, ...envAllowedOrigins];

        // Allow listed exact origins
        if (combinedAllowed.includes(origin)) {
          console.log("✅ CORS allowed (exact):", origin);
          return callback(null, true);
        }

        // Allow pattern-based origins (covers dynamic Fly.dev and Builder preview URLs) in all environments
        if (allowedOriginPatterns.some((re) => re.test(origin))) {
          console.log("✅ CORS allowed (pattern):", origin);
          return callback(null, true);
        }

        console.log("❌ CORS blocked:", origin);
        return callback(
          new Error(`CORS policy violation: Origin ${origin} not allowed`),
        );
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
      ],
    }),
  );

  app.use(express.json({ limit: "1gb" }));
  app.use(express.urlencoded({ extended: true, limit: "1gb" }));

  // Mount CSV import routes under protected admin path
  app.use("/api/admin", authenticateToken, requireAdmin, osImportRoutes);
app.use("/api/payments/phonepe", phonepeRoutes);
  // Initialize MongoDB connection
  connectToDatabase()
    .then(async () => {
      console.log("✅ MongoDB Atlas connected successfully");
      try {
        // Attempt to seed default data if collections are empty (idempotent)
        const initModule = await import("./routes/init");
        if (initModule && typeof initModule.seedDefaultData === "function") {
          const seedResult = await initModule.seedDefaultData();
          console.log("🔧 seedDefaultData result:", seedResult);
        }
        // Seed Area Maps defaults as well (idempotent)
        try {
          const mapsModule = await import("./routes/maps");
          if (
            mapsModule &&
            typeof mapsModule.seedDefaultAreaMaps === "function"
          ) {
            const out = await mapsModule.seedDefaultAreaMaps();
            console.log("🗺️ seedDefaultAreaMaps:", out);
          }
        } catch (merr) {
          console.warn(
            "⚠️ seedDefaultAreaMaps skipped:",
            (merr as any)?.message || merr,
          );
        }
      } catch (e: any) {
        console.warn("⚠️ seedDefaultData failed:", e?.message || e);
      }
    })
    .catch((error) => {
      console.error("�� MongoDB connection failed:", error);
      console.log("Server will continue with limited functionality");
    });

  // Serve uploaded files (maps, properties, etc.)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/payments/razorpay", requireBuyer, razorpayRoutes);

  // Health check with database status and CORS info
  app.get("/api/ping", async (req, res) => {
    const startTime = Date.now();

    try {
      // Try to get database connection
      let db;
      let dbStatus = "unknown";
      let dbError = null;

      try {
        db = getDatabase();
        // Test the connection
        await db.admin().ping();
        dbStatus = "connected";
      } catch (error: any) {
        dbError = error.message;
        try {
          // If database not initialized, try to connect
          console.log("🔄 Database not initialized, attempting connection...");
          const connection = await connectToDatabase();
          db = connection.db;
          await db.admin().ping();
          dbStatus = "connected";
        } catch (connectError: any) {
          dbStatus = "failed";
          dbError = connectError.message;
        }
      }

      const responseTime = Date.now() - startTime;

      const response = {
        message: "pong",
        status: "healthy",
        server: {
          environment: process.env.NODE_ENV || "unknown",
          port: process.env.PORT || 3000,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          responseTime: `${responseTime}ms`,
        },
        database: {
          status: dbStatus,
          name: db?.databaseName || "unknown",
          error: dbError,
        },
        request: {
          headers: {
            host: req.get("host"),
            "user-agent": req.get("user-agent")?.substring(0, 100),
            origin: req.get("origin"),
            referer: req.get("referer"),
          },
          ip: req.ip || req.connection.remoteAddress,
          method: req.method,
          url: req.url,
        },
        cors: {
          allowedOrigins,
          requestOrigin: req.get("origin"),
          isOriginAllowed:
            !req.get("origin") ||
            allowedOrigins.includes(req.get("origin") || ""),
        },
        timestamp: new Date().toISOString(),
      };

      if (dbStatus === "connected") {
        res.json(response);
      } else {
        res.status(503).json(response);
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error("❌ Health check failed:", error.message);

      res.status(500).json({
        message: "pong",
        status: "unhealthy",
        error: error.message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Database seeding (development only)
  app.post("/api/seed", seedDatabase);

  // System initialization
  app.post("/api/init", initializeSystem);

  // Authentication routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.post("/api/auth/send-otp", sendOTP);
  app.post("/api/auth/verify-otp", verifyOTP);
  app.post("/api/auth/google", googleAuth);
  app.get("/api/auth/profile", authenticateToken, getUserProfile);
  app.put("/api/auth/profile", authenticateToken, updateUserProfile);
  app.post("/api/auth/firebase-login", firebaseLogin); // ✅ ADD THIS LINE

  // Email verification routes
  app.post("/api/auth/send-verification", sendEmailVerification);
  app.get("/api/auth/verify-email", verifyEmail);
  app.post(
    "/api/auth/resend-verification",
    authenticateToken,
    resendEmailVerification,
  );

  // Email OTP auth routes (separate from phone OTP to avoid path conflicts)
  app.post("/api/auth/email/request-otp", requestEmailOtp);
  app.post("/api/auth/email/verify-otp", verifyEmailOtp);

  // Property routes
  app.get("/api/properties", getProperties);
  app.get("/api/properties/featured", getFeaturedProperties);
  app.get("/api/properties/:id", getPropertyById);
  app.post(
    "/api/properties",
    authenticateToken,
    upload.array("images", 10),
    createProperty,
  );
  app.use("/api/reviews", reviewsRouter);

  // User property management routes
  app.get("/api/user/properties", authenticateToken, getUserProperties);

  // User notification routes
  app.get("/api/user/notifications", authenticateToken, getUserNotifications);
  app.put(
    "/api/user/notifications/:notificationId/read",
    authenticateToken,
    markUserNotificationAsRead,
  );
  app.delete(
    "/api/user/notifications/:notificationId",
    authenticateToken,
    deleteUserNotification,
  );

  // FCM topic subscribe (optional, requires Firebase admin env)
  app.post("/api/notifications/subscribe", subscribeToTopic);
  app.get(
    "/api/notifications/unread-count",
    authenticateToken,
    getUnreadNotificationsCount,
  );

  // Dynamic ads.txt (configured via env ADSENSE_PUB_ID)
  app.get("/ads.txt", (req, res) => {
    const pub = process.env.ADSENSE_PUB_ID;
    if (!pub) return res.status(404).send("");
    res.type("text/plain").send(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  });

  // Admin property approval routes
  app.get(
    "/api/admin/properties/pending",
    authenticateToken,
    requireAdmin,
    getPendingProperties,
  );
  app.put(
    "/api/admin/properties/:propertyId/approval",
    authenticateToken,
    requireAdmin,
    updatePropertyApproval,
  );

  // PUBLIC Category routes
  app.get("/api/categories", getCategories); // ?active=true&withSub=true
  app.get("/api/categories/:slug", getCategoryBySlug);
  app.get(
    "/api/categories/:categorySlug/subcategories",
    getSubcategoriesByCategory,
  );

  // ADMIN Category routes
  app.get(
    "/api/admin/categories",
    authenticateToken,
    requireAdmin,
    getAllCategories,
  );
  app.post(
    "/api/admin/categories",
    authenticateToken,
    requireAdmin,
    createCategory,
  );
  app.put(
    "/api/admin/categories/:id",
    authenticateToken,
    requireAdmin,
    updateCategory,
  );
  app.delete(
    "/api/admin/categories/:id",
    authenticateToken,
    requireAdmin,
    deleteCategory,
  );
  app.put(
    "/api/admin/categories/:id/toggle",
    authenticateToken,
    requireAdmin,
    toggleCategoryActive,
  );
  app.put(
    "/api/admin/categories/sort-order",
    authenticateToken,
    requireAdmin,
    updateCategorySortOrder,
  );
  app.post(
    "/api/admin/categories/upload-icon",
    authenticateToken,
    requireAdmin,
    uploadCategoryIcon,
    handleIconUpload,
  );

  // ADMIN Subcategory routes
  app.get(
    "/api/admin/subcategories",
    authenticateToken,
    requireAdmin,
    getAllSubcategories,
  );
  app.get(
    "/api/admin/subcategories/by-category/:categoryId",
    authenticateToken,
    requireAdmin,
    getSubcategoriesByCategoryAdmin,
  );
  app.post(
    "/api/admin/subcategories",
    authenticateToken,
    requireAdmin,
    createSubcategory,
  );
  app.put(
    "/api/admin/subcategories/:id",
    authenticateToken,
    requireAdmin,
    updateSubcategory,
  );
  app.delete(
    "/api/admin/subcategories/:id",
    authenticateToken,
    requireAdmin,
    deleteSubcategory,
  );
  app.put(
    "/api/admin/subcategories/:id/toggle",
    authenticateToken,
    requireAdmin,
    toggleSubcategoryActive,
  );
  app.put(
    "/api/admin/subcategories/sort-order",
    authenticateToken,
    requireAdmin,
    updateSubcategorySortOrder,
  );
  app.post(
    "/api/admin/subcategories/upload-icon",
    authenticateToken,
    requireAdmin,
    uploadSubcategoryIcon,
    handleSubcategoryIconUpload,
  );

  // Service listings routes (public)
  app.get("/api/other-services/listings", getServiceListings);

  // Admin service listings routes
  app.get(
    "/api/admin/service-listings",
    authenticateToken,
    requireAdmin,
    getAllServiceListings,
  );
  app.post(
    "/api/admin/service-listings",
    authenticateToken,
    requireAdmin,
    createServiceListing,
  );
  app.put(
    "/api/admin/service-listings/:listingId",
    authenticateToken,
    requireAdmin,
    updateServiceListing,
  );
  app.delete(
    "/api/admin/service-listings/:listingId",
    authenticateToken,
    requireAdmin,
    deleteServiceListing,
  );
  app.post(
    "/api/admin/os-listings/import",
    authenticateToken,
    requireAdmin,
    upload.single("file"),
    bulkImportServiceListings,
  );

  // Homepage slider routes
  // app.get("/api/homepage-sliders", getHomepageSliders);
  // app.post("/api/homepage-sliders/initialize", initializeHomepageSliders);
  app.get(
    "/api/admin/homepage-sliders",
    authenticateToken,
    requireAdmin,
    // getAdminHomepageSliders,
  );
  app.post(
    "/api/admin/homepage-sliders",
    authenticateToken,
    requireAdmin,
    createHomepageSlider,
  );
  app.put(
    "/api/admin/homepage-sliders/:sliderId",
    authenticateToken,
    requireAdmin,
    updateHomepageSlider,
  );
  app.delete(
    "/api/admin/homepage-sliders/:sliderId",
    authenticateToken,
    requireAdmin,
    deleteHomepageSlider,
  );

  // Admin routes
  app.get("/api/admin/users", authenticateToken, requireAdmin, getAllUsers);
  app.get("/api/admin/stats", authenticateToken, requireAdmin, getUserStats);

  // Admin settings routes
  app.get(
    "/api/admin/settings",
    authenticateToken,
    requireAdmin,
    getAdminSettings,
  );
  app.put(
    "/api/admin/settings",
    authenticateToken,
    requireAdmin,
    updateAdminSettings,
  );
  app.get(
    "/api/admin/settings/phonepe",
    authenticateToken,
    requireAdmin,
    getPhonePeConfig,
  );
  app.put(
    "/api/admin/settings/phonepe",
    authenticateToken,
    requireAdmin,
    updatePhonePeConfig,
  );

  // AdSense config routes
  app.get("/api/adsense/config", async (req, res) => {
    try {
      const db = getDatabase();
      const settings = await db.collection("admin_settings").findOne({});
      const adsense = settings?.adsense ?? {
        enabled: false,
        clientId: "",
        slots: {},
        disabledRoutes: [],
        testMode: true,
      };
      res.json({ success: true, data: adsense });
    } catch (e) {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch AdSense config" });
    }
  });
  app.put(
    "/api/admin/settings/adsense",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const db = getDatabase();
        const {
          enabled,
          clientId,
          slots = {},
          disabledRoutes = [],
          testMode = false,
        } = req.body || {};
        await db.collection("admin_settings").updateOne(
          {},
          {
            $set: {
              adsense: {
                enabled: !!enabled,
                clientId: clientId || "",
                slots,
                disabledRoutes,
                testMode: !!testMode,
              },
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );
        res.json({
          success: true,
          data: { message: "AdSense settings updated" },
        });
      } catch (e) {
        res
          .status(500)
          .json({ success: false, error: "Failed to update AdSense config" });
      }
    },
  );
  app.get(
    "/api/admin/user-stats",
    authenticateToken,
    requireAdmin,
    getUserManagementStats,
  );
  app.get(
    "/api/admin/user-analytics",
    authenticateToken,
    requireAdmin,
    getUserAnalytics,
  );
  app.get(
    "/api/admin/users/export",
    authenticateToken,
    requireAdmin,
    exportUsers,
  );
  app.put(
    "/api/admin/users/:userId/status",
    authenticateToken,
    requireAdmin,
    updateUserStatus,
  );
  app.patch(
    "/api/admin/users/:userId/status",
    authenticateToken,
    requireAdmin,
    updateUserStatus,
  );
  app.delete(
    "/api/admin/users/:userId",
    authenticateToken,
    requireAdmin,
    deleteUser,
  );
  app.post(
    "/api/admin/users/bulk-delete",
    authenticateToken,
    requireAdmin,
    bulkDeleteUsers,
  );
  app.get(
    "/api/admin/properties",
    authenticateToken,
    requireAdmin,
    getAllProperties,
  );
  app.post(
    "/api/admin/properties",
    authenticateToken,
    requireAdmin,
    upload.array("images", 10),
    adminCreateProperty,
  );
  app.put(
    "/api/admin/properties/:propertyId",
    authenticateToken,
    requireAdmin,
    upload.array("images", 10),
    updateProperty,
  );
  app.delete(
    "/api/admin/properties/:propertyId",
    authenticateToken,
    requireAdmin,
    deleteProperty,
  );
  app.delete(
    "/api/admin/properties/bulk",
    authenticateToken,
    requireAdmin,
    bulkDeleteProperties,
  );
  app.put(
    "/api/admin/properties/bulk/status",
    authenticateToken,
    requireAdmin,
    bulkUpdatePropertiesStatus,
  );
  app.put(
    "/api/admin/properties/bulk/approval",
    authenticateToken,
    requireAdmin,
    bulkUpdatePropertiesApproval,
  );
  app.get(
    "/api/admin/properties/deleted",
    authenticateToken,
    requireAdmin,
    getDeletedProperties,
  );
  app.put(
    "/api/admin/properties/:propertyId/restore",
    authenticateToken,
    requireAdmin,
    restoreProperty,
  );
  app.put(
    "/api/admin/properties/bulk/restore",
    authenticateToken,
    requireAdmin,
    restoreProperties,
  );
  app.delete(
    "/api/admin/properties/:propertyId/permanent",
    authenticateToken,
    requireAdmin,
    permanentDeleteProperty,
  );
  app.delete(
    "/api/admin/properties/bulk/permanent",
    authenticateToken,
    requireAdmin,
    permanentDeleteProperties,
  );
  app.get(
    "/api/admin/premium-properties",
    authenticateToken,
    requireAdmin,
    getPremiumProperties,
  );
  app.put(
    "/api/admin/premium-properties/:propertyId/approval",
    authenticateToken,
    requireAdmin,
    approvePremiumProperty,
  );
  app.put(
    "/api/admin/properties/:propertyId/promotion",
    authenticateToken,
    requireAdmin,
    updatePropertyPromotion,
  );

  app.post("/api/admin/initialize", initializeAdmin);
  
  // Watermark settings routes (protected)
  app.get("/api/admin/watermark-settings", authenticateToken, requireAdmin, getWatermarkSettings);
  app.post("/api/admin/watermark-settings", authenticateToken, requireAdmin, updateWatermarkSettings);
  app.post("/api/admin/watermark-logo", authenticateToken, requireAdmin, ...uploadWatermarkLogo);
  
  // Public watermark settings (read-only, for display)
  app.get("/api/watermark-settings", getWatermarkSettings);
  
  app.post(
    "/api/admin/test-property",
    authenticateToken,
    requireAdmin,
    createTestProperty,
  );
  app.post("/api/create-test-properties", createTestProperty); // Temporary endpoint without auth for testing
  app.post("/api/seed-db", seedDatabase); // Temporary endpoint to seed database
  app.get("/api/debug-properties", debugProperties); // Debug endpoint to check properties
  app.put("/api/test-property-approval/:propertyId", async (req, res) => {
    try {
      console.log("🧪 TEST: Property approval request received:");
      console.log("📋 URL path:", req.path);
      console.log("📋 Route params:", req.params);
      console.log("📋 Property ID:", req.params.propertyId);
      console.log("📋 Request body:", req.body);

      res.json({
        success: true,
        receivedPropertyId: req.params.propertyId,
        receivedBody: req.body,
        message: "Test endpoint working",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }); // Test endpoint for property approval

  // Package routes
  app.get("/api/packages", getAdPackages);
  app.get("/api/packages/:packageId", getPackageById);
  app.post("/api/packages", authenticateToken, requireAdmin, createPackage);
  app.put(
    "/api/packages/:packageId",
    authenticateToken,
    requireAdmin,
    updatePackage,
  );
  app.delete(
    "/api/packages/:packageId",
    authenticateToken,
    requireAdmin,
    deletePackage,
  );
  app.post("/api/packages/initialize", initializePackages);

  // Plans route (alias for packages as requested by user)
  app.get("/api/plans", getAdPackages);

  // Coupon routes
  app.get("/api/admin/coupons", authenticateToken, requireAdmin, getAllCoupons);
  app.post("/api/admin/coupons", authenticateToken, requireAdmin, createCoupon);
  app.put("/api/admin/coupons/:id", authenticateToken, requireAdmin, updateCoupon);
  app.delete("/api/admin/coupons/:id", authenticateToken, requireAdmin, deleteCoupon);
  app.post("/api/coupons/validate", authenticateToken, validateCoupon);
  app.post("/api/coupons/record-usage", authenticateToken, recordCouponUsage);

  // Payment routes
  // ===================== Payments (generic) =====================
  // Payments (generic)
  app.post("/api/payments/transaction", authenticateToken, createTransaction);
  app.get("/api/payments/transactions", authenticateToken, getUserTransactions);
  app.get(
    "/api/admin/transactions",
    authenticateToken,
    requireAdmin,
    getAllTransactions,
  );
  app.put(
    "/api/admin/transactions/:transactionId",
    authenticateToken,
    requireAdmin,
    updateTransactionStatus,
  );
  app.put(
    "/api/admin/transactions/:transactionId/status",
    authenticateToken,
    requireAdmin,
    updateTransactionStatus,
  );
  app.post("/api/payments/verify", verifyPayment);

  // Payment methods (PhonePe flags)
  app.get("/api/payments/methods", getPaymentMethodsWithPhonePe);

  // --- PhonePe ---
  app.post(
    "/api/payments/phonepe/create",
    authenticateToken,
    createPhonePeTransaction,
  );
  app.post("/api/payments/phonepe/callback", phonePeCallback);
  // Browser redirect after PhonePe payment (handles POST from PhonePe)
  app.post("/payment-callback", phonePePaymentCallback);
  app.get("/payment-callback", phonePePaymentCallback);
  // NOTE: controller param name `merchantTransactionId` hai, to yahi use karo:
  app.get(
    "/api/payments/phonepe/status/:merchantTransactionId",
    getPhonePePaymentStatus,
  );

  // (optional) legacy alias agar kahin /transaction use ho raha ho:
  app.post(
    "/api/payments/phonepe/transaction",
    authenticateToken,
    createPhonePeTransaction,
  );

  // --- Razorpay ---
  app.post(
    "/api/payments/razorpay/create",
    authenticateToken,
    createRazorpayOrder,
  );
  app.post(
    "/api/payments/razorpay/verify",
    authenticateToken,
    verifyRazorpayPayment,
  );
  app.get(
    "/api/payments/razorpay/status/:orderId",
    authenticateToken,
    getRazorpayPaymentStatus,
  );

  // Test endpoints for debugging
  app.get(
    "/api/test/phonepe-config",
    authenticateToken,
    requireAdmin,
    testPhonePeConfig,
  );
  app.get("/api/test/payment-methods", testPaymentMethods);
  app.get("/api/test/database", testDatabaseConnection);

  // Banner routes
  app.get("/api/banners", getActiveBanners);
  app.get("/api/admin/banners", authenticateToken, requireAdmin, getAllBanners);
  app.post("/api/admin/banners", authenticateToken, requireAdmin, createBanner);
  app.put(
    "/api/admin/banners/:id",
    authenticateToken,
    requireAdmin,
    updateBanner,
  );
  app.delete(
    "/api/admin/banners/:id",
    authenticateToken,
    requireAdmin,
    deleteBanner,
  );
  app.post(
    "/api/admin/banners/upload",
    authenticateToken,
    requireAdmin,
    uploadBannerImage,
    handleImageUpload,
  );
  app.post("/api/banners/initialize", initializeBanners);

  // Analytics routes
  app.post("/api/analytics/view/:propertyId", trackPropertyView);
  app.post(
    "/api/analytics/inquiry/:propertyId",
    authenticateToken,
    trackPropertyInquiry,
  );
  app.post("/api/analytics/phone/:propertyId", trackPhoneClick);
  app.get(
    "/api/analytics/property/:propertyId",
    authenticateToken,
    getPropertyAnalytics,
  );
  app.get("/api/analytics/seller", authenticateToken, getSellerAnalytics);
  app.get(
    "/api/admin/analytics",
    authenticateToken,
    requireAdmin,
    getAdminAnalytics,
  );

  // Other Services - Public APIs
  app.get("/api/os/categories", getOsCategories);
  app.get("/api/os/subcategories", getOsSubcategories);
  app.get("/api/os/listings", getOsListings);

  // Other Services - Admin APIs
  app.get(
    "/api/admin/os-categories",
    authenticateToken,
    requireAdmin,
    getAdminOsCategories,
  );
  app.post(
    "/api/admin/os-categories",
    authenticateToken,
    requireAdmin,
    createOsCategory,
  );
  app.put(
    "/api/admin/os-categories/:categoryId",
    authenticateToken,
    requireAdmin,
    updateOsCategory,
  );
  app.delete(
    "/api/admin/os-categories/:categoryId",
    authenticateToken,
    requireAdmin,
    deleteOsCategory,
  );

  app.get(
    "/api/admin/os-subcategories",
    authenticateToken,
    requireAdmin,
    getAdminOsSubcategories,
  );
  app.post(
    "/api/admin/os-subcategories",
    authenticateToken,
    requireAdmin,
    createOsSubcategory,
  );
  app.put(
    "/api/admin/os-subcategories/:subcategoryId",
    authenticateToken,
    requireAdmin,
    updateOsSubcategory,
  );
  app.delete(
    "/api/admin/os-subcategories/:subcategoryId",
    authenticateToken,
    requireAdmin,
    deleteOsSubcategory,
  );

  app.get(
    "/api/admin/os-listings",
    authenticateToken,
    requireAdmin,
    getAdminOsListings,
  );
  app.post(
    "/api/admin/os-listings",
    authenticateToken,
    requireAdmin,
    createOsListing,
  );
  app.put(
    "/api/admin/os-listings/:listingId",
    authenticateToken,
    requireAdmin,
    updateOsListing,
  );
  app.delete(
    "/api/admin/os-listings/:listingId",
    authenticateToken,
    requireAdmin,
    deleteOsListing,
  );

  // Test route for Other Services
  app.post("/api/test/other-services", async (req, res) => {
    try {
      const { createTestData } = await import("./scripts/test-other-services");
      const result = await createTestData();
      res.json({
        success: result,
        message: result
          ? "Test data created successfully"
          : "Failed to create test data",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // App routes
  app.get("/api/app/info", getAppInfo);
  app.get("/api/app/download", downloadAPK);
  app.post("/api/admin/app/upload", authenticateToken, requireAdmin, uploadAPK);
  app.get(
    "/api/admin/app/stats",
    authenticateToken,
    requireAdmin,
    getDownloadStats,
  );

  // Chat routes
  app.get("/api/chat/conversations", authenticateToken, getUserConversations);
  app.get(
    "/api/chat/conversations/:conversationId/messages",
    authenticateToken,
    getConversationMessages,
  );
  app.post("/api/chat/messages", authenticateToken, sendMessage);
  app.post(
    "/api/chat/start-property-conversation",
    authenticateToken,
    startPropertyConversation,
  );
  app.get("/api/chat/unread-count", authenticateToken, getUnreadCount);

  // OLX-style Conversation routes
  app.post("/api/conversations", authenticateToken, createConversation); // supports create-or-get by propertyId
  app.post(
    "/api/conversations/find-or-create",
    authenticateToken,
    findOrCreateConversation,
  );
  app.get("/api/conversations", authenticateToken, getMyConversations); // alias
  app.get("/api/conversations/my", authenticateToken, getMyConversations);
  app.get(
    "/api/conversations/:id/messages",
    authenticateToken,
    getConversationMessagesNew,
  );
  app.post(
    "/api/conversations/:id/messages",
    authenticateToken,
    sendMessageToConversation,
  );
  app.post(
    "/api/conversations/:id/read",
    authenticateToken,
    markConversationRead,
  );

  // Admin conversation routes (Support Inbox)
  app.get(
    "/api/admin/conversations",
    authenticateToken,
    requireAdmin,
    getAdminConversations,
  );

  // Sitemap XML
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const db = getDatabase();
      const base = `${req.protocol}://${req.get("host")}`;
      const urls: string[] = [
        "/",
        "/blog",
        "/categories",
        "/properties",
        "/contact-us",
        "/about-us",
      ];
      const posts = await db
        .collection("blog_posts")
        .find(
          { status: "published" },
          { projection: { slug: 1, updatedAt: 1 } },
        )
        .toArray();
      const now = new Date().toISOString();
      const xmlParts: string[] = [];
      xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
      xmlParts.push(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      );
      urls.forEach((u) => {
        xmlParts.push("<url>");
        xmlParts.push(`<loc>${base}${u}</loc>`);
        xmlParts.push(`<lastmod>${now}</lastmod>`);
        xmlParts.push("<changefreq>daily</changefreq>");
        xmlParts.push("<priority>0.8</priority>");
        xmlParts.push("</url>");
      });
      posts.forEach((p: any) => {
        xmlParts.push("<url>");
        xmlParts.push(`<loc>${base}/blog/${p.slug}</loc>`);
        xmlParts.push(
          `<lastmod>${(p.updatedAt || new Date()).toISOString?.() || now}</lastmod>`,
        );
        xmlParts.push("<changefreq>weekly</changefreq>");
        xmlParts.push("<priority>0.6</priority>");
        xmlParts.push("</url>");
      });
      xmlParts.push("</urlset>");
      res.type("application/xml").send(xmlParts.join(""));
    } catch (e) {
      res.status(500).send("");
    }
  });
  app.post(
    "/api/admin/conversations/:id/messages",
    authenticateToken,
    requireAdmin,
    adminReplyToConversation,
  );
  app.get(
    "/api/admin/conversations/stats",
    authenticateToken,
    requireAdmin,
    getAdminConversationStats,
  );
  app.put(
    "/api/admin/conversations/:id/status",
    authenticateToken,
    requireAdmin,
    updateConversationStatus,
  );

  // Testimonials routes
  app.get("/api/testimonials", getPublicTestimonials);
  app.get(
    "/api/admin/testimonials",
    authenticateToken,
    requireAdmin,
    getAllTestimonials,
  );
  app.post("/api/testimonials", authenticateToken, createTestimonial);
  app.put(
    "/api/admin/testimonials/:testimonialId",
    authenticateToken,
    requireAdmin,
    updateTestimonialStatus,
  );
  app.delete(
    "/api/admin/testimonials/:testimonialId",
    authenticateToken,
    requireAdmin,
    deleteTestimonial,
  );
  app.post(
    "/api/admin/testimonials/initialize",
    authenticateToken,
    requireAdmin,
    initializeTestimonials,
  );

  // FAQ routes
  app.get("/api/faqs", getPublicFAQs);
  app.get("/api/admin/faqs", authenticateToken, requireAdmin, getAllFAQs);
  app.post("/api/admin/faqs", authenticateToken, requireAdmin, createFAQ);
  app.put("/api/admin/faqs/:faqId", authenticateToken, requireAdmin, updateFAQ);
  app.delete(
    "/api/admin/faqs/:faqId",
    authenticateToken,
    requireAdmin,
    deleteFAQ,
  );
  app.post("/api/faqs/initialize", initializeFAQs);

  // Blog routes
  app.get("/api/blog", getPublicBlogPosts);
  app.get("/api/blog/:slug", getBlogPostBySlug);
  // Seller blog
  app.get(
    "/api/seller/blog",
    authenticateToken,
    requireSellerOrAgent,
    getSellerBlogPosts,
  );
  app.post(
    "/api/seller/blog",
    authenticateToken,
    requireSellerOrAgent,
    createSellerBlogPost,
  );
  app.put(
    "/api/seller/blog/:postId",
    authenticateToken,
    requireSellerOrAgent,
    updateSellerBlogPost,
  );
  app.delete(
    "/api/seller/blog/:postId",
    authenticateToken,
    requireSellerOrAgent,
    deleteSellerBlogPost,
  );
  // Admin blog
  app.get("/api/admin/blog", authenticateToken, requireAdmin, getAllBlogPosts);
  app.post("/api/admin/blog", authenticateToken, requireAdmin, createBlogPost);
  app.put(
    "/api/admin/blog/:postId",
    authenticateToken,
    requireAdmin,
    updateBlogPost,
  );
  app.delete(
    "/api/admin/blog/:postId",
    authenticateToken,
    requireAdmin,
    deleteBlogPost,
  );

  // Reports routes
  app.get("/api/reports/reasons", getPublicReportReasons);
  app.get(
    "/api/admin/reports/reasons",
    authenticateToken,
    requireAdmin,
    getAllReportReasons,
  );
  app.post(
    "/api/admin/reports/reasons",
    authenticateToken,
    requireAdmin,
    createReportReason,
  );
  app.put(
    "/api/admin/reports/reasons/:reasonId",
    authenticateToken,
    requireAdmin,
    updateReportReason,
  );
  app.delete(
    "/api/admin/reports/reasons/:reasonId",
    authenticateToken,
    requireAdmin,
    deleteReportReason,
  );
  app.get(
    "/api/admin/reports",
    authenticateToken,
    requireAdmin,
    getAllUserReports,
  );
  app.post("/api/reports", authenticateToken, createUserReport);
  app.put(
    "/api/admin/reports/:reportId",
    authenticateToken,
    requireAdmin,
    updateUserReportStatus,
  );
  app.post("/api/reports/initialize", initializeReportReasons);

  // User Packages routes
  app.get(
    "/api/admin/user-packages",
    authenticateToken,
    requireAdmin,
    getAllUserPackages,
  );
  app.get("/api/user-packages", authenticateToken, getUserPackages);
  app.post("/api/user-packages", authenticateToken, createUserPackage);
  app.put(
    "/api/admin/user-packages/:packageId",
    authenticateToken,
    requireAdmin,
    updateUserPackageStatus,
  );
  app.put(
    "/api/user-packages/:packageId/usage",
    authenticateToken,
    updatePackageUsage,
  );
  app.delete(
    "/api/user-packages/:packageId",
    authenticateToken,
    cancelUserPackage,
  );
  app.get(
    "/api/admin/package-stats",
    authenticateToken,
    requireAdmin,
    getPackageStats,
  );

  // Content Management routes (legacy)
  app.get("/api/content/pages", getPublishedPages);
  app.get("/api/pages", getPublishedPages);
  app.get("/api/content/pages/slug/:slug", getContentPageBySlug);
  app.post("/api/content/pages/:pageId/view", trackPageView);

  // Unified CMS: public
  app.get("/api/settings", getSiteSettingsPublic); // no-store inside handler
  app.get("/api/pages/:slug", getPublicPageBySlug); // no-store inside handler

  // Unified CMS: admin
  app.put(
    "/api/admin/settings",
    authenticateToken,
    requireAdmin,
    updateSiteSettings,
  );
  app.get("/api/admin/pages", authenticateToken, requireAdmin, listPagesAdmin);
  app.put(
    "/api/admin/pages/:slug",
    authenticateToken,
    requireAdmin,
    upsertPageBySlug,
  );
  app.delete(
    "/api/admin/pages/:slug",
    authenticateToken,
    requireAdmin,
    deletePageBySlug,
  );
  app.get(
    "/api/admin/content",
    authenticateToken,
    requireAdmin,
    getAllContentPages,
  );
  app.post(
    "/api/admin/content",
    authenticateToken,
    requireAdmin,
    createContentPage,
  );
  app.put(
    "/api/admin/content/:pageId",
    authenticateToken,
    requireAdmin,
    updateContentPage,
  );
  app.delete(
    "/api/admin/content/:pageId",
    authenticateToken,
    requireAdmin,
    deleteContentPage,
  );
  app.post("/api/content/initialize", initializeContentPages);

  // Database test routes (for debugging)
  app.get("/api/test/database", testDatabase);
  app.get("/api/test/admin-user", testAdminUser);
  app.get("/api/test/admin-stats", testAdminStats);

  // Admin fix routes
  app.post("/api/fix/create-admin", forceCreateAdmin);
  app.get("/api/fix/admin-endpoints", fixAdminEndpoints);
  app.post("/api/fix/initialize-system", initializeSystemData);

  // Staff management routes
  app.get("/api/admin/staff", authenticateToken, requireAdmin, getAllStaff);
  app.post("/api/admin/staff", authenticateToken, requireAdmin, createStaff);
  app.put(
    "/api/admin/staff/:staffId",
    authenticateToken,
    requireAdmin,
    updateStaff,
  );
  app.delete(
    "/api/admin/staff/:staffId",
    authenticateToken,
    requireAdmin,
    deleteStaff,
  );
  app.patch(
    "/api/admin/staff/:staffId/status",
    authenticateToken,
    requireAdmin,
    updateStaffStatus,
  );
  app.put(
    "/api/admin/staff/:staffId/password",
    authenticateToken,
    requireAdmin,
    updateStaffPassword,
  );
  app.get(
    "/api/admin/roles",
    authenticateToken,
    requireAdmin,
    getRolesAndPermissions,
  );
  app.get(
    "/api/admin/staff/permissions",
    authenticateToken,
    requireAdmin,
    getAvailablePermissions,
  );

  // Notification management routes
  app.get(
    "/api/admin/notifications",
    authenticateToken,
    requireAdmin,
    getAllNotifications,
  );
  app.post(
    "/api/admin/notifications/send",
    authenticateToken,
    requireAdmin,
    sendNotification,
  );
  app.get(
    "/api/admin/notifications/users",
    authenticateToken,
    requireAdmin,
    getUsers,
  );
  app.get(
    "/api/admin/notifications/:notificationId",
    authenticateToken,
    requireAdmin,
    getNotificationById,
  );

  // Homepage slider management routes
  app.get(
    "/api/admin/homepage-sliders",
    authenticateToken,
    requireAdmin,
    getHomepageSliders,
  );
  app.post(
    "/api/admin/homepage-sliders",
    authenticateToken,
    requireAdmin,
    createHomepageSlider,
  );
  app.put(
    "/api/admin/homepage-sliders/:sliderId",
    authenticateToken,
    requireAdmin,
    updateHomepageSlider,
  );
  app.put(
    "/api/admin/homepage-sliders/:sliderId/toggle",
    authenticateToken,
    requireAdmin,
    toggleSliderStatus,
  );
  app.delete(
    "/api/admin/homepage-sliders/:sliderId",
    authenticateToken,
    requireAdmin,
    deleteHomepageSlider,
  );
  app.post(
    "/api/admin/homepage-sliders/initialize",
    authenticateToken,
    requireAdmin,
    initializeDefaultSlider,
  );

  // Public homepage slider routes
  app.get("/api/homepage-sliders", getActiveHomepageSliders);

  // Public consolidated settings
  app.get("/api/settings", getPublicSettings);

  // Bank transfer management routes
  app.get(
    "/api/admin/bank-transfers",
    authenticateToken,
    requireAdmin,
    getAllBankTransfers,
  );
  app.get(
    "/api/admin/bank-transfers/stats",
    authenticateToken,
    requireAdmin,
    getBankTransferStats,
  );
  app.get(
    "/api/admin/bank-transfers/:transferId",
    authenticateToken,
    requireAdmin,
    getBankTransferById,
  );
  app.put(
    "/api/admin/bank-transfers/:transferId/status",
    authenticateToken,
    requireAdmin,
    updateBankTransferStatus,
  );
  app.delete(
    "/api/admin/bank-transfers/:transferId",
    authenticateToken,
    requireAdmin,
    deleteBankTransfer,
  );

  // User bank transfer routes
  app.post("/api/bank-transfers", authenticateToken, createBankTransfer);
  app.get("/api/user/bank-transfers", authenticateToken, getUserBankTransfers);

  // Bank transfer test data route (development)
  app.post(
    "/api/admin/bank-transfers/init-test-data",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        await addBankTransferTestData();
        res.json({
          success: true,
          message: "Bank transfer test data initialized",
        });
      } catch (error) {
        console.error("Error initializing bank transfer test data:", error);
        res
          .status(500)
          .json({ success: false, error: "Failed to initialize test data" });
      }
    },
  );

  // Seller dashboard routes
  app.get("/api/seller/properties", authenticateToken, getSellerProperties);
  app.get(
    "/api/seller/notifications",
    authenticateToken,
    getSellerNotifications,
  );
  app.put(
    "/api/seller/notifications/:notificationId/read",
    authenticateToken,
    markNotificationAsRead,
  );
  app.delete(
    "/api/seller/notifications/:notificationId",
    authenticateToken,
    deleteSellerNotification,
  );
  app.get("/api/seller/messages", authenticateToken, getSellerMessages);
  app.post("/api/seller/messages", authenticateToken, sendSellerMessage);
  app.get("/api/seller/packages", authenticateToken, getSellerPackages);
  app.get("/api/seller/payments", authenticateToken, getSellerPayments);
  app.put("/api/seller/profile", authenticateToken, updateSellerProfile);
  app.put(
    "/api/seller/change-password",
    authenticateToken,
    changeSellerPassword,
  );
  app.post("/api/seller/purchase-package", authenticateToken, purchasePackage);
  app.get("/api/seller/stats", authenticateToken, getSellerStats);
  app.delete(
    "/api/seller/properties/:id",
    authenticateToken,
    deleteSellerProperty,
  );
  app.post(
    "/api/seller/properties/:id/resubmit",
    authenticateToken,
    resubmitSellerProperty,
  );

  // Chatbot routes
  app.post("/api/chatbot", sendChatbotMessage);
  app.get(
    "/api/admin/chat/conversations",
    authenticateToken,
    requireAdmin,
    getAdminChatConversations,
  );
  app.get(
    "/api/admin/chat/conversations/:conversationId/messages",
    authenticateToken,
    requireAdmin,
    getAdminChatMessages,
  );
  app.post(
    "/api/admin/chat/conversations/:conversationId/messages",
    authenticateToken,
    requireAdmin,
    sendAdminMessage,
  );
  app.delete(
    "/api/admin/chat/conversations/:conversationId",
    authenticateToken,
    requireAdmin,
    deleteChatConversation,
  );
  app.get(
    "/api/admin/chat/stats",
    authenticateToken,
    requireAdmin,
    getChatStatistics,
  );

  // Sample data routes (for testing)
  app.post(
    "/api/admin/sample-transactions",
    authenticateToken,
    requireAdmin,
    createSampleTransactions,
  );
  app.delete(
    "/api/admin/clear-transactions",
    authenticateToken,
    requireAdmin,
    clearAllTransactions,
  );
  app.post(
    "/api/admin/dev/seed-chat",
    authenticateToken,
    requireAdmin,
    seedChatData,
  );
  app.post(
    "/api/admin/dev/reply-as-owner/:conversationId",
    authenticateToken,
    requireAdmin,
    replyAsOwner,
  );

  // Footer management routes
  app.get("/api/footer/links", getActiveFooterLinks);
  app.get(
    "/api/admin/footer-links",
    authenticateToken,
    requireAdmin,
    getAllFooterLinks,
  );
  app.post(
    "/api/admin/footer-links",
    authenticateToken,
    requireAdmin,
    createFooterLink,
  );
  app.put(
    "/api/admin/footer-links/:linkId",
    authenticateToken,
    requireAdmin,
    updateFooterLink,
  );
  app.delete(
    "/api/admin/footer-links/:linkId",
    authenticateToken,
    requireAdmin,
    deleteFooterLink,
  );

  app.get("/api/footer/settings", getFooterSettings);
  app.get(
    "/api/admin/footer-settings",
    authenticateToken,
    requireAdmin,
    getFooterSettings,
  );
  app.put(
    "/api/admin/footer-settings",
    authenticateToken,
    requireAdmin,
    updateFooterSettings,
  );

  app.post("/api/footer/initialize", initializeFooterData);
  app.get("/api/footer/test", testFooterData);

  // Custom fields routes
  app.get("/api/custom-fields", getActiveCustomFields); // Public endpoint for active fields
  app.get(
    "/api/admin/custom-fields",
    authenticateToken,
    requireAdmin,
    getAllCustomFields,
  );
  app.post(
    "/api/admin/custom-fields",
    authenticateToken,
    requireAdmin,
    createCustomField,
  );
  app.get(
    "/api/admin/custom-fields/:fieldId",
    authenticateToken,
    requireAdmin,
    getCustomFieldById,
  );
  app.put(
    "/api/admin/custom-fields/:fieldId",
    authenticateToken,
    requireAdmin,
    updateCustomField,
  );
  app.delete(
    "/api/admin/custom-fields/:fieldId",
    authenticateToken,
    requireAdmin,
    deleteCustomField,
  );
  app.put(
    "/api/admin/custom-fields/:fieldId/status",
    authenticateToken,
    requireAdmin,
    updateCustomFieldStatus,
  );

  // Subcategories routes
  app.get("/api/subcategories", getSubcategories);
  app.get("/api/subcategories/with-counts", getSubcategoriesWithCounts);

  // Favorites routes
  app.get("/api/favorites/my", authenticateToken, getFavorites);
  app.post("/api/favorites/:propertyId", authenticateToken, addToFavorites);
  app.delete(
    "/api/favorites/:propertyId",
    authenticateToken,
    removeFromFavorites,
  );
  app.get("/api/favorites/:propertyId/check", authenticateToken, checkFavorite);

  // Enquiries routes
  app.post("/api/enquiries", submitEnquiry); // Public endpoint for submitting enquiries
  app.get(
    "/api/admin/enquiries",
    authenticateToken,
    requireAdmin,
    getEnquiries,
  );
  app.put(
    "/api/admin/enquiries/:id/status",
    authenticateToken,
    requireAdmin,
    updateEnquiryStatus,
  );

  // Tickets (support) routes
  app.post("/api/tickets", authenticateToken, createTicket);
  app.get("/api/tickets/my", authenticateToken, getUserTickets);
  app.get("/api/admin/tickets", authenticateToken, requireAdmin, getAllTickets);
  app.get(
    "/api/tickets/:ticketId/messages",
    authenticateToken,
    getTicketMessages,
  );
  app.post(
    "/api/tickets/:ticketId/messages",
    authenticateToken,
    addTicketMessage,
  );
  app.patch(
    "/api/admin/tickets/:ticketId/status",
    authenticateToken,
    requireAdmin,
    updateTicketStatus,
  );

  // Other Services routes
  app.get("/api/other-services", getPublicOtherServices); // Public endpoint
  app.get("/api/other-services/categories", getServiceCategories); // Public categories
  app.get(
    "/api/admin/other-services",
    authenticateToken,
    requireAdmin,
    getAllOtherServices,
  );
  app.post(
    "/api/admin/other-services",
    authenticateToken,
    requireAdmin,
    createOtherService,
  );
  app.put(
    "/api/admin/other-services/:serviceId",
    authenticateToken,
    requireAdmin,
    updateOtherService,
  );
  app.delete(
    "/api/admin/other-services/:serviceId",
    authenticateToken,
    requireAdmin,
    deleteOtherService,
  );
  app.post(
    "/api/admin/other-services/import",
    authenticateToken,
    requireAdmin,
    upload.single("file"),
    importOtherServices,
  );
  app.get(
    "/api/admin/other-services/export",
    authenticateToken,
    requireAdmin,
    exportOtherServices,
  );

  // Banner routes
  app.get("/api/banners", getActiveBanners); // Public endpoint for active banners
  app.get("/api/admin/banners", authenticateToken, requireAdmin, getAllBanners);
  app.post("/api/admin/banners", authenticateToken, requireAdmin, createBanner);
  app.put(
    "/api/admin/banners/:id",
    authenticateToken,
    requireAdmin,
    updateBanner,
  );
  app.delete(
    "/api/admin/banners/:id",
    authenticateToken,
    requireAdmin,
    deleteBanner,
  );
  app.post(
    "/api/admin/banners/upload",
    authenticateToken,
    requireAdmin,
    uploadBannerImage,
    handleImageUpload,
  );
  app.post("/api/banners/init", initializeBanners); // Public initialization

  // New Projects routes
  // Public routes
  app.get("/api/new-projects", getPublicNewProjects); // Public endpoint for active projects
  app.get("/api/new-projects/banners", getPublicNewProjectBanners); // Public banners

  // Area Maps - Public
  app.get("/api/maps", getPublicAreaMaps);
  app.post("/api/maps/init", initializeAreaMaps);

  // Admin routes for projects
  app.get(
    "/api/admin/new-projects",
    authenticateToken,
    requireAdmin,
    getNewProjects,
  );
  app.post(
    "/api/admin/new-projects",
    authenticateToken,
    requireAdmin,
    createNewProject,
  );
  app.put(
    "/api/admin/new-projects/:id",
    authenticateToken,
    requireAdmin,
    updateNewProject,
  );
  app.delete(
    "/api/admin/new-projects/:id",
    authenticateToken,
    requireAdmin,
    deleteNewProject,
  );

  // Admin routes for project banners
  app.get(
    "/api/admin/new-projects/banners",
    authenticateToken,
    requireAdmin,
    getNewProjectBanners,
  );

  // Area Maps - Admin
  app.get("/api/admin/maps", authenticateToken, requireAdmin, getAllAreaMaps);
  app.post("/api/admin/maps", authenticateToken, requireAdmin, createAreaMap);
  app.put(
    "/api/admin/maps/:id",
    authenticateToken,
    requireAdmin,
    updateAreaMap,
  );
  app.delete(
    "/api/admin/maps/:id",
    authenticateToken,
    requireAdmin,
    deleteAreaMap,
  );
  app.post(
    "/api/admin/maps/upload",
    authenticateToken,
    requireAdmin,
    uploadMapImage,
    handleMapImageUpload,
  );
  app.post(
    "/api/admin/new-projects/banners",
    authenticateToken,
    requireAdmin,
    createNewProjectBanner,
  );
  app.put(
    "/api/admin/new-projects/banners/:id",
    authenticateToken,
    requireAdmin,
    updateNewProjectBanner,
  );
  app.delete(
    "/api/admin/new-projects/banners/:id",
    authenticateToken,
    requireAdmin,
    deleteNewProjectBanner,
  );

  // Initialization
  app.post("/api/new-projects/init", initializeNewProjects); // Public initialization

  // Health check endpoint for network monitoring
  app.get("/api/health", async (req, res) => {
    let dbStatus = "ok";
    try {
      const db = getDatabase();
      await db.admin().ping();
    } catch (error) {
      dbStatus = "error";
    }

    res.json({
      status: "ok",
      db: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Global error handler (returns JSON). Catches multer and other errors gracefully.
  // Note: keep this after all routes are registered.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const multer = require("multer");

    // Error-handling middleware
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: any, req: any, res: any, next: any) => {
      console.error(
        "⚠️ Global error handler:",
        err && err.message ? err.message : err,
      );

      if (!res.headersSent) {
        if (err && err.name === "MulterError") {
          // Multer-specific errors (e.g., file too large)
          return res.status(400).json({
            success: false,
            error: err.message || "File upload error",
          });
        }

        // Custom invalid file type error
        if (err && err.code === "INVALID_FILE_TYPE") {
          return res.status(400).json({
            success: false,
            error: err.message || "Invalid file type",
          });
        }

        // CORS errors and others
        if (err && err.message && String(err.message).includes("CORS")) {
          return res.status(403).json({ success: false, error: err.message });
        }

        return res.status(500).json({
          success: false,
          error: err && err.message ? err.message : "Internal server error",
        });
      }
      next(err);
    });
  } catch (e) {
    // If require('multer') fails for any reason, still register a basic error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: any, req: any, res: any, next: any) => {
      console.error(
        "⚠️ Global error handler (fallback):",
        err && err.message ? err.message : err,
      );
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: err && err.message ? err.message : "Internal server error",
        });
      }
      next(err);
    });
  }

  return app;
}

export function initializeSocket(httpServer: any) {
  socketServer = new ChatSocketServer(httpServer);
  return socketServer;
}

export function getSocketServer() {
  return socketServer;
}

// For production
