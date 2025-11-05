import React from "react";
import EnhancedCategoryManagement from "@/components/admin/EnhancedCategoryManagement";
import AdminLayout from "@/components/AdminLayout";

export default function CategoriesPage() {
  return (
    <AdminLayout
      activeSection="categories"
      onSectionChange={(section) => {
        if (section === "categories") window.location.href = "/admin/ads/categories";
        else if (section === "countries") window.location.href = "/admin/locations/countries";
        else window.location.href = "/admin";
      }}
    >
      <EnhancedCategoryManagement />
    </AdminLayout>
  );
}
