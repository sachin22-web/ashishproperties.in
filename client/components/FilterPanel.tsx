import { useState } from "react";
import { Filter, X, MapPin, IndianRupee, Home, Bed, Bath } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: {
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
    bhk?: string;
    bathrooms?: string;
    sector?: string;
    locationText?: string;
    sort?: string;
  }) => void;
  onClear?: () => void;
}

export default function FilterPanel({
  isOpen,
  onClose,
  onApply,
  onClear,
}: FilterPanelProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    [],
  );
  const [bhk, setBhk] = useState<string>("");
  const [bathrooms, setBathrooms] = useState<string>("");
  const [sectorVal, setSectorVal] = useState<string>("");
  const [locationText, setLocationText] = useState<string>("");
  const [sort, setSort] = useState<string>("");

  const propertyTypes = [
    "Residential",
    "Commercial",
    "Plots",
    "Flats",
    "PG / Rental",
    "Builder Floors",
    "Agricultural Land",
    "Shops",
    "Warehouses",
  ];

  const sectors = Array.from({ length: 20 }, (_, i) => `Sector ${i + 1}`);

  const handlePropertyTypeChange = (type: string, checked: boolean) => {
    if (checked) setSelectedPropertyTypes((p) => [...p, type]);
    else setSelectedPropertyTypes((p) => p.filter((t) => t !== type));
  };

  const formatPrice = (value: number) => {
    if (value >= 10000000) return "₹1Cr+";
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  if (!isOpen) return null;

  const applyFilters = () => {
    onApply?.({
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      propertyTypes: selectedPropertyTypes,
      bhk,
      bathrooms,
      sector: sectorVal,
      locationText,
      sort,
    });
    onClose();
  };

  const clearAll = () => {
    setPriceRange([0, 10000000]);
    setSelectedPropertyTypes([]);
    setBhk("");
    setBathrooms("");
    setSectorVal("");
    setLocationText("");
    setSort("");
    onClear?.();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000] bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Container that holds both mobile drawer and desktop modal */}
      <div
        className="fixed inset-x-0 bottom-0 z-[1001] mx-auto w-full sm:inset-0 sm:flex sm:items-center sm:justify-center"
        onClick={onClose}
      >
        {/* Mobile: right drawer */}
        <div
          className="block h-full w-80 max-w-[85%] overflow-y-auto rounded-t-xl bg-white shadow-xl sm:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Header onClose={onClose} />

          <div className="p-4 space-y-6">
            <LocationSection
              sectors={sectors}
              sectorVal={sectorVal}
              setSectorVal={setSectorVal}
              locationText={locationText}
              setLocationText={setLocationText}
            />

            <PriceSection
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              formatPrice={formatPrice}
            />

            <PropertyTypeSection
              propertyTypes={propertyTypes}
              selectedPropertyTypes={selectedPropertyTypes}
              onChange={handlePropertyTypeChange}
            />

            <BedroomsSection bhk={bhk} setBhk={setBhk} />

            <BathroomsSection
              bathrooms={bathrooms}
              setBathrooms={setBathrooms}
            />

            <SortSection sort={sort} setSort={setSort} />
          </div>

          <FooterButtons
            apply={applyFilters}
            clear={clearAll}
          />
        </div>

        {/* Desktop: centered modal */}
        <div
          className="hidden max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl sm:flex sm:flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <Header onClose={onClose} />

          <div className="grid grid-cols-2 gap-6 p-6 overflow-auto">
            <div className="space-y-6">
              <LocationSection
                sectors={sectors}
                sectorVal={sectorVal}
                setSectorVal={setSectorVal}
                locationText={locationText}
                setLocationText={setLocationText}
              />

              <PriceSection
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                formatPrice={formatPrice}
              />
            </div>

            <div className="space-y-6">
              <PropertyTypeSection
                propertyTypes={propertyTypes}
                selectedPropertyTypes={selectedPropertyTypes}
                onChange={handlePropertyTypeChange}
              />

              <div className="grid grid-cols-2 gap-6">
                <BedroomsSection bhk={bhk} setBhk={setBhk} />
                <BathroomsSection
                  bathrooms={bathrooms}
                  setBathrooms={setBathrooms}
                />
              </div>

              <SortSection sort={sort} setSort={setSort} />
            </div>
          </div>

          <div className="border-t p-4">
            <div className="mx-auto flex max-w-3xl items-center justify-end gap-3">
              <Button
                variant="outline"
                className="border-gray-300"
                size="lg"
                type="button"
                onClick={clearAll}
              >
                Clear All
              </Button>
              <Button
                className="bg-[#C70000] hover:bg-[#A60000] text-white"
                size="lg"
                type="button"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ===== Subcomponents (clean & reusable) ===== */

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-[#C70000]" />
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>
      <button onClick={onClose} className="p-1" type="button" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function LocationSection({
  sectors,
  sectorVal,
  setSectorVal,
  locationText,
  setLocationText,
}: {
  sectors: string[];
  sectorVal: string;
  setSectorVal: (v: string) => void;
  locationText: string;
  setLocationText: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-base font-medium">
        <MapPin className="h-4 w-4 text-[#C70000]" />
        Location
      </Label>
      <div className="space-y-3">
        <Input
          placeholder="Enter area, sector, or landmark"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />
        <Select value={sectorVal} onValueChange={setSectorVal}>
          <SelectTrigger>
            <SelectValue placeholder="Select Sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((sector) => {
              const val = sector.toLowerCase().replace(/\s+/g, "-");
              return (
                <SelectItem key={sector} value={val}>
                  {sector}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function PriceSection({
  priceRange,
  setPriceRange,
  formatPrice,
}: {
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  formatPrice: (v: number) => string;
}) {
  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-base font-medium">
        <IndianRupee className="h-4 w-4 text-[#C70000]" />
        Price Range
      </Label>
      <div className="space-y-4">
        <Slider
          value={priceRange as unknown as number[]}
          onValueChange={(val) => setPriceRange(val as [number, number])}
          max={10000000}
          step={100000}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>
    </div>
  );
}

function PropertyTypeSection({
  propertyTypes,
  selectedPropertyTypes,
  onChange,
}: {
  propertyTypes: string[];
  selectedPropertyTypes: string[];
  onChange: (type: string, checked: boolean) => void;
}) {
  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-base font-medium">
        <Home className="h-4 w-4 text-[#C70000]" />
        Property Type
      </Label>
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {propertyTypes.map((type) => (
          <div key={type} className="flex items-center space-x-2">
            <Checkbox
              id={type}
              checked={selectedPropertyTypes.includes(type)}
              onCheckedChange={(checked) => onChange(type, Boolean(checked))}
            />
            <Label htmlFor={type} className="text-sm font-normal">
              {type}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function BedroomsSection({
  bhk,
  setBhk,
}: {
  bhk: string;
  setBhk: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-base font-medium">
        <Bed className="h-4 w-4 text-[#C70000]" />
        Bedrooms
      </Label>
      <Select value={bhk} onValueChange={setBhk}>
        <SelectTrigger>
          <SelectValue placeholder="Select BHK" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1bhk">1 BHK</SelectItem>
          <SelectItem value="2bhk">2 BHK</SelectItem>
          <SelectItem value="3bhk">3 BHK</SelectItem>
          <SelectItem value="4bhk">4 BHK</SelectItem>
          <SelectItem value="5plus">5+ BHK</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function BathroomsSection({
  bathrooms,
  setBathrooms,
}: {
  bathrooms: string;
  setBathrooms: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-3 flex items-center gap-2 text-base font-medium">
        <Bath className="h-4 w-4 text-[#C70000]" />
        Bathrooms
      </Label>
      <Select value={bathrooms} onValueChange={setBathrooms}>
        <SelectTrigger>
          <SelectValue placeholder="Select bathrooms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 Bathroom</SelectItem>
          <SelectItem value="2">2 Bathrooms</SelectItem>
          <SelectItem value="3">3 Bathrooms</SelectItem>
          <SelectItem value="4plus">4+ Bathrooms</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function SortSection({
  sort,
  setSort,
}: {
  sort: string;
  setSort: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-3 block text-base font-medium">Sort By</Label>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger>
          <SelectValue placeholder="Sort properties" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="price-low-high">Price: Low to High</SelectItem>
          <SelectItem value="price-high-low">Price: High to Low</SelectItem>
          <SelectItem value="area-large-small">Area: Large to Small</SelectItem>
          <SelectItem value="area-small-large">Area: Small to Large</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function FooterButtons({
  apply,
  clear,
}: {
  apply: () => void;
  clear: () => void;
}) {
  return (
    <div className="sticky bottom-0 bg-white border-t p-4 space-y-3 sm:hidden">
      <Button
        className="w-full bg-[#C70000] hover:bg-[#A60000] text-white"
        size="lg"
        type="button"
        onClick={apply}
      >
        Apply Filters
      </Button>
      <Button
        variant="outline"
        className="w-full border-gray-300"
        size="lg"
        type="button"
        onClick={clear}
      >
        Clear All
      </Button>
    </div>
  );
}
