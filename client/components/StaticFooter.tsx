import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Calendar,
  Grid3X3,
} from "lucide-react";
import FooterPackages from "./FooterPackages";
import CategoryDrawer from "./CategoryDrawer";

export default function StaticFooter() {
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  return (
    <footer className="bg-gradient-to-r from-[#C70000] to-red-700 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-[#C70000] font-bold text-xl">AP</span>
              </div>
              <h3 className="text-2xl font-bold">Ashish Properties</h3>
            </div>

            <p className="text-red-100 text-sm leading-relaxed">
              Your trusted property partner in Rohtak. Find your dream home with
              verified listings and expert guidance.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/aashishproperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/aashishproperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/aashishproperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/aashishproperties"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+91 7419100032</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@ashishproperties.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Rohtak, Haryana, India</span>
              </div>
            </div>
          </div>

          {/* Popular Locations */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Popular Locations</h4>
            <ul className="space-y-3">
              {[
                "Model Town",
                "Sector 14",
                "Civil Lines",
                "Old City",
                "Industrial Area",
                "Bohar",
              ].map((location) => (
                <li key={location}>
                  <Link
                    to={`/properties?location=${encodeURIComponent(location)}`}
                    className="text-red-200 hover:text-white transition-colors duration-200 text-sm flex items-center"
                  >
                    <MapPin className="h-3 w-3 mr-2" />
                    Properties in {location}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/buy"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Quick Buy
                </Link>
              </li>
              <li>
                <Link
                  to="/sale"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Quick Sale
                </Link>
              </li>
              <li>
                <Link
                  to="/rent"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Rental Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/lease"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Lease Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/pg"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  PG Accommodation
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Other Services
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal & Support</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about-us"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact-us"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/p/privacy-policy"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/p/terms-conditions"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/support/help"
                  className="text-red-200 hover:text-white transition-colors duration-200 text-sm"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Packages */}
        <FooterPackages />

        {/* Bottom Bar */}
        <div className="border-t border-red-600 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>
                All rights reserved © 2006-{new Date().getFullYear()} Ashish
                Properties
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-red-200">
              <span>Stable Version</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Categories Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsCategoryDrawerOpen(true)}
          data-testid="footer-cats"
          className="bg-[#C70000] hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-sm font-medium"
        >
          <Grid3X3 className="w-4 h-4" />
          <span>Categories</span>
        </button>
      </div>

      {/* Category Drawer */}
      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
      />
    </footer>
  );
}
