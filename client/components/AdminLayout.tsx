import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Megaphone,
  List,
  Layers,
  Settings,
  Package,
  CreditCard,
  Users,
  Shield,
  Star,
  Flag,
  Home,
  Sliders,
  MapPin,
  Globe,
  BarChart3,
  AlertTriangle,
  Send,
  UserCheck,
  Crown,
  FileText,
  HelpCircle,
  MessageSquare,
  Wrench,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Activity,
  Plus,
  Edit,
  Bell,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import FooterUpdateNotification from "./admin/FooterUpdateNotification";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    id: "advertisements",
    label: "Advertisement Management",
    icon: Megaphone,
    children: [
      { id: "ads-listing", label: "Ads Listing", icon: List },
      { id: "deleted-ads", label: "Deleted Ads", icon: Trash2 },
      { id: "categories", label: "Categories", icon: Layers },
      { id: "custom-fields", label: "Custom Fields", icon: Settings },
      {
        id: "ad-management",
        label: "Advertisement Management",
        icon: Megaphone,
      },

      {
        id: "pending-approval",
        label: "Pending Approvals",
        icon: AlertTriangle,
        badge: "new",
      },
      {
        id: "premium-approvals",
        label: "Premium Listing Approvals",
        icon: Crown,
        badge: "3",
      },
      { id: "ad-tips", label: "Advertisement Tips", icon: HelpCircle },
    ],
  },
  {
    id: "packages",
    label: "Package Management",
    icon: Package,
    children: [
      { id: "package-management", label: "Package Management", icon: Package },
      {
        id: "listing-package",
        label: "Advertisement Listing Package",
        icon: List,
      },
      {
        id: "feature-package",
        label: "Feature Advertisement Package",
        icon: Star,
      },
    ],
  },
  {
    id: "payments",
    label: "Payment Management",
    icon: CreditCard,
    children: [
      { id: "transactions", label: "Payment Transactions", icon: CreditCard },
      {
        id: "manual-payment-approval",
        label: "Manual Payment Approval",
        icon: Shield,
        badge: "5",
      },
      { id: "bank-transfer", label: "Bank Transfer", icon: CreditCard },
    ],
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    children: [
      { id: "all-users", label: "All Users", icon: Users },
      { id: "user-analytics", label: "User Analytics", icon: BarChart3 },
    ],
  },
  {
    id: "sellers",
    label: "Seller Management",
    icon: Users,
    children: [
      { id: "seller-management", label: "Seller Management", icon: Users },
      { id: "verification-fields", label: "Verification Fields", icon: Shield },
      {
        id: "seller-verification",
        label: "Seller Verification",
        icon: UserCheck,
        badge: "12",
      },
      { id: "seller-review", label: "Seller Review", icon: Star },
      { id: "seller-review-report", label: "Seller Review Report", icon: Flag },
    ],
  },
  {
    id: "other-services",
    label: "Other Services",
    icon: Wrench,
    children: [
      { id: "service-categories", label: "Service Categories", icon: Layers },
      {
        id: "service-subcategories",
        label: "Service Subcategories",
        icon: List,
      },
      { id: "service-listings", label: "Service Listings", icon: MapPin },
      { id: "bulk-import", label: "Bulk Import", icon: Plus },
    ],
  },
  {
    id: "support",
    label: "Support & Communication",
    icon: MessageSquare,
    children: [
      {
        id: "support-inbox",
        label: "Support Inbox",
        icon: MessageSquare,
        badge: "new",
      },
      {
        id: "conversation-analytics",
        label: "Conversation Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "home-screen",
    label: "Home Screen Management",
    icon: Home,
    children: [
      { id: "slider", label: "Slider", icon: Sliders },
      { id: "new-projects", label: "New Projects", icon: Plus },
      { id: "maps", label: "Area Maps", icon: MapPin },
      { id: "banners", label: "Banners", icon: Megaphone },
      { id: "feature-section", label: "Feature Section", icon: Star },
    ],
  },
  {
    id: "locations",
    label: "Place/Location Management",
    icon: MapPin,
    children: [
      { id: "countries", label: "Countries", icon: Globe },
      { id: "states", label: "States", icon: MapPin },
      { id: "cities", label: "Cities", icon: MapPin },
      { id: "areas", label: "Areas", icon: MapPin },
    ],
  },
  {
    id: "reports",
    label: "Reports Management",
    icon: BarChart3,
    children: [
      { id: "report-reasons", label: "Report Reasons", icon: AlertTriangle },
      { id: "user-reports", label: "User Reports", icon: Flag, badge: "3" },
    ],
  },
  {
    id: "promotional",
    label: "Promotional Management",
    icon: Send,
    children: [
      { id: "send-notification", label: "Send Notification", icon: Send },
      { id: "customers", label: "Customers", icon: Users },
    ],
  },
  {
    id: "staff",
    label: "Staff Management",
    icon: Crown,
    children: [
      { id: "role", label: "Role", icon: Shield },
      { id: "staff-management", label: "Staff Management", icon: Crown },
    ],
  },
  {
    id: "content",
    label: "Page Management",
    icon: FileText,
    children: [
      { id: "content-management", label: "Create New Page", icon: Plus },
      { id: "static-pages", label: "All Pages", icon: FileText },
      { id: "footer-management", label: "Footer Settings", icon: Globe },
      { id: "blog-management", label: "Blog Management", icon: FileText },
      { id: "faq", label: "FAQ Management", icon: HelpCircle },
      {
        id: "web-queries",
        label: "Web User Queries",
        icon: MessageSquare,
        badge: "7",
      },
    ],
  },
  {
    id: "system",
    label: "System Settings",
    icon: Wrench,
    children: [
      { id: "system-status", label: "System Status", icon: Activity },
      { id: "testing", label: "System Testing", icon: Activity },
      {
        id: "test-seller-notifications",
        label: "Test Seller Notifications",
        icon: Bell,
      },
      { id: "login-test", label: "Login Test Suite", icon: Users },
      { id: "settings", label: "Settings", icon: Settings },
      { id: "system-update", label: "System Update", icon: RefreshCw },
      { id: "auth-debug", label: "Auth Debug", icon: Shield },
    ],
  },
];

export default function AdminLayout({
  children,
  activeSection,
  onSectionChange,
}: AdminLayoutProps) {
  const { user, logout } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "dashboard",
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Safety check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isActive = activeSection === item.id;

    const isRouteLink =
      level > 0 && (item.id === "categories" || item.id === "countries");
    const href =
      item.id === "categories"
        ? "/admin/ads/categories"
        : item.id === "countries"
          ? "/admin/locations/countries"
          : undefined;

    return (
      <div key={item.id}>
        {isRouteLink ? (
          <a
            href={href}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors",
              level === 0 ? "font-medium" : "text-sm font-normal",
              level > 0 && "ml-4",
              isActive
                ? "bg-[#C70000] text-white"
                : "text-gray-700 hover:bg-gray-100",
              sidebarCollapsed && level === 0 && "justify-center px-2",
            )}
            aria-label={item.label}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className={cn(
                  "flex-shrink-0",
                  level === 0 ? "h-5 w-5" : "h-4 w-4",
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
                {hasChildren && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                )}
              </div>
            )}
          </a>
        ) : (
          <button
            onClick={() => {
              if (hasChildren) {
                toggleSection(item.id);
              } else {
                onSectionChange(item.id);
                setMobileMenuOpen(false);
              }
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors",
              level === 0 ? "font-medium" : "text-sm font-normal",
              level > 0 && "ml-4",
              isActive
                ? "bg-[#C70000] text-white"
                : "text-gray-700 hover:bg-gray-100",
              sidebarCollapsed && level === 0 && "justify-center px-2",
            )}
            aria-label={item.label}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className={cn(
                  "flex-shrink-0",
                  level === 0 ? "h-5 w-5" : "h-4 w-4",
                )}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
                {hasChildren && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                )}
              </div>
            )}
          </button>
        )}

        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 lg:relative lg:translate-x-0",
          sidebarCollapsed ? "w-16" : "w-64",
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#C70000] rounded flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 lg:flex hidden"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50",
              sidebarCollapsed && "justify-center px-2",
            )}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {activeSection.replace("-", " ")}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Admin</Badge>
              <div className="w-8 h-8 bg-[#C70000] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      {/* Footer Update Notifications */}
      <FooterUpdateNotification />
    </div>
  );
}
