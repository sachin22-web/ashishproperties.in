import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AdsenseConfig = {
  enabled: boolean;
  clientId: string;
  slots: Record<string, string>;
  disabledRoutes: string[];
  testMode: boolean;
};

const AdsContext = createContext<AdsenseConfig | null>(null);

export function useAdsenseConfig() {
  return useContext(AdsContext);
}

export default function AdsenseProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [config, setConfig] = useState<AdsenseConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/adsense/config")
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        const cfg: AdsenseConfig = {
          enabled: !!data?.data?.enabled,
          clientId: String(data?.data?.clientId || ""),
          slots: data?.data?.slots || {},
          disabledRoutes: data?.data?.disabledRoutes || [],
          testMode: !!data?.data?.testMode,
        };
        setConfig(cfg);
        // Inject script if enabled and not already injected and not disabled on this route
        if (
          cfg.enabled &&
          cfg.clientId &&
          typeof window !== "undefined" &&
          !document.querySelector("script[data-adsbygoogle]")
        ) {
          const path = window.location.pathname;
          const disabled = cfg.disabledRoutes.includes(path);
          if (!disabled) {
            const s = document.createElement("script");
            s.async = true;
            s.src =
              "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
              cfg.clientId;
            s.setAttribute("crossorigin", "anonymous");
            s.setAttribute("data-adsbygoogle", "true");
            document.head.appendChild(s);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => config, [config]);

  return (
    <AdsContext.Provider value={value}>{children || null}</AdsContext.Provider>
  );
}
