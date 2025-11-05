import { useEffect, useRef } from "react";

import { useAdsenseConfig } from "./AdsenseProvider";

interface AdSlotProps {
  adSlot?: string; // explicit data-ad-slot (overrides config)
  slotKey?: string; // logical key to look up from config.slots
  style?: React.CSSProperties;
  className?: string;
  format?: "horizontal" | "rectangle" | "vertical";
}

const defaultStyles: Record<
  NonNullable<AdSlotProps["format"]>,
  React.CSSProperties
> = {
  horizontal: { width: "100%", minHeight: 90 },
  rectangle: { width: "100%", minHeight: 250 },
  vertical: { width: 300, minHeight: 600 },
};

export default function AdSlot({
  adSlot,
  slotKey,
  style,
  className = "",
  format = "horizontal",
}: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const cfg = useAdsenseConfig();

  const resolvedSlot =
    adSlot || (slotKey && cfg?.slots?.[slotKey]) || undefined;
  const routeDisabled =
    cfg?.disabledRoutes?.includes(
      typeof window !== "undefined" ? window.location.pathname : "",
    ) ?? false;
  const enabled = !!cfg?.enabled && !!cfg?.clientId && !routeDisabled;

  useEffect(() => {
    if (!enabled) return;
    // @ts-ignore
    if ((window as any).adsbygoogle && ref.current) {
      try {
        // @ts-ignore
        (window as any).adsbygoogle.push({});
      } catch {}
    }
  }, [enabled, resolvedSlot]);

  if (!enabled || !resolvedSlot) return null;

  return (
    <div className={className} style={{ ...defaultStyles[format], ...style }}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={cfg?.clientId}
        data-ad-slot={resolvedSlot}
        data-full-width-responsive="true"
        data-adtest={cfg?.testMode ? "on" : undefined}
        ref={ref as any}
      />
    </div>
  );
}
