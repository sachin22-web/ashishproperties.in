import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlertCircle,
  ChevronUp,
  ChevronDown,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface SliderImage {
  _id?: string;
  url: string;
  alt: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function HomepageSliderManagement() {
  const { token } = useAuth();
  const [sliders, setSliders] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderImage | null>(null);
  const [formData, setFormData] = useState<Partial<SliderImage>>({
    url: "",
    alt: "",
    title: "",
    subtitle: "",
    isActive: true,
    order: 1,
  });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSliders();
  }, [token]);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/homepage-sliders", {
        credentials: "include",
        headers: {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSliders(data.data || []);
        } else {
          setError(data.error || "Failed to fetch sliders");
        }
      } else {
        setError(`Failed to fetch sliders: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching sliders:", error);
      setError("Failed to fetch sliders");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url || !formData.alt) {
      setError("Image URL and Alt text are required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = editingSlider
        ? `/api/admin/homepage-sliders/${editingSlider._id}`
        : "/api/admin/homepage-sliders";

      const method = editingSlider ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(
            `Slider ${editingSlider ? "updated" : "created"} successfully!`,
          );
          setTimeout(() => setSuccess(""), 3000);

          // Reset form
          setFormData({
            url: "",
            alt: "",
            title: "",
            subtitle: "",
            isActive: true,
            order: 1,
          });
          setEditingSlider(null);
          setIsDialogOpen(false);

          // Refresh data and trigger homepage update
          fetchSliders();
          window.dispatchEvent(new CustomEvent("sliderUpdate"));
          window.dispatchEvent(new CustomEvent("sliderUpdate"));
          console.log("🔄 Slider update event dispatched");
        } else {
          setError(data.error || "Failed to save slider");
        }
      } else {
        setError(`Failed to save slider: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving slider:", error);
      setError("Failed to save slider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlider = async (sliderId: string) => {
    if (!confirm("Are you sure you want to delete this slider?")) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/admin/homepage-sliders/${sliderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess("Slider deleted successfully!");
          setTimeout(() => setSuccess(""), 3000);
          fetchSliders();
          window.dispatchEvent(new CustomEvent("sliderUpdate"));
        } else {
          setError(data.error || "Failed to delete slider");
        }
      } else {
        setError(`Failed to delete slider: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting slider:", error);
      setError("Failed to delete slider");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slider: SliderImage) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `/api/admin/homepage-sliders/${slider._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...slider,
            isActive: !slider.isActive,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(
            `Slider ${!slider.isActive ? "activated" : "deactivated"}!`,
          );
          setTimeout(() => setSuccess(""), 3000);
          fetchSliders();
          window.dispatchEvent(new CustomEvent("sliderUpdate"));
        } else {
          setError(data.error || "Failed to update slider");
        }
      } else {
        setError(`Failed to update slider: ${response.status}`);
      }
    } catch (error) {
      console.error("Error updating slider:", error);
      setError("Failed to update slider");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSlider = (slider: SliderImage) => {
    setEditingSlider(slider);
    setFormData(slider);
    setIsDialogOpen(true);
  };

  const handleMoveSlider = async (
    slider: SliderImage,
    direction: "up" | "down",
  ) => {
    const currentOrder = slider.order || 0;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

    if (newOrder < 1) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/admin/homepage-sliders/${slider._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...slider,
            order: newOrder,
          }),
        },
      );

      if (response.ok) {
        fetchSliders();
      }
    } catch (error) {
      console.error("Error moving slider:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading slider management...</p>
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
          <h3 className="text-2xl font-bold text-gray-900">
            Homepage Slider Management
          </h3>
          <p className="text-gray-600">
            Manage hero slider images for the homepage
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchSliders} variant="outline" disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#C70000] hover:bg-[#A60000]"
                onClick={() => {
                  setEditingSlider(null);
                  setFormData({
                    url: "",
                    alt: "",
                    title: "",
                    subtitle: "",
                    isActive: true,
                    order: sliders.length + 1,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSlider ? "Edit Slider" : "Add New Slider"}
                </DialogTitle>
                <DialogDescription>
                  Create or edit homepage slider images with titles and
                  descriptions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveSlider} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image URL *
                  </label>
                  <Input
                    value={formData.url || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Alt Text *
                  </label>
                  <Input
                    value={formData.alt || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, alt: e.target.value })
                    }
                    placeholder="Description of the image"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Main heading (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subtitle
                  </label>
                  <Textarea
                    value={formData.subtitle || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    placeholder="Description text (optional)"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Display Order
                    </label>
                    <Input
                      type="number"
                      value={formData.order || 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      className="w-20"
                    />
                  </div>
                  <label className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </form>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#C70000] hover:bg-[#A60000]"
                  onClick={handleSaveSlider}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingSlider ? "Update" : "Add"} Slider
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sliders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Sliders</CardTitle>
          <CardDescription>
            Manage your homepage slider images. They will appear in the order
            specified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sliders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sliders
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((slider) => (
                    <TableRow key={slider._id}>
                      <TableCell>
                        <div className="w-16 h-10 bg-gray-100 rounded overflow-hidden">
                          <img
                            src={slider.url}
                            alt={slider.alt}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='40' viewBox='0 0 64 40'%3E%3Crect width='64' height='40' fill='%23f3f4f6'/%3E%3Ctext x='32' y='20' text-anchor='middle' dy='.3em' fill='%23666'%3EImg%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {slider.title || "No title"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {slider.subtitle || "No subtitle"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {slider.alt}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm">{slider.order}</span>
                          <div className="flex flex-col">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => handleMoveSlider(slider, "up")}
                              disabled={saving}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => handleMoveSlider(slider, "down")}
                              disabled={saving}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={slider.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {slider.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(slider)}
                            disabled={saving}
                          >
                            {slider.isActive ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSlider(slider)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSlider(slider._id!)}
                            className="text-red-600 hover:text-red-700"
                            disabled={saving}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No sliders configured yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setIsDialogOpen(true)}
              >
                Add First Slider
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      {sliders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How your slider will appear on the homepage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-48 md:h-64 bg-gray-900 rounded-lg overflow-hidden">
              {sliders
                .filter((slider) => slider.isActive)
                .slice(0, 1)
                .map((slider) => (
                  <div key={slider._id} className="relative w-full h-full">
                    <img
                      src={slider.url}
                      alt={slider.alt}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white px-4">
                        <h1 className="text-xl md:text-3xl font-bold mb-2">
                          {slider.title || "Find Your Perfect Property"}
                        </h1>
                        <p className="text-sm md:text-lg text-gray-200">
                          {slider.subtitle ||
                            "Discover amazing properties in your area with verified listings"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
