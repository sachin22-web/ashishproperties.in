import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { OsCategory } from "@shared/types";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function OsCategoriesManagement() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<OsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OsCategory | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/os-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setCategories(data.data.categories);
      } else {
        setError(getApiErrorMessage(data, status, "fetch OS categories"));
      }
    } catch (error) {
      console.error("Error fetching OS categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !formData.name || !formData.slug) return;

    try {
      const response = await fetch("/api/admin/os-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchCategories();
        setShowCreateForm(false);
        setFormData({ name: "", slug: "", active: true });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "create category"));
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Failed to create category");
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingCategory || !formData.name || !formData.slug) return;

    try {
      const response = await fetch(
        `/api/admin/os-categories/${editingCategory._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchCategories();
        setEditingCategory(null);
        setFormData({ name: "", slug: "", active: true });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "update category"));
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category");
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!token || !confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await fetch(`/api/admin/os-categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchCategories();
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "delete category"));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category");
    }
  };

  const startEdit = (category: OsCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      active: category.active,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setShowCreateForm(false);
    setFormData({ name: "", slug: "", active: true });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
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
          <p className="text-gray-600">Manage other services categories</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <Input
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder="category-slug"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Active
              </label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreate}>
                <Save className="h-4 w-4 mr-2" />
                Save Category
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category._id}>
            <CardContent className="p-6">
              {editingCategory?._id === category._id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug
                    </label>
                    <Input
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`active-${category._id}`}
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                    />
                    <label
                      htmlFor={`active-${category._id}`}
                      className="text-sm text-gray-700"
                    >
                      Active
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">Slug: {category.slug}</p>
                    <Badge
                      variant={category.active ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {category.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(category)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category._id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No categories found. Create your first category above.
          </p>
        </div>
      )}
    </div>
  );
}
