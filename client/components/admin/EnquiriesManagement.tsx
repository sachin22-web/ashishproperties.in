import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, Phone, Mail, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

interface Enquiry {
  _id: string;
  propertyId: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
  property?: {
    title: string;
    propertyType: string;
    location: { city: string; state: string };
    price: number;
  };
}

export default function EnquiriesManagement() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEnquiries, setTotalEnquiries] = useState(0);

  useEffect(() => {
    fetchEnquiries();
  }, [currentPage, statusFilter]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      
      let url = `/api/admin/enquiries?page=${currentPage}&limit=20`;
      if (statusFilter && statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnquiries(data.data || []);
          setTotalPages(data.pagination?.pages || 1);
          setTotalEnquiries(data.pagination?.total || 0);
        }
      } else {
        toast.error("Failed to fetch enquiries");
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast.error("Error loading enquiries");
    } finally {
      setLoading(false);
    }
  };

  const updateEnquiryStatus = async (enquiryId: string, newStatus: "new" | "contacted" | "closed") => {
    try {
      const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
      
      const response = await fetch(`/api/admin/enquiries/${enquiryId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        fetchEnquiries();
        if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    const matchesSearch =
      searchQuery === "" ||
      enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enquiry.phone.includes(searchQuery) ||
      (enquiry.email && enquiry.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (enquiry.property?.title && enquiry.property.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">New</span>;
      case "contacted":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Contacted</span>;
      case "closed":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enquiries Management</h1>
        <p className="text-gray-600">Manage and track all property enquiries</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, phone, email, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>Total: {totalEnquiries} enquiries</span>
          <span>
            Showing {filteredEnquiries.length} of {enquiries.length} on this page
          </span>
        </div>
      </div>

      {/* Enquiries Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-gray-600">No enquiries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{enquiry.name}</p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {enquiry.phone}
                        </p>
                        {enquiry.email && (
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {enquiry.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {enquiry.property?.title || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {enquiry.property?.location?.city}, {enquiry.property?.location?.state}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(enquiry.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(enquiry.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEnquiry(enquiry);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {enquiry.status !== "contacted" && (
                          <button
                            onClick={() => updateEnquiryStatus(enquiry._id, "contacted")}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Mark as Contacted"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        {enquiry.status !== "closed" && (
                          <button
                            onClick={() => updateEnquiryStatus(enquiry._id, "closed")}
                            className="text-green-600 hover:text-green-800"
                            title="Mark as Closed"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enquiry Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span> {selectedEnquiry.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-blue-600 hover:underline">
                      {selectedEnquiry.phone}
                    </a>
                  </p>
                  {selectedEnquiry.email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      <a href={`mailto:${selectedEnquiry.email}`} className="text-blue-600 hover:underline">
                        {selectedEnquiry.email}
                      </a>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {getStatusBadge(selectedEnquiry.status)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {formatDate(selectedEnquiry.createdAt)}
                  </p>
                </div>
              </div>

              {selectedEnquiry.property && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Property Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">{selectedEnquiry.property.title}</p>
                    <p className="text-sm text-gray-600">
                      {selectedEnquiry.property.location.city}, {selectedEnquiry.property.location.state}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Price:</span> ₹{selectedEnquiry.property.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Message</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedEnquiry.message}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Update Status</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      updateEnquiryStatus(selectedEnquiry._id, "new");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Mark as New
                  </button>
                  <button
                    onClick={() => {
                      updateEnquiryStatus(selectedEnquiry._id, "contacted");
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Mark as Contacted
                  </button>
                  <button
                    onClick={() => {
                      updateEnquiryStatus(selectedEnquiry._id, "closed");
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Closed
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
