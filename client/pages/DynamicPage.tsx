import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, User, Eye, Share2, Edit } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import OLXStyleHeader from "../components/OLXStyleHeader";

interface PageContent {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  status: "published" | "draft" | "archived";
  type: "page" | "policy" | "terms" | "faq";
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  views?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function DynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (slug) {
      fetchPage(slug);
    }
  }, [slug]);

  const fetchPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/content/pages/slug/${pageSlug}`);
      
      if (response.ok) {
        const data: ApiResponse<PageContent> = await response.json();
        
        if (data.success && data.data) {
          setPage(data.data);
          
          // Update page title and meta tags
          if (data.data.metaTitle) {
            document.title = data.data.metaTitle;
          } else {
            document.title = `${data.data.title} - Ashish Properties`;
          }
          
          if (data.data.metaDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', data.data.metaDescription);
          }
          
          // Track page view
          trackPageView(data.data._id);
        } else {
          setError("Page not found");
        }
      } else if (response.status === 404) {
        setError("Page not found");
      } else {
        setError("Failed to load page");
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const trackPageView = async (pageId: string) => {
    try {
      await fetch(`/api/content/pages/${pageId}/view`, {
        method: 'POST',
      });
    } catch (error) {
      // Silently fail for view tracking
      console.warn("Failed to track page view:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && page) {
      try {
        await navigator.share({
          title: page.title,
          text: page.metaDescription || page.title,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // You could show a toast notification here
      console.log("URL copied to clipboard");
    });
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "policy": return "Policy";
      case "terms": return "Terms";
      case "faq": return "FAQ";
      default: return "Page";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "policy": return "bg-blue-100 text-blue-800";
      case "terms": return "bg-yellow-100 text-yellow-800";
      case "faq": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {error === "Page not found" ? "Page Not Found" : "Error Loading Page"}
            </h1>
            <p className="text-gray-600 mb-8">
              {error === "Page not found" 
                ? "The page you're looking for doesn't exist or has been moved."
                : "There was an error loading this page. Please try again."
              }
            </p>
            <div className="space-x-4">
              <Button onClick={() => navigate(-1)} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => navigate("/")} className="bg-[#C70000] hover:bg-[#A60000]">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline" 
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Badge className={getTypeColor(page.type)}>
                  {getTypeDisplay(page.type)}
                </Badge>
                {page.views && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{page.views} views</span>
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {page.title}
              </h1>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Updated {new Date(page.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {page.author && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{page.author}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Featured Image */}
        {page.featuredImage && (
          <div className="mb-8">
            <img 
              src={page.featuredImage} 
              alt={page.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#C70000] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <p>This page was created through our admin panel and is dynamically loaded.</p>
            <p>Last updated: {new Date(page.updatedAt).toLocaleString()}</p>
          </div>
          
          <div className="flex space-x-3">
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share Page
            </Button>
            <Button onClick={() => navigate("/")} className="bg-[#C70000] hover:bg-[#A60000]">
              Explore Properties
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
