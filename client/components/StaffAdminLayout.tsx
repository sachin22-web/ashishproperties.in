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
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";
import { hasPermission, hasAnyPermission, getRoleDisplayName } from "../utils/permissions";

interface StaffAdminLayoutProps {
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
  permissions?: string[];
}

const fullMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissions: ["dashboard.view"],
  },

  {
    id: "advertisements",
    label: "Advertisement Management",
    icon: Megaphone,
    permissions: ["ads.manage"],
    children: [
      { id: "ads-listing", label: "Ads Listing", icon: List, permissions: ["ads.view"] },
      { id: "categories", label: "Categories", icon: Layers, permissions: ["categories.manage"] },
      { id: "custom-fields", label: "Custom Fields", icon: Settings, permissions: ["ads.manage"] },
      { id: "ad-management", label: "Advertisement Management", icon: Megaphone, permissions: ["ads.manage"] },

      { id: "pending-approval", label: "Pending Approvals", icon: AlertTriangle, badge: "new", permissions: ["ads.approve"] },
      { id: "premium-approvals", label: "Premium Listing Approvals", icon: Crown, badge: "3", permissions: ["ads.approve"] },
      { id: "ad-tips", label: "Advertisement Tips", icon: HelpCircle, permissions: ["content.manage"] },
    ],
  },
  {
    id: "packages",
    label: "Package Management",
    icon: Package,
    permissions: ["packages.manage"],
    children: [
      { id: "package-management", label: "Package Management", icon: Package, permissions: ["packages.manage"] },
      { id: "listing-package", label: "Advertisement Listing Package", icon: List, permissions: ["packages.manage"] },
      { id: "feature-package", label: "Feature Advertisement Package", icon: Star, permissions: ["packages.manage"] },
    ],
  },
  {
    id: "payments",
    label: "Payment Management",
    icon: CreditCard,
    permissions: ["payments.manage"],
    children: [
      { id: "transactions", label: "Payment Transactions", icon: CreditCard, permissions: ["payments.view"] },
      { id: "manual-payment-approval", label: "Manual Payment Approval", icon: Shield, badge: "5", permissions: ["payments.approve"] },
      { id: "bank-transfer", label: "Bank Transfer", icon: CreditCard, permissions: ["payments.manage"] },
    ],
  },
  {
    id: "users",
    label: "User Management",
    icon: Users,
    permissions: ["users.manage"],
    children: [
      { id: "all-users", label: "All Users", icon: Users, permissions: ["users.view"] },
      { id: "user-analytics", label: "User Analytics", icon: BarChart3, permissions: ["analytics.view"] },
    ],
  },
  {
    id: "sellers",
    label: "Seller Management",
    icon: Users,
    permissions: ["sellers.manage"],
    children: [
      { id: "seller-management", label: "Seller Management", icon: Users, permissions: ["sellers.manage"] },
      { id: "verification-fields", label: "Verification Fields", icon: Shield, permissions: ["sellers.manage"] },
      { id: "seller-verification", label: "Seller Verification", icon: UserCheck, badge: "12", permissions: ["sellers.verify"] },
      { id: "seller-review", label: "Seller Review", icon: Star, permissions: ["sellers.view"] },
      { id: "seller-review-report", label: "Seller Review Report", icon: Flag, permissions: ["sellers.view"] },
    ],
  },
  {
    id: "home-screen",
    label: "Home Screen Management",
    icon: Home,
    permissions: ["content.manage"],
    children: [
      { id: "slider", label: "Slider", icon: Sliders, permissions: ["content.manage"] },
      { id: "feature-section", label: "Feature Section", icon: Star, permissions: ["content.manage"] },
    ],
  },
  {
    id: "locations",
    label: "Place/Location Management",
    icon: MapPin,
    permissions: ["locations.manage"],
    children: [
      { id: "countries", label: "Countries", icon: Globe, permissions: ["locations.manage"] },
      { id: "states", label: "States", icon: MapPin, permissions: ["locations.manage"] },
      { id: "cities", label: "Cities", icon: MapPin, permissions: ["locations.manage"] },
      { id: "areas", label: "Areas", icon: MapPin, permissions: ["locations.manage"] },
    ],
  },
  {
    id: "reports",
    label: "Reports Management",
    icon: BarChart3,
    permissions: ["reports.manage"],
    children: [
      { id: "report-reasons", label: "Report Reasons", icon: AlertTriangle, permissions: ["reports.manage"] },
      { id: "user-reports", label: "User Reports", icon: Flag, badge: "3", permissions: ["reports.view"] },
    ],
  },
  {
    id: "promotional",
    label: "Promotional Management",
    icon: Send,
    permissions: ["promotions.manage"],
    children: [
      { id: "send-notification", label: "Send Notification", icon: Send, permissions: ["notifications.send"] },
      { id: "customers", label: "Customers", icon: Users, permissions: ["users.view"] },
    ],
  },
  {
    id: "staff",
    label: "Staff Management",
    icon: Crown,
    permissions: ["staff.manage"],
    children: [
      { id: "role", label: "Role", icon: Shield, permissions: ["roles.manage"] },
      { id: "staff-management", label: "Staff Management", icon: Crown, permissions: ["staff.manage"] },
    ],
  },
  {
    id: "content",
    label: "Page Management",
    icon: FileText,
    permissions: ["content.manage"],
    children: [
      { id: "content-management", label: "Create New Page", icon: Plus, permissions: ["content.create"] },
      { id: "static-pages", label: "All Pages", icon: FileText, permissions: ["content.view"] },
      { id: "footer-management", label: "Footer Settings", icon: Globe, permissions: ["content.manage"] },
      { id: "blog-management", label: "Blog Management", icon: FileText, permissions: ["blog.manage"] },
      { id: "faq", label: "FAQ Management", icon: HelpCircle, permissions: ["content.manage"] },
      { id: "web-queries", label: "Web User Queries", icon: MessageSquare, badge: "7", permissions: ["support.view"] },
    ],
  },
  {
    id: "system",
    label: "System Settings",
    icon: Wrench,
    permissions: ["system.manage"],
    children: [
      { id: "system-status", label: "System Status", icon: Activity, permissions: ["system.view"] },
      { id: "login-test", label: "Login Test Suite", icon: Users, permissions: ["system.test"] },
      { id: "settings", label: "Settings", icon: Settings, permissions: ["system.manage"] },
      { id: "system-update", label: "System Update", icon: RefreshCw, permissions: ["system.update"] },
      { id: "auth-debug", label: "Auth Debug", icon: Shield, permissions: ["system.debug"] },
      { id: "role-debug", label: "Role Debug", icon: Shield, permissions: ["dashboard.view"] },
    ],
  },
];



