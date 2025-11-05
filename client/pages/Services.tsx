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

export default function Services() {
  useEffect(() => {
    document.title = "Services | Ashish Property Rohtak";
    setMetaTag(
      "description",
      "Complete real-estate services in Rohtak—Buy, Sell, Rent, Plots, Commercial, Documentation & Home Loans. Call +91-XXXXXXXXXX.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <OLXStyleHeader />
      <main className="pb-16">
        <CategoryBar />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Services
            </h1>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <ServiceCard
                title="Buy Property"
                desc="Find the right home, floor, or apartment with verified inventory, fair pricing, and clean titles."
              />
              <ServiceCard
                title="Sell Property"
                desc="Serious buyer network, professional photos/videos, and marketing across portals to get you the best value."
              />
              <ServiceCard
                title="Rent/Lease"
                desc="Residential & commercial rentals with transparent agreements and deposit terms."
              />
              <ServiceCard
                title="Plots & Land"
                desc="Residential plots, industrial land, and farmhouses with locality insights and future growth mapping."
              />
              <ServiceCard
                title="Commercial (Shops/Offices/Godowns)"
                desc="Prime market and roadside locations—ideal for retail, clinics, and startups."
              />
              <ServiceCard
                title="Home Loan Assistance"
                desc="Tie-ups and guidance to secure the right loan, eligibility checks, and document support."
              />
              <ServiceCard
                title="Legal & Documentation"
                desc="Agreement to Sale, Sale Deed/Registry, Lease Deed, NOC/Bank papers—handled with care."
              />
              <ServiceCard
                title="Property Valuation & Pricing Advice"
                desc="Price benchmarking using recent area comparisons and real demand trends."
              />
              <ServiceCard
                title="Photography & Video Walkthroughs"
                desc="Clear, professional media so you shortlist faster and visit only the best fits."
              />
              <ServiceCard
                title="Property Management (Optional)"
                desc="For NRI/Out-of-station owners—tenant screening, rent follow-ups, maintenance coordination."
              />
            </div>

            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Mini-FAQ
              </h2>
              <div className="space-y-4 text-gray-700">
                <QA
                  q="Kya listing verify hoti hai?"
                  a="Haan, documents & site check ke baad hi recommend karte hain."
                />
                <QA
                  q="Registry/Agreement me help milegi?"
                  a="Poora end-to-end documentation support milta hai."
                />
                <QA
                  q="Loan assist karte ho?"
                  a="Yes, multiple banks/NBFC partners ke sath."
                />
                <QA
                  q="Brokerage/Service fee?"
                  a="Category aur deal size ke hisaab se. Transparent before you proceed."
                />
                <QA
                  q="Site visit kaise hoti hai?"
                  a="Shortlisted properties ke appointment fix karke guided visit karwate hain."
                />
                <QA
                  q="Areas cover kaun-se?"
                  a="Rohtak city & nearby (📌 add exact areas), extended coverage on request."
                />
              </div>
            </section>

            <section className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get in touch
              </h3>
              <p className="text-gray-700">
                Call/WhatsApp +91-XXXXXXXXXX • Email sales@ashishproperty.in
              </p>
            </section>
          </div>
        </div>
      </main>
      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}

function ServiceCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border rounded-lg p-5 hover:shadow-sm transition bg-white">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="font-medium text-gray-900">Q: {q}</p>
      <p className="text-gray-700">A: {a}</p>
    </div>
  );
}
