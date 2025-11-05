import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Star,
  Check,
  X,
  Eye,
  Search,
  Filter,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface Testimonial {
  _id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  propertyId?: string;
  sellerId?: string;
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TestimonialManagement() {
  const { token } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, [token]);

  const fetchTestimonials = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/testimonials", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestimonials(data.data.testimonials);
        } else {
          setError(data.error || "Failed to fetch testimonials");
        }
      } else {
        setError("Failed to fetch testimonials");
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setError("Failed to fetch testimonials");
    } finally {
      setLoading(false);
    }
  };

  const updateTestimonialStatus = async (
    testimonialId: string,
    status: string,
    featured?: boolean,
  ) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, featured }),
      });

      if (response.ok) {
        setTestimonials(
          testimonials.map((t) =>
            t._id === testimonialId
              ? {
                  ...t,
                  status: status as any,
                  featured: featured ?? t.featured,
                }
              : t,
          ),
        );
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update testimonial");
      }
    } catch (error) {
      console.error("Error updating testimonial:", error);
      setError("Failed to update testimonial");
    }
  };

  const deleteTestimonial = async (testimonialId: string) => {
    if (!token || !confirm("Are you sure you want to delete this testimonial?"))
      return;

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTestimonials(testimonials.filter((t) => t._id !== testimonialId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      setError("Failed to delete testimonial");
    }
  };

  const filteredTestimonials = testimonials.filter((testimonial) => {
    const q = (searchTerm || "").toLowerCase().trim();

    const name = (testimonial.name || "").toString();
    const comment = (testimonial.comment || "").toString();

    const matchesSearch =
      q === "" ||
      name.toLowerCase().includes(q) ||
      comment.toLowerCase().includes(q) ||
      (testimonial.email || "").toString().toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === "all" || testimonial.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading testimonials...</p>
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
              fetchTestimonials();
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
          <h3 className="text-2xl font-bold text-gray-900">
            Testimonial Management
          </h3>
          <p className="text-gray-600">
            Manage customer testimonials and reviews
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Testimonials
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonials.length}</div>
            <p className="text-xs text-muted-foreground">All testimonials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testimonials.filter((t) => t.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testimonials.filter((t) => t.status === "approved").length}
            </div>
            <p className="text-xs text-muted-foreground">Live testimonials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testimonials.filter((t) => t.featured).length}
            </div>
            <p className="text-xs text-muted-foreground">Featured reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search testimonials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Testimonials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTestimonials.map((testimonial) => (
                <TableRow key={testimonial._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">
                        {testimonial.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(testimonial.rating)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {testimonial.comment.length > 50
                        ? `${testimonial.comment.substring(0, 50)}...`
                        : testimonial.comment}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        testimonial.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : testimonial.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {testimonial.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {testimonial.featured && (
                      <Badge className="bg-purple-100 text-purple-800">
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(testimonial.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTestimonial(testimonial)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Testimonial Details</DialogTitle>
                          </DialogHeader>
                          {selectedTestimonial && (
                            <div className="space-y-4">
                              <div>
                                <label className="font-semibold">
                                  Customer:
                                </label>
                                <p>{selectedTestimonial.name}</p>
                              </div>
                              <div>
                                <label className="font-semibold">Rating:</label>
                                <div className="mt-1">
                                  {renderStars(selectedTestimonial.rating)}
                                </div>
                              </div>
                              <div>
                                <label className="font-semibold">
                                  Comment:
                                </label>
                                <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                                  {selectedTestimonial.comment}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    updateTestimonialStatus(
                                      selectedTestimonial._id,
                                      "approved",
                                    );
                                    setSelectedTestimonial(null);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => {
                                    updateTestimonialStatus(
                                      selectedTestimonial._id,
                                      "rejected",
                                    );
                                    setSelectedTestimonial(null);
                                  }}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-purple-600"
                                  onClick={() => {
                                    updateTestimonialStatus(
                                      selectedTestimonial._id,
                                      selectedTestimonial.status,
                                      !selectedTestimonial.featured,
                                    );
                                    setSelectedTestimonial(null);
                                  }}
                                >
                                  {selectedTestimonial.featured
                                    ? "Unfeature"
                                    : "Feature"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {testimonial.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() =>
                              updateTestimonialStatus(
                                testimonial._id,
                                "approved",
                              )
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() =>
                              updateTestimonialStatus(
                                testimonial._id,
                                "rejected",
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTestimonials.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    No testimonials found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
