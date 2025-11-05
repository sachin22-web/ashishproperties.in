import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Phone, MapPin, Clock, Star } from "lucide-react";
import { OsListing } from "@shared/types";

export default function OtherServicesListings() {
  const { cat, sub } = useParams<{ cat: string; sub: string }>();
  const navigate = useNavigate();
  const [listings, setListings] = useState<OsListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subcategoryName, setSubcategoryName] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    if (sub) {
      fetchListings();
    }
  }, [sub]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await (window as any).api(
        `/os/listings?sub=${sub}&active=1`,
      );
      const data = response.ok
        ? response.json
        : { success: false, error: "Failed to fetch listings" };

      if (data.success && Array.isArray(data.data)) {
        setListings(data.data);
        // Set names from slugs
        setSubcategoryName(
          sub?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
            "",
        );
        setCategoryName(
          cat?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
            "",
        );
      } else {
        setError("Failed to load listings");
        setListings([]);
      }
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      setError(`Failed to load listings: ${error.message}`);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string, name: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const message = `Hi, I found your contact through Rohtak Property Portal. I need ${subcategoryName.toLowerCase()} services.`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Listings
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchListings} variant="outline">
              Try Again
            </Button>
            <Button
              onClick={() => navigate(`/other-services/${cat}`)}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {categoryName}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/other-services/${cat}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {categoryName}
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {subcategoryName}
          </h1>
          <p className="text-lg text-gray-600">
            {listings.length} {subcategoryName.toLowerCase()}{" "}
            {listings.length === 1 ? "service" : "services"} available in Rohtak
          </p>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-16">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Listings Available
            </h3>
            <p className="text-gray-500 mb-6">
              {subcategoryName} services will be available soon in this area.
            </p>
            <Button
              onClick={() => navigate(`/other-services/${cat}`)}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Other {categoryName} Services
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card
                key={listing._id}
                data-testid="service-card"
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                {/* Images */}
                {listing.photos && listing.photos.length > 0 && (
                  <div className="relative h-48 overflow-hidden">
                    <div className="flex space-x-1">
                      {listing.photos.slice(0, 4).map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${listing.name} ${index + 1}`}
                          className={`object-cover ${
                            listing.photos.length === 1
                              ? "w-full h-48"
                              : listing.photos.length === 2
                                ? "w-1/2 h-48"
                                : listing.photos.length === 3
                                  ? index === 0
                                    ? "w-1/2 h-48"
                                    : "w-1/4 h-48"
                                  : "w-1/4 h-48"
                          }`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Business Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {listing.name}
                  </h3>

                  {/* Address */}
                  <div className="flex items-start text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{listing.address}</span>
                  </div>

                  {/* Business Hours */}
                  <div className="flex items-center text-gray-600 mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                      {listing.open} - {listing.close}
                    </span>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCall(listing.phone, listing.name)}
                      className="bg-[#C70000] hover:bg-[#A60000] text-white"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      onClick={() =>
                        handleWhatsApp(listing.phone, listing.name)
                      }
                      className="bg-green-500 hover:bg-green-600 text-white"
                      size="sm"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309" />
                      </svg>
                      WhatsApp
                    </Button>
                  </div>

                  {/* Phone Number */}
                  <div className="mt-3 text-center">
                    <span className="text-sm text-gray-500">
                      {listing.phone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
            <h2 className="text-2xl font-bold mb-4">
              Are you a {subcategoryName.toLowerCase()} professional?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Join our platform and get more customers in Rohtak.
            </p>
            <Button
              onClick={() => (window.location.href = "/contact-us")}
              className="bg-white text-[#C70000] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              List Your Business
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
