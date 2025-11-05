import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Layers,
  Edit,
  Trash2,
  Plus,
  Eye,
  Search,
  Filter,
  Upload,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Power,
  PowerOff,
  Image,
  Grid,
  Settings,
  FileImage,
  DragHandleDots2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    count: number;
  }[];
  order: number;
  active: boolean;
  count: number;
}

export default function CompleteCategoryManagement() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    iconFile: null as File | null,
    subcategories: [] as {
      name: string;
      slug: string;
      description: string;
      imageFile?: File;
    }[],
    order: 999,
    active: true,
  });

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
          setCategories(
            list.sort(
              (a: Category, b: Category) => (a?.order ?? 0) - (b?.order ?? 0),
            ),
          );
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

  const uploadIcon = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("icon", file);

    const { apiRequest } = await import("@/lib/api");
    const response = await apiRequest("admin/categories/upload-icon", {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok && response.data && response.data.success) {
      return response.data.data.iconUrl || response.data.iconUrl;
    }
    throw new Error(response.data?.error || "Failed to upload icon");
  };

  const createCategory = async () => {
    if (!token || !newCategory.name) return;

    try {
      setUploading(true);
      let iconUrl = (newCategory as any).icon || "";

      // Upload icon if file is selected
      if (newCategory.iconFile) {
        iconUrl = await uploadIcon(newCategory.iconFile);
      }

      // Prepare category payload matching server API
      const payload = {
        name: newCategory.name,
        iconUrl: iconUrl || "/placeholder.svg",
        sortOrder: newCategory.order ?? 999,
        isActive: newCategory.active ?? true,
      };

      const { api } = await import("@/lib/api");
      const result = await api.post("admin/categories", payload, token);

      const data = result?.data;
      if (!result || !data || !data.success) {
        setError(data.error || "Failed to create category");
        setUploading(false);
        return;
      }

      const createdCategoryId = data.data?.category?._id || data.data?._id;

      // Create subcategories separately if provided
      if (
        newCategory.subcategories &&
        newCategory.subcategories.length &&
        createdCategoryId
      ) {
        for (let i = 0; i < newCategory.subcategories.length; i++) {
          const sub = newCategory.subcategories[i];
          try {
            await (
              await import("@/lib/api")
            ).api.post(
              "admin/subcategories",
              {
                categoryId: createdCategoryId,
                name: sub.name,
                iconUrl: iconUrl || "/placeholder.svg",
                sortOrder: i + 1,
                isActive: true,
              },
              token,
            );
          } catch (e) {
            console.warn("Failed to create subcategory", sub, e);
          }
        }
      }

      fetchCategories();
      resetForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
      setError("Failed to create category");
    } finally {
      setUploading(false);
    }
  };

  const updateCategory = async (
    categoryId: string,
    updates: Partial<Category>,
  ) => {
    if (!token) return;

    try {
      const payload: any = { ...updates };
      if ((payload as any).icon) {
        payload.iconUrl = (payload as any).icon;
        delete payload.icon;
      }
      if ((payload as any).order !== undefined) {
        payload.sortOrder = (payload as any).order;
        delete payload.order;
      }

      const { api } = await import("@/lib/api");
      const res = await api.put(
        `admin/categories/${categoryId}`,
        payload,
        token,
      );

      if (res && res.data && res.data.success) {
        fetchCategories();
      } else {
        setError(res?.data?.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category");
    }
  };

  const toggleCategoryStatus = async (categoryId: string, active: boolean) => {
    await updateCategory(categoryId, { active });
  };

  const updateCategoryOrder = async (
    categoryId: string,
    direction: "up" | "down",
  ) => {
    const currentIndex = categories.findIndex((c) => c._id === categoryId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= categories.length) return;

    const currentCategory = categories[currentIndex];
    const targetCategory = categories[newIndex];

    // Swap orders
    await updateCategory(currentCategory._id, { order: targetCategory.order });
    await updateCategory(targetCategory._id, { order: currentCategory.order });
  };

  const deleteCategory = async (categoryId: string) => {
    if (
      !token ||
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    )
      return;

    try {
      const { api } = await import("@/lib/api");
      const res = await api.delete(`admin/categories/${categoryId}`, token);

      if (res && res.data && res.data.success) {
        setCategories(categories.filter((cat) => cat._id !== categoryId));
      } else {
        setError(res?.data?.error || "Failed to delete category");
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

  const resetForm = () => {
    setNewCategory({
      name: "",
      slug: "",
      description: "",
      icon: "",
      iconFile: null,
      subcategories: [],
      order: 999,
      active: true,
    });
    setEditingCategory(null);
  };

  const addSubcategory = () => {
    setNewCategory({
      ...newCategory,
      subcategories: [
        ...newCategory.subcategories,
        { name: "", slug: "", description: "" },
      ],
    });
  };

  const updateSubcategory = (
    index: number,
    field: string,
    value: string | File,
  ) => {
    const updatedSubcategories = [...newCategory.subcategories];
    if (field === "imageFile") {
      updatedSubcategories[index] = {
        ...updatedSubcategories[index],
        [field]: value,
      };
    } else {
      updatedSubcategories[index] = {
        ...updatedSubcategories[index],
        [field]: value,
      };
      if (field === "name") {
        updatedSubcategories[index].slug = generateSlug(value as string);
      }
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
    const matchesSearch =
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && category.active) ||
      (filterStatus === "inactive" && !category.active);
    return matchesSearch && matchesFilter;
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
            Complete Category Management
          </h3>
          <p className="text-gray-600">
            Full control over categories, subcategories, icons, and display
            order
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
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
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter((c) => c.active).length}
            </div>
            <p className="text-xs text-muted-foreground">Published & visible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Grid className="h-4 w-4 text-muted-foreground" />
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
                (sum, cat) => sum + (cat.subcategories?.length || 0),
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total subcategories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterStatus}
          onValueChange={(value: any) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Subcategories</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category, index) => (
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
                    {category.icon ? (
                      <div className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center">
                        {category.icon.startsWith("http") ? (
                          <img
                            src={category.icon}
                            alt="Category icon"
                            className="w-6 h-6 object-cover rounded"
                          />
                        ) : (
                          <span className="text-lg">{category.icon}</span>
                        )}
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Image className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(category.subcategories || [])
                        .slice(0, 3)
                        .map((sub, subIndex) => (
                          <Badge
                            key={subIndex}
                            variant="outline"
                            className="mr-1 mb-1"
                          >
                            {sub.name} ({sub.count || 0})
                          </Badge>
                        ))}
                      {(category.subcategories?.length || 0) > 3 && (
                        <Badge variant="outline">
                          +{(category.subcategories?.length || 0) - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{category.count || 0}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.active}
                        onCheckedChange={(checked) =>
                          toggleCategoryStatus(category._id, checked)
                        }
                      />
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {category.order || 0}
                      </span>
                      <div className="flex flex-col">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateCategoryOrder(category._id, "up")
                          }
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateCategoryOrder(category._id, "down")
                          }
                          disabled={index === filteredCategories.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(category);
                          setNewCategory({
                            name: category.name,
                            slug: category.slug,
                            description: category.description,
                            icon: category.icon,
                            iconFile: null,
                            subcategories: (category.subcategories || []).map(
                              (sub) => ({
                                name: sub.name || "",
                                slug: sub.slug || "",
                                description: sub.description || "",
                              }),
                            ),
                            order: category.order,
                            active: category.active,
                          });
                          setIsCreateDialogOpen(true);
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Name *
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
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={newCategory.slug}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, slug: e.target.value })
                  }
                  placeholder="category-slug"
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Icon URL or Emoji
                </label>
                <Input
                  value={newCategory.icon}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, icon: e.target.value })
                  }
                  placeholder="🏠 or https://example.com/icon.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Icon
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewCategory({ ...newCategory, iconFile: file });
                      }
                    }}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={newCategory.order}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      order: parseInt(e.target.value) || 999,
                    })
                  }
                  placeholder="Display order (lower = first)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={newCategory.active}
                    onCheckedChange={(checked) =>
                      setNewCategory({ ...newCategory, active: checked })
                    }
                  />
                  <span className="text-sm">
                    {newCategory.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Subcategories Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
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

              <div className="space-y-4">
                {newCategory.subcategories.map((sub, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Subcategory Name
                        </label>
                        <Input
                          placeholder="Subcategory name"
                          value={sub.name}
                          onChange={(e) =>
                            updateSubcategory(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Slug
                        </label>
                        <Input
                          placeholder="subcategory-slug"
                          value={sub.slug}
                          onChange={(e) =>
                            updateSubcategory(index, "slug", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-medium mb-1">
                        Description
                      </label>
                      <Textarea
                        placeholder="Subcategory description..."
                        value={sub.description}
                        onChange={(e) =>
                          updateSubcategory(
                            index,
                            "description",
                            e.target.value,
                          )
                        }
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Image
                        </label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateSubcategory(index, "imageFile", file);
                            }
                          }}
                          className="w-48"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSubcategory(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={createCategory}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    {editingCategory ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingCategory ? "Update Category" : "Create Category"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
