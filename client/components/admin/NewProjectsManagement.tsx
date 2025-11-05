import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Search,
  Image as ImageIcon,
  Link as LinkIcon,
  Building,
  MapPin,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
import { useToast } from "../ui/use-toast";

/* ------------------ Types ------------------ */
interface NewProject {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  price: number;
  priceRange?: string;
  status: "upcoming" | "ongoing" | "completed";
  launchDate?: string;
  completionDate?: string;
  developer: string;
  amenities: string[];
  images: string[];
  brochureUrl?: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface NewProjectBanner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  projectId?: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date | string;
}

/* ------------------ Helpers ------------------ */
const toArray = <T,>(input: any): T[] => {
  if (Array.isArray(input)) return input as T[];
  if (Array.isArray(input?.data)) return input.data as T[];
  if (Array.isArray(input?.items)) return input.items as T[];
  if (Array.isArray(input?.results)) return input.results as T[];
  if (Array.isArray(input?.data?.docs)) return input.data.docs as T[];
  return [];
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const normalizeLink = (v: string) => {
  const link = (v || "").trim();
  if (!link) return "";
  // Allow absolute http(s) links OR app-internal paths. If looks like plain word, make it internal.
  if (/^https?:\/\//i.test(link) || link.startsWith("/")) return link;
  return `/${link}`;
};

export default function NewProjectsManagement() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"projects" | "banners">("projects");

  // Projects state
  const [projects, setProjects] = useState<NewProject[] | any>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<NewProject | null>(null);

  // Banners state
  const [banners, setBanners] = useState<NewProjectBanner[] | any>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<NewProjectBanner | null>(null);

  // Common state
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  // Project form data
  const [projectFormData, setProjectFormData] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    price: 0,
    priceRange: "",
    status: "upcoming" as const,
    launchDate: "",
    completionDate: "",
    developer: "",
    amenities: [] as string[],
    images: [] as string[],
    brochureUrl: "",
    contactInfo: {
      phone: "",
      email: "",
      address: "",
    },
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
  });

  // Banner form data
  const [bannerFormData, setBannerFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    projectId: "",
    link: "",
    isActive: true,
    sortOrder: 1,
  });

  useEffect(() => {
    fetchProjects();
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ API: Projects ------------------ */
  const fetchProjects = async () => {
    if (!token) return;

    try {
      setProjectsLoading(true);
      const response = await fetch("/api/admin/new-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to fetch projects");
      }
      setProjects(toArray<NewProject>(json?.data ?? json));
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      setProjects([]);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  /* ------------------ API: Banners ------------------ */
  const fetchBanners = async () => {
    if (!token) return;

    try {
      setBannersLoading(true);
      const response = await fetch("/api/admin/new-projects/banners", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await response.json();
      if (!response.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to fetch banners");
      }
      setBanners(toArray<NewProjectBanner>(json?.data ?? json));
    } catch (error: any) {
      console.error("Error fetching banners:", error);
      setBanners([]);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch banners",
        variant: "destructive",
      });
    } finally {
      setBannersLoading(false);
    }
  };

  /* ------------------ Handlers ------------------ */
  const handleProjectInputChange = (field: string, value: any) => {
    if (field === "name") {
      setProjectFormData((prev) => ({
        ...prev,
        name: value,
        slug: slugify(value),
      }));
    } else if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setProjectFormData((prev: any) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setProjectFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBannerInputChange = (field: string, value: any) => {
    setBannerFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttachProject = (projectId: string) => {
    const p = projectsArr.find((x) => (x._id || "") === projectId);
    // Auto-fill link only if user hasn't typed any link yet
    if (p && !bannerFormData.link) {
      handleBannerInputChange("link", `/new-projects/${p.slug || p._id}`);
    }
    handleBannerInputChange("projectId", projectId);
  };

  const handleImageUpload = async (file: File, type: "project" | "banner") => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/admin/banners/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadFormData,
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        if (type === "project") {
          setProjectFormData((prev) => ({
            ...prev,
            images: [...prev.images, data.data.imageUrl],
          }));
        } else {
          setBannerFormData((prev) => ({
            ...prev,
            imageUrl: data.data.imageUrl,
          }));
        }
        toast({ title: "Success", description: "Image uploaded successfully" });
      } else {
        throw new Error(data?.error || "Failed to upload image");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!token || !projectFormData.name || !projectFormData.location) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/new-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectFormData),
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        toast({ title: "Success", description: "Project created successfully" });
        await fetchProjects();
        try {
          window.dispatchEvent(new Event("newProjectsUpdated"));
        } catch {}
        resetProjectForm();
        setShowProjectDialog(false);
      } else {
        throw new Error(data?.error || "Failed to create project");
      }
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleCreateBanner = async () => {
    const payload = {
      ...bannerFormData,
      link: normalizeLink(bannerFormData.link),
      title: (bannerFormData.title || "").trim(),
      imageUrl: (bannerFormData.imageUrl || "").trim(),
    };

    if (!token || !payload.title || !payload.imageUrl || !payload.link) {
      toast({
        title: "Error",
        description: "Please fill Title, Image and Link.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/new-projects/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        toast({ title: "Success", description: "Banner created successfully" });
        await fetchBanners();
        try {
          window.dispatchEvent(new Event("newProjectsUpdated"));
        } catch {}
        resetBannerForm();
        setShowBannerDialog(false);
      } else {
        throw new Error(data?.error || "Failed to create banner");
      }
    } catch (error: any) {
      console.error("Error creating banner:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create banner",
        variant: "destructive",
      });
    }
  };

  const resetProjectForm = () => {
    setProjectFormData({
      name: "",
      slug: "",
      description: "",
      location: "",
      price: 0,
      priceRange: "",
      status: "upcoming",
      launchDate: "",
      completionDate: "",
      developer: "",
      amenities: [],
      images: [],
      brochureUrl: "",
      contactInfo: { phone: "", email: "", address: "" },
      isActive: true,
      isFeatured: false,
      sortOrder: 1,
    });
    setEditingProject(null);
  };

  const resetBannerForm = () => {
    setBannerFormData({
      title: "",
      subtitle: "",
      imageUrl: "",
      projectId: "",
      link: "",
      isActive: true,
      sortOrder: 1,
    });
    setEditingBanner(null);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      upcoming: { className: "bg-blue-100 text-blue-800", label: "Upcoming" },
      ongoing: { className: "bg-orange-100 text-orange-800", label: "Ongoing" },
      completed: { className: "bg-green-100 text-green-800", label: "Completed" },
    };
    const { className, label } = (config as any)[status] || config.upcoming;
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  };

  /* ------------- SAFE arrays for rendering everywhere ------------- */
  const projectsArr: NewProject[] = Array.isArray(projects)
    ? projects
    : toArray<NewProject>(projects);

  const bannersArr: NewProjectBanner[] = Array.isArray(banners)
    ? banners
    : toArray<NewProjectBanner>(banners);

  const term = search.trim().toLowerCase();

  const filteredProjects = projectsArr.filter((project) => {
    const n = project?.name?.toLowerCase() || "";
    const loc = project?.location?.toLowerCase() || "";
    return n.includes(term) || loc.includes(term);
  });

  const filteredBanners = bannersArr.filter((banner) => {
    const t = banner?.title?.toLowerCase() || "";
    return t.includes(term);
  });

  /* ------------------ Loading ------------------ */
  if (projectsLoading && bannersLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading New Projects...</p>
        </div>
      </div>
    );
  }

  /* ------------------ UI ------------------ */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Projects Management</h1>
          <p className="text-gray-600">Manage property projects and promotional banners</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsArr.length}</div>
            <p className="text-xs text-muted-foreground">Property projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projectsArr.filter((p) => !!p.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {projectsArr.filter((p) => !!p.isFeatured).length}
            </div>
            <p className="text-xs text-muted-foreground">Featured listings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Banners</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {bannersArr.filter((b) => !!b.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Promotional banners</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            Projects ({projectsArr.length})
          </TabsTrigger>
        <TabsTrigger value="banners" className="flex items-center">
            <ImageIcon className="h-4 w-4 mr-2" />
            Banners ({bannersArr.length})
          </TabsTrigger>
        </TabsList>

        {/* ------------------ Projects Tab ------------------ */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="pl-10"
              />
            </div>

            <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetProjectForm} className="bg-[#C70000] hover:bg-[#A60000] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Project Name *</label>
                      <Input
                        value={projectFormData.name}
                        onChange={(e) => handleProjectInputChange("name", e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Location *</label>
                      <Input
                        value={projectFormData.location}
                        onChange={(e) => handleProjectInputChange("location", e.target.value)}
                        placeholder="Project location"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={projectFormData.description}
                      onChange={(e) => handleProjectInputChange("description", e.target.value)}
                      placeholder="Project description"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleCreateProject} className="bg-[#C70000] hover:bg-[#A60000] text-white" disabled={uploading}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingProject ? "Update Project" : "Create Project"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowProjectDialog(false);
                        resetProjectForm();
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

          {/* Projects Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id || project.slug}>
                      <TableCell className="font-medium">{project?.name || "-"}</TableCell>
                      <TableCell>{project?.location || "-"}</TableCell>
                      <TableCell>{getStatusBadge(project?.status || "upcoming")}</TableCell>
                      <TableCell><Switch checked={!!project?.isActive} size="sm" /></TableCell>
                      <TableCell><Switch checked={!!project?.isFeatured} size="sm" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" title="View"><Eye className="h-3 w-3" /></Button>
                          <Button variant="outline" size="sm" title="Edit"><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" title="Delete"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------ Banners Tab ------------------ */}
        <TabsContent value="banners" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banners..."
                className="pl-10"
              />
            </div>

            <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetBannerForm} className="bg-[#C70000] hover:bg-[#A60000] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <Input
                      value={bannerFormData.title}
                      onChange={(e) => handleBannerInputChange("title", e.target.value)}
                      placeholder="Banner title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Image *</label>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          value={bannerFormData.imageUrl}
                          onChange={(e) => handleBannerInputChange("imageUrl", e.target.value)}
                          placeholder="Image URL or upload"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, "banner");
                          }}
                          className="hidden"
                          id="banner-image-upload"
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className="px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex items-center"
                        >
                          <Upload className="h-4 w-4" />
                        </label>
                      </div>
                      {bannerFormData.imageUrl && (
                        <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={bannerFormData.imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NEW: Link (required) */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Link *</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={bannerFormData.link}
                        onChange={(e) => handleBannerInputChange("link", e.target.value)}
                        placeholder="https://example.com OR /new-projects/abc"
                        className="flex-1"
                      />
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      External URL (http/https) ya internal path (e.g. <code>/new-projects/aashish-heights</code>)
                    </p>
                  </div>

                  {/* Optional: attach to a project to auto-fill link */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Attach to Project (optional)</label>
                    <select
                      value={bannerFormData.projectId}
                      onChange={(e) => handleAttachProject(e.target.value)}
                      className="w-full border border-gray-300 rounded-md h-9 px-3 text-sm"
                    >
                      <option value="">— Select Project —</option>
                      {projectsArr.map((p) => (
                        <option key={p._id || p.slug} value={p._id || ""}>
                          {p.name} {p.slug ? `(${p.slug})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sort Order</label>
                      <Input
                        type="number"
                        value={bannerFormData.sortOrder}
                        onChange={(e) => handleBannerInputChange("sortOrder", Number(e.target.value) || 1)}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        checked={bannerFormData.isActive}
                        onCheckedChange={(v) => handleBannerInputChange("isActive", v)}
                        id="banner-active"
                      />
                      <label htmlFor="banner-active" className="text-sm">Active</label>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button onClick={handleCreateBanner} className="bg-[#C70000] hover:bg-[#A60000] text-white" disabled={uploading}>
                      <Save className="h-4 w-4 mr-2" />
                      {editingBanner ? "Update Banner" : "Create Banner"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowBannerDialog(false);
                        resetBannerForm();
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

          {/* Banners Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-24">Order</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanners.map((banner) => (
                    <TableRow key={banner._id || banner.title}>
                      <TableCell>
                        <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                          <img src={banner?.imageUrl} alt={banner?.title} className="w-full h-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{banner?.title || "-"}</TableCell>
                      <TableCell>
                        {banner?.link ? (
                          <a
                            href={banner.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <LinkIcon className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-32">{banner.link}</span>
                          </a>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>{banner?.sortOrder ?? "-"}</TableCell>
                      <TableCell><Switch checked={!!banner?.isActive} size="sm" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" title="Edit"><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" title="Delete"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Empty States */}
      {activeTab === "projects" && filteredProjects.length === 0 && !projectsLoading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">Create your first new project to get started</p>
          <Button
            onClick={() => {
              resetProjectForm();
              setShowProjectDialog(true);
            }}
            className="bg-[#C70000] hover:bg-[#A60000] text-white"
          >
            Create Project
          </Button>
        </div>
      )}

      {activeTab === "banners" && filteredBanners.length === 0 && !bannersLoading && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Banners Found</h3>
          <p className="text-gray-600 mb-4">Create promotional banners for new projects</p>
          <Button
            onClick={() => {
              resetBannerForm();
              setShowBannerDialog(true);
            }}
            className="bg-[#C70000] hover:bg-[#A60000] text-white"
          >
            Create Banner
          </Button>
        </div>
      )}
    </div>
  );
}
