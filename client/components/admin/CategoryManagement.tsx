import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Layers, Edit, Trash2, Plus, Eye, Search, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: {
    name: string;
    slug: string;
    count: number;
  }[];
  order: number;
  active: boolean;
  count: number;
}

export default function CategoryManagement() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    subcategories: [] as { name: string; slug: string }[],
  });

  // Edit / View state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const fetchCategories = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const list: Category[] = Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.data?.categories)
              ? data.data.categories
              : [];
          setCategories(list);
        } else {
          setError(data.error || "Failed to fetch categories");
        }
      } else {
        setError("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!token || !newCategory.name) return;

    try {
      const payload = {
        name: newCategory.name,
        iconUrl: newCategory.icon || "/placeholder.svg",
        sortOrder: 999,
        isActive: true,
      };

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        let err = "Failed to create category";
        try {
          err = JSON.parse(text).error || err;
        } catch (e) {}
        setError(err);
        return;
      }

      const data = await response.json();
      if (!data.success) {
        setError(data.error || "Failed to create category");
        return;
      }

      // Category created; now create subcategories (if any) using dedicated endpoint
      const createdCategory = data.data?.category || { _id: data.data?._id };
      const categoryId = createdCategory._id;

      for (let i = 0; i < newCategory.subcategories.length; i++) {
        const sub = newCategory.subcategories[i];
        if (!sub || !sub.name) continue;
        try {
          await fetch("/api/admin/subcategories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              categoryId,
              name: sub.name,
              iconUrl: newCategory.icon || "/placeholder.svg",
              sortOrder: i + 1,
              isActive: true,
            }),
          });
        } catch (e) {
          console.warn("Failed to create subcategory", sub, e);
        }
      }

      // Refresh and reset form
      fetchCategories(); // Refresh the list
      // Notify other parts of the app (e.g., public categories menu) to re-fetch
      try {
        window.dispatchEvent(new Event("categories:updated"));
      } catch {}
      setNewCategory({
        name: "",
        slug: "",
        description: "",
        icon: "",
        subcategories: [],
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Failed to create category");
    }
  };

  const updateCategory = async () => {
    if (!token || !editingCategory) return;

    try {
      const payload: any = {
        name: editingCategory.name,
        iconUrl:
          (editingCategory as any).icon ||
          editingCategory.iconUrl ||
          "/placeholder.svg",
        sortOrder:
          (editingCategory as any).order ??
          (editingCategory as any).sortOrder ??
          999,
        isActive: (editingCategory as any).active ?? true,
      };

      const response = await fetch(
        `/api/admin/categories/${editingCategory._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const text = await response.text();
        let err = "Failed to update category";
        try {
          err = JSON.parse(text).error || err;
        } catch (e) {}
        setError(err);
        return;
      }

      const data = await response.json();
      if (data.success) {
        fetchCategories();
        try {
          window.dispatchEvent(new Event("categories:updated"));
        } catch {}
        setEditingCategory(null);
        setIsEditDialogOpen(false);
      } else {
        setError(data.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!token || !confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const { safeReadResponse, getApiErrorMessage } = await import(
        "../../lib/response-utils"
      );
      const { ok, status, data } = await safeReadResponse(response);

      if (ok) {
        setCategories(categories.filter((cat) => cat._id !== categoryId));
        try {
          window.dispatchEvent(new Event("categories:updated"));
        } catch {}
      } else {
        setError(getApiErrorMessage(data, status, "delete category"));
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Failed to delete category");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const addSubcategory = () => {
    setNewCategory({
      ...newCategory,
      subcategories: [...newCategory.subcategories, { name: "", slug: "" }],
    });
  };

  const updateSubcategory = (index: number, field: string, value: string) => {
    const updatedSubcategories = [...newCategory.subcategories];
    updatedSubcategories[index] = {
      ...updatedSubcategories[index],
      [field]: value,
    };
    if (field === "name") {
      updatedSubcategories[index].slug = generateSlug(value);
    }
    setNewCategory({ ...newCategory, subcategories: updatedSubcategories });
  };

  const removeSubcategory = (index: number) => {
    setNewCategory({
      ...newCategory,
      subcategories: newCategory.subcategories.filter((_, i) => i !== index),
    });
  };

  const filteredCategories = categories.filter((category) => {
    return (
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchCategories();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Category Management
          </h3>
          <p className="text-gray-600">
            Manage property categories and subcategories
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Name
                </label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setNewCategory({
                      ...newCategory,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  placeholder="Enter category name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={newCategory.slug}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, slug: e.target.value })
                  }
                  placeholder="category-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter category description..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <Input
                  value={newCategory.icon}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, icon: e.target.value })
                  }
                  placeholder="Icon name (e.g., Home, Building, etc.)"
                />
              </div>

              {/* Subcategories */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">
                    Subcategories
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubcategory}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subcategory
                  </Button>
                </div>
                {newCategory.subcategories.map((sub, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <Input
                      placeholder="Subcategory name"
                      value={sub.name}
                      onChange={(e) =>
                        updateSubcategory(index, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="subcategory-slug"
                      value={sub.slug}
                      onChange={(e) =>
                        updateSubcategory(index, "slug", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSubcategory(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createCategory}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  Create Category
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            {editingCategory ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category Name
                  </label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter category name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <Input
                    value={editingCategory.slug}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        slug: e.target.value,
                      })
                    }
                    placeholder="category-slug"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editingCategory.description}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter category description..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Icon</label>
                  <Input
                    value={editingCategory.icon}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        icon: e.target.value,
                      })
                    }
                    placeholder="Icon name (e.g., Home, Building, etc.)"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      setIsEditDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateCategory}
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No category selected</div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>View Category</DialogTitle>
            </DialogHeader>
            {viewCategory ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">{viewCategory.name}</h4>
                  <p className="text-sm text-gray-600">
                    {viewCategory.description}
                  </p>
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {viewCategory.slug}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium">Subcategories</p>
                  <div className="space-y-2 mt-2">
                    {(viewCategory.subcategories || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <div>{s.name}</div>
                        <div className="text-xs text-gray-500">
                          {s.count ?? 0}
                        </div>
                      </div>
                    ))}
                    {(viewCategory.subcategories || []).length === 0 && (
                      <div className="text-sm text-gray-500">
                        No subcategories
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewCategory(null);
                      setIsViewDialogOpen(false);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No category selected</div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Categories
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Property categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Categories
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.filter((c) => c.active).length}
            </div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + (cat.count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subcategories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce(
                (sum, cat) =>
                  sum + (cat.subcategories ? cat.subcategories.length : 0),
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total subcategories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Subcategories</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {category.slug}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(category.subcategories || [])
                        .slice(0, 3)
                        .map((sub, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="mr-1 mb-1"
                          >
                            {sub.name} ({sub.count})
                          </Badge>
                        ))}
                      {(category.subcategories || []).length > 3 && (
                        <Badge variant="outline">
                          +{(category.subcategories || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{category.count ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={category.active ? "default" : "secondary"}
                      className={
                        category.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {category.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.order ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setViewCategory(category);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCategory(category._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
