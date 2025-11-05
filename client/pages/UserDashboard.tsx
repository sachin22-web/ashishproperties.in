import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Property } from "@shared/types";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Plus, Home, Eye, MessageSquare, Heart, Phone, User, Settings, LogOut, Bell, Clock, CheckCircle } from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    premiumListings: 0,
    premiumPending: 0,
    premiumApproved: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/user-login");
        return;
      }

      // Fetch both properties and notifications
      const [propertiesRes, notificationsRes] = await Promise.all([
        api.get("/user/properties", token),
        api.get("/user/notifications", token)
      ]);

      // Handle properties
      if (propertiesRes.data.success) {
        const userProperties = propertiesRes.data.data as Property[];
        setProperties(userProperties);

        // Handle notifications
        if (notificationsRes.data.success) {
          setNotifications(notificationsRes.data.data || []);
        }

        // Calculate stats
        const totalViews = userProperties.reduce((sum, prop) => sum + prop.views, 0);
        const totalInquiries = userProperties.reduce((sum, prop) => sum + prop.inquiries, 0);
        const unreadNotifications = (notificationsRes.data.data || []).filter((n: Notification) => !n.isRead).length;

        setStats({
          totalProperties: userProperties.length,
          pendingApproval: userProperties.filter(p => p.approvalStatus === "pending").length,
          approved: userProperties.filter(p => p.approvalStatus === "approved").length,
          rejected: userProperties.filter(p => p.approvalStatus === "rejected").length,
          premiumListings: userProperties.filter(p => p.premium).length,
          premiumPending: userProperties.filter(p => p.premium && p.premiumApprovalStatus === "pending").length,
          premiumApproved: userProperties.filter(p => p.premium && p.premiumApprovalStatus === "approved").length,
          totalViews,
          totalInquiries,
          unreadNotifications,
        });
      }
    } catch (error: any) {
      console.error("Error fetching user properties:", error);

      // Handle token expiration/invalid token
      if (error.message.includes("401") || error.message.includes("403") || error.message.includes("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/user-login");
        return;
      }

      // Show user-friendly error message
      alert("Failed to load your properties. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(`/user/notifications/${notificationId}/read`, {}, token);
      setNotifications(notifications.map(n =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      // Update stats
      setStats(prev => ({ ...prev, unreadNotifications: prev.unreadNotifications - 1 }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/user/notifications/${notificationId}`, token);
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(n => n._id !== notificationId));
      // Update stats if deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setStats(prev => ({ ...prev, unreadNotifications: prev.unreadNotifications - 1 }));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'property':
        return <Home className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPremiumBadge = (property: Property) => {
    if (!property.premium) return null;

    switch (property.premiumApprovalStatus) {
      case "pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium Active
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Premium
          </Badge>
        );
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <div className="container mx-auto px-4 py-8 pb-20">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-gray-600">Manage your properties and track your listings</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('notifications')}
                className="relative"
              >
                <Bell className="h-4 w-4" />
                {stats.unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </Button>
            </div>

            <Button asChild className="bg-[#C70000] hover:bg-[#A50000] text-white">
              <Link to="/post-property">
                <Plus className="h-4 w-4 mr-2" />
                Post New Property
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Basic Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000] mb-1">{stats.totalProperties}</div>
              <div className="text-sm text-gray-600">Total Properties</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pendingApproval}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.totalViews}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalInquiries}</div>
              <div className="text-sm text-gray-600">Inquiries</div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 ${
              activeTab === 'notifications' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <CardContent className="p-4 text-center">
              <div className="relative">
                <div className="text-2xl font-bold text-blue-600 mb-1">{notifications.length}</div>
                <div className="text-sm text-gray-600">Notifications</div>
                {stats.unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Listings Section */}
        {stats.premiumListings > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium Listings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.premiumListings}</div>
                  <div className="text-sm text-gray-600">Total Premium</div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{stats.premiumPending}</div>
                  <div className="text-sm text-gray-600">Pending Approval</div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats.premiumApproved}</div>
                  <div className="text-sm text-gray-600">Approved</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeTab === 'notifications' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
                {stats.unreadNotifications > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {stats.unreadNotifications} unread
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-gray-400 text-sm">We'll notify you about important updates</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`border rounded-lg p-4 ${
                        notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markNotificationAsRead(notification._id)}
                              className="text-xs"
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteNotification(notification._id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* My Properties Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              My Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties yet</h3>
                <p className="text-gray-600 mb-6">Start by posting your first property</p>
                <Button asChild className="bg-[#C70000] hover:bg-[#A50000]">
                  <Link to="/post-property">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Property
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Property Image */}
                      <div className="w-full lg:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {property.images && property.images.length > 0 ? (
                          <img
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

                      {/* Property Details */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{property.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(property.approvalStatus || "pending")}
                            {getPremiumBadge(property)}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-2 line-clamp-2">{property.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="font-semibold text-[#C70000] text-lg">
                            ₹{property.price.toLocaleString()} {property.priceType === "rent" ? "/month" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {property.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {property.inquiries} inquiries
                          </span>
                          <span>{property.location.address}</span>
                        </div>

                        {/* Rejection Reason */}
                        {property.approvalStatus === "rejected" && property.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-red-800">
                              <strong>Rejection Reason:</strong> {property.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Admin Comments */}
                        {property.adminComments && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-blue-800">
                              <strong>Admin Note:</strong> {property.adminComments}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Posted {new Date(property.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/my-account')}
          >
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-[#C70000] mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Profile</h3>
              <p className="text-sm text-gray-600">Manage your account</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/favorites')}
          >
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-[#C70000] mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Favorites</h3>
              <p className="text-sm text-gray-600">Saved properties</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-[#C70000] mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Messages</h3>
              <p className="text-sm text-gray-600">Chat with buyers</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 text-[#C70000] mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Settings</h3>
              <p className="text-sm text-gray-600">Account preferences</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default UserDashboard;
