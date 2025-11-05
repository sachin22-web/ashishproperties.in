import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import OsCategoriesManagement from "./OsCategoriesManagement";
import OsSubcategoriesManagement from "./OsSubcategoriesManagement";
import OsListingsManagement from "./OsListingsManagement";
import OsBulkImport from "./OsBulkImport";
import { Layers, List, MapPin, Plus } from "lucide-react";

interface OtherServicesManagementProps {
  activeTab?: string;
}

export default function OtherServicesManagement({
  activeTab: initialActiveTab = "categories",
}: OtherServicesManagementProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);

  // Update active tab when prop changes
  React.useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Other Services Management
        </h1>
        <p className="text-gray-600">
          Manage service categories, subcategories, and listings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories" className="flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Service Categories
          </TabsTrigger>
          <TabsTrigger value="subcategories" className="flex items-center">
            <List className="h-4 w-4 mr-2" />
            Service Subcategories
          </TabsTrigger>
          <TabsTrigger value="listings" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Service Listings
          </TabsTrigger>
          <TabsTrigger value="bulk-import" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <OsCategoriesManagement />
        </TabsContent>

        <TabsContent value="subcategories" className="mt-6">
          <OsSubcategoriesManagement />
        </TabsContent>

        <TabsContent value="listings" className="mt-6">
          <OsListingsManagement />
        </TabsContent>

        <TabsContent value="bulk-import" className="mt-6">
          <OsBulkImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
