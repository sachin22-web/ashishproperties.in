import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Save, X, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api, apiRequest } from "@/lib/api";

interface Subcategory {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export default function SubcategoriesPage() {
  const { token } = useAuth();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [categoryName, setCategoryName] = useState<string>("");
  const [items, setItems] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    icon?: string;
    order: number;
    active: boolean;
  }>({ name: "", slug: "", icon: "", order: 0, active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onUpdate = () => fetchAll();
    window.addEventListener("subcategories:updated", onUpdate);
    window.addEventListener("categories:updated", onUpdate);
    return () => {
      window.removeEventListener("subcategories:updated", onUpdate);
      window.removeEventListener("categories:updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, categoryId]);

  const fetchAll = async () => {
    if (!token || !categoryId) return;
    try {
      setLoading(true);
      setError("");

      // Get subcategories for this category
      const listRes = await api.get(
        `admin/subcategories?categoryId=${categoryId}`,
        token,
      );
      const list = (listRes?.data?.data?.subcategories ||
        listRes?.data?.data ||
        listRes?.data) as any[];
      const normalized: Subcategory[] = (Array.isArray(list) ? list : []).map(
        (s: any) => ({
          _id: s._id?.toString?.() || s._id,
          categoryId: s.categoryId,
          name: s.name,
          slug: s.slug,
          iconUrl: s.iconUrl,
          sortOrder: s.sortOrder ?? s.order ?? 0,
          isActive: typeof s.isActive === "boolean" ? s.isActive : !!s.active,
        }),
      );
      setItems(normalized);

      // Fetch category name for header
      const catRes = await api.get("admin/categories", token);
      const cats = catRes?.data?.data?.categories || catRes?.data?.data || [];
      const found = (cats || []).find(
        (c: any) => c._id?.toString?.() === categoryId || c._id === categoryId,
      );
      setCategoryName(found?.name || "Category");
    } catch (e: any) {
      console.error("Error loading subcategories:", e?.message || e);
      setError(e?.message || "Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", slug: "", icon: "", order: 0, active: true });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowDialog(true);
  };

  const onNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, name, slug }));
  };

  const save = async () => {
    if (!token || !categoryId || !form.name.trim()) return;
    try {
      setSaving(true);
      const payload = {
        categoryId,
        name: form.name.trim(),
        slug: form.slug?.trim() || undefined,
        icon: form.icon || undefined,
        order: Number(form.order) || 0,
        active: !!form.active,
      } as any;

      if (editing) {
        await api.put(`admin/subcategories/${editing._id}`, payload, token);
      } else {
        // Handle one-time 409 by retrying with -2 / -3
        let attempt = 0;
        let body = { ...payload };
        // First try
        let res = await api
          .post("admin/subcategories", body, token)
          .catch((e: any) => ({ error: e }));
        if ((res as any)?.data?.success !== true) {
          const msg =
            (res as any)?.data?.error || (res as any)?.error?.message || "";
          if (/409|exists|already/i.test(msg) && payload.slug) {
            attempt = 1;
            body.slug = `${payload.slug}-2`;
            res = await api
              .post("admin/subcategories", body, token)
              .catch((e: any) => ({ error: e }));
            if ((res as any)?.data?.success !== true) {
              attempt = 2;
              body.slug = `${payload.slug}-3`;
              res = await api
                .post("admin/subcategories", body, token)
                .catch((e: any) => ({ error: e }));
            }
          }
          if ((res as any)?.data?.success !== true)
            throw new Error((res as any)?.data?.error || "Failed to save");
        }
      }

      setShowDialog(false);
      resetForm();
      await fetchAll();
      window.dispatchEvent(new Event("subcategories:updated"));
      window.dispatchEvent(new Event("categories:updated"));
    } catch (e: any) {
      console.error("Save failed:", e?.message || e);
      setError(e?.message || "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (it: Subcategory) => {
    const prev = [...items];
    setItems((list) =>
      list.map((s) => (s._id === it._id ? { ...s, isActive: !s.isActive } : s)),
    );
    try {
      await api.put(
        `admin/subcategories/${it._id}`,
        { active: !it.isActive },
        token,
      );
      window.dispatchEvent(new Event("subcategories:updated"));
    } catch (e) {
      setItems(prev);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this subcategory? This cannot be undone.")) return;
    try {
      await api.delete(`admin/subcategories/${id}`, token);
      await fetchAll();
      window.dispatchEvent(new Event("subcategories:updated"));
      window.dispatchEvent(new Event("categories:updated"));
    } catch (e: any) {
      setError(e?.message || "Failed to delete subcategory");
    }
  };

  const headerTitle = useMemo(() => {
    const count = items.length;
    return `${categoryName || "Category"} • ${count} subcategor${count === 1 ? "y" : "ies"}`;
  }, [categoryName, items.length]);

  return (
    <AdminLayout
      activeSection="categories"
      onSectionChange={(s) => {
        window.location.href =
          s === "categories" ? "/admin/ads/categories" : "/admin";
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
          <div className="space-x-2">
            <Link to="/admin/ads/categories" className="text-sm underline">
              Back to Categories
            </Link>
            <Button onClick={openCreate} aria-label="Add Subcategory">
              <Plus className="h-4 w-4 mr-2" />
              Add Subcategory
            </Button>
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategory</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it._id}>
                  <TableCell>
                    <div className="font-medium">{it.name}</div>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {it.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    {it.iconUrl ? (
                      <img
                        src={it.iconUrl}
                        alt="icon"
                        className="w-6 h-6 rounded"
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {it.sortOrder ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={it.isActive}
                        onCheckedChange={() => toggle(it)}
                        aria-label={`Toggle ${it.name}`}
                      />
                      <span className="text-sm">
                        {it.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Edit ${it.name}`}
                        onClick={() => {
                          setEditing(it);
                          setForm({
                            name: it.name,
                            slug: it.slug,
                            icon: it.iconUrl,
                            order: it.sortOrder ?? 0,
                            active: it.isActive,
                          });
                          setShowDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        aria-label={`Delete ${it.name}`}
                        onClick={() => remove(it._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-6"
                  >
                    No subcategories yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog
          open={showDialog}
          onOpenChange={(o) => {
            setShowDialog(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Subcategory" : "Add Subcategory"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Subcategory name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  placeholder="slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Icon (URL)
                </label>
                <Input
                  value={form.icon || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, icon: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, active: !!v }))
                  }
                  aria-label="Toggle active"
                />
                <span className="text-sm">
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={save}
                  disabled={saving}
                  aria-label="Save Subcategory"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
