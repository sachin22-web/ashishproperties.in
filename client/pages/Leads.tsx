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
  Target,
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
  Activity,
  Users,
  Zap,
  Award,
  Progress,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import BottomNavigation from "../components/BottomNavigation";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source:
    | "website"
    | "referral"
    | "social"
    | "advertisement"
    | "coldcall"
    | "event";
  status:
    | "new"
    | "contacted"
    | "qualified"
    | "proposal"
    | "negotiation"
    | "closed"
    | "lost";
  score: number; // 1-100
  assignedDate: string;
  lastContact: string;
  nextFollowup: string;
  propertyInterest: {
    type: "buy" | "sell" | "rent";
    priceRange: { min: number; max: number };
    locations: string[];
    propertyTypes: string[];
    bedrooms?: number;
    urgency: "low" | "medium" | "high";
  };
  notes: string;
  interactions: LeadInteraction[];
  convertedToClient: boolean;
  conversionDate?: string;
  estimatedValue: number;
  probability: number; // 0-100
}

interface LeadInteraction {
  _id: string;
  type: "call" | "email" | "meeting" | "message" | "visit";
  date: string;
  description: string;
  outcome: "positive" | "neutral" | "negative";
  nextAction: string;
  scoreChange: number;
}

interface LeadSource {
  source: string;
  count: number;
  conversionRate: number;
  avgValue: number;
}

