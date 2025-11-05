import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Save,
  X,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface VerificationField {
  _id: string;
  fieldName: string;
  fieldType: "text" | "number" | "email" | "phone" | "file" | "select" | "date";
  label: string;
  placeholder: string;
  description: string;
  required: boolean;
  options?: string[]; // For select type
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    fileTypes?: string[];
    maxFileSize?: number;
  };
  order: number;
  active: boolean;
  category: "personal" | "business" | "document" | "contact";
  createdAt: string;
  updatedAt: string;
}

export default function SellerVerificationFields() {
  const { token } = useAuth();
  const [fields, setFields] = useState<VerificationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<VerificationField | null>(null);
  const [newField, setNewField] = useState<Partial<VerificationField>>({
    fieldName: "",
    fieldType: "text",
    label: "",
    placeholder: "",
    description: "",
    required: true,
    category: "personal",
    active: true,
    options: [],
  });

  useEffect(() => {
    fetchVerificationFields();
  }, [token]);

  const fetchVerificationFields = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      // Mock data for demonstration
      const mockFields: VerificationField[] = [
        {
          _id: "1",
          fieldName: "fullName",
          fieldType: "text",
          label: "Full Name",
          placeholder: "Enter your full name",
          description: "Legal name as per government documents",
          required: true,
          order: 1,
          active: true,
          category: "personal",
          validation: { minLength: 2, maxLength: 100 },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          _id: "2",
          fieldName: "aadhaarNumber",
          fieldType: "text",
          label: "Aadhaar Number",
          placeholder: "Enter 12-digit Aadhaar number",
          description: "Government issued Aadhaar card number",
          required: true,
          order: 2,
          active: true,
          category: "document",
          validation: { pattern: "^[0-9]{12}$" },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          _id: "3",
          fieldName: "panNumber",
          fieldType: "text",
          label: "PAN Number",
          placeholder: "Enter PAN number",
          description: "Permanent Account Number",
          required: true,
          order: 3,
          active: true,
          category: "document",
          validation: { pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$" },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          _id: "4",
          fieldName: "businessType",
          fieldType: "select",
          label: "Business Type",
          placeholder: "Select business type",
          description: "Type of real estate business",
          required: true,
          order: 4,
          active: true,
          category: "business",
          options: ["Individual Agent", "Real Estate Agency", "Property Developer", "Broker"],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          _id: "5",
          fieldName: "experienceYears",
          fieldType: "number",
          label: "Years of Experience",
          placeholder: "Enter years of experience",
          description: "Total years in real estate business",
          required: true,
          order: 5,
          active: true,
          category: "business",
          validation: { minLength: 0, maxLength: 50 },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          _id: "6",
          fieldName: "addressProof",
          fieldType: "file",
          label: "Address Proof",
          placeholder: "Upload address proof",
          description: "Government issued address proof document",
          required: true,
          order: 6,
          active: true,
          category: "document",
          validation: { fileTypes: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5 },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      setFields(mockFields);

    } catch (error) {
      console.error("Error fetching verification fields:", error);
      setError("Failed to fetch verification fields");
    } finally {
      setLoading(false);
    }
  };

  const createField = async () => {
    if (!token || !newField.fieldName || !newField.label) return;

    try {
      const fieldData: VerificationField = {
        ...newField,
        _id: Date.now().toString(),
        order: fields.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as VerificationField;

      setFields([...fields, fieldData]);
      setNewField({
        fieldName: "",
        fieldType: "text",
        label: "",
        placeholder: "",
        description: "",
        required: true,
        category: "personal",
        active: true,
        options: [],
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating field:", error);
      setError("Failed to create verification field");
    }
  };

  const updateField = async (fieldId: string, updates: Partial<VerificationField>) => {
    if (!token) return;

    try {
      setFields(fields.map(field => 
        field._id === fieldId 
          ? { ...field, ...updates, updatedAt: new Date().toISOString() }
          : field
      ));
    } catch (error) {
      console.error("Error updating field:", error);
      setError("Failed to update verification field");
    }
  };

  const deleteField = async (fieldId: string) => {
    if (!token || !confirm("Are you sure you want to delete this verification field?")) return;

    try {
      setFields(fields.filter(field => field._id !== fieldId));
    } catch (error) {
      console.error("Error deleting field:", error);
      setError("Failed to delete verification field");
    }
  };

  const filteredFields = fields.filter(field => {
    const matchesSearch = field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         field.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || field.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalFields: fields.length,
    activeFields: fields.filter(f => f.active).length,
    requiredFields: fields.filter(f => f.required).length,
    categoriesCount: [...new Set(fields.map(f => f.category))].length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading verification fields...</p>
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
              fetchVerificationFields();
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
          <h3 className="text-2xl font-bold text-gray-900">Seller Verification Fields</h3>
          <p className="text-gray-600">Configure verification requirements for sellers</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Verification Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Field Name</label>
                  <Input
                    value={newField.fieldName}
                    onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
                    placeholder="e.g., fullName"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Field Type</label>
                  <Select value={newField.fieldType} onValueChange={(value: any) => setNewField({ ...newField, fieldType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="select">Select Dropdown</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Label</label>
                <Input
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="e.g., Full Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Placeholder</label>
                <Input
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="e.g., Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={newField.description}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  placeholder="Describe what this field is for..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Select value={newField.category} onValueChange={(value: any) => setNewField({ ...newField, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal Info</SelectItem>
                      <SelectItem value="business">Business Info</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                      <SelectItem value="contact">Contact Details</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={newField.required}
                      onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    />
                    <label htmlFor="required" className="text-sm">Required</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={newField.active}
                      onChange={(e) => setNewField({ ...newField, active: e.target.checked })}
                    />
                    <label htmlFor="active" className="text-sm">Active</label>
                  </div>
                </div>
              </div>
              
              {newField.fieldType === "select" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Options (comma separated)</label>
                  <Input
                    value={newField.options?.join(", ") || ""}
                    onChange={(e) => setNewField({ 
                      ...newField, 
                      options: e.target.value.split(", ").filter(opt => (( opt ?? "" ).trim()) !== "")
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createField} className="bg-[#C70000] hover:bg-[#A60000]">
                  Create Field
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFields}</div>
            <p className="text-xs text-muted-foreground">Verification fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fields</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeFields}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Required Fields</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requiredFields}</div>
            <p className="text-xs text-muted-foreground">Mandatory fields</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categoriesCount}</div>
            <p className="text-xs text-muted-foreground">Field categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="personal">Personal Info</SelectItem>
            <SelectItem value="business">Business Info</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="contact">Contact Details</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Fields Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field) => (
                <TableRow key={field._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{field.label}</p>
                      <p className="text-sm text-gray-500">{field.description}</p>
                      <code className="text-xs bg-gray-100 px-1 rounded">{field.fieldName}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {field.fieldType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {field.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {field.required ? (
                      <Badge className="bg-red-100 text-red-800">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{field.order}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateField(field._id, { active: !field.active })}
                        className={field.active ? "text-red-600" : "text-green-600"}
                      >
                        {field.active ? <X className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteField(field._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No verification fields found
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
