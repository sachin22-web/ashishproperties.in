import { MapPin } from "lucide-react";

interface LocationMapProps {
  address?: string;
  city?: string;
  state?: string;
  sector?: string;
  colony?: string;
  landmark?: string;
}

export default function LocationMap({
  address,
  city,
  state,
  sector,
  colony,
  landmark,
}: LocationMapProps) {
  const fullAddress = [
    address,
    sector,
    colony,
    landmark,
    city,
    state,
  ]
    .filter(Boolean)
    .join(", ");

  const encodedAddress = encodeURIComponent(fullAddress);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=76.53,28.85,76.63,28.95&layer=mapnik&marker=28.9,76.58`;

  const googleMapsUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200">
      <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#C70000]" />
        <h3 className="font-semibold text-sm text-gray-900">Location Map</h3>
      </div>
      
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gray-100">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={googleMapsUrl}
          title="Property Location Map"
          className="w-full h-full"
          loading="lazy"
        />
      </div>

      {fullAddress && (
        <div className="bg-gray-50 px-4 py-3 border-t">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong className="text-gray-900">Address:</strong> {fullAddress}
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs sm:text-sm text-[#C70000] hover:underline font-medium"
          >
            Open in Google Maps →
          </a>
        </div>
      )}
    </div>
  );
}
