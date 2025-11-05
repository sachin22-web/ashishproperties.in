import { useState } from "react";
import {
  Heart,
  MapPin,
  Phone,
  Calendar,
  MessageCircle,
  Send,
} from "lucide-react";
import { Button } from "./ui/button";
import ChatModal from "./ChatModal";
import Watermark from "./Watermark";
import EnquiryModal from "./EnquiryModal";

const featuredProperties = [
  {
    id: 1,
    title: "3 BHK Luxury Apartment",
    location: "Sector 12, Rohtak",
    price: "₹85 Lakh",
    image: "/placeholder.svg",
    timeAgo: "2 hours ago",
    featured: true,
    premium: true,
  },
  {
    id: 2,
    title: "Commercial Shop in Main Market",
    location: "Sector 4, Rohtak",
    price: "₹1.2 Crore",
    image: "/placeholder.svg",
    timeAgo: "5 hours ago",
    featured: true,
    premium: false,
  },
];

const freshRecommendations = [
  {
    id: 3,
    title: "2 BHK Builder Floor",
    location: "Sector 15, Rohtak",
    price: "₹65 Lakh",
    image: "/placeholder.svg",
    timeAgo: "1 day ago",
    premium: false,
  },
  {
    id: 4,
    title: "Independent House with Garden",
    location: "Sector 8, Rohtak",
    price: "₹1.5 Crore",
    image: "/placeholder.svg",
    timeAgo: "2 days ago",
    premium: true,
  },
  {
    id: 5,
    title: "Plot for Construction",
    location: "Sector 20, Rohtak",
    price: "₹45 Lakh",
    image: "/placeholder.svg",
    timeAgo: "3 days ago",
    premium: false,
  },
  {
    id: 6,
    title: "PG Accommodation",
    location: "Sector 6, Rohtak",
    price: "₹8,000/month",
    image: "/placeholder.svg",
    timeAgo: "1 week ago",
    premium: false,
  },
];

export default function PropertyListings() {
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const handleEnquiry = (property: any) => {
    setSelectedProperty(property);
    setEnquiryModalOpen(true);
  };

  return (
    <div className="bg-white pb-20">
      {/* Fresh Recommendations Section */}
      <section className="py-4">
        <div className="px-4">
          <h2 className="text-lg font-medium text-gray-600 mb-4">
            Fresh Recommendations
          </h2>

          <div className="space-y-4">
            {freshRecommendations.map((property) => (
              <div
                key={property.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {/* <Watermark  /> */}
                    {property.premium && (
                      <div className="absolute top-1 left-1 bg-gradient-to-r from-orange-500 to-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                        AP Premium
                      </div>
                    )}
                    <button className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Heart className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium text-gray-900 leading-tight">
                        {property.title}
                      </h3>
                      <span className="text-sm font-bold text-[#C70000] ml-2">
                        {property.price}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-500 mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="text-xs">{property.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className="text-xs">{property.timeAgo}</span>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs border-[#C70000] text-[#C70000]"
                          onClick={() => handleEnquiry(property)}
                          data-testid="enquiry-btn"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Enquiry Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs border-[#C70000] text-[#C70000]"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ads Section */}
      <section className="py-4">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Featured Ads</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#C70000] text-sm"
            >
              See All
            </Button>
          </div>

          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {featuredProperties.map((property) => (
              <div
                key={property.id}
                className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-32 "
                  />
                  <Watermark variant="pattern" />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                  <div
                    className={`absolute top-3 left-3 text-white px-2 py-1 rounded-md text-xs font-bold ${
                      property.premium
                        ? "bg-gradient-to-r from-orange-500 to-red-600"
                        : "bg-[#C70000]"
                    }`}
                  >
                    {property.premium ? "AP Premium" : "Featured"}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 leading-tight">
                    {property.title}
                  </h3>

                  <div className="flex items-center text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{property.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#C70000]">
                      {property.price}
                    </span>
                    <span className="text-xs text-gray-400">
                      {property.timeAgo}
                    </span>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#C70000] text-[#C70000]"
                      onClick={() => handleEnquiry(property)}
                      data-testid="enquiry-btn"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enquiry Now
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#C70000] hover:bg-[#A60000] text-white"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Modal */}
      {selectedProperty && (
        <EnquiryModal
          isOpen={enquiryModalOpen}
          onClose={() => {
            setEnquiryModalOpen(false);
            setSelectedProperty(null);
          }}
          propertyId={selectedProperty.id.toString()}
          propertyTitle={selectedProperty.title}
          ownerName="Property Owner"
        />
      )}
    </div>
  );
}
