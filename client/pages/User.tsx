import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageSquare,
  User,
  LogOut,
  Phone,
  Mail,
  Calendar,
  Plus,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

interface Property {
  _id: string;
  title: string;
  price: number;
  priceType: "sale" | "rent";
  location: {
    address: string;
  };
  images: string[];
  coverImageUrl?: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  status: "open" | "closed" | "pending";
  priority: "low" | "medium" | "high";
  createdAt: string;
  messageCount: number;
  lastMessage: string;
}

export default function User() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchFavorites();
    fetchTickets();
  }, [user, navigate]);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/favorites/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setFavorites(data.data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/tickets/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/favorites/${propertyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFavorites(favorites.filter((fav) => fav.propertyId !== propertyId));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  const handleTicketClick = (ticketId: string) => {
    navigate(`/support/ticket/${ticketId}`);
  };

  const createNewTicket = () => {
    navigate("/support/new");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />

      <main className="pb-16">
        <div className="px-4 py-6">
          {/* User Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {user?.name}
                    </h1>
                    <p className="text-gray-600">{user?.email}</p>
                    {user?.phone && (
                      <p className="text-gray-600 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {user.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites" className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Favorites ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Support ({tickets.length})
              </TabsTrigger>
            </TabsList>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">My Favorites</h2>
              </div>

              {favorites.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No favorites yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start browsing properties and add them to your favorites
                    </p>
                    <Button
                      onClick={() => navigate("/buy")}
                      className="bg-[#C70000] hover:bg-[#A60000]"
                    >
                      Browse Properties
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {favorites.map((favorite) => (
                    <Card key={favorite._id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-32 h-32 flex-shrink-0">
                            <img
                              src={
                                favorite.property?.coverImageUrl ??
                                favorite.property?.images?.[0]?.url ??
                                favorite.property?.images?.[0] ??
                                "/placeholder.png"
                              }
                              alt={favorite.property?.title}
                              className="w-full h-full object-cover"
                              onClick={() =>
                                handlePropertyClick(favorite.propertyId)
                              }
                            />
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3
                                className="font-semibold text-gray-900 cursor-pointer hover:text-[#C70000]"
                                onClick={() =>
                                  handlePropertyClick(favorite.propertyId)
                                }
                              >
                                {favorite.property?.title}
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeFavorite(favorite.propertyId)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Heart className="h-4 w-4 fill-current" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {favorite.property?.location?.address}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-[#C70000]">
                                ₹{favorite.property?.price?.toLocaleString()}
                                {favorite.property?.priceType === "rent" &&
                                  "/month"}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Added{" "}
                                {new Date(
                                  favorite.addedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Support Tickets</h2>
                <Button
                  onClick={createNewTicket}
                  className="bg-[#C70000] hover:bg-[#A60000]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>

              {tickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No support tickets
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Need help? Create a support ticket and we'll assist you
                    </p>
                    <Button
                      onClick={createNewTicket}
                      className="bg-[#C70000] hover:bg-[#A60000]"
                    >
                      Create Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card
                      key={ticket._id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent
                        className="p-4"
                        onClick={() => handleTicketClick(ticket._id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {ticket.subject}
                            </h3>
                            <p className="text-sm text-gray-600">
                              #{ticket.ticketNumber}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                ticket.status === "open"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ticket.status}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                ticket.priority === "high"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.priority === "medium"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {ticket.lastMessage}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>{ticket.messageCount} messages</span>
                          <span>
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
