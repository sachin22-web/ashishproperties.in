import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  AlertTriangle,
  Flag,
  Eye,
  Check,
  X,
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';

interface UserReport {
  _id: string;
  reporterName: string;
  reporterEmail: string;
  reportedUserName?: string;
  reportedUserEmail?: string;
  reportedPropertyTitle?: string;
  reasonTitle: string; // This is the actual field name from server
  reason?: string; // For backward compatibility
  description?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  adminComments?: string;
  resolution?: string;
}

export default function ReportsManagement() {
  const { token } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [adminComments, setAdminComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Handle nested data structure from API: data.data.reports
          const reportsData = data.data?.reports || data.data || [];
          const transformedReports = Array.isArray(reportsData)
            ? reportsData.map((report: any) => ({
                ...report,
                reason: report.reasonTitle || report.reason || 'Unknown', // Map reasonTitle to reason for backward compatibility
                reportedUserEmail: report.reportedUserEmail || '', // Ensure email field exists
              }))
            : [];
          setReports(transformedReports);
        } else {
          setError(data.error || 'Failed to fetch reports');
        }
      } else {
        setError('Failed to fetch user reports');
      }
    } catch (err) {
      setError('Network error while fetching reports');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolved' | 'dismissed') => {
    if (!token) return;

    try {
      setProcessing(true);
      setError('');

      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action,
          adminComments: adminComments.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchReports();
          setSelectedReport(null);
          setAdminComments('');
        } else {
          setError(data.error || 'Failed to update report');
        }
      } else {
        setError('Failed to update report status');
      }
    } catch (err) {
      setError('Network error while updating report');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      under_review: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' },
      reviewed: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' }, // fallback
      resolved: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      dismissed: { variant: 'destructive' as const, className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    const displayStatus = status === 'under_review' ? 'Under Review' :
                        (status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1);

    return (
      <Badge variant={config.variant} className={config.className}>
        {displayStatus}
      </Badge>
    );
  };

  const filteredReports = Array.isArray(reports)
    ? reports.filter(report => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (report.reporterName || '').toLowerCase().includes(searchLower) ||
          (report.reportedUserName || '').toLowerCase().includes(searchLower) ||
          (report.reportedPropertyTitle || '').toLowerCase().includes(searchLower) ||
          (report.reason || '').toLowerCase().includes(searchLower)
        );
      })
    : [];

  const pendingCount = Array.isArray(reports)
    ? reports.filter(r => r.status === 'pending').length
    : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
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
          <h2 className="text-2xl font-bold text-gray-900">User Reports</h2>
          <p className="text-gray-600">Review and manage user reports and complaints</p>
        </div>
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          {pendingCount} New Reports
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by reporter, reported user, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchReports} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.reporterName}</p>
                          <p className="text-sm text-gray-500">{report.reporterEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {report.reportedUserName || report.reportedPropertyTitle || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {report.reportedUserEmail || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.reason}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedReport(report)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminComments('');
                                }}
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setAdminComments('');
                                }}
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Reporter</h4>
                  <p className="font-medium">{selectedReport.reporterName}</p>
                  <p className="text-sm text-gray-600">{selectedReport.reporterEmail}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">
                    {selectedReport.reportedUserName ? 'Reported User' : 'Reported Item'}
                  </h4>
                  <p className="font-medium">
                    {selectedReport.reportedUserName || selectedReport.reportedPropertyTitle || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedReport.reportedUserEmail || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Report Reason</h4>
                <Badge variant="outline" className="text-base">{selectedReport.reason}</Badge>
              </div>

              {selectedReport.description && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Reported on: {new Date(selectedReport.createdAt).toLocaleString()}</span>
                {getStatusBadge(selectedReport.status)}
              </div>

              {selectedReport.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Comments
                    </label>
                    <Textarea
                      value={adminComments}
                      onChange={(e) => setAdminComments(e.target.value)}
                      placeholder="Add your review comments..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => handleReportAction(selectedReport._id, 'dismissed')}
                      disabled={processing}
                      variant="outline"
                      className="text-gray-600"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Dismiss'}
                    </Button>
                    <Button
                      onClick={() => handleReportAction(selectedReport._id, 'resolved')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processing ? 'Processing...' : 'Mark Resolved'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedReport.adminComments && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Admin Comments</h4>
                  <p className="text-gray-700">{selectedReport.adminComments}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
