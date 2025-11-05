import React, { useState, useEffect } from "react";
import { Upload, Save, Image as ImageIcon, Eye, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";

interface WatermarkConfig {
  enabled: boolean;
  position: "bottom-right" | "center" | "pattern";
  opacity: number;
  logoUrl?: string;
  text: string;
}

export default function WatermarkSettings() {
  const [config, setConfig] = useState<WatermarkConfig>({
    enabled: true,
    position: "bottom-right",
    opacity: 0.8,
    text: "ashishproperties.in",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    fetchWatermarkSettings();
  }, []);

  const fetchWatermarkSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/watermark-settings", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfig(data.data);
          if (data.data.logoUrl) {
            setPreviewUrl(data.data.logoUrl);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch watermark settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      
      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        
        const uploadResponse = await fetch("/api/admin/watermark-logo", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          config.logoUrl = uploadData.data.url;
        }
      }

      // Save settings
      const response = await fetch("/api/admin/watermark-settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        alert("Watermark settings saved successfully!");
      } else {
        alert("Failed to save watermark settings");
      }
    } catch (error) {
      console.error("Failed to save watermark settings:", error);
      alert("Failed to save watermark settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Watermark Settings</CardTitle>
          <CardDescription>
            Configure watermark for property images to protect your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Watermark */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="watermark-enabled">Enable Watermark</Label>
              <p className="text-sm text-gray-500">
                Show watermark on all property images
              </p>
            </div>
            <Switch
              id="watermark-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enabled: checked })
              }
            />
          </div>

          {/* Watermark Position */}
          <div className="space-y-2">
            <Label>Watermark Position</Label>
            <Select
              value={config.position}
              onValueChange={(value: any) =>
                setConfig({ ...config, position: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Bottom Right (Badge)</SelectItem>
                <SelectItem value="center">Center (Translucent)</SelectItem>
                <SelectItem value="pattern">Pattern (Repeated)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Watermark Opacity */}
          <div className="space-y-2">
            <Label>Watermark Opacity: {Math.round(config.opacity * 100)}%</Label>
            <Slider
              value={[config.opacity * 100]}
              onValueChange={(values) =>
                setConfig({ ...config, opacity: values[0] / 100 })
              }
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Watermark Text */}
          <div className="space-y-2">
            <Label>Watermark Text</Label>
            <Input
              value={config.text}
              onChange={(e) => setConfig({ ...config, text: e.target.value })}
              placeholder="ashishproperties.in"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Watermark Logo (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("logo-upload")?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {previewUrl && (
                <div className="flex items-center gap-2">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="h-12 w-auto object-contain border rounded"
                  />
                  <span className="text-sm text-gray-500">Current logo</span>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "300px" }}>
              <img
                src="/placeholder-property.jpg"
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x600/e5e7eb/6b7280?text=Property+Image+Preview";
                }}
              />
              {config.enabled && (
                <>
                  {config.position === "bottom-right" && (
                    <div className="absolute bottom-4 right-4 pointer-events-none">
                      <div
                        className="px-4 py-2 bg-black/70 text-white rounded-lg text-sm font-semibold"
                        style={{ opacity: config.opacity }}
                      >
                        {config.text}
                      </div>
                    </div>
                  )}
                  {config.position === "center" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className="text-4xl font-bold text-white"
                        style={{
                          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                          opacity: config.opacity,
                        }}
                      >
                        {config.text}
                      </div>
                    </div>
                  )}
                  {config.position === "pattern" && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
                          <svg xmlns='http://www.w3.org/2000/svg' width='260' height='180'>
                            <text x='20' y='90' font-family='sans-serif' font-weight='600' font-size='18' fill='black' opacity='${config.opacity}' transform='rotate(-45 130 90)'>${config.text}</text>
                          </svg>
                        `)}")`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "260px 180px",
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#C70000] hover:bg-[#A60000]"
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Watermark Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
