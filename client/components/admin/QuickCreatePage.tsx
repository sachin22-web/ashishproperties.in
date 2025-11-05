import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Save,
  FileText,
  Globe,
  Shield,
  HelpCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface PageTemplate {
  title: string;
  type: "page" | "policy" | "terms" | "faq";
  icon: React.ElementType;
  description: string;
  content: string;
}

const pageTemplates: PageTemplate[] = [
  {
    title: "About Us",
    type: "page",
    icon: Globe,
    description: "Company information and story",
    content: `<div class="prose prose-lg">
<h1>About Aashish Property</h1>
<p>Welcome to Aashish Property, your trusted partner in real estate solutions...</p>

<h2>Our Mission</h2>
<p>To make property transactions transparent, efficient, and hassle-free.</p>

<h2>Our Services</h2>
<ul>
<li>Residential Property Sales</li>
<li>Commercial Property Leasing</li>
<li>Property Investment Consultation</li>
</ul>
</div>`
  },
  {
    title: "Privacy Policy",
    type: "policy",
    icon: Shield,
    description: "Data protection and privacy terms",
    content: `<div class="prose prose-lg">
<h1>Privacy Policy</h1>
<p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>Information We Collect</h2>
<p>We collect information you provide directly to us...</p>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to provide and improve our services.</p>
</div>`
  },
  {
    title: "Terms and Conditions",
    type: "terms",
    icon: FileText,
    description: "Service terms and conditions",
    content: `<div class="prose prose-lg">
<h1>Terms and Conditions</h1>
<p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>

<h2>Acceptance of Terms</h2>
<p>By accessing and using our platform, you accept these terms...</p>

<h2>User Responsibilities</h2>
<ul>
<li>Provide accurate information</li>
<li>Comply with applicable laws</li>
</ul>
</div>`
  },
  {
    title: "Contact Us",
    type: "page",
    icon: Globe,
    description: "Contact information and form",
    content: `<div class="prose prose-lg">
<h1>Contact Us</h1>
<p>Get in touch with our team for any questions or support.</p>

<h2>Contact Information</h2>
<p><strong>Address:</strong> Rohtak, Haryana<br>
<strong>Phone:</strong> +91-XXXXXXXXXX<br>
<strong>Email:</strong> info@aashishproperty.com</p>

<h2>Business Hours</h2>
<p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
</div>`
  },
  {
    title: "FAQ",
    type: "faq",
    icon: HelpCircle,
    description: "Frequently asked questions",
    content: `<div class="prose prose-lg">
<h1>Frequently Asked Questions</h1>

<h3>Q: How do I list my property?</h3>
<p>A: You can list your property by creating an account and using our property listing form.</p>

<h3>Q: What are the listing charges?</h3>
<p>A: We offer both free and premium listing options. Check our packages for details.</p>

<h3>Q: How do I contact property owners?</h3>
<p>A: Contact details are available for verified listings. You can call or message directly.</p>
</div>`
  },
];

export default function QuickCreatePage() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PageTemplate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    type: "page" as "page" | "policy" | "terms" | "faq",
    status: "draft" as "published" | "draft" | "archived",
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTemplateSelect = (template: PageTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      slug: generateSlug(template.title),
      content: template.content,
      type: template.type,
      status: "draft",
    });
  };

  const handleCustomCreate = () => {
    setCustomMode(true);
    setSelectedTemplate(null);
    setFormData({
      title: "",
      slug: "",
      content: "",
      type: "page",
      status: "draft",
    });
  };

  const handleCreate = async () => {
    if (!token || !formData.title || !formData.content) return;

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
        setOpen(false);
        setSelectedTemplate(null);
        setCustomMode(false);
        setFormData({
          title: "",
          slug: "",
          content: "",
          type: "page",
          status: "draft",
        });
        // Refresh the page or show success message
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create page");
      }
    } catch (error) {
      console.error("Error creating page:", error);
      alert("Failed to create page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#C70000] hover:bg-[#A60000]">
          <Plus className="h-4 w-4 mr-2" />
          Quick Create Page
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Create Page</DialogTitle>
        </DialogHeader>
        
        {!selectedTemplate && !customMode ? (
          // Template Selection
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Choose a Page Template</h3>
              <p className="text-gray-600">Select a pre-made template or create a custom page</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageTemplates.map((template) => (
                <Card
                  key={template.title}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <template.icon className="h-8 w-8 text-[#C70000]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {template.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center pt-4 border-t">
              <Button variant="outline" onClick={handleCustomCreate}>
                <FileText className="h-4 w-4 mr-2" />
                Create Custom Page
              </Button>
            </div>
          </div>
        ) : (
          // Page Creation Form
          <div className="space-y-6">
            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <selectedTemplate.icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Template: {selectedTemplate.title}</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">{selectedTemplate.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Page Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({ 
                      ...formData, 
                      title,
                      slug: generateSlug(title)
                    });
                  }}
                  placeholder="Enter page title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="page-url-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Page Type</label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
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
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
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
              <label className="block text-sm font-medium mb-2">Page Content *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter page content (HTML supported)..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use HTML tags for formatting. The content will be displayed on your website.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedTemplate(null);
                  setCustomMode(false);
                }}
              >
                Back
              </Button>
              <Button 
                onClick={handleCreate} 
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving || !formData.title || !formData.content}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
