import React, { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window as any).navigator?.standalone === true;
    if (installed) {
      setIsInstalled(true);
      return;
    }

    // When app gets installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem("pwa-installed", "true");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // This component is now inactive - all PWA installation is handled by PWAInstallButton
  return null;
}
