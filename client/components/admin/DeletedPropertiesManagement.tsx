import { useEffect, useState } from "react";
import { Property } from "../../../shared/types";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { RefreshCw, Trash2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

export default function DeletedPropertiesManagement() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDeletedProperties();
  }, []);

  const fetchDeletedProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { api } = await import("../../lib/api");
      const response = await api.get("admin/properties/deleted", token);

      if (response.data?.success) {
        setProperties(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching deleted properties:", error);
      toast.error("Failed to fetch deleted properties");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(properties.map((p) => p._id!)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select properties to restore");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const { api } = await import("../../lib/api");
      const response = await api.put(
        "admin/properties/bulk/restore",
        { propertyIds: Array.from(selectedIds) },
        token,
      );

      if (response.data?.success) {
        toast.success(response.data.data.message);
        setSelectedIds(new Set());
        fetchDeletedProperties();
      }
    } catch (error) {
      console.error("Error restoring properties:", error);
      toast.error("Failed to restore properties");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select properties to delete permanently");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const { api } = await import("../../lib/api");
      const response = await api.delete(
        "admin/properties/bulk/permanent",
        token,
        { propertyIds: Array.from(selectedIds) },
      );

      if (response.data?.success) {
        toast.success(response.data.data.message);
        setSelectedIds(new Set());
        setDeleteDialogOpen(false);
        fetchDeletedProperties();
      }
    } catch (error) {
      console.error("Error permanently deleting properties:", error);
      toast.error("Failed to permanently delete properties");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreSingle = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      const { api } = await import("../../lib/api");
      const response = await api.put(
        `admin/properties/${propertyId}/restore`,
        {},
        token,
      );

      if (response.data?.success) {
        toast.success("Property restored successfully");
        fetchDeletedProperties();
      }
    } catch (error) {
      console.error("Error restoring property:", error);
      toast.error("Failed to restore property");
    }
  };

  const handlePermanentDeleteSingle = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      const { api } = await import("../../lib/api");
      const response = await api.delete(
        `admin/properties/${propertyId}/permanent`,
        token,
      );

      if (response.data?.success) {
        toast.success("Property permanently deleted");
        fetchDeletedProperties();
      }
    } catch (error) {
      console.error("Error permanently deleting property:", error);
      toast.error("Failed to permanently delete property");
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading deleted properties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deleted Properties</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage deleted property listings ({properties.length} total)
          </p>
        </div>
        <Button onClick={fetchDeletedProperties} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "property" : "properties"} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkRestore}
              disabled={actionLoading}
              size="sm"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restore Selected
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={actionLoading}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No deleted properties found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      properties.length > 0 &&
                      selectedIds.size === properties.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Deleted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(property._id!)}
                      onCheckedChange={() => toggleSelect(property._id!)}
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {property.title}
                  </TableCell>
                  <TableCell className="capitalize">
                    {property.propertyType}
                  </TableCell>
                  <TableCell>
                    ₹{property.price.toLocaleString("en-IN")}
                    <span className="text-xs text-gray-500 ml-1">
                      {property.priceType === "rent" ? "/mo" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {property.location.area || property.location.sector}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(property.deletedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleRestoreSingle(property._id!)}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedIds(new Set([property._id!]));
                          setDeleteDialogOpen(true);
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Properties?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedIds.size}{" "}
              {selectedIds.size === 1 ? "property" : "properties"} from the
              database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkPermanentDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
