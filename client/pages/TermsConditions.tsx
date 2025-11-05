import StaticFooter from "@/components/StaticFooter";
import { useEffect } from "react";


export default function TermsConditions() {
  useEffect(() => {
    const title = "Terms & Conditions | Ashish Property";
    const desc =
      "Terms of using Ashish Property’s website and services. Read service scope, pricing, liability and dispute policy.";
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Effective Date: 15 September 2025
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <p>
            By using ashishproperty.in (“Site”) or our services, you agree to
            these Terms.
          </p>
          <ol className="list-decimal pl-6 space-y-3 text-gray-800">
            <li>
              <strong>Acceptance</strong> — By using the Site or services, you
              agree to these Terms.
            </li>
            <li>
              <strong>Service Scope</strong> — We are a real-estate
              facilitator/consultant. Availability of listings and final
              transactions depend on owners, developers, and regulatory
              approvals.
            </li>
            <li>
              <strong>Listings & Accuracy</strong> — We strive for accuracy but
              details (area, price, availability) may change or be approximate.
              Always verify on site.
            </li>
            <li>
              <strong>Appointments & Site Visits</strong> — Appointments are
              subject to owner/tenant availability. Government holidays/strikes
              may affect schedules.
            </li>
            <li>
              <strong>Pricing & Payments</strong> — Quotes are indicative; final
              price depends on inspection and negotiation. Taxes, stamp duty,
              and registration charges are extra as applicable.
            </li>
            <li>
              <strong>Brokerage/Service Fee</strong> — Fees vary by service and
              deal size and will be disclosed before proceeding.
            </li>
            <li>
              <strong>Documentation & Loans</strong> — We assist with paperwork
              and finance but final approval rests with relevant authorities and
              banks.
            </li>
            <li>
              <strong>User Conduct</strong> — Do not misuse the Site, submit
              false documents, or violate any law.
            </li>
            <li>
              <strong>Reviews & Media</strong> — By sharing reviews/photos for
              listings, you grant us a non-exclusive license to display them on
              our platforms.
            </li>
            <li>
              <strong>Liability</strong> — To the extent permitted by law, we
              are not liable for indirect or consequential losses. Our total
              liability is limited to fees paid to us in the 3 months preceding
              a claim.
            </li>
            <li>
              <strong>Indemnity</strong> — You agree to indemnify us for losses
              arising from your breach of these Terms or applicable laws.
            </li>
            <li>
              <strong>IP Rights</strong> — All trademarks, logos, and content on
              the Site belong to Ashish Property or their owners.
            </li>
            <li>
              <strong>Termination</strong> — We may suspend or terminate access
              for misuse or non-compliance.
            </li>
            <li>
              <strong>Governing Law & Dispute</strong> — These Terms are
              governed by Indian law; courts at 📌 Rohtak (or your chosen
              jurisdiction) shall have exclusive jurisdiction.
            </li>
            <li>
              <strong>Contact</strong> — Email: legal@ashishproperty.in • Phone:
              +91-XXXXXXXXXX • Address: 📌 Full address
            </li>
          </ol>
        </article>
      </main>

      <StaticFooter/>
    </div>
  );
}
