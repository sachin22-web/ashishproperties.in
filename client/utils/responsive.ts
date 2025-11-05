// Responsive utility functions for mobile optimization

export const isMobile = () => {
  return window.innerWidth < 768;
};

export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = () => {
  return window.innerWidth >= 1024;
};

export const getBreakpoint = () => {
  const width = window.innerWidth;
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  return "xl";
};

// Mobile-friendly spacing classes
export const mobileSpacing = {
  padding: {
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  },
  margin: {
    xs: "m-2",
    sm: "m-3",
    md: "m-4",
    lg: "m-6",
  },
  gap: {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  },
};

// Responsive grid classes
export const responsiveGrid = {
  "1-2-3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  "1-2-4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  "2-3-4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  "1-3-5": "grid-cols-1 md:grid-cols-3 lg:grid-cols-5",
};

// Mobile touch-friendly button sizes
export const touchFriendly = {
  button: "min-h-[44px] min-w-[44px]", // Apple's recommended minimum
  input: "min-h-[44px]",
  spacing: "space-y-3", // Adequate spacing between touch targets
};

// Responsive text sizes
export const responsiveText = {
  title: "text-lg md:text-xl lg:text-2xl",
  subtitle: "text-base md:text-lg",
  body: "text-sm md:text-base",
  caption: "text-xs md:text-sm",
};

// Mobile-optimized flex directions
export const mobileStack = "flex-col md:flex-row";
export const desktopStack = "flex-row md:flex-col";

// Responsive widths for modals and containers
export const responsiveWidth = {
  modal: "w-full max-w-sm md:max-w-md lg:max-w-lg",
  container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  sidebar: "w-full md:w-64 lg:w-72",
};

// Responsive visibility classes
export const hideOnMobile = "hidden md:block";
export const showOnMobile = "block md:hidden";
export const hideOnDesktop = "block md:hidden";
export const showOnDesktop = "hidden md:block";
