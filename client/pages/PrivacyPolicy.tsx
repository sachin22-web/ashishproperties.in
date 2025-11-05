import StaticFooter from "@/components/StaticFooter";
import { useEffect } from "react";


export default function PrivacyPolicy() {
  useEffect(() => {
    const title = "Privacy Policy | Ashish Property";
    const desc =
      "How Ashish Property collects, uses, and safeguards your data. Read our privacy practices and your rights.";
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-600 text-sm">
            Last Updated: 15 September 2025
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              1) Introduction
            </h2>
            <p className="text-gray-700">
              This Privacy Policy explains how Ashish Properties ("we", "us")
              collects, uses, and protects information when you use our website
              and services in India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              2) Information We Collect
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                <strong>Provided by you:</strong> Name, phone, email,
                requirements, location preferences, budget, and property
                details.
              </li>
              <li>
                <strong>Automatic:</strong> Device information, cookies, and
                basic analytics for improving experience.
              </li>
              <li>
                <strong>From third parties:</strong> Lead portals, banking
                partners (with consent), and public records for verification.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              3) How We Use Information
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                To provide and improve services, share curated listings,
                schedule site visits, and close transactions.
              </li>
              <li>
                To communicate updates, offers, and service notifications via
                call/SMS/WhatsApp/email.
              </li>
              <li>For fraud prevention, legal compliance, and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              4) Sharing of Information
            </h2>
            <p className="text-gray-700">
              We share information with property owners, buyers/tenants, service
              partners, and banks strictly for service fulfillment, compliance,
              or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              5) Data Retention
            </h2>
            <p className="text-gray-700">
              We retain information as long as necessary to provide services,
              comply with legal obligations, and resolve disputes, after which
              it is deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              6) Your Rights
            </h2>
            <p className="text-gray-700">
              You may request access, correction, deletion, or withdrawal of
              consent by contacting us at privacy@ashishproperty.in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              7) Security
            </h2>
            <p className="text-gray-700">
              We use reasonable technical and organizational measures to protect
              your data from unauthorized access, alteration, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">8) Cookies</h2>
            <p className="text-gray-700">
              We use cookies to improve functionality and measure usage. You can
              control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              9) Contact / Grievance Officer
            </h2>
            <p className="text-gray-700">
              Email: privacy@ashishproperties.in • Phone: +91-7419100032 •
              Address: Rohtak, Haryana, India
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              10) Changes
            </h2>
            <p className="text-gray-700">
              We may update this policy; the "Last Updated" date will change
              accordingly.
            </p>
          </section>
        </article>
      </main>
<StaticFooter/>
    </div>
  );
}
