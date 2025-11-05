import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { useToast } from "../ui/use-toast";
import { Upload, Trash2, Save, MapPin, Image as ImageIcon } from "lucide-react";

interface AreaMapItem {
  _id?: string;
  title?: string;
  area?: string;
  description?: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export default function MapsManagement() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AreaMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AreaMapItem>({
    title: "",
    area: "",
    description: "",
    imageUrl: "",
    isActive: true,
    sortOrder: 1,
  });
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/admin/maps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data?.success === false)
        throw new Error(data?.error || "Failed to load maps");
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e: any) {
      console.error("Maps load error", e);
      toast({
        title: "Error",
        description: e?.message || "Failed to load maps",
        variant: "destructive",
      });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/maps/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "Upload failed");
      setForm((p) => ({ ...p, imageUrl: data.data.imageUrl }));
      toast({ title: "Uploaded", description: "Image uploaded" });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const createItem = async () => {
    if (!form.imageUrl) {
      toast({
        title: "Image required",
        description: "Please upload or paste an image URL",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch("/api/admin/maps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "Create failed");
      setForm({
        title: "",
        area: "",
        description: "",
        imageUrl: "",
        isActive: true,
        sortOrder: 1,
      });
      await fetchItems();
      try {
        window.dispatchEvent(new Event("areaMapsUpdated"));
      } catch {}
      toast({ title: "Saved", description: "Map added" });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Create failed",
        variant: "destructive",
      });
    }
  };

  const updateItem = async (id: string, patch: Partial<AreaMapItem>) => {
    try {
      const res = await fetch(`/api/admin/maps/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "Update failed");
      await fetchItems();
      try {
        window.dispatchEvent(new Event("areaMapsUpdated"));
      } catch {}
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Update failed",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/maps/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success)
        throw new Error(data?.error || "Delete failed");
      await fetchItems();
      try {
        window.dispatchEvent(new Event("areaMapsUpdated"));
      } catch {}
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Delete failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Area Maps</h1>
      <p className="text-gray-600 mb-6">
        Upload area-wise maps with description. Appears on Maps page.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <MapPin size={16} /> Area
              </label>
              <Input
                value={form.area || ""}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="e.g. Sector 1, Rohtak"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1">Title</label>
              <Input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short title (optional)"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1">Description</label>
            <Textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              placeholder="Details (optional)"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium flex items-center gap-2 mb-1">
                <ImageIcon size={16} /> Image URL
              </label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="Paste image URL or upload"
              />
            </div>
            <div>
              <input
                id="mapfile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
              <Button
                type="button"
                onClick={() => document.getElementById("mapfile")?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />{" "}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-center">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <span className="text-sm">Active</span>
            </div>
            <div>
              <label className="text-sm font-medium mb-1">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sortOrder: parseInt(e.target.value || "0", 10),
                  })
                }
              />
            </div>
            <div>
              <Button onClick={createItem} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </div>
          </div>
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="preview"
              className="mt-2 rounded border max-h-48 object-contain"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-3 text-center py-10 text-gray-600">
            Loading...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-600">
            No maps yet
          </div>
        )}
        {items.map((it) => (
          <Card key={it._id}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {it.title || it.area || "Map"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <img
                src={it.imageUrl}
                alt={it.title || "map"}
                className="w-full h-40 object-cover rounded"
              />
              <div className="text-sm text-gray-700">
                <span className="font-medium">Area:</span> {it.area || "—"}
              </div>
              {it.description && (
                <div className="text-sm text-gray-600 line-clamp-2">
                  {it.description}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!it.isActive}
                    onCheckedChange={(v) =>
                      it._id && updateItem(it._id, { isActive: v })
                    }
                  />
                  <span className="text-xs">Active</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => it._id && deleteItem(it._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
