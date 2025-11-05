import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowLeft, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StaticFooter from "@/components/StaticFooter";

interface SiteSettingsResponse {
  success: boolean;
  data: {
    footer?: {
      contact?: {
        email?: string;
        phone?: string;
        address?: string;
      };
    };
    system?: { brandName?: string };
    general?: {
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
    };
  };
}

export default function ContactUs() {
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [contactEmail, setContactEmail] = useState<string>("contact@aashishproperty.com");
  const [contactPhone, setContactPhone] = useState<string>("+91 7419100032");
  const [contactAddress, setContactAddress] = useState<string>("Rohtak, Haryana");

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [subject, setSubject] = useState<string>("General Enquiry");
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Prefill from logged-in user
    if (isAuthenticated && user) {
      setName((prev) => prev || user.name || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Fetch public settings for contact info
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data: SiteSettingsResponse = await res.json();
        const contact = data?.data?.footer?.contact || {
          email: data?.data?.general?.contactEmail,
          phone: data?.data?.general?.contactPhone,
          address: data?.data?.general?.address,
        };
        if (contact?.email) setContactEmail(contact.email);
        if (contact?.phone) setContactPhone(contact.phone);
        if (contact?.address) setContactAddress(contact.address);
      } catch (e) {
        // keep defaults
      }
    };
    loadSettings();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Please fill subject and message", variant: "destructive" });
      return;
    }

    // If logged-in, create a support ticket
    if (isAuthenticated && token) {
      try {
        setSubmitting(true);
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            message: `${message}\n\n— Contact details —\nName: ${name || ""}\nEmail: ${email || ""}\nPhone: ${phone || ""}`,
            category: "contact",
            priority: "medium",
          }),
        });
        const data = await res.json();
        if (res.ok && data?.success) {
          toast({ title: "Message sent", description: "Our team will contact you soon." });
          setMessage("");
        } else {
          throw new Error(data?.error || "Failed to send");
        }
      } catch (err) {
        toast({ title: "Failed to send message", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Guest users: open email client with prefilled details
    const body = `${message}\n\n— Contact details —\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`;
    const link = `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
      subject || "General Enquiry",
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = link;
    toast({ title: "Opening your email app..." });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Button asChild variant="ghost" className="">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Link>
          </Button>
          <div className="text-sm text-gray-500">We're here to help</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-5">
        {/* Contact Info */}
        <aside className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#C70000] mt-0.5" />
                <div>
                  <div className="font-medium">Phone</div>
                  <a className="text-[#C70000]" href={`tel:${contactPhone}`}>{contactPhone}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#C70000] mt-0.5" />
                <div>
                  <div className="font-medium">Email</div>
                  <a className="text-[#C70000]" href={`mailto:${contactEmail}`}>{contactEmail}</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#C70000] mt-0.5" />
                <div>
                  <div className="font-medium">Address</div>
                  <div className="text-gray-600">{contactAddress}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium mb-2">Business Hours</h3>
            <p className="text-sm text-gray-600">Mon–Sat: 9:30 AM – 6:30 PM</p>
            <p className="text-sm text-gray-600">Sun: Closed</p>
          </div>
        </aside>

        {/* Form */}
        <section className="md:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-1">Contact Us</h1>
            <p className="text-gray-600 mb-6">Send us a message and we’ll get back to you shortly.</p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="How can we help you?" />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting} className="bg-[#C70000] hover:bg-[#A60000]">
                  <Send className="h-4 w-4 mr-2" />
                  {isAuthenticated ? (submitting ? "Sending..." : "Send Message") : "Open Email App"}
                </Button>
                <span className="text-xs text-gray-500">{isAuthenticated ? "Creates a support ticket" : "You’re not logged in; we’ll open your email app to send"}</span>
              </div>
            </form>
          </div>
        </section>
      </div>

     <StaticFooter/>
    </div>
  );
}
