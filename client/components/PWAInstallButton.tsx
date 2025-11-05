import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWAInstallButton = () => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (PWA is installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        setShowInstallButton(false);
        localStorage.setItem("pwa-installed", "true");
        localStorage.removeItem("pwa-install-dismissed");
        return;
      }

      // Check localStorage for installation status
      const storedInstalled = localStorage.getItem("pwa-installed");
      if (storedInstalled === "true") {
        setIsInstalled(true);
        setShowInstallButton(false);
        return;
      }

      // Check if already dismissed today
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const hoursSinceDismissed =
          (Date.now() - dismissedTime) / (1000 * 60 * 60);

        // Show again after 24 hours
        if (hoursSinceDismissed < 24) {
          setIsVisible(false);
          return;
        } else {
          localStorage.removeItem("pwa-install-dismissed");
        }
      }
    };

    checkInstalled();
  }, []);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setShowInstallButton(true);
      setIsVisible(true);
      console.log("beforeinstallprompt event captured");
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log("App installed successfully");
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setIsInstalling(false);
      localStorage.setItem("pwa-installed", "true");
      localStorage.removeItem("pwa-install-dismissed");
      toast({
        title: "Success! 🎉",
        description:
          "App installed successfully. Look for it on your home screen.",
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Not available on this browser",
        description:
          "PWA installation not supported. Try Chrome or Samsung Internet on Android.",
        variant: "destructive",
      });
      return;
    }

    setIsInstalling(true);

    try {
      // Show the browser's install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        setIsInstalled(true);
        setShowInstallButton(false);
        localStorage.setItem("pwa-installed", "true");
        toast({
          title: "Installing... 📱",
          description: "Your app is being installed. Check your home screen.",
        });
      } else {
        console.log("User dismissed the install prompt");
        setIsInstalling(false);
      }

      // Clear the saved prompt since it can only be used once
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Error during PWA installation:", error);
      setIsInstalling(false);
      toast({
        title: "Installation Error",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if installed or dismissed
  if (isInstalled || !isVisible) {
    return null;
  }

  // Show install button
  if (showInstallButton && deferredPrompt) {
    return (
      <div className="fixed left-0 right-0 z-40 bg-gradient-to-r from-[#C70000] to-[#A50000] text-white bottom-16 md:bottom-0 md:left-auto md:right-4 md:w-96 md:rounded-lg md:shadow-lg">
        <div className="p-4 md:p-5">
          {/* Header with icon and title */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-bold">
                  Install Ashish Properties
                </h3>
                <p className="text-xs text-red-100">
                  Quick access on home screen
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors ml-2 shrink-0"
              aria-label="Dismiss"
              disabled={isInstalling}
              type="button"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Install Button */}
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            size="sm"
            className="w-full bg-white text-[#C70000] hover:bg-gray-100 font-bold text-base py-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isInstalling ? (
              <>
                <div className="h-5 w-5 mr-2 border-3 border-white border-t-[#C70000] rounded-full animate-spin" />
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                <span>Install App</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstallButton;
