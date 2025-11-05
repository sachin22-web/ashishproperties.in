import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FAQManagement() {
  const { token } = useAuth();
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);
  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
    category: "",
    featured: false,
  });

  useEffect(() => {
    fetchFAQs();
  }, [token]);

  const fetchFAQs = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/faqs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFAQs(data.data.faqs);
          setCategories(data.data.categories);
        } else {
          setError(data.error || "Failed to fetch FAQs");
        }
      } else {
        setError("Failed to fetch FAQs");
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setError("Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  const createFAQ = async () => {
    if (!token || !newFAQ.question || !newFAQ.answer || !newFAQ.category) return;

    try {
      const response = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFAQ),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchFAQs(); // Refresh the list
          setNewFAQ({ question: "", answer: "", category: "", featured: false });
          setIsCreateDialogOpen(false);
        } else {
          setError(data.error || "Failed to create FAQ");
        }
      } else {
        setError("Failed to create FAQ");
      }
    } catch (error) {
      console.error("Error creating FAQ:", error);
      setError("Failed to create FAQ");
    }
  };

  const updateFAQStatus = async (faqId: string, updates: Partial<FAQ>) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setFAQs(faqs.map(f => 
          f._id === faqId ? { ...f, ...updates } : f
        ));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update FAQ");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      setError("Failed to update FAQ");
    }
  };

  const deleteFAQ = async (faqId: string) => {
    if (!token || !confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const response = await fetch(`/api/admin/faqs/${faqId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setFAQs(faqs.filter(f => f._id !== faqId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete FAQ");
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setError("Failed to delete FAQ");
    }
  };

  const toggleFAQExpansion = (faqId: string) => {
    setExpandedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading FAQs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchFAQs();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">FAQ Management</h3>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New FAQ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <Input
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Answer</label>
                <Textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={newFAQ.category} onValueChange={(value) => setNewFAQ({ ...newFAQ, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Listing">Listing</SelectItem>
                    <SelectItem value="Pricing">Pricing</SelectItem>
                    <SelectItem value="Communication">Communication</SelectItem>
                    <SelectItem value="Privacy">Privacy</SelectItem>
                    <SelectItem value="Verification">Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={newFAQ.featured}
                  onChange={(e) => setNewFAQ({ ...newFAQ, featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-sm">Featured FAQ</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFAQ} className="bg-[#C70000] hover:bg-[#A60000]">
                  Create FAQ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs.length}</div>
            <p className="text-xs text-muted-foreground">All questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqs.filter(f => f.active).length}
            </div>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {faqs.filter(f => f.featured).length}
            </div>
            <p className="text-xs text-muted-foreground">Highlighted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Different topics</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* FAQs List */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq._id}>
            <CardContent className="p-6">
              <Collapsible>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CollapsibleTrigger
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => toggleFAQExpansion(faq._id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {faq.question}
                          </h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {faq.category}
                            </Badge>
                            {faq.featured && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Featured
                              </Badge>
                            )}
                            <Badge
                              variant={faq.active ? "default" : "secondary"}
                              className={`text-xs ${
                                faq.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {faq.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {expandedFAQs.includes(faq._id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </CollapsibleTrigger>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateFAQStatus(faq._id, { featured: !faq.featured })}
                      className="text-purple-600"
                    >
                      {faq.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateFAQStatus(faq._id, { active: !faq.active })}
                      className={faq.active ? "text-red-600" : "text-green-600"}
                    >
                      {faq.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFAQ(faq._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent className="mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
        {filteredFAQs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No FAQs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