export default function StaffAdminLayout({
  children,
  activeSection,
  onSectionChange,
}: StaffAdminLayoutProps) {
  const { user, logout } = useAuth();

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["dashboard"]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter menu items based on permissions
  const hasMenuPermission = (requiredPermissions?: string[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    return hasAnyPermission(user?.role || "admin", requiredPermissions);
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // Check if user has permission for this item
      if (!hasMenuPermission(item.permissions)) return false;

      // If item has children, filter them too
      if (item.children) {
        const filteredChildren = filterMenuItems(item.children);
        // Only show parent if it has accessible children
        if (filteredChildren.length === 0) return false;
        item.children = filteredChildren;
      }

      return true;
    });
  };

  const menuItems = filterMenuItems(fullMenuItems);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/staff/login";
  };

  const getUserRoleDisplay = () => {
    return getRoleDisplayName(user?.role || "admin");
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const isActive = activeSection === item.id;

    return (
      <div key={item.id}>
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
              <h1 className="text-lg font-bold text-gray-900">Staff Panel</h1>
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
                  {user?.name?.charAt(0) || "S"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || "Staff User"}
                </p>
                <p className="text-xs text-gray-500">{getUserRoleDisplay()}</p>
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
              <Badge variant="outline">{getUserRoleDisplay()}</Badge>
              <div className="w-8 h-8 bg-[#C70000] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || "S"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
