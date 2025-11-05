import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  FileText,
  Download,
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

interface SellerVerification {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  documents: {
    type: string;
    url: string;
    verified: boolean;
  }[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  comments?: string;
}

export default function SellerVerificationManagement() {
  const { token } = useAuth();
  const [verifications, setVerifications] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState<SellerVerification | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const fetchVerifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/seller-verifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVerifications(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch verifications');
        }
      } else {
        setError('Failed to fetch seller verifications');
      }
    } catch (err) {
      setError('Network error while fetching verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (verificationId: string, action: 'approve' | 'reject') => {
    if (!token) return;

    try {
      setProcessing(true);
      setError('');

      const response = await fetch(`/api/admin/seller-verifications/${verificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          comments: reviewComments.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the list
          fetchVerifications();
          setSelectedVerification(null);
          setReviewComments('');
        } else {
          setError(data.error || 'Failed to update verification');
        }
      } else {
        setError('Failed to update verification status');
      }
    } catch (err) {
      setError('Network error while updating verification');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {(status || 'pending').charAt(0).toUpperCase() + (status || 'pending').slice(1)}
      </Badge>
    );
  };

  const filteredVerifications = verifications.filter(verification =>
    verification.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVerifications}
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
          <h2 className="text-2xl font-bold text-gray-900">Seller Verification</h2>
          <p className="text-gray-600">Review and manage seller verification requests</p>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {verifications.filter(v => v.status === 'pending').length} Pending Review
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by seller name or email..."
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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchVerifications} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading verifications...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.length > 0 ? (
                  filteredVerifications.map((verification) => (
                    <TableRow key={verification._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#C70000] rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {verification.userName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{verification.userName}</p>
                            <p className="text-sm text-gray-500">{verification.userEmail}</p>
                            {verification.userPhone && (
                              <p className="text-xs text-gray-400">{verification.userPhone}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {verification.documents?.length || 0} Documents
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(verification.status)}</TableCell>
                      <TableCell>
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setSelectedVerification(verification)}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {verification.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setReviewComments('');
                                }}
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedVerification(verification);
                                  setReviewComments('');
                                }}
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No verification requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      {selectedVerification && (
        <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seller Verification Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center">
                  <span className="text-xl font-medium text-white">
                    {selectedVerification.userName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedVerification.userName}</h3>
                  <p className="text-gray-600">{selectedVerification.userEmail}</p>
                  {selectedVerification.userPhone && (
                    <p className="text-gray-600">{selectedVerification.userPhone}</p>
                  )}
                  {getStatusBadge(selectedVerification.status)}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Submitted Documents</h4>
                <div className="space-y-2">
                  {selectedVerification.documents?.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{doc.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={doc.verified ? 'default' : 'outline'}>
                          {doc.verified ? 'Verified' : 'Pending'}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500">No documents submitted</p>
                  )}
                </div>
              </div>

              {selectedVerification.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Comments
                    </label>
                    <Textarea
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add comments about this verification..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      onClick={() => handleVerificationAction(selectedVerification._id, 'reject')}
                      disabled={processing}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {processing ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      onClick={() => handleVerificationAction(selectedVerification._id, 'approve')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processing ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              )}

              {selectedVerification.comments && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Admin Comments</h4>
                  <p className="text-gray-700">{selectedVerification.comments}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
