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
  Eye,
  Search,
  Filter,
  MapPin,
  Heart,
  MessageSquare,
  Share,
  Calendar,
  Clock,
  Home,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  Star,
  TrendingUp,
  Grid,
  List,
  ChevronRight,
  Bed,
  Bath,
  Square,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface ViewedProperty extends Property {
  viewedAt: string;
  viewCount: number;
  timeSpent: number; // in seconds
  referrer?: string;
  isFavorited: boolean;
  lastViewSession: string;
}

interface ViewingSession {
  _id: string;
  date: string;
  properties: string[];
  totalTimeSpent: number;
  searchQuery?: string;
  filters?: any;
}

export default function RecentViews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentViews, setRecentViews] = useState<ViewedProperty[]>([]);
  const [viewingSessions, setViewingSessions] = useState<ViewingSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "today" | "week" | "month" | "all"
  >("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "timeSpent" | "viewCount" | "price"
  >("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTab, setSelectedTab] = useState("properties");

  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueProperties: 0,
    avgTimeSpent: 0,
    favoritesFromViews: 0,
    todayViews: 0,
    weekViews: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRecentViews();
    fetchViewingSessions();
  }, [user, navigate]);

  const fetchRecentViews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/user/recent-views", token);
      if (response.data.success) {
        const viewsData = response.data.data as ViewedProperty[];
        setRecentViews(viewsData);
        calculateStats(viewsData);
      }
    } catch (error) {
      console.error("Error fetching recent views:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewingSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/user/viewing-sessions", token);
      if (response.data.success) {
        setViewingSessions(response.data.data as ViewingSession[]);
      }
    } catch (error) {
      console.error("Error fetching viewing sessions:", error);
    }
  };

  const calculateStats = (views: ViewedProperty[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayViews = views.filter(
      (view) => new Date(view.viewedAt) >= today,
    ).length;

    const weekViews = views.filter(
      (view) => new Date(view.viewedAt) >= weekAgo,
    ).length;

    const totalTimeSpent = views.reduce((sum, view) => sum + view.timeSpent, 0);
    const avgTimeSpent = views.length > 0 ? totalTimeSpent / views.length : 0;

    const favoritesFromViews = views.filter((view) => view.isFavorited).length;

    setStats({
      totalViews: views.reduce((sum, view) => sum + view.viewCount, 0),
      uniqueProperties: views.length,
      avgTimeSpent: Math.round(avgTimeSpent),
      favoritesFromViews,
      todayViews,
      weekViews,
    });
  };

  const addToFavorites = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post(`/user/favorites/${propertyId}`, {}, token);
      fetchRecentViews(); // Refresh to update favorite status
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  };

  const removeFromRecentViews = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/user/recent-views/${propertyId}`, token);
      fetchRecentViews();
    } catch (error) {
      console.error("Error removing from recent views:", error);
    }
  };

  const clearAllRecentViews = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete("/user/recent-views", token);
      fetchRecentViews();
    } catch (error) {
      console.error("Error clearing recent views:", error);
    }
  };

  const shareProperty = (property: ViewedProperty) => {
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

  const getFilteredViews = () => {
    let filtered = recentViews;

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

    // Apply time filter
    const now = new Date();
    switch (timeFilter) {
      case "today":
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        filtered = filtered.filter((view) => new Date(view.viewedAt) >= today);
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (view) => new Date(view.viewedAt) >= weekAgo,
        );
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (view) => new Date(view.viewedAt) >= monthAgo,
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
          );
        case "timeSpent":
          return b.timeSpent - a.timeSpent;
        case "viewCount":
          return b.viewCount - a.viewCount;
        case "price":
          return b.price - a.price;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    } else {
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const viewDate = new Date(date);
    const diffMs = now.getTime() - viewDate.getTime();

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your viewing history...</p>
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
              <Eye className="h-6 w-6 text-blue-500" />
              <span>Recent Views</span>
            </h1>
            <p className="text-gray-600">
              Your property viewing history and browsing patterns
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchRecentViews} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {recentViews.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Recent Views</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear your entire viewing
                      history? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearAllRecentViews}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000]">
                {stats.totalViews}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.uniqueProperties}
              </div>
              <div className="text-sm text-gray-600">Properties</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTimeSpent(stats.avgTimeSpent)}
              </div>
              <div className="text-sm text-gray-600">Avg Time</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.favoritesFromViews}
              </div>
              <div className="text-sm text-gray-600">Favorited</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.todayViews}
              </div>
              <div className="text-sm text-gray-600">Today</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.weekViews}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="properties">Recent Properties</TabsTrigger>
            <TabsTrigger value="sessions">Viewing Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            {/* Filters and Controls */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search viewed properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-md"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="timeSpent">Time Spent</option>
                    <option value="viewCount">View Count</option>
                    <option value="price">Price</option>
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

            {/* Properties List */}
            {getFilteredViews().length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Eye className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {recentViews.length === 0
                      ? "No viewing history"
                      : "No properties match your filters"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {recentViews.length === 0
                      ? "Start browsing properties to build your viewing history"
                      : "Try adjusting your search criteria"}
                  </p>
                  {recentViews.length === 0 && (
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
                {getFilteredViews().map((property) => (
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
                        <Badge className="bg-blue-500 text-white">
                          {property.viewCount}x viewed
                        </Badge>
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
                            {!property.isFavorited && (
                              <DropdownMenuItem
                                onClick={() => addToFavorites(property._id)}
                              >
                                <Heart className="h-4 w-4 mr-2" />
                                Add to Favorites
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => shareProperty(property)}
                            >
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                removeFromRecentViews(property._id)
                              }
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from History
                            </DropdownMenuItem>
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

                      <div className="text-2xl font-bold text-[#C70000] mb-3">
                        ₹{property.price.toLocaleString()}
                        {property.priceType === "rent" && "/month"}
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
                          <Clock className="h-3 w-3" />
                          <span>{getTimeAgo(property.viewedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>
                            Spent {formatTimeSpent(property.timeSpent)}
                          </span>
                        </div>
                      </div>

                      {property.isFavorited && (
                        <div className="mt-2">
                          <Badge className="bg-red-100 text-red-800">
                            <Heart className="h-3 w-3 mr-1 fill-current" />
                            Favorited
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredViews().map((property) => (
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
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {property.title}
                                </h3>
                                {property.isFavorited && (
                                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">
                                {property.description}
                              </p>
                              <div className="flex items-center space-x-1 text-gray-500 text-sm mb-2">
                                <MapPin className="h-3 w-3" />
                                <span>{property.location.address}</span>
                              </div>
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
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#C70000] mb-2">
                                ₹{property.price.toLocaleString()}
                                {property.priceType === "rent" && "/month"}
                              </div>
                              <div className="space-y-1 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{property.viewCount}x viewed</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTimeSpent(property.timeSpent)}
                                  </span>
                                </div>
                                <div className="text-xs">
                                  {getTimeAgo(property.viewedAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/property/${property._id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Again
                                </Link>
                              </Button>
                              {!property.isFavorited && (
                                <Button
                                  onClick={() => addToFavorites(property._id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Heart className="h-3 w-3 mr-1" />
                                  Add to Favorites
                                </Button>
                              )}
                              <Button
                                onClick={() => shareProperty(property)}
                                variant="outline"
                                size="sm"
                              >
                                <Share className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                            </div>
                            <Button
                              onClick={() =>
                                removeFromRecentViews(property._id)
                              }
                              variant="outline"
                              size="sm"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Viewing Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {viewingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No viewing sessions yet</p>
                    <p className="text-sm text-gray-400">
                      Your browsing sessions will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingSessions.map((session) => (
                      <Card key={session._id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium">
                                {new Date(session.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>
                                  {session.properties.length} properties viewed
                                </span>
                                <span>
                                  {formatTimeSpent(session.totalTimeSpent)}{" "}
                                  total time
                                </span>
                              </div>
                              {session.searchQuery && (
                                <p className="text-sm text-blue-600 mt-1">
                                  Searched: "{session.searchQuery}"
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>
                              Session from{" "}
                              {new Date(session.date).toLocaleTimeString()}
                            </span>
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
