import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save, X, Trash2, Edit, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";

// API endpoints config (easy to change)
const API = {
  list: (categoryId: string, q: string, page: number, limit: number) =>
    `/api/categories/${categoryId}/subcategories?search=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
  create: (categoryId: string) => `/api/categories/${categoryId}/subcategories`,
  update: (id: string) => `/api/subcategories/${id}`,
  remove: (id: string) => `/api/subcategories/${id}`,
  category: (categoryId: string) => `/api/categories/${categoryId}`,
};

type Status = "active" | "inactive";

type Subcategory = {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  status: Status;
  updatedAt?: string;
  createdAt?: string;
};

type ListResponse = {
  data: Subcategory[];
  pagination?: { page: number; limit: number; total: number };
};

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  status: z.enum(["active", "inactive"]),
});

// Mock fallback data generator
function makeMock(categoryId: string) {
  const now = new Date().toISOString();
  return Array.from({ length: 6 }).map((_, i) => ({
    _id: `mock-${i + 1}`,
    name: `Mock Sub ${i + 1}`,
    slug: `mock-sub-${i + 1}`,
    categoryId,
    status: i % 2 === 0 ? "active" : "inactive",
    updatedAt: now,
    createdAt: now,
  } as Subcategory));
}

export default function AdminSubcategoriesPage(): JSX.Element {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get("search") || "";
  const pParam = parseInt(searchParams.get("page") || "1", 10) || 1;
  const lParam = parseInt(searchParams.get("limit") || "10", 10) || 10;

  const [items, setItems] = useState<Subcategory[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);

  // Dialog / form state
  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [form, setForm] = useState<{ name: string; slug: string; status: Status }>({ name: "", slug: "", status: "active" });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  // Search debounce
  const [query, setQuery] = useState<string>(qParam);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // @ts-ignore
    debounceRef.current = window.setTimeout(() => {
      const s = query || "";
      const page = 1; // reset page on new search
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev.toString());
        next.set("search", s);
        next.set("page", String(page));
        next.set("limit", String(lParam));
        return next;
      });
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const page = parseInt(searchParams.get("page") || "1", 10) || 1;
  const limit = parseInt(searchParams.get("limit") || "10", 10) || 10;
  const search = searchParams.get("search") || "";

  const load = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    setUseMock(false);
    try {
      // Fetch category name (optional)
      try {
        const cat = await apiClient.get<{ data: any }>(API.category(categoryId));
        setCategoryName((cat && (cat.data?.name || cat.data?.title)) || null);
      } catch (e: any) {
        // ignore category name errors; treat later
      }

      const res = await apiClient.get<ListResponse>(API.list(categoryId, search, page, limit));
      if (!res || !Array.isArray(res.data)) {
        throw new Error("Invalid response");
      }
      setItems(res.data);
      setTotal(res.pagination?.total ?? res.data.length ?? 0);
    } catch (err: any) {
      // If 401/403
      if (err?.status === 401 || err?.status === 403) {
        setError("Session expired");
        toast({ title: "Session expired", description: "Please login again.", });
        return;
      }

      // Fallback to mock data
      setUseMock(true);
      setTimeout(() => {
        const mock = makeMock(categoryId || "unknown");
        setItems(mock);
        setTotal(mock.length + 12); // pretend more pages
        setLoading(false);
      }, 600);
      return;
    } finally {
      setLoading(false);
    }
  }, [categoryId, limit, page, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * limit;

  const pageItems = useMemo(() => items.slice(0, limit), [items, limit]);

  // Open create
  const onOpenCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", status: "active" });
    setOpenEditor(true);
  };

  const onOpenEdit = (it: Subcategory) => {
    setEditing(it);
    setForm({ name: it.name, slug: it.slug, status: it.status });
    setOpenEditor(true);
  };

  const generateSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    if (!editing) return;
    // focus management could be added
  }, [editing]);

  const save = async () => {
    // Validate
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ");
      toast({ title: "Validation failed", description: msg });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        if (useMock) {
          setItems((list) => list.map((i) => (i._id === editing._id ? { ...i, ...form } as Subcategory : i)));
          toast({ title: "Updated (mock)", description: `${form.name} updated` });
        } else {
          await apiClient.put(API.update(editing._id), { name: form.name, slug: form.slug, status: form.status });
          toast({ title: "Updated", description: `${form.name} updated` });
          // update locally
          setItems((list) => list.map((i) => (i._id === editing._id ? { ...i, ...form } as Subcategory : i)));
        }
      } else {
        if (useMock) {
          const newItem: Subcategory = {
            _id: `mock-${Math.random().toString(36).substring(2, 9)}`,
            name: form.name,
            slug: form.slug,
            categoryId: categoryId || "",
            status: form.status,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          setItems((list) => [newItem, ...list]);
          setTotal((t) => t + 1);
          toast({ title: "Created (mock)", description: `${form.name} created` });
        } else {
          await apiClient.post(API.create(categoryId || ""), { name: form.name, slug: form.slug, status: form.status });
          toast({ title: "Created", description: `${form.name} created` });
          // reload
          await load();
        }
      }
      setOpenEditor(false);
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const onToggleStatus = async (it: Subcategory) => {
    const prev = items;
    const updated = { ...it, status: it.status === "active" ? "inactive" : "active" };
    setItems((list) => list.map((i) => (i._id === it._id ? updated : i)));
    try {
      if (useMock) {
        toast({ title: "Status updated (mock)", description: `${updated.name} is now ${updated.status}` });
      } else {
        await apiClient.put(API.update(it._id), { status: updated.status });
        toast({ title: "Status updated", description: `${updated.name} is now ${updated.status}` });
      }
    } catch (e: any) {
      setItems(prev);
      toast({ title: "Update failed", description: e?.message || "Could not update status" });
    }
  };

  const onDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    if (confirmText !== "DELETE") {
      toast({ title: "Type DELETE to confirm", description: "You must type DELETE to confirm deletion." });
      return;
    }
    const id = pendingDelete.id;
    try {
      if (useMock) {
        setItems((list) => list.filter((i) => i._id !== id));
        setTotal((t) => Math.max(0, t - 1));
        toast({ title: "Deleted (mock)", description: "Subcategory removed" });
      } else {
        await apiClient.delete(API.remove(id));
        setItems((list) => list.filter((i) => i._id !== id));
        setTotal((t) => Math.max(0, t - 1));
        toast({ title: "Deleted", description: "Subcategory removed" });
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Could not delete" });
    } finally {
      setPendingDelete(null);
      setConfirmText("");
    }
  };

  if (!categoryId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Invalid category</h2>
        <p className="text-gray-600 mt-2">Category id is missing from the URL.</p>
        <Link to="/admin/categories" className="text-primary underline mt-4 inline-block">Back to Categories</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500 mb-2">
            <Link to="/">Home</Link> <span className="mx-1">›</span>{" "}
            <Link to="/admin/categories">Categories</Link> <span className="mx-1">›</span>{" "}
            <span>{categoryName || `#${(categoryId || "").slice(0, 6)}`}</span>{" "}
            <span className="mx-1">›</span> <strong>Subcategories</strong>
          </div>
          <h1 className="text-2xl font-bold">Subcategories – {categoryName || `#${(categoryId || "").slice(0, 6)}`}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-8 w-64" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search subcategories..." />
          </div>
          <Button onClick={onOpenCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Subcategory
          </Button>
        </div>
      </div>

      {/* Card */}
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
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              )}

              {!loading && pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No subcategories found. <Button variant="ghost" onClick={onOpenCreate} className="ml-2">Add Subcategory</Button>
                  </TableCell>
                </TableRow>
              )}

              {!loading && pageItems.map((it, idx) => (
                <TableRow key={it._id} className="[&>td]:align-middle">
                  <TableCell>{pageStart + idx + 1}</TableCell>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell><code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{it.slug}</code></TableCell>
                  <TableCell>{categoryName || it.categoryId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={it.status === "active"} onCheckedChange={() => onToggleStatus(it)} />
                      <Badge variant={it.status === "active" ? "default" : "secondary"}>{it.status === "active" ? "Active" : "Inactive"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell><span className="text-sm text-gray-600">{it.updatedAt ? new Date(it.updatedAt).toLocaleString() : it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onOpenEdit(it)} aria-label={`Edit ${it.name}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setPendingDelete({ id: it._id, name: it.name })}>
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
            <select value={limit} onChange={(e) => { const l = parseInt(e.target.value||"10",10); setSearchParams((p) => { const n = new URLSearchParams(p.toString()); n.set("limit", String(l)); n.set("page", "1"); return n; }); }} className="border rounded px-2 py-1">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" disabled={currentPage === 1} onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p.toString()); n.set("page", String(Math.max(1, currentPage - 1))); return n; })}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(7, totalPages) }).map((_, i) => {
                const n = Math.max(1, Math.min(totalPages, currentPage - 3 + i));
                return (
                  <Button key={n} variant={n === currentPage ? "default" : "outline"} size="sm" onClick={() => setSearchParams((p) => { const s = new URLSearchParams(p.toString()); s.set("page", String(n)); return s; })}>{n}</Button>
                );
              })}
              <Button variant="outline" size="icon" disabled={currentPage === totalPages} onClick={() => setSearchParams((p) => { const n = new URLSearchParams(p.toString()); n.set("page", String(Math.min(totalPages, currentPage + 1))); return n; })}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={openEditor} onOpenChange={(o) => { setOpenEditor(o); if (!o) { setEditing(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, name: v, slug: f.slug && editing ? f.slug : generateSlug(v) })); }} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug *</label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="flex items-center gap-2">
                <Button variant={form.status === "active" ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, status: "active" }))}>Active</Button>
                <Button variant={form.status === "inactive" ? "default" : "outline"} size="sm" onClick={() => setForm((f) => ({ ...f, status: "inactive" }))}>Inactive</Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setOpenEditor(false); setEditing(null); }}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full mr-2" /> Saving...
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
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
            <AlertDialogDescription>
              Type <strong>DELETE</strong> to confirm deletion of <strong>{pendingDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-4">
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={onDeleteConfirmed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
