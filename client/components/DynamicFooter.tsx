import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { enhancedApi } from "@/lib/api-enhanced";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ExternalLink,
  Calendar,
  Users,
  Building,
  RefreshCw,
  AlertCircle,
  Check,
} from "lucide-react";

interface FooterPage {
  _id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  order?: number;
  isExternal?: boolean;
  url?: string;
  createdAt: string;
}

interface FooterLink {
  _id: string;
  title: string;
  url: string;
  section: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
}

interface FooterSettings {
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  showLocations: boolean;
  locations: string[];
  customSections: {
    [key: string]: {
      title: string;
      enabled: boolean;
      order: number;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function DynamicFooter() {
  const [footerPages, setFooterPages] = useState<FooterPage[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    companyName: "Ashish Properties",
    companyDescription:
      "Your trusted property partner in Rohtak. Find your dream home with verified listings and expert guidance.",
    companyLogo: "AP",
    socialLinks: {},
    contactInfo: {},
    showLocations: true,
    locations: [
      "Model Town",
      "Sector 14",
      "Civil Lines",
      "Old City",
      "Industrial Area",
      "Bohar",
    ],
    customSections: {},
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "offline" | "error"
  >("connected");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initialize footer with error handling
    const initialize = async () => {
      try {
        await initializeFooter();
      } catch (error) {
        console.error("Footer initialization failed:", error);
        setLoading(false);
        setConnectionStatus("error");
      }
    };

    initialize();

    // Auto-refresh every 20 minutes (further reduced frequency)
    const interval = setInterval(
      () => {
        if (navigator.onLine && !document.hidden && !isRefreshing) {
          refreshFooterData(true);
        }
      },
      20 * 60 * 1000,
    );

    // Listen for admin updates
    const handleFooterUpdate = () => {
      console.log("🔄 Footer update triggered by admin");
      if (!isRefreshing) {
        refreshFooterData();
      }
    };

    // Debounced visibility change handler with better error handling
    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      clearTimeout(visibilityTimeout);
      visibilityTimeout = setTimeout(() => {
        if (!document.hidden && navigator.onLine && !isRefreshing) {
          // Only refresh if it's been more than 10 minutes since last update
          const now = Date.now();
          const lastUpdateTime = lastUpdated
            ? new Date(lastUpdated).getTime()
            : 0;
          if (now - lastUpdateTime > 10 * 60 * 1000) {
            refreshFooterData(true);
          }
        }
      }, 8000); // 8 second debounce (further increased)
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setConnectionStatus("connected");
      if (!isRefreshing) {
        setTimeout(() => refreshFooterData(true), 1000); // Small delay when coming online
      }
    };

    const handleOffline = () => {
      setConnectionStatus("offline");
    };

    window.addEventListener("footerUpdate", handleFooterUpdate);
    window.addEventListener("footerRefresh", handleFooterUpdate);
    window.addEventListener("pagePublished", handleFooterUpdate);
    window.addEventListener("pageUnpublished", handleFooterUpdate);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      clearTimeout(visibilityTimeout);
      window.removeEventListener("footerUpdate", handleFooterUpdate);
      window.removeEventListener("footerRefresh", handleFooterUpdate);
      window.removeEventListener("pagePublished", handleFooterUpdate);
      window.removeEventListener("pageUnpublished", handleFooterUpdate);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRefreshing, lastUpdated]);

  const initializeFooter = async () => {
    setLoading(true);
    try {
      // Try to initialize footer data first
      try {
        const initResponse = await enhancedApi.get("footer/initialize");
        if (initResponse.ok && initResponse.data?.success) {
          console.log("🔧 Footer data initialization checked/completed");
        }
      } catch (initError) {
        console.warn("⚠️ Footer initialization endpoint failed:", initError);
      }

      // Always attempt to refresh data regardless of initialization result
      await refreshFooterData();
    } catch (error: any) {
      console.warn("Footer initialization failed, using defaults:", {
        message: error.message,
        name: error.name,
      });
      setConnectionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const refreshFooterData = async (silent = false) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      if (!silent)
        console.log("🔄 Footer refresh already in progress, skipping...");
      return;
    }

    try {
      setIsRefreshing(true);
      if (!silent) setConnectionStatus("connected");

      // Check if we're online before making requests
      if (!navigator.onLine) {
        setConnectionStatus("offline");
        return;
      }

      // Enhanced timeout wrapper with better error handling
      const createTimeoutPromise = (ms: number) =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), ms),
        );

