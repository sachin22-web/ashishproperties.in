export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export const propertyTypesBySubcategory: Record<string, PropertyType[]> = {
  // Buy - Residential
  residential: [
    {
      id: "flat",
      name: "Flat/Apartment",
      slug: "flat",
      description: "Independent flats and apartments",
    },
    {
      id: "independent-house",
      name: "Independent House",
      slug: "independent-house",
      description: "Standalone houses",
    },
    {
      id: "villa",
      name: "Villa",
      slug: "villa",
      description: "Luxury villas and bungalows",
    },
    {
      id: "builder-floor",
      name: "Builder Floor",
      slug: "builder-floor",
      description: "Builder floor apartments",
    },
    {
      id: "penthouse",
      name: "Penthouse",
      slug: "penthouse",
      description: "Top floor luxury units",
    },
    {
      id: "studio-apartment",
      name: "Studio Apartment",
      slug: "studio-apartment",
      description: "Single room living spaces",
    },
  ],

  // Buy - Commercial
  commercial: [
    {
      id: "office-space",
      name: "Office Space",
      slug: "office-space",
      description: "Commercial office units",
    },
    {
      id: "shop-showroom",
      name: "Shop/Showroom",
      slug: "shop-showroom",
      description: "Retail spaces and showrooms",
    },
    {
      id: "warehouse",
      name: "Warehouse/Godown",
      slug: "warehouse",
      description: "Storage and warehouse spaces",
    },
    {
      id: "industrial-land",
      name: "Industrial Land",
      slug: "industrial-land",
      description: "Land for industrial use",
    },
    {
      id: "business-center",
      name: "Business Center",
      slug: "business-center",
      description: "Shared office spaces",
    },
    {
      id: "coworking",
      name: "Co-working Space",
      slug: "coworking",
      description: "Shared working environments",
    },
  ],

  // Buy - Plot
  plot: [
    {
      id: "residential-plot",
      name: "Residential Plot",
      slug: "residential-plot",
      description: "Land for residential construction",
    },
    {
      id: "commercial-plot",
      name: "Commercial Plot",
      slug: "commercial-plot",
      description: "Land for commercial development",
    },
    {
      id: "industrial-plot",
      name: "Industrial Plot",
      slug: "industrial-plot",
      description: "Land for industrial purposes",
    },
    {
      id: "agricultural-land",
      name: "Agricultural Land",
      slug: "agricultural-land",
      description: "Farmland and agricultural plots",
    },
  ],

  // Rent - PG/Hostel
  "pg-hostel": [
    {
      id: "boys-pg",
      name: "Boys PG",
      slug: "boys-pg",
      description: "Paying guest accommodation for men",
    },
    {
      id: "girls-pg",
      name: "Girls PG",
      slug: "girls-pg",
      description: "Paying guest accommodation for women",
    },
    {
      id: "co-living",
      name: "Co-living Spaces",
      slug: "co-living",
      description: "Modern shared living spaces",
    },
    {
      id: "hostel",
      name: "Hostel",
      slug: "hostel",
      description: "Dormitory style accommodation",
    },
    {
      id: "shared-room",
      name: "Shared Room",
      slug: "shared-room",
      description: "Shared bedroom accommodation",
    },
    {
      id: "single-room",
      name: "Single Room",
      slug: "single-room",
      description: "Private single room accommodation",
    },
  ],

  // Other Services
  "interior-design": [
    {
      id: "home-interior",
      name: "Home Interior",
      slug: "home-interior",
      description: "Residential interior design",
    },
    {
      id: "office-interior",
      name: "Office Interior",
      slug: "office-interior",
      description: "Commercial interior design",
    },
    {
      id: "modular-kitchen",
      name: "Modular Kitchen",
      slug: "modular-kitchen",
      description: "Kitchen design and setup",
    },
    {
      id: "furniture",
      name: "Furniture",
      slug: "furniture",
      description: "Custom furniture solutions",
    },
  ],

  "home-services": [
    {
      id: "packers-movers",
      name: "Packers & Movers",
      slug: "packers-movers",
      description: "Relocation services",
    },
    {
      id: "cleaning-services",
      name: "Cleaning Services",
      slug: "cleaning-services",
      description: "Home and office cleaning",
    },
    {
      id: "home-maintenance",
      name: "Home Maintenance",
      slug: "home-maintenance",
      description: "Repair and maintenance services",
    },
    {
      id: "security-services",
      name: "Security Services",
      slug: "security-services",
      description: "Home and office security",
    },
  ],

  "legal-services": [
    {
      id: "property-lawyer",
      name: "Property Lawyer",
      slug: "property-lawyer",
      description: "Legal services for property",
    },
    {
      id: "documentation",
      name: "Documentation",
      slug: "documentation",
      description: "Property document services",
    },
    {
      id: "loan-assistance",
      name: "Loan Assistance",
      slug: "loan-assistance",
      description: "Home loan and mortgage help",
    },
  ],
};

export const getPropertyTypesForSubcategory = (
  subcategorySlug: string,
): PropertyType[] => {
  return propertyTypesBySubcategory[subcategorySlug] || [];
};
