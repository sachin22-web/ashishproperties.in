import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  DollarSign,
  Users,
  AlertTriangle,
  Download,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
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

interface ManualPaymentTransaction {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  packageId: string;
  packageName: string;
  propertyId?: string;
  propertyTitle?: string;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "cash";
  paymentDetails: {
    upiId?: string;
    transactionId?: string;
    bankAccount?: string;
    reference?: string;
    screenshot?: string;
  };
  status: "pending" | "approved" | "rejected" | "processing";
  adminNotes?: string;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export default function ManualPaymentApproval() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<ManualPaymentTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<ManualPaymentTransaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      console.log("🔍 Fetching manual payment transactions...");

      const response = await fetch(
        "/api/admin/transactions?status=pending,processing",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const responseText = await response.text();
      console.log("📄 Manual payment response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response:", parseError);
        setError("Invalid response format");
        return;
      }

      if (response.ok && data.success) {
        const transactions = data.data?.transactions || data.data || [];
        console.log("✅ Fetched transactions:", transactions.length);
        setTransactions(transactions);
      } else {
        console.error("❌ API Error:", data.error);
        setError(data.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (
    transactionId: string,
    action: "approve" | "reject",
  ) => {
    if (!token) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from pending list
          setTransactions((prev) =>
            prev.filter((t) => t._id !== transactionId),
          );
          setSelectedTransaction(null);
          setAdminNotes("");

          // Show success message
          alert(
            `Transaction ${action === "approve" ? "approved" : "rejected"} successfully!`,
          );
        } else {
          setError(data.error || `Failed to ${action} transaction`);
        }
      } else {
        setError(`Failed to ${action} transaction`);
      }
    } catch (error) {
      console.error(`Error ${action}ing transaction:`, error);
      setError(`Failed to ${action} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
      },
      processing: {
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-800",
      },
      approved: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      rejected: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "upi":
        return <Phone className="h-4 w-4" />;
      case "bank_transfer":
        return <Building2 className="h-4 w-4" />;
      case "cash":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      (transaction.userName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (transaction.userEmail?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (transaction.packageName?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (transaction.paymentDetails?.transactionId?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );

    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;
    const matchesMethod =
      selectedMethod === "all" || transaction.paymentMethod === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const stats = {
    totalPending: transactions.filter((t) => t.status === "pending").length,
    totalProcessing: transactions.filter((t) => t.status === "processing")
      .length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    avgAmount: transactions.length
      ? Math.round(
          transactions.reduce((sum, t) => sum + t.amount, 0) /
            transactions.length,
        )
      : 0,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading payment transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchTransactions();
            }}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Manual Payment Approval
          </h3>
          <p className="text-gray-600">
            Review and approve manual payment transactions
          </p>
        </div>
        <Button onClick={fetchTransactions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.totalPending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalProcessing}
            </div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Amount
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ₹{stats.avgAmount}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMethod} onValueChange={setSelectedMethod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User & Contact</TableHead>
                <TableHead>Package & Amount</TableHead>
                <TableHead>Payment Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.userName}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Mail className="h-3 w-3" />
                        <span>{transaction.userEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{transaction.userPhone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.packageName}</p>
                      <p className="text-lg font-bold text-green-600">
                        ₹{transaction.amount}
                      </p>
                      {transaction.propertyTitle && (
                        <p className="text-xs text-gray-500">
                          {transaction.propertyTitle}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 mb-1">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span className="capitalize text-sm">
                        {transaction.paymentMethod.replace("_", " ")}
                      </span>
                    </div>
                    {transaction.paymentDetails.transactionId && (
                      <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {transaction.paymentDetails.transactionId}
                      </p>
                    )}
                    {transaction.paymentDetails.upiId && (
                      <p className="text-xs text-gray-500">
                        UPI: {transaction.paymentDetails.upiId}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(transaction.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.submittedAt).toLocaleTimeString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Payment Transaction</DialogTitle>
                        </DialogHeader>
                        {selectedTransaction && (
                          <div className="space-y-6">
                            {/* User Information */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3">
                                User Information
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Name
                                  </label>
                                  <p className="font-medium">
                                    {selectedTransaction.userName}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Email
                                  </label>
                                  <p>{selectedTransaction.userEmail}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Phone
                                  </label>
                                  <p>{selectedTransaction.userPhone}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Status
                                  </label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedTransaction.status)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Package Information */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3">
                                Package Information
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Package
                                  </label>
                                  <p className="font-medium">
                                    {selectedTransaction.packageName}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Amount
                                  </label>
                                  <p className="text-xl font-bold text-green-600">
                                    ₹{selectedTransaction.amount}
                                  </p>
                                </div>
                                {selectedTransaction.propertyTitle && (
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      Property
                                    </label>
                                    <p>{selectedTransaction.propertyTitle}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Information */}
                            <div className="bg-green-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-3">
                                Payment Information
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Method
                                  </label>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {getPaymentMethodIcon(
                                      selectedTransaction.paymentMethod,
                                    )}
                                    <span className="capitalize">
                                      {selectedTransaction.paymentMethod.replace(
                                        "_",
                                        " ",
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-600">
                                    Submitted
                                  </label>
                                  <p>
                                    {new Date(
                                      selectedTransaction.submittedAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                {selectedTransaction.paymentDetails
                                  .transactionId && (
                                  <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-600">
                                      Transaction ID
                                    </label>
                                    <p className="font-mono text-sm bg-white px-3 py-2 rounded border">
                                      {
                                        selectedTransaction.paymentDetails
                                          .transactionId
                                      }
                                    </p>
                                  </div>
                                )}
                                {selectedTransaction.paymentDetails.upiId && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      UPI ID
                                    </label>
                                    <p>
                                      {selectedTransaction.paymentDetails.upiId}
                                    </p>
                                  </div>
                                )}
                                {selectedTransaction.paymentDetails
                                  .reference && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Reference
                                    </label>
                                    <p>
                                      {
                                        selectedTransaction.paymentDetails
                                          .reference
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Admin Notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Notes (Optional)
                              </label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about this transaction verification..."
                                rows={3}
                              />
                            </div>

                            {/* Action Buttons */}
                            {selectedTransaction.status === "pending" && (
                              <div className="flex space-x-3 pt-4">
                                <Button
                                  onClick={() =>
                                    handleTransactionAction(
                                      selectedTransaction._id,
                                      "approve",
                                    )
                                  }
                                  disabled={actionLoading}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  {actionLoading
                                    ? "Processing..."
                                    : "Approve Payment"}
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleTransactionAction(
                                      selectedTransaction._id,
                                      "reject",
                                    )
                                  }
                                  disabled={actionLoading}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  {actionLoading
                                    ? "Processing..."
                                    : "Reject Payment"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No transactions found matching your criteria
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
