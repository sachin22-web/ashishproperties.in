import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Save,
  X,
  Check,
  Calendar,
  Globe,
  Link,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface ContentPage {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: "published" | "draft" | "archived";
  type: "page" | "policy" | "terms" | "faq";
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentManagement() {
  const { token } = useAuth();
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft" as "published" | "draft" | "archived",
    type: "page" as "page" | "policy" | "terms" | "faq",
    featuredImage: "",
  });

  useEffect(() => {
    fetchPages();
  }, [token]);

  const fetchPages = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPages(data.data);
        } else {
          setError(data.error || "Failed to fetch pages");
        }
      } else {
        setError(
          `Failed to fetch pages: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      setError("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;

    try {
      setSaving(true);

      const response = await fetch("/api/admin/content", {
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
          fetchPages();
          resetForm();
          setShowCreateDialog(false);
          setSuccessMessage(
            formData.status === "published"
              ? "Page created and published successfully! It's now visible on the website and footer."
              : "Page created as draft. Publish it to make it visible on the website footer.",
          );
          setTimeout(() => setSuccessMessage(""), 5000);

          // Trigger footer refresh if page is published
          if (formData.status === "published") {
            console.log("🔄 Triggering footer refresh for new published page");
            window.dispatchEvent(new CustomEvent("footerUpdate"));
            window.dispatchEvent(new CustomEvent("footerRefresh"));
            window.dispatchEvent(
              new CustomEvent("pagePublished", {
                detail: {
                  pageId: data.data._id,
                  title: formData.title,
                  slug: formData.slug,
                },
              }),
            );
          }
        } else {
          setError(data.error || "Failed to create page");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      setError("Failed to create page");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !selectedPage) {
      setError("No authentication token or selected page");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("🔄 Updating page:", selectedPage._id);
      console.log("📄 Form data:", formData);

      const response = await fetch(`/api/admin/content/${selectedPage._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      console.log("📡 Update response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Update response data:", data);

        if (data.success) {
          fetchPages();
          resetForm();
          setShowEditDialog(false);
          setSelectedPage(null);
          setSuccessMessage(
            formData.status === "published"
              ? "Page updated successfully! Changes are now live on the website."
              : "Page updated successfully.",
          );
          setTimeout(() => setSuccessMessage(""), 5000);
          console.log("✅ Page update successful");

          // Trigger footer refresh if page is published or was previously published
          const wasPublished = selectedPage?.status === "published";
          const isPublished = formData.status === "published";

          if (isPublished || wasPublished) {
            console.log("🔄 Triggering footer refresh for updated page");
            window.dispatchEvent(new CustomEvent("footerUpdate"));
            window.dispatchEvent(new CustomEvent("footerRefresh"));

            if (isPublished) {
              window.dispatchEvent(
                new CustomEvent("pagePublished", {
                  detail: {
                    pageId: selectedPage?._id,
                    title: formData.title,
                    slug: formData.slug,
                  },
                }),
              );
            } else if (wasPublished && !isPublished) {
              window.dispatchEvent(
                new CustomEvent("pageUnpublished", {
                  detail: {
                    pageId: selectedPage?._id,
                    title: formData.title,
                    slug: formData.slug,
                  },
                }),
              );
            }
          }
        } else {
          setError(data.error || "Failed to update page");
          console.error("❌ Update failed:", data.error);
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Update response error:", response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(
            errorData.error || `Failed to update page: ${response.status}`,
          );
        } catch {
          setError(
            `Failed to update page: ${response.status} ${response.statusText}`,
          );
        }
      }
    } catch (error) {
      console.error("❌ Error updating page:", error);
      setError(
        `Failed to update page: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (
      !token ||
      !confirm(
        "Are you sure you want to delete this page? This action cannot be undone.",
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/content/${pageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const deletedPage = pages.find((page) => page._id === pageId);
        setPages(pages.filter((page) => page._id !== pageId));
        setSuccessMessage("Page deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        // Trigger footer refresh if the deleted page was published
        if (deletedPage?.status === "published") {
          console.log(
            "🔄 Triggering footer refresh for deleted published page",
          );
          window.dispatchEvent(new CustomEvent("footerUpdate"));
          window.dispatchEvent(new CustomEvent("footerRefresh"));
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete page");
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      setError("Failed to delete page");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
      type: "page",
      featuredImage: "",
    });
  };

  const populateForm = (page: ContentPage) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: page.status,
      type: page.type,
      featuredImage: page.featuredImage || "",
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const testApiConnection = async () => {
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("🧪 Testing API connection...");
      console.log("🔑 Token:", token.substring(0, 20) + "...");

      // Test getting pages
      const response = await fetch("/api/admin/content", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 API Response status:", response.status);
      console.log(
        "📡 API Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ API Response data:", data);
        setSuccessMessage(
          `✅ API Test Successful! Found ${data.data?.length || 0} pages. Status: ${response.status}`,
        );
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorText = await response.text();
        console.error("❌ API Error response:", errorText);
        setError(`API Test Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("❌ API Test error:", error);
      setError(
        `API Test Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const testUpdate = async (page: ContentPage) => {
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("🧪 Testing direct update for page:", page.title);

      const testData = {
        title: `${page.title} - Test Update ${new Date().toLocaleTimeString()}`,
        content: `${page.content}\n\n--- Test update at ${new Date().toLocaleString()} ---`,
        slug: page.slug,
        metaTitle: page.metaTitle || "",
        metaDescription: page.metaDescription || "",
        status: page.status,
        type: page.type,
        featuredImage: page.featuredImage || "",
      };

      console.log("📤 Test update data:", testData);

      const response = await fetch(`/api/admin/content/${page._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });

      console.log("📡 Test update response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Test update response data:", data);
        setSuccessMessage(
          `✅ Test Update Successful! Page "${page.title}" updated.`,
        );
        setTimeout(() => setSuccessMessage(""), 5000);
        fetchPages(); // Refresh the list
      } else {
        const errorText = await response.text();
        console.error("❌ Test update error response:", errorText);
        setError(`Test Update Failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Test update error:", error);
      setError(
        `Test Update Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      published: { className: "bg-green-100 text-green-800", icon: Check },
      draft: { className: "bg-yellow-100 text-yellow-800", icon: Edit },
      archived: { className: "bg-gray-100 text-gray-800", icon: X },
    };

    const { className, icon: Icon } = config[status] || config.draft;

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = {
      page: { className: "bg-blue-100 text-blue-800", label: "Page" },
      policy: { className: "bg-purple-100 text-purple-800", label: "Policy" },
      terms: { className: "bg-orange-100 text-orange-800", label: "Terms" },
      faq: { className: "bg-indigo-100 text-indigo-800", label: "FAQ" },
    };

    const { className, label } = config[type] || config.page;

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  };

  const filteredPages = pages.filter((page) => {
    const safeTitle = page.title || "";
    const safeSlug = page.slug || "";
    const safeSearchTerm = searchTerm || "";
    const matchesSearch =
      safeTitle.toLowerCase().includes(safeSearchTerm.toLowerCase()) ||
      safeSlug.toLowerCase().includes(safeSearchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || page.status === selectedStatus;
    const matchesType = selectedType === "all" || page.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === "published").length,
    draft: pages.filter((p) => p.status === "draft").length,
    archived: pages.filter((p) => p.status === "archived").length,
  };

  // Initialize default pages if none exist
  useEffect(() => {
    if (pages.length === 0 && !loading && token) {
      const initializeDefaultPages = async () => {
        try {
          const defaultPages = [
            {
              title: "About Us",
              slug: "about-us",
              content:
                "<h1>About Aashish Property</h1><p>Welcome to Aashish Property, your trusted partner in real estate solutions in Rohtak and surrounding areas.</p>",
              metaTitle: "About Us - Aashish Property",
              metaDescription:
                "Learn more about Aashish Property, your trusted real estate partner in Rohtak.",
              status: "published",
              type: "page",
            },
            {
              title: "Privacy Policy",
              slug: "privacy-policy",
              content:
                "<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>",
              metaTitle: "Privacy Policy - Aashish Property",
              metaDescription:
                "Read our privacy policy to understand how we protect your data.",
              status: "published",
              type: "policy",
            },
            {
              title: "Terms and Conditions",
              slug: "terms-conditions",
              content:
                "<h1>Terms and Conditions</h1><p>Please read these terms and conditions carefully before using our services.</p>",
              metaTitle: "Terms and Conditions - Aashish Property",
              metaDescription:
                "Terms and conditions for using Aashish Property services.",
              status: "published",
              type: "terms",
            },
            {
              title: "Refund Policy",
              slug: "refund-policy",
              content:
                "<h1>Refund Policy</h1><p>Our refund policy ensures fair treatment for all our customers.</p>",
              metaTitle: "Refund Policy - Aashish Property",
              metaDescription:
                "Understanding our refund policy for property services.",
              status: "published",
              type: "policy",
            },
          ];

          for (const pageData of defaultPages) {
            await fetch("/api/admin/content", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(pageData),
            });
          }

          fetchPages();
        } catch (error) {
          console.error("Error initializing default pages:", error);
        }
      };

      initializeDefaultPages();
    }
  }, [pages.length, loading, token]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading content pages...</p>
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
              fetchPages();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-red-500 mt-1">❌</div>
            <div className="flex-1">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setError("")}>
              ✕
            </Button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-green-500 mt-1">✅</div>
            <div className="flex-1">
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Page Management</h3>
          <p className="text-gray-600">
            Create dynamic pages that auto-appear in footer. All pages are
            MongoDB-connected and fully functional.
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Globe className="h-3 w-3 mr-1" />
              MongoDB Connected
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Link className="h-3 w-3 mr-1" />
              Auto Footer Integration
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${token ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              🔑 Auth: {token ? "Connected" : "Missing"}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={testApiConnection}
            variant="outline"
            disabled={saving}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Test API
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Page
          </Button>
        </div>
      </div>

      {/* Quick Create Templates */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800">Quick Create Pages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                title: "About Us",
                type: "page",
                description: "Company information",
              },
              {
                title: "Privacy Policy",
                type: "policy",
                description: "Privacy terms",
              },
              {
                title: "Terms & Conditions",
                type: "terms",
                description: "Service terms",
              },
              {
                title: "Contact Us",
                type: "page",
                description: "Contact information",
              },
            ].map((template) => (
              <Button
                key={template.title}
                variant="outline"
                className="h-auto p-3 flex flex-col items-start space-y-1 hover:bg-blue-100 border-blue-300"
                onClick={() => {
                  setFormData({
                    ...formData,
                    title: template.title,
                    slug: generateSlug(template.title),
                    type: template.type as any,
                  });
                  setShowCreateDialog(true);
                }}
              >
                <span className="font-medium text-sm">{template.title}</span>
                <span className="text-xs text-gray-500">
                  {template.description}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All content pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.published}
            </div>
            <p className="text-xs text-muted-foreground">Live pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.draft}
            </div>
            <p className="text-xs text-muted-foreground">Work in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.archived}
            </div>
            <p className="text-xs text-muted-foreground">Archived pages</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="page">Page</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="terms">Terms</SelectItem>
            <SelectItem value="faq">FAQ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.map((page) => (
                <TableRow key={page._id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      /{page.slug}
                    </code>
                  </TableCell>
                  <TableCell>{getTypeBadge(page.type)}</TableCell>
                  <TableCell>{getStatusBadge(page.status)}</TableCell>
                  <TableCell>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/${page.slug}`, "_blank")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPage(page);
                          populateForm(page);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testUpdate(page)}
                        disabled={saving}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(page._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPages.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No pages found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Page Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      ...formData,
                      title,
                      slug: generateSlug(title),
                    });
                  }}
                  placeholder="Enter page title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="page-url-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
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
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="terms">Terms</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter page content (HTML supported)..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Title
                </label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  placeholder="SEO title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meta Description
                </label>
                <Input
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value,
                    })
                  }
                  placeholder="SEO description..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Page
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Page Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter page title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="page-url-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Content *
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Enter page content (HTML supported)..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Page
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State for No Pages */}
      {pages.length === 0 && !loading && (
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50">
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Create Your First Page
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Admin can create any page for the website like About Us, Privacy
              Policy, Contact Us, or any custom page.
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[#C70000] hover:bg-[#A60000]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    title: "About Us",
                    slug: "about-us",
                    type: "page",
                  });
                  setShowCreateDialog(true);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Quick: About Us
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
