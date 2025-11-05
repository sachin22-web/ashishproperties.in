import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import StaffAdminLayout from "../components/StaffAdminLayout";
import { canAccessSection } from "../utils/permissions";
import { Shield } from "lucide-react";

// Import all admin components
import AdminDashboardSummary from "../components/admin/AdminDashboardSummary";
import ContentManagement from "../components/admin/ContentManagement";
import CategoryManagement from "../components/admin/CategoryManagement";
import CompletePropertyManagement from "../components/admin/CompletePropertyManagement";
import AdvertisementListingPackage from "../components/admin/AdvertisementListingPackage";
import PaymentTransactions from "../components/admin/PaymentTransactions";
import ManualPaymentApproval from "../components/admin/ManualPaymentApproval";
import BankTransferManagement from "../components/admin/BankTransferManagement";
import AllUsersManagement from "../components/AllUsersManagement";
import UserAnalytics from "../components/admin/UserAnalytics";
import SellerVerificationFields from "../components/admin/SellerVerificationFields";
import SellerVerificationManagement from "../components/admin/SellerVerificationManagement";
import ReportsManagement from "../components/admin/ReportsManagement";
import NotificationManagement from "../components/admin/NotificationManagement";
import StaffManagement from "../components/admin/StaffManagement";
import FooterManagement from "../components/admin/FooterManagement";
import FAQManagement from "../components/admin/FAQManagement";
import SystemStatus from "../components/admin/SystemStatus";
import AdminSettings from "../components/admin/AdminSettings";
import SystemUpdate from "../components/admin/SystemUpdate";
import AuthDebug from "../components/AuthDebug";
import RoleDebug from "../components/admin/RoleDebug";
import PackageManagement from "../components/admin/PackageManagement";
import FeatureAdvertisementPackage from "../components/admin/FeatureAdvertisementPackage";
import PremiumListingApprovals from "../components/admin/PremiumListingApprovals";
import CustomFieldsManagement from "../components/admin/CustomFieldsManagement";
import UserManagement from "../components/admin/UserManagement";
import PropertyManagement from "../components/admin/PropertyManagement";

export default function StaffAdmin() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/staff/login");
      return;
    }

    // Check if user is staff or admin
    if (user?.userType !== "staff" && user?.userType !== "admin") {
      navigate("/staff/login");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, user, navigate]);

  const renderContent = () => {
    // Check if user has permission to access this section
    if (!canAccessSection(user?.role || "admin", activeSection)) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access this section.</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "dashboard":
        return <AdminDashboardSummary />;

      // Page Management
      case "content-management":
        return <ContentManagement />;
      case "static-pages":
        return <ContentManagement />;
      case "pages":
        return <ContentManagement />;

      // Advertisement Management
      case "ads-listing":
        return <CompletePropertyManagement />;
      case "categories":
        return <CategoryManagement />;
      case "custom-fields":
        return <CustomFieldsManagement />;
      case "ad-management":
        return <PropertyManagement />;
      case "ad-requested":
        return <PropertyManagement />;
      case "pending-approval":
        return <PropertyManagement />;
      case "premium-approvals":
        return <PremiumListingApprovals />;
      case "ad-tips":
        return <ContentManagement />;

      // Package Management
      case "package-management":
        return <PackageManagement />;
      case "listing-package":
        return <AdvertisementListingPackage />;
      case "feature-package":
        return <FeatureAdvertisementPackage />;

      // Payment Management
      case "transactions":
        return <PaymentTransactions />;
      case "manual-payment-approval":
        return <ManualPaymentApproval />;
      case "bank-transfer":
        return <BankTransferManagement />;

      // User Management
      case "all-users":
        return <AllUsersManagement />;
      case "user-analytics":
        return <UserAnalytics />;

      // Seller Management
      case "seller-management":
        return <UserManagement />;
      case "verification-fields":
        return <SellerVerificationFields />;
      case "seller-verification":
        return <SellerVerificationManagement />;
      case "seller-review":
        return <UserManagement />;
      case "seller-review-report":
        return <ReportsManagement />;

      // Home Screen Management
      case "slider":
        return <ContentManagement />;
      case "feature-section":
        return <ContentManagement />;

      // Location Management
      case "countries":
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Countries</h3>
            <p className="text-sm text-gray-600 mb-4">This section moved to dedicated page.</p>
            <a className="text-[#C70000] underline" href="/admin/locations/countries">Go to Countries</a>
          </div>
        );
      case "states":
        return <CategoryManagement />;
      case "cities":
        return <CategoryManagement />;
      case "areas":
        return <CategoryManagement />;

      // Reports Management
      case "report-reasons":
        return <ReportsManagement />;
      case "user-reports":
        return <ReportsManagement />;

      // Promotional Management
      case "send-notification":
        return <NotificationManagement />;
      case "customers":
        return <UserManagement />;

      // Staff Management
      case "role":
        return <StaffManagement />;
      case "staff-management":
        return <StaffManagement />;

      // Content Management
      case "footer-management":
        return <FooterManagement />;
      case "blog-management":
        return <ContentManagement />;
      case "blogs":
        return <ContentManagement />;
      case "faq":
        return <FAQManagement />;
      case "faqs":
        return <FAQManagement />;
      case "web-queries":
        return <UserManagement />;

      // System Settings
      case "system-status":
        return <SystemStatus />;
      case "login-test":
        return <SystemStatus />;
      case "settings":
        return <AdminSettings />;
      case "system-update":
        return <SystemUpdate />;
      case "auth-debug":
        return <AuthDebug />;
      case "role-debug":
        return <RoleDebug />;

      default:
        return <AdminDashboardSummary />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <StaffAdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </StaffAdminLayout>
  );
}
