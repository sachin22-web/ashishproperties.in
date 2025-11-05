import React, { useEffect } from "react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import CategoryBar from "../components/CategoryBar";
import BottomNavigation from "../components/BottomNavigation";
import StaticFooter from "../components/StaticFooter";

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(
    `meta[name='${name}']`,
  ) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export default function TermsAndConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | Ashish Properties";
    setMetaTag(
      "description",
      "Terms of using Ashish Property’s website and services. Read service scope, pricing, liability and dispute policy.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <OLXStyleHeader />
      <main className="pb-16">
        <CategoryBar />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Terms & Conditions
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Effective Date: 15 September 2025
            </p>

            <ol className="list-decimal pl-6 space-y-4 text-gray-700 leading-relaxed">
              <li>
                <span className="font-medium">Acceptance:</span> By using
                ashishproperties.in (“Site”) or our services, you agree to these
                Terms.
              </li>
              <li>
                <span className="font-medium">Service Scope:</span> We are a
                real-estate facilitator/consultant. Availability of listings and
                final transactions depend on owners, developers, and regulatory
                approvals.
              </li>
              <li>
                <span className="font-medium">Listings & Accuracy:</span> We
                strive for accuracy but details (area, price, availability) may
                change or be approximate. Always verify on site.
              </li>
              <li>
                <span className="font-medium">Appointments & Site Visits:</span>{" "}
                Appointments are subject to owner/tenant availability.
                Government holidays/strikes may affect schedules.
              </li>
              <li>
                <span className="font-medium">Pricing & Payments:</span> Quotes
                are indicative; final price depends on inspection and
                negotiation. Taxes, stamp duty, and registration charges are
                extra as applicable.
              </li>
              <li>
                <span className="font-medium">Brokerage/Service Fee:</span> Fees
                vary by service and deal size and will be disclosed before
                proceeding.
              </li>
              <li>
                <span className="font-medium">Documentation & Loans:</span> We
                assist with paperwork and finance but final approval rests with
                relevant authorities and banks.
              </li>
              <li>
                <span className="font-medium">User Conduct:</span> Do not misuse
                the Site, submit false documents, or violate any law.
              </li>
              <li>
                <span className="font-medium">Reviews & Media:</span> By sharing
                reviews/photos for listings, you grant us a non-exclusive
                license to display them on our platforms.
              </li>
              <li>
                <span className="font-medium">Liability:</span> To the extent
                permitted by law, we are not liable for indirect or
                consequential losses. Our total liability is limited to fees
                paid to us in the 3 months preceding a claim.
              </li>
              <li>
                <span className="font-medium">Indemnity:</span> You agree to
                indemnify us for losses arising from your breach of these Terms
                or applicable laws.
              </li>
              <li>
                <span className="font-medium">IP Rights:</span> All trademarks,
                logos, and content on the Site belong to Ashish Property or
                their owners.
              </li>
              <li>
                <span className="font-medium">Termination:</span> We may suspend
                or terminate access for misuse or non-compliance.
              </li>
              <li>
                <span className="font-medium">Governing Law & Dispute:</span>{" "}
                These Terms are governed by Indian law; courts at 📌 Rohtak (or
                your chosen jurisdiction) shall have exclusive jurisdiction.
              </li>
              <li>
                <span className="font-medium">Contact:</span> Email:
                legal@ashishproperties.in • Phone: +91-7419100032 • Address: 📌
                Full address
              </li>
            </ol>
          </div>
        </div>
      </main>
      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}
