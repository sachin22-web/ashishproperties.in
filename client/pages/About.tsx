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

export default function About() {
  useEffect(() => {
    document.title = "About Ashish Properties | Real Estate in Rohtak";
    setMetaTag(
      "description",
      "Learn about Ashish Properties—Rohtak’s trusted real-estate partner for buying, selling, and renting residential & commercial properties. Transparent deals, verified listings, and end-to-end support.",
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
              About Ashish Properties
            </h1>
            <p className="text-gray-700 leading-relaxed mb-8">
              Ashish Properties is a hyperlocal real-estate partner helping
              families and businesses in Rohtak and nearby areas discover the
              right homes, plots, and commercial spaces—quickly and
              transparently. Our mission is simple: trust, clarity, and speed in
              every real-estate transaction.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                What we do
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <span className="font-medium">Buy & Sell:</span> Verified
                  residential homes, floors, plots, builder floors, and
                  commercial units.
                </li>
                <li>
                  <span className="font-medium">Rent & Lease:</span> Curated
                  houses, flats, shops, offices, and godowns with clear terms.
                </li>
                <li>
                  <span className="font-medium">Land & Development:</span>{" "}
                  Residential plots, industrial land, farmhouses and
                  collaboration projects.
                </li>
                <li>
                  <span className="font-medium">Advisory & Documentation:</span>{" "}
                  Pricing guidance, due-diligence, registry assistance, and bank
                  loan support.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Why Ashish Properties
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  <span className="font-medium">Local Expertise:</span> Deep
                  knowledge of Rohtak sectors, colonies, and emerging pockets.
                </li>
                <li>
                  <span className="font-medium">Verified Listings:</span>{" "}
                  Physical checks, owner validation, and requirement fitment.
                </li>
                <li>
                  <span className="font-medium">Transparent Pricing:</span>{" "}
                  Comparable sales data and clear cost breakdowns.
                </li>
                <li>
                  <span className="font-medium">End-to-End Support:</span> From
                  site visits to paperwork and possession.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                How it works
              </h2>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Share your requirement (budget, location, size).</li>
                <li>Get curated options with photos, videos, and pricing.</li>
                <li>Site visit & shortlist with honest guidance.</li>
                <li>
                  Close confidently with documentation and loan assistance.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Service Areas
              </h2>
              <p className="text-gray-700">
                Rohtak city & outskirts (📌 add specific sectors/colonies here),
                with selective coverage across Sonipat | Jhajjar | Panipat (as
                per requirement).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Contact
              </h2>
              <p className="text-gray-700">
                Call/WhatsApp: 📞 +91-7419100032 • Email: info@ashishproperties.in
                • Office: 📌 Full address here
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
