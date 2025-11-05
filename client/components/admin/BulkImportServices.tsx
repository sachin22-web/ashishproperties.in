import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { safeReadResponse, getApiErrorMessage } from "../../lib/response-utils";

export default function BulkImportServices() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
      setResult(null);
    } else {
      setError("Please select a CSV file");
      setFile(null);
    }
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => (( line ?? "" ).trim()));
    const headers = lines[0].split(",").map((h) => (( h ?? "" ).trim()));

    return lines
      .slice(1)
      .map((line) => {
        const values = line.split(",").map((v) => (( v ?? "" ).trim()).replace(/"/g, ""));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      })
      .filter((row) => row.name && row.categorySlug); // Filter out empty rows
  };

  const handleUpload = async () => {
    if (!file || !token) return;

    try {
      setUploading(true);
      setError("");

      // Read file content
      const csvText = await file.text();
      const csvData = parseCsvData(csvText);

      if (csvData.length === 0) {
        setError("No valid data found in CSV file");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("csvData", JSON.stringify(csvData));

      const response = await fetch("/api/admin/os-listings/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const { ok, status, data } = await safeReadResponse(response);

      if (ok && data.success) {
        setResult(data.data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "csv-file",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(getApiErrorMessage(data, status, "import CSV"));
      }
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError("Failed to upload CSV file");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `categorySlug,subSlug,name,phone,address,lat,lng,photo1,photo2,photo3,photo4,open,close,active
repairs,plumber,"ABC Plumbing Services","+91-9876543210","123 Main Street, Rohtak",28.8945,76.6066,"https://example.com/photo1.jpg","","","","09:00","18:00",true
cleaning,house-cleaning,"Quick Clean Services","+91-9876543211","456 Park Road, Rohtak",28.8950,76.6070,"","","","","08:00","20:00",true`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "service-listings-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bulk Import Service Listings
        </h2>
        <p className="text-gray-600">
          Import multiple service listings from a CSV file
        </p>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Download Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download the CSV template to see the required format for bulk
            import.
          </p>
          <Button
            data-testid="download-template-btn"
            onClick={downloadTemplate}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="csv-file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select CSV File
              </label>
              <input
                id="csv-file"
                data-testid="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {file && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Selected: {file.name}</span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                CSV Format Requirements:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • <strong>categorySlug</strong>: Category identifier (will
                  auto-create if not exists)
                </li>
                <li>
                  • <strong>subSlug</strong>: Subcategory identifier (will
                  auto-create if not exists)
                </li>
                <li>
                  • <strong>name</strong>: Business name (required)
                </li>
                <li>
                  • <strong>phone</strong>: Contact phone number
                </li>
                <li>
                  • <strong>address</strong>: Business address
                </li>
                <li>
                  • <strong>lat, lng</strong>: Latitude and longitude
                  coordinates
                </li>
                <li>
                  • <strong>photo1-4</strong>: Photo URLs (optional)
                </li>
                <li>
                  • <strong>open, close</strong>: Business hours (HH:MM format)
                </li>
                <li>
                  • <strong>active</strong>: true/false status
                </li>
              </ul>
            </div>

            <Button
              data-testid="upload-csv-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload CSV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Upload Error</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Success Result */}
      {result && (
        <Card data-testid="import-result">
          <CardContent className="p-6">
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Import Completed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800">
                  Successfully Created
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {result.created}
                </p>
                <p className="text-sm text-green-700">service listings</p>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800">Errors</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    {result.errors.length}
                  </p>
                  <p className="text-sm text-yellow-700">rows with issues</p>
                </div>
              )}
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Error Details:
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {result.errors.map((error: string, index: number) => (
                    <p key={index} className="text-sm text-gray-600 mb-1">
                      {index + 1}. {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm">
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Download the CSV template to see the required format</li>
              <li>
                Fill in your service listing data following the template
                structure
              </li>
              <li>Save your file as CSV format</li>
              <li>Upload the CSV file using the upload button above</li>
              <li>
                Categories and subcategories will be automatically created if
                they don't exist
              </li>
              <li>Review the import results and fix any errors if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
