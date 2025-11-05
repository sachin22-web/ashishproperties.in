import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "../components/ui/button";
import StaticFooter from "@/components/StaticFooter";


interface ContentPageData {
  _id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContentPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<ContentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // If route is a direct path like /contact-us (no :slug param), resolve slug from pathname
    const routeSlug = slug || window.location.pathname.replace(/^\//, "");
    if (!routeSlug) return;

    if (routeSlug === "terms-conditions") {
      const metaTitle = "Terms & Conditions | Ashish Property";
      const metaDescription =
        "Terms of using Ashish Property’s website and services. Read service scope, pricing, liability and dispute policy.";

      document.title = metaTitle;
      const metaDesc = document.querySelector(
        "meta[name='description']",
      ) as HTMLMetaElement | null;
      if (metaDesc) metaDesc.setAttribute("content", metaDescription);

      const html = `
        <p><strong>Effective Date:</strong> 15 September 2025</p>
        <h2>1. Acceptance</h2>
        <p>By using ashishproperty.in (“Site”) or our services, you agree to these Terms.</p>
        <h2>2. Service Scope</h2>
        <p>We are a real-estate facilitator/consultant. Availability of listings and final transactions depend on owners, developers, and regulatory approvals.</p>
        <h2>3. Listings &amp; Accuracy</h2>
        <p>We strive for accuracy but details (area, price, availability) may change or be approximate. Always verify on site.</p>
        <h2>4. Appointments &amp; Site Visits</h2>
        <p>Appointments are subject to owner/tenant availability. Government holidays/strikes may affect schedules.</p>
        <h2>5. Pricing &amp; Payments</h2>
        <p>Quotes are indicative; final price depends on inspection and negotiation. Taxes, stamp duty, and registration charges are extra as applicable.</p>
        <h2>6. Brokerage/Service Fee</h2>
        <p>Fees vary by service and deal size and will be disclosed before proceeding.</p>
        <h2>7. Documentation &amp; Loans</h2>
        <p>We assist with paperwork and finance but final approval rests with relevant authorities and banks.</p>
        <h2>8. User Conduct</h2>
        <p>Do not misuse the Site, submit false documents, or violate any law.</p>
        <h2>9. Reviews &amp; Media</h2>
        <p>By sharing reviews/photos for listings, you grant us a non-exclusive license to display them on our platforms.</p>
        <h2>10. Liability</h2>
        <p>To the extent permitted by law, we are not liable for indirect or consequential losses. Our total liability is limited to fees paid to us in the 3 months preceding a claim.</p>
        <h2>11. Indemnity</h2>
        <p>You agree to indemnify us for losses arising from your breach of these Terms or applicable laws.</p>
        <h2>12. IP Rights</h2>
        <p>All trademarks, logos, and content on the Site belong to Ashish Property or their owners.</p>
        <h2>13. Termination</h2>
        <p>We may suspend or terminate access for misuse or non-compliance.</p>
        <h2>14. Governing Law &amp; Dispute</h2>
        <p>These Terms are governed by Indian law; courts at 📌 Rohtak (or your chosen jurisdiction) shall have exclusive jurisdiction.</p>
        <h2>15. Contact</h2>
        <p>Email: <a href="mailto:info@aashishproperty.com">info@aashishproperty.com</a><br />Phone: +91 9876543210<br />Address: 📌 Full address</p>
      `;

      const now = new Date("2025-09-15T00:00:00.000Z").toISOString();
      setPage({
        _id: "static-terms-conditions",
        title: "Terms & Conditions",
        slug: "terms-conditions",
        content: html,
        metaTitle,
        metaDescription,
        type: "terms",
        status: "published",
        createdAt: now,
        updatedAt: now,
      });
      setError("");
      setLoading(false);
      return;
    }

    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const resolvedSlug = slug || window.location.pathname.replace(/^\//, "");
      const response = await fetch(`/api/pages/${resolvedSlug}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPage(data.data);
          // Update page title and meta tags
          if (data.data.metaTitle) {
            document.title = data.data.metaTitle;
          } else {
            document.title = `${data.data.title} - Ashish Property`;
          }

          if (data.data.metaDescription) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
              metaDesc.setAttribute("content", data.data.metaDescription);
            }
          }
        } else {
          setError(data.error || "Page not found");
        }
      } else {
        setError("Page not found");
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm p-8">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {page.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Updated {new Date(page.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Aashish Property</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* Page Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-600">
                This page was last updated on{" "}
                {new Date(page.updatedAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-4">
                <Button asChild variant="outline" size="sm">
                  <Link to="/contact-us">Contact Support</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  <Link to="/">Browse Properties</Link>
                </Button>
              </div>
            </div>
          </footer>
        </article>
      </div>

 <StaticFooter/>
    </div>
  );
}
