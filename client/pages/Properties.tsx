import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, Phone, MessageCircle, Share2, Heart,
  BadgeCheck, Home, Layers, Tag, Ruler, Building2, Landmark,
  FileText, Images, CalendarClock, IdCard,
} from "lucide-react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import Watermark from "../components/Watermark";
import { Button } from "../components/ui/button";

const Section: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
    <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">{title}</h3>
    {children}
  </div>
);

const KV: React.FC<{ k: string; v?: React.ReactNode }> = ({ k, v }) =>
  v ? (
    <div className="flex justify-between py-1 text-[13px]">
      <span className="text-gray-500">{k}</span>
      <span className="text-gray-900 font-medium text-right ml-3">{v}</span>
    </div>
  ) : null;

const Chip: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 inline-flex items-center ${className}`}>
    {children}
  </span>
);

function fmtPrice(n?: number | string) {
  const num = typeof n === "string" ? Number(n) : n || 0;
  try { return num.toLocaleString("en-IN"); } catch { return String(num); }
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await (window as any).api(`properties/${id}`);
        const payload = res?.ok ? res.json : res;
        if (payload?.success) setData(payload.data || payload.property || payload);
        else setData(null);
      } catch (e) {
        console.error(e); setData(null);
      } finally { setLoading(false); }
    })();
  }, [id]);

  const images: string[] = useMemo(() => Array.isArray(data?.images) ? data.images : [], [data]);
  const primaryImg = images[0] || "https://via.placeholder.com/1200x600?text=No+Image";

  const specs = data?.specifications || {};
  const loc = data?.location || {};
  const dims = data?.dimensions || {};
  const details = data?.details || {};
  const meta = data?.meta || {};
  const contact = data?.contactInfo || data?.contact || {};

  const isRent = data?.priceType === "rent";
  const verified = Boolean(data?.isVerified || meta?.verified || data?.verified);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="h-6 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto p-4">
          <Button variant="outline" onClick={() => history.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Property not found</h2>
            <p className="text-gray-600">This listing may be removed or does not exist.</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const address =
    loc?.address ||
    [loc?.landmark, loc?.colony, loc?.sector, loc?.area, loc?.city].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero image */}
      <div className="max-w-5xl mx-auto p-4">
        <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden rounded-lg bg-white">
          <img src={primaryImg} alt={data?.title || "Property"} className="w-full h-full object-cover" />
          <Watermark variant="pattern" />
          <button className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
            <Heart className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Header section */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const url = window.location.href;
                  if (navigator.share) navigator.share({ title: data?.title, url });
                  else { navigator.clipboard.writeText(url); alert("Link copied!"); }
                } catch {}
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
              onClick={() => window.open(`tel:${contact?.phone || ""}`, "_self")}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("token");
                  const lsUser = localStorage.getItem("user");
                  if (!token || !lsUser) {
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                    return;
                  }
                  const apiResponse = await (window as any).api(`conversations/find-or-create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: { propertyId: data._id },
                  });
                  const ok = apiResponse?.ok || apiResponse?.success;
                  const payload = apiResponse?.json || apiResponse?.data;
                  if (ok) {
                    const raw = payload?._id || payload?.conversationId;
                    const convId = typeof raw === "string" ? raw : raw?.toString?.();
                    if (convId) { window.location.href = `/conversation/${convId}`; return; }
                  }
                  alert("Failed to start chat");
                } catch (e) { console.error(e); alert("Failed to start chat"); }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Owner
            </Button>
          </div>
        </div>

        {/* Title + price + badges */}
        <Section title={<><Home className="h-4 w-4" /> Listing Details</>}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{data?.title}</h1>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{address}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {data?.propertyType && (
                  <Chip className="bg-red-50 text-[#C70000]">
                    <Home className="h-3 w-3 mr-1" />
                    {String(data.propertyType)}
                  </Chip>
                )}
                {data?.subCategory && (
                  <Chip>
                    <Layers className="h-3 w-3 mr-1" />
                    {String(data.subCategory)}
                  </Chip>
                )}
                {data?.priceType && (
                  <Chip>
                    <Tag className="h-3 w-3 mr-1" />
                    {String(data.priceType).toUpperCase()}
                  </Chip>
                )}
                {data?.status && <Chip>{String(data.status)}</Chip>}
                {verified && (
                  <Chip className="bg-emerald-50 text-emerald-700">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    Verified
                  </Chip>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-[#C70000]">
                ₹{fmtPrice(data?.price)}
                {isRent && <span className="text-sm font-medium text-gray-600"> /month</span>}
              </div>
              {data?.negotiable && (
                <div className="text-[12px] text-emerald-700 font-medium mt-1">Negotiable</div>
              )}
            </div>
          </div>
        </Section>

        {/* Specifications */}
        <Section title={<><Ruler className="h-4 w-4" /> Specifications</>}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6">
            <KV k="Bedrooms" v={specs?.bedrooms} />
            <KV k="Bathrooms" v={specs?.bathrooms} />
            <KV k="Balconies" v={specs?.balconies} />
            <KV k="Area" v={specs?.area && `${specs.area} ${specs?.areaUnit || "sq ft"}`} />
            <KV k="Carpet Area" v={specs?.carpetArea && `${specs.carpetArea} ${specs?.areaUnit || "sq ft"}`} />
            <KV k="Built-up Area" v={specs?.builtUpArea && `${specs.builtUpArea} ${specs?.areaUnit || "sq ft"}`} />
            <KV k="Plot Area" v={details?.plotArea && `${details.plotArea} ${details?.plotUnit || ""}`} />
            <KV k="Dimensions" v={(dims?.length || dims?.width) && `${dims?.length || ""}${dims?.length ? " x " : ""}${dims?.width || ""} ${dims?.unit || ""}`} />
            <KV k="Floor" v={specs?.floor} />
            <KV k="Total Floors" v={specs?.totalFloors} />
            <KV k="Facing" v={specs?.facing} />
            <KV k="Furnishing" v={specs?.furnishing} />
            <KV k="Property Age" v={specs?.age} />
            <KV k="Ownership" v={specs?.ownership} />
            <KV k="Maintenance" v={specs?.maintenance} />
            <KV k="RERA" v={meta?.reraId || details?.reraId} />
            <KV k="Posted On" v={(meta?.postedOn || data?.createdAt) && new Date(meta?.postedOn || data?.createdAt).toLocaleDateString()} />
            <KV k="Listing ID" v={data?.listingId || meta?.listingId} />
            <KV k="Posted By" v={meta?.postedBy || data?.postedBy || contact?.name} />
          </div>
        </Section>

        {/* Description */}
        {(data?.description || details?.description || data?.shortDescription) && (
          <Section title={<><FileText className="h-4 w-4" /> Description</>}>
            <p className="text-[13.5px] leading-6 text-gray-700">
              {data?.description || details?.description || data?.shortDescription}
            </p>
          </Section>
        )}

        {/* Amenities + Nearby */}
        <div className="grid md:grid-cols-2 gap-4">
          {!!(data?.amenities?.length || details?.amenities?.length || data?.features?.length) && (
            <Section title={<><Building2 className="h-4 w-4" /> Amenities / Features</>}>
              <div className="flex flex-wrap gap-1.5">
                {(data?.amenities || details?.amenities || data?.features || []).slice(0, 40).map((a: string, i: number) => (
                  <Chip key={i}>{a}</Chip>
                ))}
              </div>
            </Section>
          )}
          {(data?.tags?.length || details?.tags?.length || loc?.landmark || loc?.nearby?.length || details?.nearby?.length) && (
            <Section title={<><Landmark className="h-4 w-4" /> Nearby / Tags</>}>
              <div className="flex flex-wrap gap-1.5">
                {loc?.landmark && <Chip>{loc.landmark}</Chip>}
                {Array.isArray(loc?.nearby) && loc.nearby.map((n: string, i: number) => <Chip key={`n-${i}`}>{n}</Chip>)}
                {Array.isArray(details?.nearby) && details.nearby.map((n: string, i: number) => <Chip key={`dn-${i}`}>{n}</Chip>)}
                {(data?.tags || details?.tags || []).map((t: string, i: number) => <Chip key={`t-${i}`}>{t}</Chip>)}
              </div>
            </Section>
          )}
        </div>

        {/* Gallery */}
        {images.length > 1 && (
          <Section title={<><Images className="h-4 w-4" /> Gallery</>}>
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {images.slice(1).map((src, idx) => (
                  <img key={idx} src={src} alt={`Property ${idx + 2}`} className="h-28 w-40 object-cover rounded-md border flex-shrink-0" />
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* Documents */}
        {(details?.floorPlanUrl || details?.reraCertificateUrl || details?.documents?.length) && (
          <Section title={<><IdCard className="h-4 w-4" /> Documents</>}>
            <div className="flex flex-col gap-2">
              {details?.floorPlanUrl && <a href={details.floorPlanUrl} target="_blank" rel="noreferrer" className="text-[#C70000] underline">• Floor Plan</a>}
              {details?.reraCertificateUrl && <a href={details.reraCertificateUrl} target="_blank" rel="noreferrer" className="text-[#C70000] underline">• RERA Certificate</a>}
              {Array.isArray(details?.documents) &&
                details.documents.map((d: any, i: number) => (
                  <a key={i} href={typeof d === "string" ? d : d?.url} target="_blank" rel="noreferrer" className="text-[#C70000] underline">
                    • {typeof d === "string" ? `Document ${i + 1}` : d?.name || `Document ${i + 1}`}
                  </a>
                ))}
            </div>
          </Section>
        )}

        {/* Contact & CTA */}
        <Section title={<><CalendarClock className="h-4 w-4" /> Contact & Actions</>}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[13px] text-gray-600">
              <div><span className="text-gray-500">Owner/Agent:</span> <span className="font-medium text-gray-900">{contact?.name || data?.postedBy || "N/A"}</span></div>
              {contact?.phone && <div><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{contact.phone}</span></div>}
              {contact?.email && <div><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{contact.email}</span></div>}
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-[#C70000] hover:bg-[#A60000] text-white" onClick={() => window.open(`tel:${contact?.phone || ""}`, "_self")}>
                <Phone className="h-4 w-4 mr-2" /> Call
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const lsUser = localStorage.getItem("user");
                    if (!token || !lsUser) {
                      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
                      return;
                    }
                    const apiResponse = await (window as any).api(`conversations/find-or-create`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: { propertyId: data._id },
                    });
                    const ok = apiResponse?.ok || apiResponse?.success;
                    const payload = apiResponse?.json || apiResponse?.data;
                    if (ok) {
                      const raw = payload?._id || payload?.conversationId;
                      const convId = typeof raw === "string" ? raw : raw?.toString?.();
                      if (convId) { window.location.href = `/conversation/${convId}`; return; }
                    }
                    alert("Failed to start chat");
                  } catch (e) { console.error(e); alert("Failed to start chat"); }
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Message Owner
              </Button>
              <Link to="/" className="text-[#C70000] underline text-sm">Back to Listings</Link>
            </div>
          </div>
        </Section>
      </div>

      <BottomNavigation />
    </div>
  );
}
