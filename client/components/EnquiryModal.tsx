import React, { useState } from "react";
import { X, Phone, User, MessageSquare, Send, Mail } from "lucide-react";
import { toast } from "sonner";

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  ownerName?: string;
}

interface EnquiryFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  ownerName = "Property Owner",
}) => {
  const [formData, setFormData] = useState<EnquiryFormData>({
    name: "",
    phone: "",
    email: "",
    message: `Hi, I'm interested in "${propertyTitle}". Could you please provide more details?`,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Validate email if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (!formData.message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    // Validate phone number format (basic)
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          "Enquiry sent successfully! The owner will contact you soon.",
        );

        // Reset form
        setFormData({
          name: "",
          phone: "",
          email: "",
          message: `Hi, I'm interested in "${propertyTitle}". Could you please provide more details?`,
        });

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);

        console.log("✅ Enquiry sent successfully:", result);
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message || "Failed to send enquiry. Please try again.",
        );
        console.error("❌ Enquiry submission failed:", errorData);
      }
    } catch (error) {
      console.error("❌ Error submitting enquiry:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickMessage = (message: string) => {
    setFormData((prev) => ({
      ...prev,
      message,
    }));
  };

  const quickMessages = [
    `Hi, I'm interested in "${propertyTitle}". Is it still available?`,
    `Can you please share more details about "${propertyTitle}"?`,
    `I would like to schedule a visit for "${propertyTitle}".`,
    `What is the best price you can offer for "${propertyTitle}"?`,
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Send Enquiry
            </h2>
            <p className="text-sm text-gray-600">Contact {ownerName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Info */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-sm font-medium text-gray-900 line-clamp-2">
            {propertyTitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                placeholder="+91 9876543210"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">We'll send you a confirmation email if provided</p>
          </div>

          {/* Quick Messages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Messages
            </label>
            <div className="space-y-2">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickMessage(msg)}
                  className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Message Field */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Message *
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors resize-none"
                placeholder="Write your message here..."
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="enquiry-btn"
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 active:bg-red-800"
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Enquiry</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Your contact information will only be shared with the property
            owner.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnquiryModal;
