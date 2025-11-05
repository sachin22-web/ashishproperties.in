import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Search,
  GripVertical,
  Image as ImageIcon,
} from "lucide-react";
import { Category } from "@shared/types";
import { useToast } from "../ui/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AdminCategoriesProps {
  token: string;
}

interface SortableCategoryRowProps {
  category: Category & { subcategoryCount?: number };
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onToggleActive: (category: Category) => void;
}

// Sortable row component for drag-and-drop
function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableCategoryRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category._id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="hover:bg-gray-50">
      <TableCell>
        <div className="flex items-center space-x-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
            <img
              src={category.iconUrl}
              alt={category.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="font-mono text-sm text-gray-600">
        {category.slug}
      </TableCell>
      <TableCell>{category.sortOrder}</TableCell>
      <TableCell>
        <span className="text-sm text-gray-500">
          {category.subcategoryCount || 0}
        </span>
      </TableCell>
      <TableCell>
        <Switch
          checked={category.isActive}
          onCheckedChange={() => onToggleActive(category)}
        />
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category._id!)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminCategoriesNew({ token }: AdminCategoriesProps) {
  const [categories, setCategories] = useState<
    (Category & { subcategoryCount?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    iconUrl: "",
    sortOrder: 1,
    isActive: true,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    fetchCategories();
  }, [search, currentPage]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const { apiRequest } = await import("@/lib/api");
      const resp = await apiRequest(`admin/categories?${params}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = resp.data as any;
      if (resp.ok && data && data.success) {
        setCategories(data.data.categories);
        setTotalPages(data.data.pagination.pages);
        setTotal(data.data.pagination.total);
      } else {
        toast({
          title: "Error",
          description:
            (data && (data.error || data.message)) || `HTTP ${resp.status}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIconUpload = async (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 1MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("icon", file);

      const { apiRequest } = await import("@/lib/api");
      const response = await apiRequest("admin/categories/upload-icon", {
        method: "POST",
        body: uploadFormData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok && response.data && response.data.success) {
        handleInputChange(
          "iconUrl",
          response.data.data.iconUrl || response.data.iconUrl,
        );
        toast({
          title: "Success",
          description: "Icon uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description:
            (response.data && response.data.error) || "Failed to upload icon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading icon:", error);
      toast({
        title: "Error",
        description: "Failed to upload icon",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.iconUrl.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const isEditing = !!editingCategory;
      const url = isEditing
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";

      const method = isEditing ? "PUT" : "POST";

      // Optimistic update for editing
      if (isEditing) {
        const updatedCategory = { ...editingCategory, ...formData };
        setCategories((prev) =>
          prev.map((c) =>
            c._id === editingCategory._id ? updatedCategory : c,
          ),
        );
      }

      const { apiRequest } = await import("@/lib/api");
      const resp = await apiRequest(url.replace(/^\/api\//, ""), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = resp.data as any;

      if (resp.ok && data && data.success) {
        toast({
          title: "Success",
          description: `Category ${isEditing ? "updated" : "created"} successfully`,
        });
        window.dispatchEvent(new Event("categories:updated"));
        fetchCategories(); // Refresh to get accurate data
        resetForm();
        setShowDialog(false);
      } else {
        // Revert optimistic update on error
        if (isEditing) {
          setCategories((prev) =>
            prev.map((c) =>
              c._id === editingCategory._id ? editingCategory : c,
            ),
          );
        }
        toast({
          title: "Error",
          description:
            (data && data.error) ||
            `Failed to ${isEditing ? "update" : "create"} category`,
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) =>
            c._id === editingCategory._id ? editingCategory : c,
          ),
        );
      }
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingCategory ? "update" : "create"} category`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      // Optimistic update
      const categoryToDelete = categories.find((c) => c._id === categoryId);
      setCategories((prev) => prev.filter((c) => c._id !== categoryId));

      const { apiRequest } = await import("@/lib/api");
      const resp = await apiRequest(`admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = resp.data as any;

      if (resp.ok && data && data.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        window.dispatchEvent(new Event("categories:updated"));
        fetchCategories(); // Refresh pagination counts
      } else {
        // Revert optimistic update on error
        if (categoryToDelete) {
          setCategories((prev) => [...prev, categoryToDelete]);
        }
        toast({
          title: "Error",
          description: (data && data.error) || "Failed to delete category",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      fetchCategories();
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      // Optimistic update
      const updatedCategory = { ...category, isActive: !category.isActive };
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? updatedCategory : c)),
      );

      const { apiRequest } = await import("@/lib/api");
      const resp = await apiRequest(`admin/categories/${category._id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = resp.data as any;

      if (!(resp.ok && data && data.success)) {
        // Revert optimistic update on error
        setCategories((prev) =>
          prev.map((c) => (c._id === category._id ? category : c)),
        );
        toast({
          title: "Error",
          description: (data && data.error) || "Failed to update category",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? category : c)),
      );
      console.error("Error toggling category:", error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      iconUrl: category.iconUrl,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setShowDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      iconUrl: "",
      sortOrder: 1,
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item._id === active.id);
      const newIndex = categories.findIndex((item) => item._id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);

      // Optimistic update
      setCategories(newCategories);

      // Update sort orders
      const updates = newCategories.map((category, index) => ({
        id: category._id,
        sortOrder: index + 1,
      }));

      try {
        const { apiRequest } = await import("@/lib/api");
        const resp = await apiRequest("admin/categories/sort-order", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ updates }),
        });

        const data = resp.data as any;

        if (!(resp.ok && data && data.success)) {
          // Revert on error
          fetchCategories();
          toast({
            title: "Error",
            description: (data && data.error) || "Failed to update sort order",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Category order updated successfully",
          });
          window.dispatchEvent(new Event("categories:updated"));
        }
      } catch (error) {
        console.error("Error updating sort order:", error);
        fetchCategories(); // Revert on error
        toast({
          title: "Error",
          description: "Failed to update sort order",
          variant: "destructive",
        });
      }
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
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
        <h1 className="text-2xl font-bold text-gray-900">
          Category Management
        </h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter category name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Slug will be auto-generated
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon *</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={formData.iconUrl}
                      onChange={(e) =>
                        handleInputChange("iconUrl", e.target.value)
                      }
                      placeholder="Enter icon URL or upload image"
                      required
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconUpload(file);
                      }}
                      className="hidden"
                      id="icon-upload"
                    />
                    <label
                      htmlFor="icon-upload"
                      className="px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex items-center"
                    >
                      <Upload className="h-4 w-4" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Max file size: 1MB</p>
                  {formData.iconUrl && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={formData.iconUrl}
                        alt="Category icon preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sort Order
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    handleInputChange(
                      "sortOrder",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                  }
                />
                <label className="text-sm font-medium">Active</label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  className="bg-[#C70000] hover:bg-[#A60000] text-white"
                  disabled={uploading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search categories..."
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {total} categor{total !== 1 ? "ies" : "y"}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-20">Subcats</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={categories.map((c) => c._id!)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {categories.map((category) => (
                  <SortableCategoryRow
                    key={category._id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>

        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No categories
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new category.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
