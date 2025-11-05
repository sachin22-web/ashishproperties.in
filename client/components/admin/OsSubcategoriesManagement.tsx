import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { OsCategory, OsSubcategory } from "@shared/types";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function OsSubcategoriesManagement() {
  const { token } = useAuth();
  const [subcategories, setSubcategories] = useState<OsSubcategory[]>([]);
  const [categories, setCategories] = useState<OsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSubcategory, setEditingSubcategory] =
    useState<OsSubcategory | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    slug: "",
    active: true,
  });

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/os-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/os-subcategories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setSubcategories(data.data.subcategories);
      } else {
        setError(getApiErrorMessage(data, status, "fetch OS subcategories"));
      }
    } catch (error) {
      console.error("Error fetching OS subcategories:", error);
      setError("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token || !formData.name || !formData.slug || !formData.category)
      return;

    try {
      const response = await fetch("/api/admin/os-subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchSubcategories();
        setShowCreateForm(false);
        setFormData({ category: "", name: "", slug: "", active: true });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "create subcategory"));
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
      setError("Failed to create subcategory");
    }
  };

  const handleUpdate = async () => {
    if (
      !token ||
      !editingSubcategory ||
      !formData.name ||
      !formData.slug ||
      !formData.category
    )
      return;

    try {
      const response = await fetch(
        `/api/admin/os-subcategories/${editingSubcategory._id}`,
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
        await fetchSubcategories();
        setEditingSubcategory(null);
        setFormData({ category: "", name: "", slug: "", active: true });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "update subcategory"));
      }
    } catch (error) {
      console.error("Error updating subcategory:", error);
      setError("Failed to update subcategory");
    }
  };

  const handleDelete = async (subcategoryId: string) => {
    if (!token || !confirm("Are you sure you want to delete this subcategory?"))
      return;

    try {
      const response = await fetch(
        `/api/admin/os-subcategories/${subcategoryId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchSubcategories();
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "delete subcategory"));
      }
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      setError("Failed to delete subcategory");
    }
  };

  const startEdit = (subcategory: OsSubcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      category: subcategory.category,
      name: subcategory.name,
      slug: subcategory.slug,
      active: subcategory.active,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingSubcategory(null);
    setShowCreateForm(false);
    setFormData({ category: "", name: "", slug: "", active: true });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find((cat) => cat.slug === categorySlug);
    return category ? category.name : categorySlug;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subcategories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Service Subcategories
          </h2>
          <p className="text-gray-600">
            Manage subcategories for service categories
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subcategory
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
            <CardTitle>Create New Subcategory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((cat) => cat.active)
                    .map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
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
                placeholder="Subcategory name"
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
                placeholder="subcategory-slug"
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
                Save Subcategory
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

      {/* Subcategories List */}
      <div className="grid gap-4">
        {subcategories.map((subcategory) => (
          <Card key={subcategory._id}>
            <CardContent className="p-6">
              {editingSubcategory?._id === subcategory._id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((cat) => cat.active)
                          .map((category) => (
                            <SelectItem
                              key={category.slug}
                              value={category.slug}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      id={`active-${subcategory._id}`}
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                    />
                    <label
                      htmlFor={`active-${subcategory._id}`}
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
                      {subcategory.name}
                    </h3>
                    <p className="text-gray-600">
                      Category: {getCategoryName(subcategory.category)} | Slug:{" "}
                      {subcategory.slug}
                    </p>
                    <Badge
                      variant={subcategory.active ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {subcategory.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(subcategory)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(subcategory._id!)}
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

      {subcategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No subcategories found. Create your first subcategory above.
          </p>
        </div>
      )}
    </div>
  );
}
