import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Plus, Pencil, Trash2, Save, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase kebab-case, e.g. 2-bhk"),
  status: z.enum(["active", "inactive"]),
});

type FormState = z.infer<typeof schema>;

interface SubcategoryItem {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder?: number;
  updatedAt?: string;
  createdAt?: string;
}

export default function AdminSubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categoryName, setCategoryName] = useState<string>("");
  const [items, setItems] = useState<SubcategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const debounceTimer = useRef<number | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editing, setEditing] = useState<SubcategoryItem | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({ name: "", slug: "", status: "active" });

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    // @ts-expect-error setTimeout typing in DOM
    debounceTimer.current = window.setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 400);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      if (!categoryId) return;
      setLoading(true);
      setError("");
      try {
        // Fetch subcategories for category
        const listRes = await api.get(`admin/subcategories?categoryId=${encodeURIComponent(categoryId)}`);
        const listRaw = (listRes?.data?.data?.subcategories || listRes?.data?.data || listRes?.data) as any[];
        const normalized: SubcategoryItem[] = (Array.isArray(listRaw) ? listRaw : []).map((s: any) => ({
          _id: s._id?.toString?.() || s._id,
          categoryId: s.categoryId,
          name: s.name,
          slug: s.slug,
          isActive: typeof s.isActive === "boolean" ? s.isActive : !!s.active,
          sortOrder: s.sortOrder ?? s.order,
          updatedAt: s.updatedAt,
          createdAt: s.createdAt,
        }));
        setItems(normalized);

        // Fetch categories to resolve the name
        const catsRes = await api.get("admin/categories");
        const cats = (catsRes?.data?.data?.categories || catsRes?.data?.data || []) as any[];
        const found = cats.find((c: any) => c._id?.toString?.() === categoryId || c._id === categoryId);
        setCategoryName(found?.name || `Category #${categoryId.substring(0, 6)}`);
      } catch (e: any) {
        setError(e?.message || "Failed to load subcategories");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const filtered = useMemo(() => {
    let list = items;
    if (debouncedQuery) {
      list = list.filter((it) =>
        `${it.name} ${it.slug}`.toLowerCase().includes(debouncedQuery),
      );
    }
    return list;
  }, [items, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 7;
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", status: "active" });
    setShowEditor(true);
  };

  const openEdit = (it: SubcategoryItem) => {
    setEditing(it);
    setForm({ name: it.name, slug: it.slug, status: it.isActive ? "active" : "inactive" });
    setShowEditor(true);
  };

  const onChangeName = (v: string) => {
    const auto = v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, name: v, slug: auto }));
  };

  const save = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Validation failed", description: parsed.error.errors.map((e) => e.message).join("\n") });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        categoryId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        active: parsed.data.status === "active",
      };

      if (editing) {
        await api.put(`admin/subcategories/${editing._id}`, payload);
        toast({ title: "Updated", description: `Subcategory “${payload.name}” updated` });
      } else {
        await api.post("admin/subcategories", payload);
        toast({ title: "Created", description: `Subcategory “${payload.name}” created` });
      }

      // Refresh
      const listRes = await api.get(`admin/subcategories?categoryId=${encodeURIComponent(categoryId || "")}`);
      const listRaw = (listRes?.data?.data?.subcategories || listRes?.data?.data || listRes?.data) as any[];
      const normalized: SubcategoryItem[] = (Array.isArray(listRaw) ? listRaw : []).map((s: any) => ({
        _id: s._id?.toString?.() || s._id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        isActive: typeof s.isActive === "boolean" ? s.isActive : !!s.active,
        sortOrder: s.sortOrder ?? s.order,
        updatedAt: s.updatedAt,
        createdAt: s.createdAt,
      }));
      setItems(normalized);
      setShowEditor(false);
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Could not save subcategory" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (it: SubcategoryItem) => {
    const prev = items;
    const next = items.map((s) => (s._id === it._id ? { ...s, isActive: !s.isActive } : s));
    setItems(next);
    try {
      await api.put(`admin/subcategories/${it._id}`, { active: !it.isActive });
      toast({ title: !it.isActive ? "Activated" : "Deactivated", description: it.name });
    } catch (e: any) {
      setItems(prev);
      toast({ title: "Update failed", description: e?.message || "Could not update status" });
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`admin/subcategories/${id}`);
      setItems((list) => list.filter((x) => x._id !== id));
      toast({ title: "Deleted", description: "Subcategory removed" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Could not delete" });
    } finally {
      setPendingDeleteId(null);
    }
  };

  if (!categoryId) {
    return (
      <AdminLayout activeSection="categories">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-2">Invalid category</h1>
          <p className="text-gray-600 mb-4">The category ID is missing or invalid.</p>
          <Link to="/admin/ads/categories" className="text-primary underline">Back to Categories</Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      activeSection="categories"
      onSectionChange={(s) => {
        window.location.href = s === "categories" ? "/admin/ads/categories" : "/admin";
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="text-sm text-gray-500">
            <Link to="/">Home</Link> <span className="mx-1">›</span>
            <Link to="/admin/ads/categories">Categories</Link> <span className="mx-1">›</span>
            <span>{categoryName || `Category #${categoryId.substring(0, 6)}`}</span> <span className="mx-1">›</span>
            <span className="text-gray-800 font-medium">Subcategories</span>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Subcategories – {categoryName || `Category #${categoryId.substring(0, 6)}`}
            </h1>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search subcategories..."
                  className="pl-8 w-64"
                />
              </div>
              <Button onClick={openCreate} aria-label="Add Subcategory">
                <Plus className="h-4 w-4 mr-2" /> Add Subcategory
              </Button>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {!loading && pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No subcategories found
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  pageItems.map((it, idx) => (
                    <TableRow key={it._id} className="[&>td]:align-middle">
                      <TableCell>{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{it.slug}</code>
                      </TableCell>
                      <TableCell>{categoryName || it.categoryId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={it.isActive} onCheckedChange={() => toggleActive(it)} />
                          <Badge variant={it.isActive ? "default" : "secondary"}>
                            {it.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {it.updatedAt ? new Date(it.updatedAt).toLocaleString() : it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(it)} aria-label={`Edit ${it.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setPendingDeleteId(it._id)} aria-label={`Delete ${it.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows per page</span>
              <select
                className="border rounded px-2 py-1"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value) || 10);
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers.map((n) => (
                  <Button key={n} variant={n === currentPage ? "default" : "outline"} size="sm" onClick={() => setPage(n)}>
                    {n}
                  </Button>
                ))}
                <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={(o) => { setShowEditor(o); if (!o) setEditing(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={form.name} onChange={(e) => onChangeName(e.target.value)} placeholder="e.g. 2 BHK" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="e.g. 2-bhk" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className="flex items-center gap-3">
                  <Button variant={form.status === "active" ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, status: "active" }))}>Active</Button>
                  <Button variant={form.status === "inactive" ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, status: "inactive" }))}>Inactive</Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditor(false)} aria-label="Cancel">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={save} disabled={saving} aria-label="Save Subcategory">
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <AlertDialog open={!!pendingDeleteId} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the subcategory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => pendingDeleteId && remove(pendingDeleteId)} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
