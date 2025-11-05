// Role-based permission mapping
export const rolePermissions: Record<string, string[]> = {
  super_admin: [
    "dashboard.view", "content.manage", "content.create", "content.view", 
    "ads.manage", "ads.view", "ads.approve", "categories.manage",
    "packages.manage", "payments.manage", "payments.view", "payments.approve",
    "users.manage", "users.view", "sellers.manage", "sellers.verify", "sellers.view",
    "locations.manage", "reports.manage", "reports.view", "promotions.manage",
    "notifications.send", "staff.manage", "roles.manage", "blog.manage", "blog.view",
    "support.view", "system.manage", "system.view", "system.test", "system.update", "system.debug",
    "analytics.view"
  ],
  content_manager: [
    "dashboard.view", "content.manage", "content.create", "content.view",
    "blog.manage", "blog.view", "ads.view", "support.view"
  ],
  sales_manager: [
    "dashboard.view", "users.view", "sellers.manage", "sellers.verify", "sellers.view",
    "payments.view", "packages.manage", "ads.view", "analytics.view"
  ],
  support_executive: [
    "dashboard.view", "users.view", "support.view", "reports.view", "content.view"
  ],
  admin: [
    "dashboard.view", "content.view", "users.view", "ads.view", "analytics.view"
  ]
};

// Check if user has a specific permission
export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions = rolePermissions[userRole] || rolePermissions.admin;
  return permissions.includes(permission);
};

// Check if user has any of the required permissions
export const hasAnyPermission = (userRole: string, requiredPermissions: string[]): boolean => {
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
};

// Get all permissions for a role
export const getRolePermissions = (userRole: string): string[] => {
  return rolePermissions[userRole] || rolePermissions.admin;
};

// Get role display name
export const getRoleDisplayName = (role: string): string => {
  const roleDisplayNames: Record<string, string> = {
    super_admin: "Super Admin",
    content_manager: "Content Manager", 
    sales_manager: "Sales Manager",
    support_executive: "Support Executive",
    admin: "Admin"
  };
  return roleDisplayNames[role] || "Staff";
};

// Check if user can access a specific section
export const canAccessSection = (userRole: string, sectionId: string): boolean => {
  const sectionPermissions: Record<string, string[]> = {
    "dashboard": ["dashboard.view"],
    "content-management": ["content.create"],
    "static-pages": ["content.view"],
    "pages": ["content.manage"],
    "ads-listing": ["ads.view"],
    "categories": ["categories.manage"],
    "custom-fields": ["ads.manage"],
    "ad-management": ["ads.manage"],
    "ad-requested": ["ads.approve"],
    "pending-approval": ["ads.approve"],
    "premium-approvals": ["ads.approve"],
    "ad-tips": ["content.manage"],
    "package-management": ["packages.manage"],
    "listing-package": ["packages.manage"],
    "feature-package": ["packages.manage"],
    "transactions": ["payments.view"],
    "manual-payment-approval": ["payments.approve"],
    "bank-transfer": ["payments.manage"],
    "all-users": ["users.view"],
    "user-analytics": ["analytics.view"],
    "seller-management": ["sellers.manage"],
    "verification-fields": ["sellers.manage"],
    "seller-verification": ["sellers.verify"],
    "seller-review": ["sellers.view"],
    "seller-review-report": ["sellers.view"],
    "slider": ["content.manage"],
    "feature-section": ["content.manage"],
    "countries": ["locations.manage"],
    "states": ["locations.manage"],
    "cities": ["locations.manage"],
    "areas": ["locations.manage"],
    "report-reasons": ["reports.manage"],
    "user-reports": ["reports.view"],
    "send-notification": ["notifications.send"],
    "customers": ["users.view"],
    "role": ["roles.manage"],
    "staff-management": ["staff.manage"],
    "footer-management": ["content.manage"],
    "blog-management": ["blog.manage"],
    "blogs": ["blog.view"],
    "faq": ["content.manage"],
    "faqs": ["content.view"],
    "web-queries": ["support.view"],
    "system-status": ["system.view"],
    "login-test": ["system.test"],
    "settings": ["system.manage"],
    "system-update": ["system.update"],
    "auth-debug": ["system.debug"]
  };

  const requiredPermissions = sectionPermissions[sectionId] || [];
  return hasAnyPermission(userRole, requiredPermissions);
};
