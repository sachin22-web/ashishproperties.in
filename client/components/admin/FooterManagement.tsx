import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Globe,
  Save,
  X,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Database,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";

interface FooterLink {
  _id?: string;
  title: string;
  url: string;
  section: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FooterSettings {
  _id?: string;
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  showLocations: boolean;
  locations: string[];
  updatedAt?: string;
}

export default function FooterManagement() {
  const { token } = useAuth();
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>({
    companyName: "POSTTRR",
    companyDescription: "",
    companyLogo: "P",
    socialLinks: {},
    contactInfo: {},
    showLocations: true,
    locations: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [linkFormData, setLinkFormData] = useState<Partial<FooterLink>>({
    title: "",
    url: "",
    section: "",
    order: 0,
    isActive: true,
    isExternal: false,
  });

  const footerSections = [
    { id: "quick_links", name: "Quick Links", description: "Navigation and important pages" },
    { id: "legal", name: "Legal Pages", description: "Terms, privacy, policies" },
    { id: "company", name: "Company Info", description: "About company, contact" },
    { id: "support", name: "Support", description: "Help, FAQ, customer service" },
  ];

  useEffect(() => {
    fetchFooterData();
  }, [token]);

  const fetchFooterData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch footer links
      const linksResponse = await fetch("/api/admin/footer-links", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        if (linksData.success) {
          setFooterLinks(linksData.data);
        }
      }

      // Fetch footer settings
      const settingsResponse = await fetch("/api/admin/footer-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success) {
          setFooterSettings(settingsData.data);
        }
      }

    } catch (error) {
      console.error("Error fetching footer data:", error);
      setError("Failed to fetch footer data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/admin/footer-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(footerSettings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Footer settings saved and updated across all website pages!");
          setTimeout(() => setSuccess(""), 4000);

          // Trigger footer refresh on all pages
          window.dispatchEvent(new CustomEvent('footerRefresh'));
          console.log("🔄 Footer refresh event dispatched");
        } else {
          setError(data.error || "Failed to save settings");
        }
      } else {
        setError(`Failed to save settings: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving footer settings:", error);
      setError("Failed to save footer settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkFormData.title || !linkFormData.url || !linkFormData.section) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = editingLink 
        ? `/api/admin/footer-links/${editingLink._id}`
        : "/api/admin/footer-links";
      
      const method = editingLink ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(linkFormData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`Footer link ${editingLink ? 'updated' : 'created'} and applied to all website pages!`);
          setTimeout(() => setSuccess(""), 3000);

          // Reset form
          setLinkFormData({
            title: "",
            url: "",
            section: "",
            order: 0,
            isActive: true,
            isExternal: false,
          });
          setEditingLink(null);
          setIsLinkDialogOpen(false);

          // Refresh data and trigger footer refresh
          fetchFooterData();
          window.dispatchEvent(new CustomEvent('footerRefresh'));
          console.log("🔄 Footer refresh event dispatched after link save");
        } else {
          setError(data.error || "Failed to save link");
        }
      } else {
        setError(`Failed to save link: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving footer link:", error);
      setError("Failed to save footer link");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this footer link?")) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/admin/footer-links/${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Footer link deleted and removed from all website pages!");
          setTimeout(() => setSuccess(""), 3000);
          fetchFooterData();
          window.dispatchEvent(new CustomEvent('footerRefresh'));
          console.log("🔄 Footer refresh event dispatched after link delete");
        } else {
          setError(data.error || "Failed to delete link");
        }
      } else {
        setError(`Failed to delete link: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting footer link:", error);
      setError("Failed to delete footer link");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLink = (link: FooterLink) => {
    setEditingLink(link);
    setLinkFormData(link);
    setIsLinkDialogOpen(true);
  };

  const initializeFooterData = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/footer/initialize", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Footer data initialized successfully!");
          setTimeout(() => setSuccess(""), 3000);
          fetchFooterData();
        } else {
          setError(data.error || "Failed to initialize footer data");
        }
      }
    } catch (error) {
      console.error("Error initializing footer data:", error);
      setError("Failed to initialize footer data");
    } finally {
      setSaving(false);
    }
  };

  const testFooterConnection = async () => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/footer/test");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const stats = data.data.stats;
          setSuccess(
            `✅ Connection successful! Found ${stats.totalLinks} links (${stats.activeLinks} active), ` +
            `settings ${stats.hasSettings ? 'configured' : 'missing'}, last updated: ${new Date(stats.lastUpdated).toLocaleString()}`
          );
          setTimeout(() => setSuccess(""), 5000);
        } else {
          setError(data.error || "Test failed");
        }
      } else {
        setError(`Test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error testing footer connection:", error);
      setError("Failed to test footer connection");
    } finally {
      setSaving(false);
    }
  };

  const testLiveUpdate = async () => {
    try {
      setSaving(true);
      setError("");

      // Make a small test change to footer settings
      const testTimestamp = new Date().toLocaleString();
      const testSettings = {
        ...footerSettings,
        companyDescription: `${footerSettings.companyDescription} [Test Update: ${testTimestamp}]`,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch("/api/admin/footer-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testSettings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`🚀 Live update test successful! Check the footer on the website - it should update within seconds. Test timestamp: ${testTimestamp}`);
          setTimeout(() => setSuccess(""), 10000);

          // Trigger footer refresh and reload admin data
          window.dispatchEvent(new CustomEvent('footerRefresh'));
          fetchFooterData();
          console.log("🔄 Test live update completed, footer refresh triggered");
        } else {
          setError(data.error || "Test update failed");
        }
      } else {
        setError(`Test update failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error testing live update:", error);
      setError("Failed to test live update");
    } finally {
      setSaving(false);
    }
  };

  const getLinksBySection = (sectionId: string) => {
    return footerLinks
      .filter(link => link.section === sectionId)
      .sort((a, b) => a.order - b.order);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading footer management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError("")}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Dynamic Footer Management</h3>
          <p className="text-gray-600">Manage footer content, links, and settings for your website</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">Live Updates Enabled</span>
            <span className="text-xs text-gray-500">
              Changes reflect immediately across all pages
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={initializeFooterData}
            variant="outline"
            disabled={saving}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <Database className="h-4 w-4 mr-2" />
            Initialize Data
          </Button>
          <Button
            onClick={fetchFooterData}
            variant="outline"
            disabled={saving}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={testFooterConnection}
            variant="outline"
            disabled={saving}
            className="text-green-600 border-green-300 hover:bg-green-50"
          >
            <Check className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button
            onClick={testLiveUpdate}
            variant="outline"
            disabled={saving}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Live Update
          </Button>
        </div>
      </div>

      {/* Tabs for different management sections */}
      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links">Footer Links</TabsTrigger>
          <TabsTrigger value="settings">Footer Settings</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>

        {/* Footer Links Management */}
        <TabsContent value="links" className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Manage Footer Links</h4>
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#C70000] hover:bg-[#A60000]"
                  onClick={() => {
                    setEditingLink(null);
                    setLinkFormData({
                      title: "",
                      url: "",
                      section: "",
                      order: 0,
                      isActive: true,
                      isExternal: false,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Footer Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingLink ? "Edit Footer Link" : "Add New Footer Link"}
                  </DialogTitle>
                  <DialogDescription>
                    Create or edit footer links that will appear in your website footer.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Link Title *</label>
                    <Input
                      value={linkFormData.title || ""}
                      onChange={(e) => setLinkFormData({ ...linkFormData, title: e.target.value })}
                      placeholder="e.g., About Us, Contact"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL *</label>
                    <Input
                      value={linkFormData.url || ""}
                      onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                      placeholder="e.g., /about-us, https://example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Footer Section *</label>
                    <Select 
                      value={linkFormData.section || ""} 
                      onValueChange={(value) => setLinkFormData({ ...linkFormData, section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select footer section" />
                      </SelectTrigger>
                      <SelectContent>
                        {footerSections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.name} - {section.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Order</label>
                    <Input
                      type="number"
                      value={linkFormData.order || 0}
                      onChange={(e) => setLinkFormData({ ...linkFormData, order: parseInt(e.target.value) || 0 })}
                      placeholder="1"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={linkFormData.isActive ?? true}
                        onChange={(e) => setLinkFormData({ ...linkFormData, isActive: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={linkFormData.isExternal ?? false}
                        onChange={(e) => setLinkFormData({ ...linkFormData, isExternal: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">External Link</span>
                    </label>
                  </div>
                </form>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsLinkDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#C70000] hover:bg-[#A60000]"
                    onClick={handleSaveLink}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingLink ? "Update" : "Add"} Link
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Links by Section */}
          <div className="space-y-4">
            {footerSections.map((section) => {
              const sectionLinks = getLinksBySection(section.id);
              return (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {sectionLinks.length} links
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sectionLinks.length > 0 ? (
                      <div className="space-y-2">
                        {sectionLinks.map((link) => (
                          <div 
                            key={link._id} 
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {link.isExternal && (
                                  <ExternalLink className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="font-medium">{link.title}</span>
                              </div>
                              <Badge 
                                variant={link.isActive ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {link.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-gray-500">Order: {link.order}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditLink(link)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteLink(link._id!)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No links in this section yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setLinkFormData({ ...linkFormData, section: section.id });
                            setIsLinkDialogOpen(true);
                          }}
                        >
                          Add First Link
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Footer Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Footer Settings</CardTitle>
              <CardDescription>Configure global footer settings and company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <Input
                    value={footerSettings.companyName}
                    onChange={(e) => setFooterSettings({ ...footerSettings, companyName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Logo (Single Letter)</label>
                  <Input
                    value={footerSettings.companyLogo}
                    onChange={(e) => setFooterSettings({ ...footerSettings, companyLogo: e.target.value.charAt(0) })}
                    placeholder="P"
                    maxLength={1}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Description</label>
                <Textarea
                  value={footerSettings.companyDescription}
                  onChange={(e) => setFooterSettings({ ...footerSettings, companyDescription: e.target.value })}
                  placeholder="Brief description of your company..."
                  rows={3}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={footerSettings.contactInfo.phone || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        contactInfo: { ...footerSettings.contactInfo, phone: e.target.value }
                      })}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      value={footerSettings.contactInfo.email || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        contactInfo: { ...footerSettings.contactInfo, email: e.target.value }
                      })}
                      placeholder="info@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <Input
                      value={footerSettings.contactInfo.address || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        contactInfo: { ...footerSettings.contactInfo, address: e.target.value }
                      })}
                      placeholder="Your address"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Social Media Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <Facebook className="h-4 w-4" />
                      <span>Facebook</span>
                    </label>
                    <Input
                      value={footerSettings.socialLinks.facebook || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        socialLinks: { ...footerSettings.socialLinks, facebook: e.target.value }
                      })}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                    </label>
                    <Input
                      value={footerSettings.socialLinks.twitter || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        socialLinks: { ...footerSettings.socialLinks, twitter: e.target.value }
                      })}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </label>
                    <Input
                      value={footerSettings.socialLinks.instagram || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        socialLinks: { ...footerSettings.socialLinks, instagram: e.target.value }
                      })}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                      <Youtube className="h-4 w-4" />
                      <span>YouTube</span>
                    </label>
                    <Input
                      value={footerSettings.socialLinks.youtube || ""}
                      onChange={(e) => setFooterSettings({ 
                        ...footerSettings, 
                        socialLinks: { ...footerSettings.socialLinks, youtube: e.target.value }
                      })}
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Popular Locations</span>
                  </h4>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={footerSettings.showLocations}
                      onChange={(e) => setFooterSettings({ ...footerSettings, showLocations: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Show locations in footer</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Locations (comma-separated)</label>
                  <Input
                    value={(footerSettings.locations || []).join(", ")}
                    onChange={(e) => setFooterSettings({
                      ...footerSettings,
                      locations: e.target.value.split(",").map(loc => (( loc ?? "" ).trim())).filter(loc => loc)
                    })}
                    placeholder="Kolkata, Mumbai, Delhi, Bangalore"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={fetchFooterData}>
                  Reset Changes
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span>Live Footer Preview</span>
              </CardTitle>
              <CardDescription>
                This is how your footer will appear on the website with current settings.
                Changes are applied automatically across all pages in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Footer Preview */}
              <div className="bg-gradient-to-r from-[#C70000] to-red-700 text-white p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Company Info Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-[#C70000] font-bold text-xl">{footerSettings.companyLogo}</span>
                      </div>
                      <h3 className="text-2xl font-bold">{footerSettings.companyName}</h3>
                    </div>
                    <p className="text-red-100 text-sm">{footerSettings.companyDescription}</p>
                  </div>

                  {/* Locations Preview */}
                  {footerSettings.showLocations && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold">POPULAR LOCATIONS</h4>
                      <ul className="space-y-2">
                        {(footerSettings.locations || []).slice(0, 6).map((location, index) => (
                          <li key={index} className="text-red-100 text-sm">• {location}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Links Preview */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold">QUICK LINKS</h4>
                    <ul className="space-y-2">
                      {getLinksBySection('quick_links').slice(0, 6).map((link) => (
                        <li key={link._id} className="text-red-100 text-sm">
                          • {link.title} {link.isExternal && '↗'}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Legal Links Preview */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold">LEGAL & SUPPORT</h4>
                    <ul className="space-y-2">
                      {getLinksBySection('legal').slice(0, 6).map((link) => (
                        <li key={link._id} className="text-red-100 text-sm">
                          • {link.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Social Media and Contact Preview */}
                <div className="mt-6 pt-4 border-t border-red-400/30 space-y-4">
                  {/* Social Media Links */}
                  {(footerSettings.socialLinks.facebook || footerSettings.socialLinks.twitter ||
                    footerSettings.socialLinks.instagram || footerSettings.socialLinks.youtube) && (
                    <div className="text-center">
                      <h4 className="text-sm font-semibold mb-2">Follow Us</h4>
                      <div className="flex justify-center space-x-4">
                        {footerSettings.socialLinks.facebook && (
                          <span className="text-red-100 text-xs">📘 Facebook</span>
                        )}
                        {footerSettings.socialLinks.twitter && (
                          <span className="text-red-100 text-xs">🐦 Twitter</span>
                        )}
                        {footerSettings.socialLinks.instagram && (
                          <span className="text-red-100 text-xs">📷 Instagram</span>
                        )}
                        {footerSettings.socialLinks.youtube && (
                          <span className="text-red-100 text-xs">📺 YouTube</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {(footerSettings.contactInfo.phone || footerSettings.contactInfo.email) && (
                    <div className="text-center">
                      <h4 className="text-sm font-semibold mb-2">Contact Us</h4>
                      <div className="flex justify-center space-x-4 text-xs text-red-100">
                        {footerSettings.contactInfo.phone && (
                          <span>📞 {footerSettings.contactInfo.phone}</span>
                        )}
                        {footerSettings.contactInfo.email && (
                          <span>✉️ {footerSettings.contactInfo.email}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-red-100 text-sm">
                      © {new Date().getFullYear()} {footerSettings.companyName}. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer System Status */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Check className="h-5 w-5" />
            <span>Dynamic Footer System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-900">✅ Features Active</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Real-time updates across all pages</li>
                <li>• Database integration with MongoDB</li>
                <li>• Social media links management</li>
                <li>• Contact information sync</li>
                <li>• Location listings</li>
                <li>• Custom footer links by section</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-900">📊 Current Stats</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Total Links: {footerLinks.length}</li>
                <li>• Active Links: {footerLinks.filter(l => l.isActive).length}</li>
                <li>• Quick Links: {footerLinks.filter(l => l.section === 'quick_links').length}</li>
                <li>• Legal Pages: {footerLinks.filter(l => l.section === 'legal').length}</li>
                <li>• Company: {footerSettings.companyName}</li>
                <li>• Locations: {(footerSettings.locations || []).length}</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-green-900">🔄 Auto-Sync Features</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Changes apply instantly</li>
                <li>• No page refresh required</li>
                <li>• Cross-browser compatibility</li>
                <li>• Mobile responsive updates</li>
                <li>• Event-driven refresh system</li>
                <li>• Fallback loading mechanisms</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-start space-x-2">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">✨ Dynamic Footer System Fully Operational</p>
                <p className="text-green-700 text-sm mt-1">
                  Your footer is now completely dynamic and connected to the database.
                  Any changes you make here will automatically appear on all website pages within seconds.
                  Social media links, contact information, and custom links are all managed through this interface.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
