import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";
import { OsSubcategory } from "@shared/types";

export default function OtherServicesCategory() {
  const { cat } = useParams<{ cat: string }>();
  const navigate = useNavigate();
  const [subcategories, setSubcategories] = useState<OsSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  useEffect(() => {
    if (cat) {
      fetchSubcategories();
    }
  }, [cat]);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await (window as any).api(
        `/os/subcategories?cat=${cat}&active=1`,
      );
      const data = response.ok
        ? response.json
        : { success: false, error: "Failed to fetch subcategories" };

      if (data.success && Array.isArray(data.data)) {
        setSubcategories(data.data);
        // Set category name from slug
        setCategoryName(
          cat?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
            "",
        );
      } else {
        setError("Failed to load subcategories");
        setSubcategories([]);
      }
    } catch (error: any) {
      console.error("Error fetching subcategories:", error);
      setError(`Failed to load subcategories: ${error.message}`);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subcategories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Services
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchSubcategories} variant="outline">
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
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
            onClick={() => navigate("/other-services")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </div>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Wrench className="h-10 w-10 text-[#C70000] mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">{categoryName}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from our range of {categoryName.toLowerCase()} services in
            Rohtak.
          </p>
        </div>

        {/* Subcategories Grid */}
        {subcategories.length === 0 ? (
          <div className="text-center py-16">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Subcategories Available
            </h3>
            <p className="text-gray-500">
              Subcategories for {categoryName.toLowerCase()} will be available
              soon.
            </p>
            <Button
              onClick={() => navigate("/other-services")}
              className="mt-6"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Other Services
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory._id}
                to={`/other-services/${cat}/${subcategory.slug}`}
                className="group"
              >
                <Card
                  data-testid="os-subcat-card"
                  className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-[#C70000] bg-white"
                >
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C70000] to-[#A60000] rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                      <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#C70000] transition-colors">
                      {subcategory.name}
                    </h3>
                    <div className="flex items-center justify-center text-[#C70000] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium mr-1">
                        View Listings
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
            <h2 className="text-2xl font-bold mb-4">
              Need {categoryName.toLowerCase()} services?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Browse our verified {categoryName.toLowerCase()} professionals in
              Rohtak.
            </p>
            <Button
              onClick={() => (window.location.href = "/contact-us")}
              className="bg-white text-[#C70000] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Contact Us for Help
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