      // Wrap API calls with comprehensive error handling
      const safeApiCall = async (apiCall: Promise<any>, name: string) => {
        try {
          const result = await Promise.race([
            apiCall,
            createTimeoutPromise(12000), // 12 second timeout
          ]);
          return { success: true, data: result, name };
        } catch (error: any) {
          console.warn(`⚠️ ${name} API call failed:`, error.message);
          return { success: false, error: error.message, name };
        }
      };

      // Make all API calls with better error isolation
      const [pagesResult, linksResult, settingsResult] = await Promise.all([
        safeApiCall(enhancedApi.get("content/pages"), "Pages"),
        safeApiCall(enhancedApi.get("footer/links"), "Links"),
        safeApiCall(enhancedApi.get("footer/settings"), "Settings"),
      ]);

      let hasErrors = false;
      let successCount = 0;

      // Handle pages with better error checking
      if (
        pagesResult.success &&
        pagesResult.data?.ok &&
        pagesResult.data?.data?.success
      ) {
        try {
          const publishedPages = (pagesResult.data.data.data || [])
            .filter((page: FooterPage) => page.status === "published")
            .sort(
              (a: FooterPage, b: FooterPage) => (a.order || 0) - (b.order || 0),
            );
          setFooterPages(publishedPages);
          if (!silent)
            console.log("📄 Footer Pages Loaded:", publishedPages.length);
          successCount++;
        } catch (parseError) {
          console.warn("⚠️ Failed to parse pages data:", parseError);
          hasErrors = true;
        }
      } else {
        hasErrors = true;
        if (!silent)
          console.log(
            "❌ Footer Pages Failed:",
            pagesResult.error || "Unknown error",
          );
      }

      // Handle links with better error checking
      if (
        linksResult.success &&
        linksResult.data?.ok &&
        linksResult.data?.data?.success
      ) {
        try {
          const activeLinks = (linksResult.data.data.data || [])
            .filter((link: FooterLink) => link.isActive)
            .sort((a: FooterLink, b: FooterLink) => a.order - b.order);
          setFooterLinks(activeLinks);
          if (!silent)
            console.log("🔗 Footer Links Loaded:", activeLinks.length);
          successCount++;
        } catch (parseError) {
          console.warn("⚠️ Failed to parse links data:", parseError);
          hasErrors = true;
        }
      } else {
        hasErrors = true;
        if (!silent)
          console.log(
            "❌ Footer Links Failed:",
            linksResult.error || "Unknown error",
          );
      }

      // Handle settings with better error checking
      if (
        settingsResult.success &&
        settingsResult.data?.ok &&
        settingsResult.data?.data?.success
      ) {
        try {
          const settingsData = settingsResult.data.data.data || {};
          setFooterSettings((prev) => ({
            ...prev,
            ...settingsData,
          }));
          setLastUpdated(new Date().toISOString());
          if (!silent) console.log("⚙️ Footer Settings Loaded");
          successCount++;
        } catch (parseError) {
          console.warn("⚠️ Failed to parse settings data:", parseError);
          hasErrors = true;
        }
      } else {
        hasErrors = true;
        if (!silent)
          console.log(
            "❌ Footer Settings Failed:",
            settingsResult.error || "Unknown error",
          );
      }

