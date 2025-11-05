import OLXStyleHeader from "../components/OLXStyleHeader";
import CategoryBar from "../components/CategoryBar";
import OLXStyleListings from "../components/OLXStyleListings";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import PWAInstallButton from "../components/PWAInstallButton";
import BottomNavigation from "../components/BottomNavigation";

export default function OLXStyleIndex() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <main className="pb-16">
        <CategoryBar />
        <OLXStyleListings />
      </main>

      <BottomNavigation />
      <PWAInstallPrompt />
      <PWAInstallButton />
    </div>
  );
}
