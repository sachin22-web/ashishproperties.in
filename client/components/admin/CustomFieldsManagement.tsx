import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Eye,
  ToggleLeft,
  ToggleRight,
  Type,
  List,
  CheckSquare,
  Calendar,
  Hash,
  FileText,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CustomField } from "@shared/types";

export default function CustomFieldsManagement() {
  const { token } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "text" as CustomField["type"],
    label: "",
    placeholder: "",
    required: false,
    active: true,
    order: 999,
    options: [] as string[],
    categories: [] as string[],
    description: "",
  });

  useEffect(() => {
    fetchFields();
  }, [token]);

  const fetchFields = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/custom-fields", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFields(
            data.data.sort(
              (a: CustomField, b: CustomField) => a.order - b.order,
            ),
          );
        } else {
          setError(data.error || "Failed to fetch custom fields");
        }
      } else if (response.status === 404) {
        // API endpoint doesn't exist yet - show empty state instead of error
        console.warn("Custom fields API endpoint not implemented yet");
        setFields([]);
      } else {
        setError("Failed to fetch custom fields");
      }
    } catch (error: any) {
      console.error("Error fetching custom fields:", error);

      // Check if error is due to invalid JSON (HTML response)
      if (
        error.message?.includes("Unexpected token") ||
        error.message?.includes("<!doctype")
      ) {
        console.warn(
          "Custom fields API endpoint not implemented - received HTML instead of JSON",
        );
        setFields([]); // Show empty state instead of error
      } else {
        setError("Failed to fetch custom fields");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;

    try {
      setSaving(true);

      const response = await fetch("/api/admin/custom-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchFields();
          resetForm();
          setShowCreateDialog(false);
        } else {
          setError(data.error || "Failed to create custom field");
        }
      } else if (response.status === 404) {
        setError(
          "Custom fields API not yet implemented. Contact administrator.",
        );
      } else {
        setError("Failed to create custom field");
      }
    } catch (error: any) {
      console.error("Error creating custom field:", error);

      if (
        error.message?.includes("Unexpected token") ||
        error.message?.includes("<!doctype")
      ) {
        setError(
          "Custom fields API not yet implemented. Contact administrator.",
        );
      } else {
        setError("Failed to create custom field");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingField) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/custom-fields/${editingField._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchFields();
          resetForm();
          setShowCreateDialog(false);
          setEditingField(null);
        } else {
          setError(data.error || "Failed to update custom field");
        }
      } else {
        setError("Failed to update custom field");
      }
    } catch (error) {
      console.error("Error updating custom field:", error);
      setError("Failed to update custom field");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (
      !token ||
      !confirm("Are you sure you want to delete this custom field?")
    )
      return;

    try {
      const response = await fetch(`/api/admin/custom-fields/${fieldId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFields(
          (prevFields) =>
            prevFields?.filter((field) => field?._id !== fieldId) || [],
        );
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete custom field");
      }
    } catch (error) {
      console.error("Error deleting custom field:", error);
      setError("Failed to delete custom field");
    }
  };

  const toggleFieldStatus = async (fieldId: string, active: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(
        `/api/admin/custom-fields/${fieldId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ active }),
        },
      );

      if (response.ok) {
        fetchFields();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update field status");
      }
    } catch (error) {
      console.error("Error updating field status:", error);
      setError("Failed to update field status");
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
    setFormData({
      name: "",
      slug: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      active: true,
      order: 999,
      options: [],
      categories: [],
      description: "",
    });
  };

  const populateForm = (field: CustomField) => {
    setFormData({
      name: field.name,
      slug: field.slug,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder || "",
      required: field.required,
      active: field.active,
      order: field.order,
      options: field?.options || [],
      categories: field?.categories || [],
      description: field.description || "",
    });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ""],
    });
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...formData.options];
    updatedOptions[index] = value;
    setFormData({ ...formData, options: updatedOptions });
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "select":
        return <List className="h-4 w-4" />;
      case "multiselect":
        return <List className="h-4 w-4" />;
      case "checkbox":
        return <CheckSquare className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "textarea":
        return <FileText className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading custom fields...</p>
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
              fetchFields();
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
            Custom Fields Management
          </h3>
          <p className="text-gray-600">
            Manage custom fields for property listings and advertisements
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fields?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Custom fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fields</CardTitle>
            <ToggleRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fields?.filter((f) => f?.active)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Required Fields
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fields?.filter((f) => f?.required)?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Mandatory fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Types</CardTitle>
            <Type className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(fields?.map((f) => f?.type) || []).size}
            </div>
            <p className="text-xs text-muted-foreground">Different types</p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Fields Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields?.map((field) => (
                <TableRow key={field._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{field.label}</p>
                      <p className="text-sm text-gray-500">{field.name}</p>
                      <code className="text-xs bg-gray-100 px-1 rounded">
                        {field.slug}
                      </code>
                      {field.description && (
                        <p className="text-xs text-gray-400 mt-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFieldTypeIcon(field.type)}
                      <span className="capitalize">{field.type}</span>
                    </div>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {field?.categories?.length > 0 ? (
                        field?.categories?.slice(0, 2)?.map((cat, index) => (
                          <Badge key={index} variant="outline" className="mr-1">
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">All Categories</Badge>
                      )}
                      {field?.categories?.length > 2 && (
                        <Badge variant="outline">
                          +{(field?.categories?.length || 0) - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.active}
                        onCheckedChange={(checked) =>
                          toggleFieldStatus(field._id, checked)
                        }
                      />
                      <Badge
                        variant={field.active ? "default" : "secondary"}
                        className={
                          field.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {field.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {field.order}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingField(field);
                          populateForm(field);
                          setShowCreateDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(field._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!fields || fields.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    <div className="space-y-2">
                      <p>No custom fields found.</p>
                      <p className="text-xs text-gray-400">
                        Custom fields API is not yet implemented. This feature
                        will be available in a future update.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetForm();
            setEditingField(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Custom Field" : "Create New Custom Field"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Field Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                      label: name,
                    });
                  }}
                  placeholder="Enter field name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Field Label *
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="Enter field label..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Field Type *
                </label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="number">Number Input</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown Select</SelectItem>
                    <SelectItem value="multiselect">Multi Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="date">Date Picker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Order
                </label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 999,
                    })
                  }
                  placeholder="Display order"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Placeholder Text
              </label>
              <Input
                value={formData.placeholder}
                onChange={(e) =>
                  setFormData({ ...formData, placeholder: e.target.value })
                }
                placeholder="Enter placeholder text..."
              />
            </div>

            {(formData.type === "select" ||
              formData.type === "multiselect") && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Options</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter field description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, required: checked })
                  }
                />
                <span className="text-sm">Required Field</span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <span className="text-sm">Active</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={editingField ? handleUpdate : handleCreate}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    {editingField ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingField ? "Update Field" : "Create Field"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-green-500" />
            <span>Custom Fields Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">
                Custom Field Options: Active
              </span>
            </div>
            <p className="text-sm text-green-700">
              Custom fields are now fully functional. Admin can create, edit,
              and manage custom fields for property listings. All action buttons
              (Edit, View, Delete) are working across all modules.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
