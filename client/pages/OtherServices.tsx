import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, ArrowRight, Wrench } from "lucide-react";
import { OsCategory } from "@shared/types";
import StaticFooter from "../components/StaticFooter";

export default function OtherServices() {
  const [categories, setCategories] = useState<OsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true); setError(null);
      const anyWin = window as any;
      const response = anyWin.api
        ? await anyWin.api("/os/categories?active=1")
        : await fetch("/api/os/categories?active=1").then(async (r) => ({ ok: r.ok, json: await r.json() }));

      const data = (response as any).ok ? (response as any).json : { success: false, error: "Failed to fetch categories" };
      if (data.success && Array.isArray(data.data)) setCategories(data.data);
      else { setError("Failed to load categories"); setCategories([]); }
    } catch (err: any) {
      setError(`Failed to load categories: ${err.message}`); setCategories([]);
    } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading categories...</p>
      </div>
    </div>
  );

  if (error) return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <Button onClick={fetchCategories} variant="outline">Try Again</Button>
            <Button onClick={() => navigate("/")} variant="secondary">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </div>
        </div>
      </div>
      <StaticFooter />
    </>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ==== Top breadcrumb: ALWAYS go to HOME ==== */}
          <div className="mb-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#C70000] transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
          </div>

          {/* ===== ONE ROW: icon + title + Back to Home button (explicit to "/") ===== */}
          <div className="flex items-center justify-center gap-3 mb-2 flex-wrap">
            <Wrench className="h-10 w-10 text-[#C70000]" />
            <h1 className="text-4xl font-bold text-gray-900">Other Services</h1>
            <div className="inline-flex">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="min-w-[150px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>

          <p className="text-lg text-gray-600 max-w-3xl text-center mx-auto mb-10">
            Choose from our range of other services in Rohtak.
          </p>

          {/* ===== Grid ===== */}
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories available</h3>
              <Button onClick={() => navigate("/")} className="mt-4" variant="secondary">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link key={category._id} to={`/other-services/${category.slug}`} className="group">
                  <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 hover:border-[#C70000] bg-white">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#C70000] to-[#A60000] rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                        <Wrench className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#C70000] transition-colors">
                        {category.name}
                      </h3>
                      <div className="flex items-center justify-center text-[#C70000] opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-sm font-medium mr-1">View Subcategories</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* ===== CTA ===== */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] rounded-xl text-white p-8">
              <h2 className="text-2xl font-bold mb-4">Are you a service provider?</h2>
              <p className="text-lg mb-6 opacity-90">
                Join our platform and connect with customers in Rohtak who need your services.
              </p>
              <Button
                onClick={() => (window.location.href = "/contact-us")}
                className="bg-white text-[#C70000] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                List Your Services
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <StaticFooter />
    </>
  );
}
