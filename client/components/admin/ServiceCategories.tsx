import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Category } from "@shared/types";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function ServiceCategories() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    icon: "🔧",
    description: "",
    order: 1,
    active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories?type=service", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setCategories(data.data);
      } else {
        setError(getApiErrorMessage(data, status, "fetch service categories"));
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
      setError("Failed to fetch service categories");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        iconUrl: formData.icon || "/placeholder.svg",
        sortOrder: (formData as any).order ?? 999,
        isActive: (formData as any).active ?? true,
        type: "service",
      };
      // include subcategories only when updating
      if (editingCategory) payload.subcategories = editingCategory.subcategories || [];

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchCategories();
        resetForm();
        setShowCreateForm(false);
        setEditingCategory(null);
      } else {
        setError(
          getApiErrorMessage(
            data,
            status,
            editingCategory ? "update" : "create",
          ),
        );
      }
    } catch (error) {
      console.error("Error saving category:", error);
      setError("Failed to save category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!token || !confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok) {
        await fetchCategories();
      } else {
        setError(getApiErrorMessage(data, status, "delete category"));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      icon: "🔧",
      description: "",
      order: 1,
      active: true,
    });
  };

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description || "",
      order: category.order,
      active: category.active,
    });
    setEditingCategory(category);
    setShowCreateForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Service Categories
          </h2>
          <p className="text-gray-600">
            Manage categories for service listings
          </p>
        </div>
        <Button
          data-testid="add-service-category-btn"
          onClick={() => setShowCreateForm(true)}
          className="bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card data-testid="service-category-form">
          <CardHeader>
            <CardTitle>
              {editingCategory
                ? "Edit Service Category"
                : "Create Service Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  data-testid="category-name-input"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="category-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <Input
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="🔧"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Order</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.active ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button
                data-testid="save-category-btn"
                onClick={handleSubmit}
                className="bg-[#C70000] hover:bg-[#A60000] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCategory ? "Update" : "Create"} Category
              </Button>
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div data-testid="service-categories-list" className="space-y-4">
        {categories.map((category) => (
          <Card
            key={category._id}
            data-testid={`service-category-${category._id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span>Slug: {category.slug}</span>
                      <span>Order: {category.order}</span>
                      <span>
                        Subcategories: {category.subcategories?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={
                      category.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {category.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    data-testid={`edit-category-${category._id}`}
                    onClick={() => startEdit(category)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    data-testid={`delete-category-${category._id}`}
                    onClick={() => handleDelete(category._id!)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No service categories yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first service category to get started.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service Category
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
