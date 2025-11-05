import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, createApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Country {
  _id: string;
  name: string;
  isoCode: string;
  statesCount?: number;
  active?: boolean;
}

export default function CountriesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.isoCode?.toLowerCase().includes(q));
  }, [countries, search]);

  const fetchCountries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiRequest("admin/locations/countries", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok && Array.isArray(res.data?.data)) {
        setCountries(res.data.data);
      } else if (res.ok && Array.isArray(res.data)) {
        setCountries(res.data);
      } else {
        setCountries([]);
      }
    } catch (e: any) {
      console.warn("Countries fetch failed:", e?.message || e);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toggleStatus = async (id: string, active: boolean) => {
    const prev = [...countries];
    setCountries((cs) => cs.map((c) => (c._id === id ? { ...c, active } : c)));
    try {
      setSaving(id);
      // Try PATCH status endpoint first; if 404, fallback to PUT full update
      const patchUrl = createApiUrl(`admin/locations/countries/${id}/status`);
      let ok = false;
      try {
        const r1 = await fetch(patchUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ active }),
          credentials: "include",
        });
        ok = r1.ok;
      } catch {}
      if (!ok) {
        const put = await apiRequest(`admin/locations/countries/${id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        });
        ok = put.ok;
      }
      if (!ok) throw new Error("Failed to update status");
      toast({ title: "Status updated" });
    } catch (e: any) {
      setCountries(prev);
      toast({ title: "Error", description: e?.message || "Failed to update", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this country?")) return;
    const prev = [...countries];
    setCountries((cs) => cs.filter((c) => c._id !== id));
    try {
      setDeleting(id);
      const res = await apiRequest(`admin/locations/countries/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(res.data?.error || "Delete failed");
      toast({ title: "Country deleted" });
    } catch (e: any) {
      setCountries(prev);
      toast({ title: "Error", description: e?.message || "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AdminLayout
      activeSection="countries"
      onSectionChange={(section) => {
        if (section === "categories") window.location.href = "/admin/ads/categories";
        else if (section === "countries") window.location.href = "/admin/locations/countries";
        else window.location.href = "/admin";
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Countries</h3>
            <p className="text-gray-600">Manage countries list and status</p>
          </div>
          <Button aria-label="Add Country" disabled className="bg-[#C70000] hover:bg-[#A60000]"> <Plus className="h-4 w-4 mr-2" /> Add Country</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Input placeholder="Search countries..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search countries" />
              <Button variant="outline" onClick={() => fetchCountries()} aria-label="Refresh countries" disabled={loading}>Refresh</Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>ISO Code</TableHead>
                    <TableHead>States</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.isoCode || "-"}</TableCell>
                      <TableCell>{c.statesCount ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!c.active}
                            onCheckedChange={(checked) => toggleStatus(c._id, checked)}
                            disabled={saving === c._id}
                            aria-label={`Toggle status for ${c.name}`}
                          />
                          <span className="text-sm">{c.active ? "Active" : "Inactive"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" aria-label={`Edit ${c.name}`} disabled>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" aria-label={`Delete ${c.name}`} onClick={() => remove(c._id)} disabled={deleting === c._id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                        {loading ? "Loading..." : "No countries found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
