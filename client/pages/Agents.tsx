import Header from "../components/Header";

export default function Agents() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Our Property Agents
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect with our experienced property agents - Coming Soon
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <p className="text-[#C70000] font-medium">
              This page is under development. Please check back soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
