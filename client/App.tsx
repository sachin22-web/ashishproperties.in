import "./global.css";
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { FirebaseAuthProvider } from "./hooks/useFirebaseAuth";
import ErrorBoundary from "./components/ErrorBoundary";
import PageUpdateNotification from "./components/PageUpdateNotification";
import "./lib/global-api"; // Make API helper globally available
import Index from "./pages/Index";
import FirebaseAuth from "./pages/FirebaseAuth";
import FirebaseAuthTest from "./pages/FirebaseAuthTest";
import Categories from "./pages/Categories";
import Properties from "./pages/Properties";
import Buy from "./pages/Buy";
import Sale from "./pages/Sale";
import Wishlist from "./pages/Wishlist";
import Rent from "./pages/Rent";
import Lease from "./pages/Lease";
import PG from "./pages/PG";
import Services from "./pages/Services";
import Advertise from "./pages/Advertise";
import Chat from "./pages/Chat";
import ChatPage from "./pages/ChatPage";
import ChatConversation from "./pages/ChatConversation";
import Conversations from "./pages/Conversations";
import DevChatTest from "./pages/DevChatTest";
import MyAccount from "./pages/MyAccount";
import User from "./pages/User";
import Seller from "./pages/Seller";
import Support from "./pages/Support";
import Agents from "./pages/Agents";
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import EnhancedUserLogin from "./pages/EnhancedUserLogin";
import LoginModal from "./components/auth/LoginModal";
import { SellerProtectedRoute } from "./components/auth/ProtectedRoute";
import ComprehensiveAuth from "./pages/ComprehensiveAuth";
import UserDashboard from "./pages/UserDashboard";
import PostProperty from "./pages/PostProperty";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import CategoriesPage from "./pages/CategoriesPage";
import SubcategoriesPage from "./pages/SubcategoriesPage";
import CountriesPage from "./pages/CountriesPage";
import CategoryProperties from "./pages/CategoryProperties";
import PropertyTypes from "./pages/PropertyTypes";
import PropertyDetail from "./pages/PropertyDetail";
import Blog from "./pages/Blog";
import ContentPage from "./pages/ContentPage";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import StaffLogin from "./pages/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard";
import StaffAdmin from "./pages/StaffAdmin";
import AdminReviewsModeration from "./pages/AdminReviewsModeration";
import EnhancedSellerDashboard from "./pages/EnhancedSellerDashboard";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import MyProperties from "./pages/MyProperties";
import Clients from "./pages/Clients";
import Favorites from "./pages/Favorites"; 
import BlogPost from "./pages/BlogPost";
import Maps from "./pages/Maps";
import NewProjects from "./pages/NewProjects";
import RecentViews from "./pages/RecentViews";
import Leads from "./pages/Leads";
import Notifications from "./pages/Notifications";
import SellerBlog from "./pages/SellerBlog";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import OtherServices from "./pages/OtherServices";
import OtherServicesCategory from "./pages/OtherServicesCategory";
import OtherServicesListings from "./pages/OtherServicesListings";
import TestChat from "./pages/TestChat";
import Step3Test from "./pages/Step3Test";
import NetworkStatus from "./components/NetworkStatus";
import AdsenseProvider from "./components/AdsenseProvider";
import TitleSync from "./components/TitleSync";
import DynamicPage from "./pages/DynamicPage";
import AdminSubcategoriesPage from "./pages/AdminSubcategoriesPage";
import Checkout from "./pages/Checkout";
import PaymentStatus from "./pages/PaymentStatus";
import PWAInstallButton from "./components/PWAInstallButton";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <FirebaseAuthProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NetworkStatus />
              <PWAInstallPrompt />
              <PWAInstallButton />
              <AdsenseProvider />
              <BrowserRouter>
                <TitleSync />
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:category" element={<CategoryProperties />} />
                  <Route path="/checkout/:planId" element={<Checkout />} />
                  <Route path="/categories/:category/:subcategory" element={<CategoryProperties />} />
                  <Route path="/categories/:category/:subcategory/:propertyType" element={<CategoryProperties />} />
                  <Route path="/properties" element={<Properties />} />
                  {/* New Category Routes */}
                  <Route path="/buy" element={<Buy />} />
                  <Route path="/sale" element={<Sale />} />
                  <Route path="/rent" element={<Rent />} />
                  <Route path="/lease" element={<Lease />} />
                  <Route path="/pg" element={<PG />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/other-services" element={<OtherServices />} />
                  <Route path="/other-services/:cat" element={<OtherServicesCategory />} />
                  <Route path="/other-services/:cat/:sub" element={<OtherServicesListings />} />
                  <Route path="/advertise" element={<Advertise />} />
                  {/* Category/Subcategory Listings */}
                  <Route path="/buy/:slug" element={<CategoryProperties />} />
                  <Route path="/sale/:slug" element={<CategoryProperties />} />
                  <Route path="/rent/:slug" element={<CategoryProperties />} />
                  <Route path="/lease/:slug" element={<CategoryProperties />} />
                  <Route path="/pg/:slug" element={<CategoryProperties />} />
                  <Route path="/property/:id" element={<PropertyDetail />} />
                  <Route path="/properties/:id" element={<PropertyDetail />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/chat/:conversationId" element={<ChatPage />} />
                  <Route path="/chats" element={<Conversations />} />
                  <Route path="/conversation/:id" element={<ChatConversation />} />
                  <Route path="/test-chat/:id" element={<TestChat />} />
                  <Route path="/dev/chat-test" element={<DevChatTest />} />
                  <Route path="/step3-test" element={<Step3Test />} />
                  <Route path="/my-account" element={<MyAccount />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/login" element={<LoginModal />} />
                  <Route path="/user-login" element={<EnhancedUserLogin />} />
                  <Route path="/auth" element={<ComprehensiveAuth />} />
                  <Route path="/firebase-auth" element={<FirebaseAuth />} />
                  <Route path="/firebase-auth-test" element={<FirebaseAuthTest />} />
                  <Route path="/user" element={<User />} />
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/post-property" element={<PostProperty />} />
                  <Route path="/payment-status" element={<PaymentStatus />} />
                  <Route
                    path="/seller"
                    element={
                      <SellerProtectedRoute>
                        <Seller />
                      </SellerProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller-dashboard"
                    element={
                      <SellerProtectedRoute>
                        <EnhancedSellerDashboard />
                      </SellerProtectedRoute>
                    }
                  />
                  <Route path="/support/:action" element={<Support />} />
                  <Route path="/support/ticket/:ticketId" element={<Support />} />
                  <Route path="/enhanced-seller-dashboard" element={<EnhancedSellerDashboard />} />
                  <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
                  <Route path="/agent-dashboard" element={<AgentDashboard />} />
                  <Route path="/seller/blog" element={<SellerBlog />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/admin/support" element={<Admin />} />
                  <Route path="/admin/reviews" element={<AdminReviewsModeration />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/ads/categories" element={<CategoriesPage />} />
                  <Route path="/admin/ads/categories/:categoryId/subcategories" element={<SubcategoriesPage />} />
                  <Route path="/admin/ads/categories/:categoryId/subcategories" element={<AdminSubcategoriesPage />} />
                  <Route path="/admin/ads/categories/:categoryId/subcategories/*" element={<AdminSubcategoriesPage />} />
                  <Route path="/admin/categories/:categoryId/subcategories" element={<AdminSubcategoriesPage />} />
                  <Route path="/admin/categories/:categoryId/subcategories/*" element={<AdminSubcategoriesPage />} />
                  <Route path="/admin/locations/countries" element={<CountriesPage />} />
                  <Route path="/staff/login" element={<StaffLogin />} />
                  <Route path="/staff-dashboard" element={<StaffDashboard />} />
                  <Route path="/staff-admin" element={<StaffAdmin />} />
                  {/* New Routes for Menu Dashboard Pages */}
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/my-properties" element={<MyProperties />} />
                  <Route path="/clients" element={<Clients />} />

                  {/* ✅ Wishlist routes (both paths) */}
                  <Route path="/favorites" element={<Favorites />} />
<Route path="/wishlist" element={<Wishlist />} />

                  <Route path="/account/my-ads" element={<MyProperties />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/maps" element={<Maps />} />
                  <Route path="/new-projects" element={<NewProjects />} />
                  <Route path="/recent-views" element={<RecentViews />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/notifications" element={<Notifications />} />

                  {/* Content Pages */}
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-conditions" element={<TermsAndConditions />} />
                  <Route path="/refund-policy" element={<ContentPage />} />
                  <Route path="/contact-us" element={<ContactUs />} />
                  <Route path="/contact" element={<ContactUs />} />

                  {/* Dynamic Pages from Admin */}
                  <Route path="/page/:slug" element={<DynamicPage />} />
                  <Route path="/p/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/p/about-us" element={<AboutUs />} />
                  <Route path="/p/terms-conditions" element={<TermsAndConditions />} />
                  <Route path="/p/:slug" element={<ContentPage />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>

              {/* Global Components */}
              <PageUpdateNotification />
            </TooltipProvider>
          </AuthProvider>
        </FirebaseAuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