      // Update connection status based on results
      if (successCount === 0) {
        setConnectionStatus("error");
        if (!silent)
          console.log("📂 All footer APIs failed, using default content");
      } else if (hasErrors) {
        setConnectionStatus("error");
        if (!silent)
          console.log(
            `📂 Partial footer data loaded (${successCount}/3 APIs successful)`,
          );
      } else {
        setConnectionStatus("connected");
        if (!silent) console.log("✅ Footer data refreshed successfully");
      }
    } catch (error: any) {
      console.error("❌ Critical error refreshing footer data:", {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n")?.[0],
      });
      setConnectionStatus("error");
      // Ensure footer still renders with default content
      if (!silent)
        console.log(
          "📂 Footer will continue with default content due to critical error",
        );
    } finally {
      setIsRefreshing(false);
      // Ensure loading state is cleared
      setLoading(false);
    }
  };

  const getPagesByType = (type: string) => {
    return footerPages
      .filter((page) => page.type === type)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getLinksBySection = (section: string) => {
    return footerLinks
      .filter((link) => link.section === section)
      .sort((a, b) => a.order - b.order);
  };

  const renderPageLink = (page: FooterPage) => {
    const className =
      "text-red-200 hover:text-white transition-colors duration-200 text-sm";

    const externalProps = {
      href: page.url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: className + " flex items-center",
    };

    const internalProps = {
      to: `/page/${page.slug}`,
      className,
    };

    const content = (
      <>
        {page.title}
        {page.isExternal && <ExternalLink className="h-3 w-3 ml-1" />}
      </>
    );

    return (
      <li key={page._id}>
        {page.isExternal ? (
          <a {...externalProps}>{content}</a>
        ) : (
          <Link {...internalProps}>{content}</Link>
        )}
      </li>
    );
  };

  const renderFooterLink = (link: FooterLink) => {
    const content = (
      <>
        {link.title}
        {link.isExternal && <ExternalLink className="h-3 w-3 ml-1" />}
      </>
    );

    return (
      <li key={link._id}>
        {link.isExternal ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-200 hover:text-white transition-colors duration-200 text-sm flex items-center"
          >
            {content}
          </a>
        ) : (
          <Link
            to={link.url}
            className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
          >
            {content}
          </Link>
        )}
      </li>
    );
  };

  if (loading) {
    return (
      <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-pulse">Loading footer...</div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[#C70000] font-bold text-xl">
                  {footerSettings.companyLogo}
                </span>
              </div>
              <h3 className="text-2xl font-bold">
                {footerSettings.companyName}
              </h3>
            </div>

            <p className="text-red-100 text-sm leading-relaxed">
              {footerSettings.companyDescription}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {footerSettings.socialLinks?.facebook && (
                <a
                  href={footerSettings.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.twitter && (
                <a
                  href={footerSettings.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.instagram && (
                <a
                  href={footerSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {footerSettings.socialLinks?.youtube && (
                <a
                  href={footerSettings.socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Contact Info */}
            {(footerSettings.contactInfo?.phone ||
              footerSettings.contactInfo?.email) && (
              <div className="space-y-2 text-sm">
                {footerSettings.contactInfo?.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{footerSettings.contactInfo.phone}</span>
                  </div>
                )}
                {footerSettings.contactInfo?.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{footerSettings.contactInfo.email}</span>
                  </div>
                )}
                {footerSettings.contactInfo?.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{footerSettings.contactInfo.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular Locations */}
          {footerSettings.showLocations &&
            footerSettings.locations &&
            footerSettings.locations.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Popular Locations</h4>
                <ul className="space-y-3">
                  {footerSettings.locations.slice(0, 6).map((location) => (
                    <li key={location}>
                      <Link
                        to={`/properties?location=${encodeURIComponent(location)}`}
                        className="text-red-200 hover:text-white transition-colors duration-200 text-sm flex items-center"
                      >
                        <MapPin className="h-3 w-3 mr-2" />
                        Properties in {location}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-3">
              {/* Dynamic footer links from admin panel */}
              {getLinksBySection("quick_links").map(renderFooterLink)}

              {/* Default quick links if no custom ones */}
              {getLinksBySection("quick_links").length === 0 && (
                <>
                  <li>
                    <Link
                      to="/properties"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      All Properties
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/post-property"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Post Property
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/agents"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Find Agents
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact-us"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Contact Us
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Pages & Policies */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal & Support</h4>
            <ul className="space-y-3">
              {/* Dynamic pages created from admin */}
              {getPagesByType("policy").map(renderPageLink)}
              {getPagesByType("terms").map(renderPageLink)}
              {getPagesByType("page").map(renderPageLink)}

              {/* Custom footer links from admin */}
              {getLinksBySection("support").map(renderFooterLink)}
              {getLinksBySection("legal").map(renderFooterLink)}

              {/* Default links if no custom ones exist */}
              {getPagesByType("policy").length +
                getPagesByType("terms").length +
                getPagesByType("page").length +
                getLinksBySection("support").length +
                getLinksBySection("legal").length ===
                0 && (
                <>
                  <li>
                    <Link
                      to="/about-us"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/support/help"
                      className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                    >
                      Help Center
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-red-600 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>
                All rights reserved © 2006-{new Date().getFullYear()}{" "}
                {footerSettings.companyName}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-red-200">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {connectionStatus === "connected" && (
                  <Check className="h-3 w-3 text-green-400" />
                )}
                {connectionStatus === "offline" && (
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                )}
                {connectionStatus === "error" && (
                  <AlertCircle className="h-3 w-3 text-red-400" />
                )}
                <span>
                  {connectionStatus === "connected" && "Live"}
                  {connectionStatus === "offline" && "Offline"}
                  {connectionStatus === "error" && "Error"}
                </span>
              </div>

              {/* Content count */}
              <span className="text-red-200">
                {footerPages.length + footerLinks.length} dynamic items
              </span>
            </div>

            {/* Debug info for development */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-red-200/50">
                <p>
                  Last updated:{" "}
                  {lastUpdated
                    ? new Date(lastUpdated).toLocaleTimeString()
                    : "Never"}
                </p>
                <p>
                  Pages: {footerPages.length} | Links: {footerLinks.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
