import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import { ServiceListing, Category } from "@shared/types";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function ServiceListings() {
  const { token } = useAuth();
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState<ServiceListing | null>(
    null,
  );
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
  }, []);

  const fetchListings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch("/api/admin/service-listings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setListings(data.data.listings || []);
      } else {
        setError(getApiErrorMessage(data, status, "fetch service listings"));
      }
    } catch (error) {
      console.error("Error fetching service listings:", error);
      setError("Failed to fetch service listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/admin/categories?type=service", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      const url = editingListing
        ? `/api/admin/service-listings/${editingListing._id}`
        : "/api/admin/service-listings";
      const method = editingListing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          photos: formData.photos.filter((photo) => (( photo ?? "" ).trim()) !== ""),
        }),
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        await fetchListings();
        resetForm();
        setShowCreateForm(false);
        setEditingListing(null);
      } else {
        setError(
          getApiErrorMessage(
            data,
            status,
            editingListing ? "update" : "create",
          ),
        );
      }
    } catch (error) {
      console.error("Error saving listing:", error);
      setError("Failed to save listing");
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!token || !confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      const response = await fetch(`/api/admin/service-listings/${listingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok) {
        await fetchListings();
      } else {
        setError(getApiErrorMessage(data, status, "delete listing"));
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      setError("Failed to delete listing");
    }
  };

  const resetForm = () => {
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

  const startEdit = (listing: ServiceListing) => {
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
    setEditingListing(listing);
    setShowCreateForm(true);
  };

  const getSubcategories = (categorySlug: string) => {
    const category = categories.find((cat) => cat.slug === categorySlug);
    return category?.subcategories || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Listings</h2>
          <p className="text-gray-600">
            Manage individual service provider listings
          </p>
        </div>
        <Button
          data-testid="add-service-listing-btn"
          onClick={() => setShowCreateForm(true)}
          className="bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Service Listing
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card data-testid="service-listing-form">
          <CardHeader>
            <CardTitle>
              {editingListing
                ? "Edit Service Listing"
                : "Create Service Listing"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  data-testid="category-select"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      subcategory: "",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subcategory
                </label>
                <select
                  data-testid="subcategory-select"
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!formData.category}
                >
                  <option value="">Select Subcategory</option>
                  {getSubcategories(formData.category).map((sub) => (
                    <option key={sub.slug} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name
                </label>
                <Input
                  data-testid="listing-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <Textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Business address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
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
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
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
                  placeholder="Longitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
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
                <label className="block text-sm font-medium mb-2">
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
              {formData.photos.map((photo, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-2">
                    Photo {index + 1} URL
                  </label>
                  <Input
                    value={photo}
                    onChange={(e) => {
                      const newPhotos = [...formData.photos];
                      newPhotos[index] = e.target.value;
                      setFormData({ ...formData, photos: newPhotos });
                    }}
                    placeholder={`Photo ${index + 1} URL`}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.active ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button
                data-testid="save-listing-btn"
                onClick={handleSubmit}
                className="bg-[#C70000] hover:bg-[#A60000] text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingListing ? "Update" : "Create"} Listing
              </Button>
              <Button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingListing(null);
                  resetForm();
                }}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      <div
        data-testid="service-listings-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {listings.map((listing) => (
          <Card
            key={listing._id}
            data-testid={`service-listing-${listing._id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {listing.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {listing.category} / {listing.subcategory}
                  </p>
                </div>
                <Badge
                  className={
                    listing.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {listing.active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {listing.phone}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <span className="line-clamp-2">{listing.address}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {listing.open} - {listing.close}
                </div>
              </div>

              {listing.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {listing.photos.slice(0, 4).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${listing.name} ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  data-testid={`edit-listing-${listing._id}`}
                  onClick={() => startEdit(listing)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  data-testid={`delete-listing-${listing._id}`}
                  onClick={() => handleDelete(listing._id!)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {listings.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No service listings yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first service listing to get started.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service Listing
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
