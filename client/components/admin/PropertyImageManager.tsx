import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Plus,
  Save,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface Property {
  _id: string;
  title: string;
  images: string[];
  price: number;
  location?: {
    city: string;
    state: string;
  } | null;
}

export default function PropertyImageManager() {
  const { token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  // Free stock images for properties
  const stockImages = [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400", // Modern house
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400", // House exterior
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400", // Commercial building
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", // Apartment interior
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400", // Villa
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400", // Land/Plot
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400", // Modern home
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400", // Office space
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400", // Apartment
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400", // Luxury villa
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", // Studio apartment
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400", // Commercial building
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400", // Penthouse
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400", // House with parking
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400", // Warehouse
  ];

  useEffect(() => {
    fetchProperties();
  }, [token]);

  const fetchProperties = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const { api } = await import("../../lib/api");
      const response = await api.get("admin/properties", token);
      if (response.data.success) {
        setProperties(response.data.data.properties || []);
      } else {
        setError(response.data.error || "Failed to fetch properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to fetch properties");
    } finally {
      setLoading(false);
    }
  };

  const addImageToProperty = async (propertyId: string, imageUrl: string) => {
    if (!token || !imageUrl.trim()) return;

    try {
      const property = properties.find((p) => p._id === propertyId);
      if (!property) return;

      const updatedImages = [...property.images, imageUrl];

      const { api } = await import("../../lib/api");
      await api.put(
        `admin/properties/${propertyId}`,
        { images: updatedImages },
        token,
      );
      setProperties(
        properties.map((p) =>
          p._id === propertyId ? { ...p, images: updatedImages } : p,
        ),
      );
      setNewImageUrl("");
    } catch (error) {
      console.error("Error adding image:", error);
      setError("Failed to add image");
    }
  };

  const removeImageFromProperty = async (
    propertyId: string,
    imageIndex: number,
  ) => {
    if (!token) return;

    try {
      const property = properties.find((p) => p._id === propertyId);
      if (!property) return;

      const updatedImages = property.images.filter(
        (_, index) => index !== imageIndex,
      );

      const { api } = await import("../../lib/api");
      await api.put(
        `admin/properties/${propertyId}`,
        { images: updatedImages },
        token,
      );
      setProperties(
        properties.map((p) =>
          p._id === propertyId ? { ...p, images: updatedImages } : p,
        ),
      );
    } catch (error) {
      console.error("Error removing image:", error);
      setError("Failed to remove image");
    }
  };

  const addStockImageToProperty = (
    propertyId: string,
    stockImageUrl: string,
  ) => {
    addImageToProperty(propertyId, stockImageUrl);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchProperties();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Property Image Manager
          </h3>
          <p className="text-gray-600">
            Add and manage images for property listings
          </p>
        </div>
      </div>

      {/* Stock Images Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Free Stock Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {stockImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Stock image ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#C70000] hover:bg-[#A60000]"
                    onClick={() => {
                      if (selectedProperty) {
                        addStockImageToProperty(selectedProperty._id, imageUrl);
                      }
                    }}
                    disabled={!selectedProperty}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {selectedProperty
              ? `Click any image to add to "${selectedProperty.title}"`
              : "Select a property first to add images"}
          </p>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="grid grid-cols-1 gap-6">
        {properties.map((property) => (
          <Card
            key={property._id}
            className={`${selectedProperty?._id === property._id ? "ring-2 ring-[#C70000]" : ""}`}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <p className="text-sm text-gray-500">
                    ₹{(property.price / 100000).toFixed(1)}L •{" "}
                    {property.location?.city || "Unknown"},{" "}
                    {property.location?.state || "Unknown"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedProperty(property)}
                  className={
                    selectedProperty?._id === property._id
                      ? "bg-[#C70000] text-white"
                      : ""
                  }
                >
                  {selectedProperty?._id === property._id
                    ? "Selected"
                    : "Select"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Images */}
                <div>
                  <h4 className="font-medium mb-2">
                    Current Images ({property.images.length})
                  </h4>
                  {property.images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {property.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Property image ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                            <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-white text-red-600"
                                onClick={() =>
                                  removeImageFromProperty(property._id, index)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No images added yet</p>
                    </div>
                  )}
                </div>

                {/* Add New Image URL */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter image URL..."
                    value={
                      selectedProperty?._id === property._id ? newImageUrl : ""
                    }
                    onChange={(e) => {
                      if (selectedProperty?._id === property._id) {
                        setNewImageUrl(e.target.value);
                      }
                    }}
                    disabled={selectedProperty?._id !== property._id}
                  />
                  <Button
                    onClick={() =>
                      addImageToProperty(property._id, newImageUrl)
                    }
                    disabled={
                      !newImageUrl.trim() ||
                      selectedProperty?._id !== property._id
                    }
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No properties found</p>
          </div>
        )}
      </div>
    </div>
  );
}
