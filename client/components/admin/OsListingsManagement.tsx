import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { OsCategory, OsSubcategory, OsListing } from "@shared/types";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function OsListingsManagement() {
  const { token } = useAuth();
  const [listings, setListings] = useState<OsListing[]>([]);
  const [categories, setCategories] = useState<OsCategory[]>([]);
  const [subcategories, setSubcategories] = useState<OsSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<OsListing | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    name: "",
    phone: "",
    address: "",
    photos: ["", "", "", ""],
    geo: { lat: 0, lng: 0 },
    open: "09:00",
    close: "18:00",
    active: true,
  });

  useEffect(() => {
    fetchListings();
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/os-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/os-subcategories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setSubcategories(data.data.subcategories);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchListings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/os-listings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setListings(data.data.listings);
      } else {
        setError(getApiErrorMessage(data, status, "fetch OS listings"));
      }
    } catch (error) {
      console.error("Error fetching OS listings:", error);
      setError("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (
      !token ||
      !formData.name ||
      !formData.phone ||
      !formData.category ||
      !formData.subcategory
    )
      return;

    try {
      const listingData = {
        ...formData,
        photos: formData.photos.filter((photo) => (( photo ?? "" ).trim()) !== ""),
      };

      const response = await fetch("/api/admin/os-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(listingData),
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchListings();
        setShowCreateForm(false);
        setFormData({
          category: "",
          subcategory: "",
          name: "",
          phone: "",
          address: "",
          photos: ["", "", "", ""],
          geo: { lat: 0, lng: 0 },
          open: "09:00",
          close: "18:00",
          active: true,
        });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "create listing"));
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      setError("Failed to create listing");
    }
  };

  const handleUpdate = async () => {
    if (!token || !editingListing || !formData.name || !formData.phone) return;

    try {
      const listingData = {
        ...formData,
        photos: formData.photos.filter((photo) => (( photo ?? "" ).trim()) !== ""),
      };

      const response = await fetch(
        `/api/admin/os-listings/${editingListing._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(listingData),
        },
      );

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchListings();
        setEditingListing(null);
        setFormData({
          category: "",
          subcategory: "",
          name: "",
          phone: "",
          address: "",
          photos: ["", "", "", ""],
          geo: { lat: 0, lng: 0 },
          open: "09:00",
          close: "18:00",
          active: true,
        });
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "update listing"));
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      setError("Failed to update listing");
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!token || !confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      const response = await fetch(`/api/admin/os-listings/${listingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchListings();
        setError("");
      } else {
        setError(getApiErrorMessage(data, status, "delete listing"));
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      setError("Failed to delete listing");
    }
  };

  const startEdit = (listing: OsListing) => {
    setEditingListing(listing);
    setFormData({
      category: listing.category,
      subcategory: listing.subcategory,
      name: listing.name,
      phone: listing.phone,
      address: listing.address,
      photos: [...listing.photos, "", "", "", ""].slice(0, 4),
      geo: listing.geo,
      open: listing.open,
      close: listing.close,
      active: listing.active,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingListing(null);
    setShowCreateForm(false);
    setFormData({
      category: "",
      subcategory: "",
      name: "",
      phone: "",
      address: "",
      photos: ["", "", "", ""],
      geo: { lat: 0, lng: 0 },
      open: "09:00",
      close: "18:00",
      active: true,
    });
  };

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find((cat) => cat.slug === categorySlug);
    return category ? category.name : categorySlug;
  };

  const getSubcategoryName = (subcategorySlug: string) => {
    const subcategory = subcategories.find(
      (sub) => sub.slug === subcategorySlug,
    );
    return subcategory ? subcategory.name : subcategorySlug;
  };

  const getFilteredSubcategories = () => {
    return subcategories.filter(
      (sub) => sub.category === formData.category && sub.active,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Listings</h2>
          <p className="text-gray-600">Manage service provider listings</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-[#C70000] hover:bg-[#A60000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Listing
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value,
                      subcategory: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.active)
                      .map((category) => (
                        <SelectItem key={category.slug} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subcategory: value })
                  }
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredSubcategories().map((subcategory) => (
                      <SelectItem
                        key={subcategory.slug}
                        value={subcategory.slug}
                      >
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.geo.lat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      geo: {
                        ...formData.geo,
                        lat: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="28.8955"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="any"
                  value={formData.geo.lng}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      geo: {
                        ...formData.geo,
                        lng: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="76.6066"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Time
                </label>
                <Input
                  type="time"
                  value={formData.open}
                  onChange={(e) =>
                    setFormData({ ...formData, open: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time
                </label>
                <Input
                  type="time"
                  value={formData.close}
                  onChange={(e) =>
                    setFormData({ ...formData, close: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (up to 4)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.photos.map((photo, index) => (
                  <Input
                    key={index}
                    value={photo}
                    onChange={(e) => {
                      const newPhotos = [...formData.photos];
                      newPhotos[index] = e.target.value;
                      setFormData({ ...formData, photos: newPhotos });
                    }}
                    placeholder={`Photo ${index + 1} URL`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCreate}>
                <Save className="h-4 w-4 mr-2" />
                Save Listing
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings List */}
      <div className="grid gap-4">
        {listings.map((listing) => (
          <Card key={listing._id}>
            <CardContent className="p-6">
              {editingListing?._id === listing._id ? (
                <div className="space-y-4">
                  {/* Same form fields as create form, but for editing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category: value,
                            subcategory: "",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories
                            .filter((cat) => cat.active)
                            .map((category) => (
                              <SelectItem
                                key={category.slug}
                                value={category.slug}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value) =>
                          setFormData({ ...formData, subcategory: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getFilteredSubcategories().map((subcategory) => (
                            <SelectItem
                              key={subcategory.slug}
                              value={subcategory.slug}
                            >
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Business name"
                  />
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Phone"
                  />
                  <Textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Address"
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleUpdate}>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {listing.name}
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        {getCategoryName(listing.category)} →{" "}
                        {getSubcategoryName(listing.subcategory)}
                      </p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-1" />
                        {listing.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        {listing.address}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {listing.open} - {listing.close}
                      </div>
                    </div>
                    <Badge
                      variant={listing.active ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {listing.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(listing)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(listing._id!)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {listings.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No listings found. Create your first listing above.
          </p>
        </div>
      )}
    </div>
  );
}
