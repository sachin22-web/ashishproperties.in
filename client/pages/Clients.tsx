import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  User,
  Edit,
  Trash2,
  Eye,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Home,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  FileText,
  Target,
  Activity,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: "buyer" | "seller";
  status: "active" | "inactive" | "potential" | "closed";
  source: "referral" | "website" | "social" | "advertisement" | "direct";
  assignedDate: string;
  lastContact: string;
  nextFollowup: string;
  budget: {
    min: number;
    max: number;
  };
  preferences: {
    propertyTypes: string[];
    locations: string[];
    bedrooms?: number;
    amenities: string[];
  };
  notes: string;
  interactions: Interaction[];
  deals: Deal[];
  rating: number;
}

interface Interaction {
  _id: string;
  type: "call" | "email" | "meeting" | "message" | "visit";
  date: string;
  description: string;
  outcome: "positive" | "neutral" | "negative";
  followupRequired: boolean;
  nextAction: string;
}

interface Deal {
  _id: string;
  propertyId: string;
  propertyTitle: string;
  type: "sale" | "rent";
  amount: number;
  commission: number;
  status: "negotiating" | "pending" | "closed" | "cancelled";
  startDate: string;
  expectedCloseDate: string;
  actualCloseDate?: string;
}

export default function Clients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "potential" | "closed"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "buyer" | "seller">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "name" | "lastContact" | "rating" | "deals"
  >("lastContact");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [showAddInteractionDialog, setShowAddInteractionDialog] =
    useState(false);

  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "buyer" as "buyer" | "seller",
    source: "direct" as
      | "referral"
      | "website"
      | "social"
      | "advertisement"
      | "direct",
    budget: { min: 0, max: 0 },
    notes: "",
  });

  const [newInteraction, setNewInteraction] = useState({
    type: "call" as "call" | "email" | "meeting" | "message" | "visit",
    description: "",
    outcome: "neutral" as "positive" | "neutral" | "negative",
    followupRequired: false,
    nextAction: "",
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    potential: 0,
    closed: 0,
    buyers: 0,
    sellers: 0,
    totalDeals: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.userType !== "agent") {
      navigate("/user-dashboard");
      return;
    }

    fetchClients();
  }, [user, navigate]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/agent/clients", token);
      if (response.data.success) {
        const clientsData = response.data.data as Client[];
        setClients(clientsData);
        calculateStats(clientsData);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clients: Client[]) => {
    const totalDeals = clients.reduce(
      (sum, client) => sum + client.deals.length,
      0,
    );
    const totalCommission = clients.reduce(
      (sum, client) =>
        sum +
        client.deals.reduce((dealSum, deal) => dealSum + deal.commission, 0),
      0,
    );

    setStats({
      total: clients.length,
      active: clients.filter((c) => c.status === "active").length,
      potential: clients.filter((c) => c.status === "potential").length,
      closed: clients.filter((c) => c.status === "closed").length,
      buyers: clients.filter((c) => c.userType === "buyer").length,
      sellers: clients.filter((c) => c.userType === "seller").length,
      totalDeals,
      totalCommission,
    });
  };

  const addClient = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post("/agent/clients", newClient, token);
      if (response.data.success) {
        fetchClients();
        setShowAddClientDialog(false);
        setNewClient({
          name: "",
          email: "",
          phone: "",
          userType: "buyer",
          source: "direct",
          budget: { min: 0, max: 0 },
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const updateClientStatus = async (clientId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put(`/agent/clients/${clientId}/status`, { status }, token);
      fetchClients();
    } catch (error) {
      console.error("Error updating client status:", error);
    }
  };

  const addInteraction = async () => {
    if (!selectedClient) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post(
        `/agent/clients/${selectedClient._id}/interactions`,
        newInteraction,
        token,
      );
      if (response.data.success) {
        fetchClients();
        setShowAddInteractionDialog(false);
        setNewInteraction({
          type: "call",
          description: "",
          outcome: "neutral",
          followupRequired: false,
          nextAction: "",
        });
      }
    } catch (error) {
      console.error("Error adding interaction:", error);
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/agent/clients/${clientId}`, token);
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const getFilteredClients = () => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((client) => client.userType === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "lastContact":
          return (
            new Date(b.lastContact).getTime() -
            new Date(a.lastContact).getTime()
          );
        case "rating":
          return b.rating - a.rating;
        case "deals":
          return b.deals.length - a.deals.length;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "potential":
        return <Badge className="bg-blue-100 text-blue-800">Potential</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      case "inactive":
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "visit":
        return <Home className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "positive":
        return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
      case "negative":
        return <Badge className="bg-red-100 text-red-800">Negative</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading clients...</p>
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
              <Users className="h-6 w-6" />
              <span>Client Management</span>
            </h1>
            <p className="text-gray-600">
              Manage your client relationships and track interactions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchClients} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddClientDialog(true)}
              className="bg-[#C70000] hover:bg-[#A60000]"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000]">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.potential}
              </div>
              <div className="text-sm text-gray-600">Potential</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {stats.closed}
              </div>
              <div className="text-sm text-gray-600">Closed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.buyers}
              </div>
              <div className="text-sm text-gray-600">Buyers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.sellers}
              </div>
              <div className="text-sm text-gray-600">Sellers</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats.totalDeals}
              </div>
              <div className="text-sm text-gray-600">Total Deals</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{(stats.totalCommission / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600">Commission</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="potential">Potential</option>
                <option value="closed">Closed</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Types</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="lastContact">Last Contact</option>
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="deals">Deals</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clients ({getFilteredClients().length})</CardTitle>
          </CardHeader>
          <CardContent>
            {getFilteredClients().length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {clients.length === 0
                    ? "No clients yet"
                    : "No clients match your filters"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {clients.length === 0
                    ? "Start building your client base by adding your first client"
                    : "Try adjusting your search criteria"}
                </p>
                {clients.length === 0 && (
                  <Button
                    onClick={() => setShowAddClientDialog(true)}
                    className="bg-[#C70000] hover:bg-[#A60000]"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredClients().map((client) => (
                      <TableRow key={client._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {client.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {client.userType.charAt(0).toUpperCase() +
                              client.userType.slice(1)}
                          </Badge>
                        </TableCell>

                        <TableCell>{getStatusBadge(client.status)}</TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">
                                {client.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            ₹{client.budget.min.toLocaleString()} - ₹
                            {client.budget.max.toLocaleString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{client.deals.length}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(client.lastContact).toLocaleDateString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{client.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowClientDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowAddInteractionDialog(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Interaction
                              </DropdownMenuItem>

                              <DropdownMenuItem>
                                <Phone className="h-4 w-4 mr-2" />
                                Call Client
                              </DropdownMenuItem>

                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => deleteClient(client._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Client Dialog */}
        <Dialog
          open={showAddClientDialog}
          onOpenChange={setShowAddClientDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Client Type</label>
                  <Select
                    value={newClient.userType}
                    onValueChange={(value: any) =>
                      setNewClient((prev) => ({ ...prev, userType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Min Budget</label>
                  <Input
                    type="number"
                    value={newClient.budget.min}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        budget: {
                          ...prev.budget,
                          min: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="Minimum budget"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Max Budget</label>
                  <Input
                    type="number"
                    value={newClient.budget.max}
                    onChange={(e) =>
                      setNewClient((prev) => ({
                        ...prev,
                        budget: {
                          ...prev.budget,
                          max: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="Maximum budget"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Source</label>
                <Select
                  value={newClient.source}
                  onValueChange={(value: any) =>
                    setNewClient((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newClient.notes}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any notes about the client..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addClient}
                  className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                >
                  Add Client
                </Button>
                <Button
                  onClick={() => setShowAddClientDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Client Details Dialog */}
        <Dialog open={showClientDetails} onOpenChange={setShowClientDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>

            {selectedClient && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                  <TabsTrigger value="deals">Deals</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Contact Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{selectedClient.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedClient.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Client Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <Badge variant="outline">
                            {selectedClient.userType}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          {getStatusBadge(selectedClient.status)}
                        </div>
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span>{selectedClient.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedClient.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          {selectedClient.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="interactions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Recent Interactions</h3>
                    <Button
                      onClick={() => setShowAddInteractionDialog(true)}
                      size="sm"
                      className="bg-[#C70000] hover:bg-[#A60000]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Interaction
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedClient.interactions?.map((interaction) => (
                      <Card key={interaction._id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getInteractionIcon(interaction.type)}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium capitalize">
                                    {interaction.type}
                                  </span>
                                  {getOutcomeBadge(interaction.outcome)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {interaction.description}
                                </p>
                                {interaction.nextAction && (
                                  <p className="text-sm text-blue-600 mt-1">
                                    Next: {interaction.nextAction}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(interaction.date).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="deals" className="space-y-4">
                  <h3 className="font-medium">Active Deals</h3>
                  {selectedClient.deals?.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No deals yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedClient.deals?.map((deal) => (
                        <Card key={deal._id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {deal.propertyTitle}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {deal.type}
                                </p>
                                <p className="text-lg font-bold text-[#C70000]">
                                  ₹{deal.amount.toLocaleString()}
                                </p>
                              </div>
                              <Badge>{deal.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Budget Range</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-[#C70000]">
                        ₹{selectedClient.budget.min.toLocaleString()} - ₹
                        {selectedClient.budget.max.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Preferred Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.preferences?.locations?.map(
                          (location, index) => (
                            <Badge key={index} variant="outline">
                              {location}
                            </Badge>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Interaction Dialog */}
        <Dialog
          open={showAddInteractionDialog}
          onOpenChange={setShowAddInteractionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Interaction</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Interaction Type</label>
                <Select
                  value={newInteraction.type}
                  onValueChange={(value: any) =>
                    setNewInteraction((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="visit">Property Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newInteraction.description}
                  onChange={(e) =>
                    setNewInteraction((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe the interaction..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Outcome</label>
                <Select
                  value={newInteraction.outcome}
                  onValueChange={(value: any) =>
                    setNewInteraction((prev) => ({ ...prev, outcome: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Next Action</label>
                <Input
                  value={newInteraction.nextAction}
                  onChange={(e) =>
                    setNewInteraction((prev) => ({
                      ...prev,
                      nextAction: e.target.value,
                    }))
                  }
                  placeholder="What's the next step?"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addInteraction}
                  className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                >
                  Add Interaction
                </Button>
                <Button
                  onClick={() => setShowAddInteractionDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation />
    </div>
  );
}
