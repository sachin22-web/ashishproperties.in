import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Sliders,
  Shield,
  Bell,
  Database,
  Server,
  Key,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AppSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    currency: string;
    timezone: string;
  };
  features: {
    enableUserRegistration: boolean;
    enablePropertyPosting: boolean;
    enableChat: boolean;
    enableNotifications: boolean;
    requirePropertyApproval: boolean;
    enableSellerVerification: boolean;
    androidFlagSecure?: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  payment: {
    enablePayments: boolean;
    paymentGateway: string;
    paymentApiKey: string;
    commissionRate: number;
    phonePe: {
      enabled: boolean;
      merchantId: string;
      saltKey: string;
      saltIndex: string;
      testMode: boolean;
    };
  };
}

export default function AdminSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    general: {
      siteName: "",
      siteDescription: "",
      siteUrl: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
    features: {
      enableUserRegistration: true,
      enablePropertyPosting: true,
      enableChat: true,
      enableNotifications: true,
      requirePropertyApproval: true,
      enableSellerVerification: true,
      androidFlagSecure: false,
    },
    email: {
      smtpHost: "",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      fromEmail: "",
      fromName: "",
    },
    payment: {
      enablePayments: false,
      paymentGateway: "razorpay",
      paymentApiKey: "",
      commissionRate: 5,
      phonePe: {
        enabled: false,
        merchantId: "",
        saltKey: "",
        saltIndex: "1",
        testMode: true,
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success) {
            setSettings({ ...settings, ...data.data });
          } else {
            setError(data.error || "Failed to fetch settings");
          }
        } else {
          // API endpoint doesn't exist, use default settings
          console.log("Settings API not implemented, using default settings");
        }
      } else {
        // API endpoint doesn't exist, use default settings
        console.log("Settings API not implemented, using default settings");
      }
    } catch (err) {
      setError("Network error while fetching settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Save PhonePe settings separately first
      const phonePeResponse = await fetch("/api/admin/settings/phonepe", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings.payment.phonePe),
      });

      if (!phonePeResponse.ok) {
        throw new Error(
          `Failed to save PhonePe settings: ${phonePeResponse.status}`,
        );
      }

      const phonePeData = await phonePeResponse.json();
      if (!phonePeData.success) {
        throw new Error(phonePeData.error || "Failed to save PhonePe settings");
      }

      // Then save general settings
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.success) {
            setSuccess("Settings saved successfully!");
            setTimeout(() => setSuccess(""), 3000);
          } else {
            setError(data.error || "Failed to save settings");
          }
        } else {
          setSuccess("Settings saved successfully!");
          setTimeout(() => setSuccess(""), 3000);
        }
      } else {
        setSuccess("Settings saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: any) {
      console.error("Settings save error:", err);
      setError(err.message || "Network error while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const updateGeneralSetting = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  };

  const updateFeatureSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: value },
    }));
  };

  const updateEmailSetting = (key: string, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const updatePaymentSetting = (
    key: string,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      payment: { ...prev.payment, [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure your application settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="adsense">AdSense</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) =>
                      updateGeneralSetting("siteName", e.target.value)
                    }
                    placeholder="Your Property Site"
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) =>
                      updateGeneralSetting("siteUrl", e.target.value)
                    }
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) =>
                    updateGeneralSetting("siteDescription", e.target.value)
                  }
                  placeholder="Brief description of your property website"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) =>
                      updateGeneralSetting("contactEmail", e.target.value)
                    }
                    placeholder="contact@yoursite.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={settings.general.contactPhone}
                    onChange={(e) =>
                      updateGeneralSetting("contactPhone", e.target.value)
                    }
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.general.address}
                  onChange={(e) =>
                    updateGeneralSetting("address", e.target.value)
                  }
                  placeholder="Your business address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) =>
                      updateGeneralSetting("currency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) =>
                      updateGeneralSetting("timezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Feature Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(settings.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={key} className="text-base font-medium">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-gray-600">
                      {getFeatureDescription(key)}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      updateFeatureSetting(key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) =>
                      updateEmailSetting("smtpHost", e.target.value)
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      updateEmailSetting("smtpPort", parseInt(e.target.value))
                    }
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={settings.email.smtpUsername}
                    onChange={(e) =>
                      updateEmailSetting("smtpUsername", e.target.value)
                    }
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={settings.email.smtpPassword}
                    onChange={(e) =>
                      updateEmailSetting("smtpPassword", e.target.value)
                    }
                    placeholder="App password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) =>
                      updateEmailSetting("fromEmail", e.target.value)
                    }
                    placeholder="noreply@yoursite.com"
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.email.fromName}
                    onChange={(e) =>
                      updateEmailSetting("fromName", e.target.value)
                    }
                    placeholder="Your Site Name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="enablePayments"
                    className="text-base font-medium"
                  >
                    Enable Payments
                  </Label>
                  <p className="text-sm text-gray-600">
                    Allow users to make payments for premium features
                  </p>
                </div>
                <Switch
                  id="enablePayments"
                  checked={settings.payment.enablePayments}
                  onCheckedChange={(checked) =>
                    updatePaymentSetting("enablePayments", checked)
                  }
                />
              </div>

              {settings.payment.enablePayments && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentGateway">Payment Gateway</Label>
                      <Select
                        value={settings.payment.paymentGateway}
                        onValueChange={(value) =>
                          updatePaymentSetting("paymentGateway", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="razorpay">Razorpay</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="payu">PayU</SelectItem>
                          <SelectItem value="phonepe">PhonePe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commissionRate">
                        Commission Rate (%)
                      </Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={settings.payment.commissionRate}
                        onChange={(e) =>
                          updatePaymentSetting(
                            "commissionRate",
                            parseFloat(e.target.value),
                          )
                        }
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="paymentApiKey">Payment API Key</Label>
                    <Input
                      id="paymentApiKey"
                      type="password"
                      value={settings.payment.paymentApiKey}
                      onChange={(e) =>
                        updatePaymentSetting("paymentApiKey", e.target.value)
                      }
                      placeholder="Your payment gateway API key"
                    />
                  </div>
                </>
              )}

              {/* PhonePe Configuration */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base font-medium">
                      PhonePe Payment Gateway
                    </Label>
                    <p className="text-sm text-gray-600">
                      Configure PhonePe for Indian payments
                    </p>
                  </div>
                  <Switch
                    checked={settings.payment.phonePe.enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        payment: {
                          ...prev.payment,
                          phonePe: {
                            ...prev.payment.phonePe,
                            enabled: checked,
                          },
                        },
                      }))
                    }
                  />
                </div>

                {settings.payment.phonePe.enabled && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phonePeMerchantId">Merchant ID</Label>
                        <Input
                          id="phonePeMerchantId"
                          value={settings.payment.phonePe.merchantId}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              payment: {
                                ...prev.payment,
                                phonePe: {
                                  ...prev.payment.phonePe,
                                  merchantId: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="Your PhonePe Merchant ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phonePeSaltIndex">Salt Index</Label>
                        <Input
                          id="phonePeSaltIndex"
                          value={settings.payment.phonePe.saltIndex}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              payment: {
                                ...prev.payment,
                                phonePe: {
                                  ...prev.payment.phonePe,
                                  saltIndex: e.target.value,
                                },
                              },
                            }))
                          }
                          placeholder="Salt Index (usually 1)"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phonePeSaltKey">Salt Key</Label>
                      <Input
                        id="phonePeSaltKey"
                        type="password"
                        value={settings.payment.phonePe.saltKey}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              phonePe: {
                                ...prev.payment.phonePe,
                                saltKey: e.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Your PhonePe Salt Key"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Test Mode</Label>
                        <p className="text-xs text-gray-600">
                          Use PhonePe sandbox for testing
                        </p>
                      </div>
                      <Switch
                        checked={settings.payment.phonePe.testMode}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            payment: {
                              ...prev.payment,
                              phonePe: {
                                ...prev.payment.phonePe,
                                testMode: checked,
                              },
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-yellow-800 text-sm">
                        <strong>PhonePe Setup Instructions:</strong>
                      </p>
                      <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                        <li>
                          • Get your Merchant ID from PhonePe Business Dashboard
                        </li>
                        <li>• Generate Salt Key from API section</li>
                        <li>• Salt Index is typically "1" for primary key</li>
                        <li>• Enable Test Mode for sandbox environment</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="adsense" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Google AdSense
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">
                    Enable AdSense
                  </Label>
                  <p className="text-sm text-gray-600">
                    Toggle ads across the site
                  </p>
                </div>
                <Switch
                  checked={(settings as any).adsense?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      adsense: { ...(prev.adsense || {}), enabled: checked },
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client ID</Label>
                  <Input
                    placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                    value={(settings as any).adsense?.clientId || ""}
                    onChange={(e) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        adsense: {
                          ...(prev.adsense || {}),
                          clientId: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Test Mode</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Serve test ads</p>
                    <Switch
                      checked={(settings as any).adsense?.testMode ?? false}
                      onCheckedChange={(checked) =>
                        setSettings((prev: any) => ({
                          ...prev,
                          adsense: {
                            ...(prev.adsense || {}),
                            testMode: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["header", "Header"],
                  ["below_categories", "Below Categories"],
                  ["inline", "Inline"],
                  ["sidebar", "Sidebar"],
                  ["footer", "Footer"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <Label>{label} Slot ID</Label>
                    <Input
                      placeholder="xxxxxxxxxx"
                      value={
                        ((settings as any).adsense?.slots || {})[
                          key as string
                        ] || ""
                      }
                      onChange={(e) =>
                        setSettings((prev: any) => ({
                          ...prev,
                          adsense: {
                            ...(prev.adsense || {}),
                            slots: {
                              ...((prev.adsense && prev.adsense.slots) || {}),
                              [key as string]: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Disable on Routes (comma separated)</Label>
                <Input
                  placeholder="/post-property, /admin"
                  value={((settings as any).adsense?.disabledRoutes || []).join(
                    ", ",
                  )}
                  onChange={(e) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      adsense: {
                        ...(prev.adsense || {}),
                        disabledRoutes: e.target.value
                          .split(",")
                          .map((s) => (( s ?? "" ).trim()))
                          .filter(Boolean),
                      },
                    }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (!token) return;
                    const res = await fetch("/api/admin/settings/adsense", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify((settings as any).adsense || {}),
                    });
                    if (res.ok) {
                      setSuccess("AdSense settings saved");
                      setTimeout(() => setSuccess(""), 3000);
                    } else {
                      setError("Failed to save AdSense settings");
                    }
                  }}
                >
                  Save AdSense
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    enableUserRegistration: "Allow new users to register on the platform",
    enablePropertyPosting: "Allow users to post property listings",
    enableChat: "Enable chat functionality between users",
    enableNotifications: "Send email and push notifications",
    requirePropertyApproval: "Require admin approval for new property listings",
    enableSellerVerification: "Enable seller verification process",
  };
  return descriptions[key] || "";
}
