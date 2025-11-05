import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import {
  Heart,
  Search,
  Filter,
  MapPin,
  Eye,
  MessageSquare,
  Share,
  Calendar,
  Star,
  Home,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  DollarSign,
  Bed,
  Bath,
  Square,
  PriceTag,
  TrendingUp,
  TrendingDown,
  Minus,
  Grid,
  List,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface FavoriteProperty extends Property {
  savedAt: string;
  priceHistory?: PricePoint[];
  lastViewed?: string;
  notes?: string;
}

interface PricePoint {
  price: number;
  date: string;
}

interface SavedSearch {
  _id: string;
  name: string;
  query: string;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    location?: string;
    bedrooms?: number;
  };
  createdAt: string;
  matchCount: number;
  lastRun: string;
}

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "price" | "priceChange"
  >("newest");
  const [filterBy, setFilterBy] = useState<
    "all" | "sale" | "rent" | "priceDropped" | "new"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTab, setSelectedTab] = useState("properties");

  const [stats, setStats] = useState({
    totalFavorites: 0,
    recentlyAdded: 0,
    priceDropped: 0,
    avgPrice: 0,
    totalSavedSearches: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchFavorites();
    fetchSavedSearches();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/user/favorites", token);
      if (response.data.success) {
        const favoritesData = response.data.data as FavoriteProperty[];
        setFavorites(favoritesData);
        calculateStats(favoritesData);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/user/saved-searches", token);
      if (response.data.success) {
        setSavedSearches(response.data.data as SavedSearch[]);
      }
    } catch (error) {
      console.error("Error fetching saved searches:", error);
    }
  };

  const calculateStats = (favorites: FavoriteProperty[]) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentlyAdded = favorites.filter(
      (fav) => new Date(fav.savedAt) > lastWeek,
    ).length;

    const priceDropped = favorites.filter(
      (fav) =>
        fav.priceHistory &&
        fav.priceHistory.length > 1 &&
        fav.priceHistory[fav.priceHistory.length - 1].price <
          fav.priceHistory[0].price,
    ).length;

    const avgPrice =
      favorites.length > 0
        ? favorites.reduce((sum, fav) => sum + fav.price, 0) / favorites.length
        : 0;

    setStats({
      totalFavorites: favorites.length,
      recentlyAdded,
      priceDropped,
      avgPrice,
      totalSavedSearches: savedSearches.length,
    });
  };

  const removeFromFavorites = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/user/favorites/${propertyId}`, token);
      fetchFavorites();
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const addPropertyNote = async (propertyId: string, note: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put(`/user/favorites/${propertyId}/note`, { note }, token);
      fetchFavorites();
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const shareProperty = (property: FavoriteProperty) => {
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: property.description,
        url: `${window.location.origin}/property/${property._id}`,
      });
    } else {
      const link = `${window.location.origin}/property/${property._id}`;
      navigator.clipboard.writeText(link);
      // Show toast notification
    }
  };

  const runSavedSearch = async (searchId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post(
        `/user/saved-searches/${searchId}/run`,
        {},
        token,
      );
      if (response.data.success) {
        // Navigate to search results
        navigate(`/search?saved=${searchId}`);
      }
    } catch (error) {
      console.error("Error running saved search:", error);
    }
  };

  const deleteSavedSearch = async (searchId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/user/saved-searches/${searchId}`, token);
      fetchSavedSearches();
    } catch (error) {
      console.error("Error deleting saved search:", error);
    }
  };

  const getFilteredFavorites = () => {
    let filtered = favorites;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (property) =>
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.location.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          property.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply type filter
    switch (filterBy) {
      case "sale":
        filtered = filtered.filter((prop) => prop.priceType === "sale");
        break;
      case "rent":
        filtered = filtered.filter((prop) => prop.priceType === "rent");
        break;
      case "priceDropped":
        filtered = filtered.filter(
          (prop) =>
            prop.priceHistory &&
            prop.priceHistory.length > 1 &&
            prop.priceHistory[prop.priceHistory.length - 1].price <
              prop.priceHistory[0].price,
        );
        break;
      case "new":
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((prop) => new Date(prop.savedAt) > lastWeek);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case "oldest":
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        case "price":
          return b.price - a.price;
        case "priceChange":
          const aChange =
            a.priceHistory && a.priceHistory.length > 1
              ? a.priceHistory[a.priceHistory.length - 1].price -
                a.priceHistory[0].price
              : 0;
          const bChange =
            b.priceHistory && b.priceHistory.length > 1
              ? b.priceHistory[b.priceHistory.length - 1].price -
                b.priceHistory[0].price
              : 0;
          return bChange - aChange;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getPriceChangeIndicator = (property: FavoriteProperty) => {
    if (!property.priceHistory || property.priceHistory.length < 2) {
      return null;
    }

    const currentPrice =
      property.priceHistory[property.priceHistory.length - 1].price;
    const previousPrice = property.priceHistory[0].price;
    const change = currentPrice - previousPrice;
    const percentage = ((change / previousPrice) * 100).toFixed(1);

    if (change > 0) {
      return (
        <div className="flex items-center space-x-1 text-red-600">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs">+{percentage}%</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center space-x-1 text-green-600">
          <TrendingDown className="h-3 w-3" />
          <span className="text-xs">{percentage}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 text-gray-500">
          <Minus className="h-3 w-3" />
          <span className="text-xs">0%</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span>My Favorites</span>
            </h1>
            <p className="text-gray-600">Your saved properties and searches</p>
          </div>
          <Button onClick={fetchFavorites} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000]">
                {stats.totalFavorites}
              </div>
              <div className="text-sm text-gray-600">Total Favorites</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.recentlyAdded}
              </div>
              <div className="text-sm text-gray-600">Recent</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.priceDropped}
              </div>
              <div className="text-sm text-gray-600">Price Dropped</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{(stats.avgPrice / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-gray-600">Avg Price</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalSavedSearches}
              </div>
              <div className="text-sm text-gray-600">Saved Searches</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="properties">Favorite Properties</TabsTrigger>
            <TabsTrigger value="searches">Saved Searches</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {/* Filters and Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search favorites..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="all">All Properties</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="priceDropped">Price Dropped</option>
                    <option value="new">Recently Added</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price">Price High to Low</option>
                    <option value="priceChange">Price Change</option>
                  </select>

                  <div className="flex space-x-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Grid/List */}
            {getFilteredFavorites().length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {favorites.length === 0
                      ? "No favorites yet"
                      : "No properties match your filters"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {favorites.length === 0
                      ? "Start browsing properties and save your favorites"
                      : "Try adjusting your search criteria"}
                  </p>
                  {favorites.length === 0 && (
                    <Link to="/properties">
                      <Button className="bg-[#C70000] hover:bg-[#A60000]">
                        <Search className="h-4 w-4 mr-2" />
                        Browse Properties
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredFavorites().map((property) => (
                  <Card
                    key={property._id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <div className="relative">
                      <div className="aspect-video w-full bg-gray-200 rounded-t-lg overflow-hidden">
                        {property.images && property.images.length > 0 ? (
                          <img
                            data-wm="1"
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {property.isPremium && (
                          <Badge className="bg-amber-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        {getPriceChangeIndicator(property)}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {property.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/property/${property._id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Property
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => shareProperty(property)}
                            >
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove from Favorites
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove "
                                    {property.title}" from your favorites?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      removeFromFavorites(property._id)
                                    }
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {property.description}
                      </p>

                      <div className="flex items-center space-x-1 text-gray-500 text-sm mb-3">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {property.location.address}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold text-[#C70000]">
                          ₹{property.price.toLocaleString()}
                          {property.priceType === "rent" && "/month"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-4">
                          {property.bedrooms && (
                            <div className="flex items-center space-x-1">
                              <Bed className="h-3 w-3" />
                              <span>{property.bedrooms}</span>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="flex items-center space-x-1">
                              <Bath className="h-3 w-3" />
                              <span>{property.bathrooms}</span>
                            </div>
                          )}
                          {property.area && (
                            <div className="flex items-center space-x-1">
                              <Square className="h-3 w-3" />
                              <span>{property.area} sq ft</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>
                            Saved{" "}
                            {new Date(property.savedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{property.views} views</span>
                        </div>
                      </div>

                      {property.notes && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            {property.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredFavorites().map((property) => (
                  <Card key={property._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-32 h-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {property.images && property.images.length > 0 ? (
                            <img
                              data-wm="1"
                              src={property.images[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {property.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">
                                {property.description}
                              </p>
                              <div className="flex items-center space-x-1 text-gray-500 text-sm mb-2">
                                <MapPin className="h-3 w-3" />
                                <span>{property.location.address}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#C70000]">
                                ₹{property.price.toLocaleString()}
                                {property.priceType === "rent" && "/month"}
                              </div>
                              {getPriceChangeIndicator(property)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {property.bedrooms && (
                                <div className="flex items-center space-x-1">
                                  <Bed className="h-3 w-3" />
                                  <span>{property.bedrooms} beds</span>
                                </div>
                              )}
                              {property.bathrooms && (
                                <div className="flex items-center space-x-1">
                                  <Bath className="h-3 w-3" />
                                  <span>{property.bathrooms} baths</span>
                                </div>
                              )}
                              {property.area && (
                                <div className="flex items-center space-x-1">
                                  <Square className="h-3 w-3" />
                                  <span>{property.area} sq ft</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/property/${property._id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Link>
                              </Button>
                              <Button
                                onClick={() => shareProperty(property)}
                                variant="outline"
                                size="sm"
                              >
                                <Share className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Remove from Favorites
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove "
                                      {property.title}" from your favorites?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        removeFromFavorites(property._id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="searches">
            <Card>
              <CardHeader>
                <CardTitle>Saved Searches</CardTitle>
              </CardHeader>
              <CardContent>
                {savedSearches.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No saved searches yet</p>
                    <p className="text-sm text-gray-400">
                      Save your searches to get notified of new matches
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedSearches.map((search) => (
                      <Card key={search._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{search.name}</h3>
                              <p className="text-sm text-gray-500">
                                {search.query}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                                <span>{search.matchCount} matches</span>
                                <span>
                                  Last run:{" "}
                                  {new Date(
                                    search.lastRun,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => runSavedSearch(search._id)}
                                variant="outline"
                                size="sm"
                              >
                                <Search className="h-3 w-3 mr-1" />
                                Run Search
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Saved Search
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the saved
                                      search "{search.name}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteSavedSearch(search._id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
}



