import {
  Search,
  MapPin,
  Home,
  IndianRupee,
  Bed,
  MapPinIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-[#C70000] to-[#A60000] text-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto">
            Discover the perfect home, commercial space, or investment
            opportunity in Rohtak and surrounding areas
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by Area, Sector, Landmark..."
                  className="pl-10 h-12 text-gray-900 border-gray-300 focus:border-[#C70000]"
                />
              </div>
              <Button
                size="lg"
                className="bg-[#C70000] hover:bg-[#A60000] text-white px-8 h-12"
              >
                Search Properties
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Property Type */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-5 w-5 text-[#C70000]" />
                <span className="font-medium text-gray-900">Property Type</span>
              </div>
              <Select>
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="plots">Plots</SelectItem>
                  <SelectItem value="flats">Flats</SelectItem>
                  <SelectItem value="pg-rental">PG / Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-5 w-5 text-[#C70000]" />
                <span className="font-medium text-gray-900">Price Range</span>
              </div>
              <Select>
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-50l">Under ₹50L</SelectItem>
                  <SelectItem value="50l-1cr">₹50L - ₹1Cr</SelectItem>
                  <SelectItem value="1cr-2cr">₹1Cr - ₹2Cr</SelectItem>
                  <SelectItem value="2cr-5cr">₹2Cr - ₹5Cr</SelectItem>
                  <SelectItem value="above-5cr">Above ₹5Cr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bed className="h-5 w-5 text-[#C70000]" />
                <span className="font-medium text-gray-900">Bedrooms</span>
              </div>
              <Select>
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="Select BHK" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1bhk">1 BHK</SelectItem>
                  <SelectItem value="2bhk">2 BHK</SelectItem>
                  <SelectItem value="3bhk">3 BHK</SelectItem>
                  <SelectItem value="4bhk">4 BHK</SelectItem>
                  <SelectItem value="5plus">5+ BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nearby Places */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPinIcon className="h-5 w-5 text-[#C70000]" />
                <span className="font-medium text-gray-900">Nearby Places</span>
              </div>
              <Select>
                <SelectTrigger className="w-full border-gray-300">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sector-1">Sector 1</SelectItem>
                  <SelectItem value="sector-2">Sector 2</SelectItem>
                  <SelectItem value="sector-3">Sector 3</SelectItem>
                  <SelectItem value="sector-4">Sector 4</SelectItem>
                  <SelectItem value="city-center">City Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