export default function Leads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "score" | "lastContact" | "nextFollowup" | "probability"
  >("score");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [showAddInteractionDialog, setShowAddInteractionDialog] =
    useState(false);

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "website" as Lead["source"],
    propertyInterest: {
      type: "buy" as "buy" | "sell" | "rent",
      priceRange: { min: 0, max: 0 },
      locations: [] as string[],
      urgency: "medium" as "low" | "medium" | "high",
    },
    notes: "",
  });

  const [newInteraction, setNewInteraction] = useState({
    type: "call" as LeadInteraction["type"],
    description: "",
    outcome: "neutral" as LeadInteraction["outcome"],
    nextAction: "",
    scoreChange: 0,
  });

  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    hotLeads: 0,
    converted: 0,
    avgScore: 0,
    conversionRate: 0,
    totalValue: 0,
    thisWeekContacts: 0,
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

    fetchLeads();
    fetchLeadSources();
  }, [user, navigate]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/agent/leads", token);
      if (response.data.success) {
        const leadsData = response.data.data as Lead[];
        setLeads(leadsData);
        calculateStats(leadsData);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.get("/agent/lead-sources", token);
      if (response.data.success) {
        setLeadSources(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching lead sources:", error);
    }
  };

  const calculateStats = (leads: Lead[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newLeads = leads.filter((l) => l.status === "new").length;
    const hotLeads = leads.filter((l) => l.score >= 80).length;
    const converted = leads.filter((l) => l.convertedToClient).length;
    const avgScore =
      leads.length > 0
        ? leads.reduce((sum, l) => sum + l.score, 0) / leads.length
        : 0;
    const conversionRate =
      leads.length > 0 ? (converted / leads.length) * 100 : 0;
    const totalValue = leads.reduce((sum, l) => sum + l.estimatedValue, 0);
    const thisWeekContacts = leads.filter(
      (l) => new Date(l.lastContact) >= weekAgo,
    ).length;

    setStats({
      totalLeads: leads.length,
      newLeads,
      hotLeads,
      converted,
      avgScore: Math.round(avgScore),
      conversionRate: Math.round(conversionRate),
      totalValue,
      thisWeekContacts,
    });
  };

  const addLead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post("/agent/leads", newLead, token);
      if (response.data.success) {
        fetchLeads();
        setShowAddLeadDialog(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          source: "website",
          propertyInterest: {
            type: "buy",
            priceRange: { min: 0, max: 0 },
            locations: [],
            urgency: "medium",
          },
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding lead:", error);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put(`/agent/leads/${leadId}/status`, { status }, token);
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
    }
  };

  const updateLeadScore = async (leadId: string, scoreChange: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.put(`/agent/leads/${leadId}/score`, { scoreChange }, token);
      fetchLeads();
    } catch (error) {
      console.error("Error updating lead score:", error);
    }
  };

  const convertToClient = async (leadId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.post(`/agent/leads/${leadId}/convert`, {}, token);
      fetchLeads();
    } catch (error) {
      console.error("Error converting lead to client:", error);
    }
  };

  const addInteraction = async () => {
    if (!selectedLead) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await api.post(
        `/agent/leads/${selectedLead._id}/interactions`,
        newInteraction,
        token,
      );
      if (response.data.success) {
        fetchLeads();
        setShowAddInteractionDialog(false);
        setNewInteraction({
          type: "call",
          description: "",
          outcome: "neutral",
          nextAction: "",
          scoreChange: 0,
        });
      }
    } catch (error) {
      console.error("Error adding interaction:", error);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await api.delete(`/agent/leads/${leadId}`, token);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const getFilteredLeads = () => {
    let filtered = leads;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    // Apply score filter
    switch (scoreFilter) {
      case "hot":
        filtered = filtered.filter((lead) => lead.score >= 80);
        break;
      case "warm":
        filtered = filtered.filter(
          (lead) => lead.score >= 50 && lead.score < 80,
        );
        break;
      case "cold":
        filtered = filtered.filter((lead) => lead.score < 50);
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.score - a.score;
        case "lastContact":
          return (
            new Date(b.lastContact).getTime() -
            new Date(a.lastContact).getTime()
          );
        case "nextFollowup":
          return (
            new Date(a.nextFollowup).getTime() -
            new Date(b.nextFollowup).getTime()
          );
        case "probability":
          return b.probability - a.probability;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: "bg-blue-100 text-blue-800", label: "New" },
      contacted: { color: "bg-yellow-100 text-yellow-800", label: "Contacted" },
      qualified: { color: "bg-purple-100 text-purple-800", label: "Qualified" },
      proposal: { color: "bg-orange-100 text-orange-800", label: "Proposal" },
      negotiation: {
        color: "bg-indigo-100 text-indigo-800",
        label: "Negotiation",
      },
      closed: { color: "bg-green-100 text-green-800", label: "Closed" },
      lost: { color: "bg-red-100 text-red-800", label: "Lost" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-red-100 text-red-800">🔥 Hot</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-orange-100 text-orange-800">🌟 Warm</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">❄️ Cold</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      high: { color: "bg-red-100 text-red-800", label: "High" },
      medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
      low: { color: "bg-green-100 text-green-800", label: "Low" },
    };

    const config =
      urgencyConfig[urgency as keyof typeof urgencyConfig] ||
      urgencyConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
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

  const getScoreChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="h-3 w-3 text-green-600" />;
    } else if (change < 0) {
      return <ArrowDown className="h-3 w-3 text-red-600" />;
    } else {
      return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
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
              <Target className="h-6 w-6" />
              <span>Lead Management</span>
            </h1>
            <p className="text-gray-600">
              Track and nurture your potential clients
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchLeads} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddLeadDialog(true)}
              className="bg-[#C70000] hover:bg-[#A60000]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#C70000]">
                {stats.totalLeads}
              </div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.newLeads}
              </div>
              <div className="text-sm text-gray-600">New</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.hotLeads}
              </div>
              <div className="text-sm text-gray-600">Hot Leads</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.converted}
              </div>
              <div className="text-sm text-gray-600">Converted</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.avgScore}
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.conversionRate}%
              </div>
              <div className="text-sm text-gray-600">Conversion</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                ��{(stats.totalValue / 100000).toFixed(1)}L
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">
                {stats.thisWeekContacts}
              </div>
              <div className="text-sm text-gray-600">This Week</div>
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
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="advertisement">Advertisement</option>
                <option value="coldcall">Cold Call</option>
                <option value="event">Event</option>
              </select>

              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="all">All Scores</option>
                <option value="hot">Hot (80+)</option>
                <option value="warm">Warm (50-79)</option>
                <option value="cold">Cold (&lt;50)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              >
                <option value="score">Score</option>
                <option value="lastContact">Last Contact</option>
                <option value="nextFollowup">Next Followup</option>
                <option value="probability">Probability</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads ({getFilteredLeads().length})</CardTitle>
              </CardHeader>
              <CardContent>
                {getFilteredLeads().length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {leads.length === 0
                        ? "No leads yet"
                        : "No leads match your filters"}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {leads.length === 0
                        ? "Start building your lead pipeline"
                        : "Try adjusting your search criteria"}
                    </p>
                    {leads.length === 0 && (
                      <Button
                        onClick={() => setShowAddLeadDialog(true)}
                        className="bg-[#C70000] hover:bg-[#A60000]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Lead
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Last Contact</TableHead>
                          <TableHead>Next Followup</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredLeads().map((lead) => (
                          <TableRow key={lead._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {lead.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {lead.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {lead.email}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {lead.phone}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="text-lg font-bold">
                                  {lead.score}
                                </div>
                                {getScoreBadge(lead.score)}
                              </div>
                            </TableCell>

                            <TableCell>{getStatusBadge(lead.status)}</TableCell>

                            <TableCell>
                              <div className="space-y-1">
                                <Badge variant="outline">
                                  {lead.propertyInterest.type.toUpperCase()}
                                </Badge>
                                {getUrgencyBadge(lead.propertyInterest.urgency)}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm">
                                ₹
                                {lead.propertyInterest.priceRange.min.toLocaleString()}{" "}
                                - ₹
                                {lead.propertyInterest.priceRange.max.toLocaleString()}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  lead.lastContact,
                                ).toLocaleDateString()}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm text-gray-500">
                                {new Date(
                                  lead.nextFollowup,
                                ).toLocaleDateString()}
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
                                      setSelectedLead(lead);
                                      setShowLeadDetails(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setShowAddInteractionDialog(true);
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Add Interaction
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Lead
                                  </DropdownMenuItem>

                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Email
                                  </DropdownMenuItem>

                                  {!lead.convertedToClient && (
                                    <DropdownMenuItem
                                      onClick={() => convertToClient(lead._id)}
                                    >
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Convert to Client
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuItem
                                    onClick={() => deleteLead(lead._id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Lead
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
          </TabsContent>

          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Lead Sources Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {leadSources.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      No lead source data available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leadSources.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium capitalize">
                            {source.source}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{source.count} leads</span>
                            <span>
                              {source.conversionRate.toFixed(1)}% conversion
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#C70000]">
                            ₹{source.avgValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Avg Value</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    Pipeline Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>New</span>
                      <Badge>
                        {leads.filter((l) => l.status === "new").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Qualified</span>
                      <Badge>
                        {leads.filter((l) => l.status === "qualified").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Proposal</span>
                      <Badge>
                        {leads.filter((l) => l.status === "proposal").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Negotiation</span>
                      <Badge>
                        {leads.filter((l) => l.status === "negotiation").length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Closed</span>
                      <Badge className="bg-green-100 text-green-800">
                        {leads.filter((l) => l.status === "closed").length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-[#C70000]">
                        {
                          leads.filter(
                            (l) =>
                              new Date(l.assignedDate).getMonth() ===
                              new Date().getMonth(),
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-500">New Leads</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {
                          leads.filter(
                            (l) =>
                              l.convertedToClient &&
                              l.conversionDate &&
                              new Date(l.conversionDate).getMonth() ===
                                new Date().getMonth(),
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-500">Conversions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.avgScore}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg Lead Score
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.conversionRate}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Conversion Rate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Lead Dialog */}
        <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={newLead.name}
                    onChange={(e) =>
                      setNewLead((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) =>
                      setNewLead((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) =>
                      setNewLead((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Source</label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value: any) =>
                      setNewLead((prev) => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="advertisement">
                        Advertisement
                      </SelectItem>
                      <SelectItem value="coldcall">Cold Call</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Interest Type</label>
                  <Select
                    value={newLead.propertyInterest.type}
                    onValueChange={(value: any) =>
                      setNewLead((prev) => ({
                        ...prev,
                        propertyInterest: {
                          ...prev.propertyInterest,
                          type: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Urgency</label>
                  <Select
                    value={newLead.propertyInterest.urgency}
                    onValueChange={(value: any) =>
                      setNewLead((prev) => ({
                        ...prev,
                        propertyInterest: {
                          ...prev.propertyInterest,
                          urgency: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Min Budget</label>
                  <Input
                    type="number"
                    value={newLead.propertyInterest.priceRange.min}
                    onChange={(e) =>
                      setNewLead((prev) => ({
                        ...prev,
                        propertyInterest: {
                          ...prev.propertyInterest,
                          priceRange: {
                            ...prev.propertyInterest.priceRange,
                            min: parseInt(e.target.value) || 0,
                          },
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
                    value={newLead.propertyInterest.priceRange.max}
                    onChange={(e) =>
                      setNewLead((prev) => ({
                        ...prev,
                        propertyInterest: {
                          ...prev.propertyInterest,
                          priceRange: {
                            ...prev.propertyInterest.priceRange,
                            max: parseInt(e.target.value) || 0,
                          },
                        },
                      }))
                    }
                    placeholder="Maximum budget"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newLead.notes}
                  onChange={(e) =>
                    setNewLead((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any notes about the lead..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addLead}
                  className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                >
                  Add Lead
                </Button>
                <Button
                  onClick={() => setShowAddLeadDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lead Details Dialog */}
        <Dialog open={showLeadDetails} onOpenChange={setShowLeadDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>

            {selectedLead && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                  <TabsTrigger value="scoring">Scoring</TabsTrigger>
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
                          <span>{selectedLead.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedLead.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedLead.phone}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Lead Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          {getStatusBadge(selectedLead.status)}
                        </div>
                        <div className="flex justify-between">
                          <span>Score:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">
                              {selectedLead.score}
                            </span>
                            {getScoreBadge(selectedLead.score)}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Source:</span>
                          <Badge variant="outline">{selectedLead.source}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Property Interest
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">
                          {selectedLead.propertyInterest.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Budget:</span>
                        <span>
                          ₹
                          {selectedLead.propertyInterest.priceRange.min.toLocaleString()}{" "}
                          - ₹
                          {selectedLead.propertyInterest.priceRange.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Urgency:</span>
                        {getUrgencyBadge(selectedLead.propertyInterest.urgency)}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedLead.notes && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          {selectedLead.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="interactions" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Interaction History</h3>
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
                    {selectedLead.interactions?.map((interaction) => (
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
                                  <Badge
                                    className={
                                      interaction.outcome === "positive"
                                        ? "bg-green-100 text-green-800"
                                        : interaction.outcome === "negative"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
                                    }
                                  >
                                    {interaction.outcome}
                                  </Badge>
                                  {interaction.scoreChange !== 0 && (
                                    <div className="flex items-center space-x-1">
                                      {getScoreChangeIcon(
                                        interaction.scoreChange,
                                      )}
                                      <span className="text-sm">
                                        {Math.abs(interaction.scoreChange)}
                                      </span>
                                    </div>
                                  )}
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

                <TabsContent value="scoring" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Lead Scoring</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Current Score:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold">
                              {selectedLead.score}
                            </span>
                            {getScoreBadge(selectedLead.score)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Probability:</span>
                          <span className="font-bold">
                            {selectedLead.probability}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Estimated Value:</span>
                          <span className="font-bold text-[#C70000]">
                            ₹{selectedLead.estimatedValue.toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Adjust Score</h4>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() =>
                                updateLeadScore(selectedLead._id, 10)
                              }
                              size="sm"
                              variant="outline"
                            >
                              +10
                            </Button>
                            <Button
                              onClick={() =>
                                updateLeadScore(selectedLead._id, 5)
                              }
                              size="sm"
                              variant="outline"
                            >
                              +5
                            </Button>
                            <Button
                              onClick={() =>
                                updateLeadScore(selectedLead._id, -5)
                              }
                              size="sm"
                              variant="outline"
                            >
                              -5
                            </Button>
                            <Button
                              onClick={() =>
                                updateLeadScore(selectedLead._id, -10)
                              }
                              size="sm"
                              variant="outline"
                            >
                              -10
                            </Button>
                          </div>
                        </div>
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
                <label className="text-sm font-medium">Score Change</label>
                <Input
                  type="number"
                  value={newInteraction.scoreChange}
                  onChange={(e) =>
                    setNewInteraction((prev) => ({
                      ...prev,
                      scoreChange: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Score change (-20 to +20)"
                  min="-20"
                  max="20"
                />
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
