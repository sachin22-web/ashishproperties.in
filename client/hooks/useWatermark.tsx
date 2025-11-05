import { useState, useEffect } from "react";

interface WatermarkSettings {
  enabled: boolean;
  position: "bottom-right" | "center" | "pattern";
  opacity: number;
  text: string;
  logoUrl?: string;
}

/**
 * Hook to fetch and manage watermark settings from the server
 */
export function useWatermark() {
  const [settings, setSettings] = useState<WatermarkSettings>({
    enabled: true,
    position: "bottom-right",
    opacity: 0.8,
    text: "ashishproperties.in",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatermarkSettings();
  }, []);

  const fetchWatermarkSettings = async () => {
    try {
      const response = await fetch("/api/watermark-settings");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch watermark settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading };
}

export default useWatermark;
