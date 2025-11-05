import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  CreditCard,
  Eye,
  Filter,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
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

interface Transaction {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: "package_purchase" | "listing_fee" | "featured_upgrade" | "refund";
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "bank_transfer";
  transactionId: string;
  packageId?: string;
  packageName?: string;
  description: string;
  paymentDetails?: {
    upiId?: string;
    bankAccount?: string;
    transactionId?: string;
    gatewayResponse?: any;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PaymentTransactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, [token, pagination.page, selectedStatus, selectedType]);

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedType !== "all") params.append("type", selectedType);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTransactions(data.data.transactions);
          setPagination({
            ...pagination,
            total: data.data.pagination.total,
            pages: data.data.pagination.pages,
          });
        } else {
          setError(data.error || "Failed to fetch transactions");
        }
      } else {
        setError(
          `Failed to fetch transactions: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "package_purchase":
        return "bg-blue-100 text-blue-800";
      case "featured_upgrade":
        return "bg-purple-100 text-purple-800";
      case "listing_fee":
        return "bg-orange-100 text-orange-800";
      case "refund":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const updateTransactionStatus = async (
    transactionId: string,
    status: "paid" | "failed" | "cancelled" | "approved",
  ) => {
    if (!token) return;

    try {
      const response = await fetch(
        `/api/admin/transactions/${transactionId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setTransactions(
            transactions.map((t) =>
              t._id === transactionId
                ? { ...t, status, updatedAt: new Date().toISOString() }
                : t,
            ),
          );
          // Close dialog
          setSelectedTransaction(null);
        } else {
          setError(data.error || "Failed to update transaction status");
        }
      } else {
        setError(
          `Failed to update transaction status: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      setError("Failed to update transaction status");
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
      (transaction.transactionId?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );
    const matchesStatus =
      selectedStatus === "all" || transaction.status === selectedStatus;
    const matchesType =
      selectedType === "all" || transaction.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    totalTransactions: transactions.length,
    totalRevenue: transactions
      .filter((t) => t.status === "paid" && t.type !== "refund")
      .reduce((sum, t) => sum + t.amount, 0),
    pendingTransactions: transactions.filter((t) => t.status === "pending")
      .length,
    failedTransactions: transactions.filter((t) => t.status === "failed")
      .length,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading transactions...</p>
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
              fetchTransactions();
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
            Payment Transactions
          </h3>
          <p className="text-gray-600">
            Monitor and manage all payment transactions
          </p>
        </div>
        <Button className="bg-[#C70000] hover:bg-[#A60000]">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingTransactions}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Payments
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedTransactions}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Responsive Layout */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-sm"
        />
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="package_purchase">Package Purchase</SelectItem>
              <SelectItem value="featured_upgrade">Featured Upgrade</SelectItem>
              <SelectItem value="listing_fee">Listing Fee</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Transactions Table - Responsive */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    Transaction ID
                  </TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Payment Method
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Payment Details
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-medium">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {transaction.transactionId}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{transaction.userName}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.userEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        ₹{transaction.amount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getTypeColor(transaction.type)}
                      >
                        {transaction.type
                          ? transaction.type.replace("_", " ")
                          : "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <Badge
                          variant="outline"
                          className={getStatusColor(transaction.status)}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {transaction.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {transaction.paymentDetails?.upiId && (
                          <div>
                            <span className="text-xs text-gray-500">
                              UPI ID:
                            </span>
                            <p className="font-mono text-xs">
                              {transaction.paymentDetails.upiId}
                            </p>
                          </div>
                        )}
                        {transaction.paymentDetails?.bankAccount && (
                          <div>
                            <span className="text-xs text-gray-500">
                              Bank A/c:
                            </span>
                            <p className="font-mono text-xs">
                              {transaction.paymentDetails.bankAccount}
                            </p>
                          </div>
                        )}
                        {transaction.paymentDetails?.transactionId && (
                          <div>
                            <span className="text-xs text-gray-500">
                              Txn ID:
                            </span>
                            <p className="font-mono text-xs">
                              {transaction.paymentDetails.transactionId}
                            </p>
                          </div>
                        )}
                        {!transaction.paymentDetails?.upiId &&
                          !transaction.paymentDetails?.bankAccount &&
                          !transaction.paymentDetails?.transactionId && (
                            <span className="text-xs text-gray-400">
                              No details
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Transaction Details</DialogTitle>
                          </DialogHeader>
                          {selectedTransaction && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="font-semibold">
                                    Transaction ID:
                                  </label>
                                  <p className="font-mono text-sm">
                                    {selectedTransaction.transactionId}
                                  </p>
                                </div>
                                <div>
                                  <label className="font-semibold">
                                    Amount:
                                  </label>
                                  <p className="text-lg font-bold">
                                    ₹{selectedTransaction.amount}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="font-semibold">User:</label>
                                  <p>{selectedTransaction.userName}</p>
                                  <p className="text-sm text-gray-500">
                                    {selectedTransaction.userEmail}
                                  </p>
                                </div>
                                <div>
                                  <label className="font-semibold">
                                    Payment Method:
                                  </label>
                                  <p className="capitalize">
                                    {selectedTransaction.paymentMethod}
                                  </p>
                                </div>
                              </div>

                              {/* Payment Details Section */}
                              {(selectedTransaction.paymentDetails?.upiId ||
                                selectedTransaction.paymentDetails
                                  ?.bankAccount ||
                                selectedTransaction.paymentDetails
                                  ?.transactionId) && (
                                <div className="border-t pt-4">
                                  <label className="font-semibold block mb-3">
                                    Payment Details:
                                  </label>
                                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    {selectedTransaction.paymentDetails
                                      ?.upiId && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <span className="text-sm font-medium text-gray-600">
                                          UPI ID:
                                        </span>
                                        <span className="text-sm font-mono break-all">
                                          {
                                            selectedTransaction.paymentDetails
                                              .upiId
                                          }
                                        </span>
                                      </div>
                                    )}
                                    {selectedTransaction.paymentDetails
                                      ?.bankAccount && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <span className="text-sm font-medium text-gray-600">
                                          Bank Account:
                                        </span>
                                        <span className="text-sm font-mono break-all">
                                          {
                                            selectedTransaction.paymentDetails
                                              .bankAccount
                                          }
                                        </span>
                                      </div>
                                    )}
                                    {selectedTransaction.paymentDetails
                                      ?.transactionId && (
                                      <div className="grid grid-cols-2 gap-2">
                                        <span className="text-sm font-medium text-gray-600">
                                          Transaction ID:
                                        </span>
                                        <span className="text-sm font-mono break-all">
                                          {
                                            selectedTransaction.paymentDetails
                                              .transactionId
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-4"></div>
                              <div>
                                <label className="font-semibold">
                                  Description:
                                </label>
                                <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                                  {selectedTransaction.description}
                                </p>
                              </div>
                              {selectedTransaction.packageName && (
                                <div>
                                  <label className="font-semibold">
                                    Package:
                                  </label>
                                  <p>{selectedTransaction.packageName}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="font-semibold">
                                    Created:
                                  </label>
                                  <p>
                                    {new Date(
                                      selectedTransaction.createdAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <label className="font-semibold">
                                    Updated:
                                  </label>
                                  <p>
                                    {new Date(
                                      selectedTransaction.updatedAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Status Update Actions */}
                              {selectedTransaction.status === "pending" && (
                                <div className="border-t pt-4">
                                  <label className="font-semibold mb-3 block">
                                    Update Payment Status:
                                  </label>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() =>
                                        updateTransactionStatus(
                                          selectedTransaction._id,
                                          "paid",
                                        )
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Mark as Paid
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        updateTransactionStatus(
                                          selectedTransaction._id,
                                          "failed",
                                        )
                                      }
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Mark as Failed
                                    </Button>
                                  </div>
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
                      colSpan={9}
                      className="text-center text-gray-500 py-8"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Management Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-500" />
            <span>Payment Management Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Manual Payments: Active
                </span>
              </div>
              <p className="text-sm text-green-700">
                Manual UPI and bank transfer payments are being tracked and
                saved to database with proper Pending/Paid status. Admin can
                manually approve payments.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">
                  Status Management: Active
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Admin can update payment status from Pending to Paid or Failed.
                All payment entries are properly saved in database with full
                audit trail.
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Payment Flow:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-xs font-medium text-blue-600">
                  1. User Payment
                </div>
                <div className="text-xs text-gray-600">UPI/Bank Transfer</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-xs font-medium text-yellow-600">
                  2. Pending Status
                </div>
                <div className="text-xs text-gray-600">Saved in Database</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-xs font-medium text-purple-600">
                  3. Admin Review
                </div>
                <div className="text-xs text-gray-600">Manual Verification</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="text-xs font-medium text-green-600">
                  4. Paid Status
                </div>
                <div className="text-xs text-gray-600">Service Activated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
