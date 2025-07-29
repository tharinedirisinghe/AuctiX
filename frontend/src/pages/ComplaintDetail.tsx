import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAxiosRequest from '@/services/axiosInspector';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { openTool } from '@/store/slices/adminToolsSlice';
import { AdminToolsEnum } from '@/components/organisms/AdminTools';
import { useDispatch } from 'react-redux';

interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profile_photo: string | null;
  role: string;
}

interface Complaint {
  id: string;
  readableId: string;
  reportedUser?: User; // made optional for targetType USER/AUCTION
  reportedBy: User;
  reason: string;
  description?: string;
  targetType?: string;
  targetId?: string;
  dateReported: string;
  status: string;
}

interface TimelineEntry {
  id: string;
  type: 'STATUS_CHANGE' | 'COMMENT' | 'REPORT_SUBMITTED';
  message: string;
  performedBy: string;
  timestamp: string;
}

interface Auction {
  id: string;
  title: string;
  images?: string;
  status?: string;
  // add more fields as needed
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { axiosInstance } = useAxiosRequest();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timelineActivities, setTimelineActivities] = useState<TimelineEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [targetAuction, setTargetAuction] = useState<Auction | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const appDispatch = useDispatch();

  // Move fetchTargetDetails here so it's available to both effects
  const fetchTargetDetails = async () => {
    if (!complaint) return;
    try {
      if (complaint.targetType === 'AUCTION' && complaint.targetId) {
        const res = await axiosInstance.get(`/auctions/${complaint.targetId}`);
        setTargetAuction(res.data);
        setTargetUser(null);
      } else if (complaint.targetType === 'USER' && complaint.targetId) {
        // Use the correct endpoint for user details
        const res = await axiosInstance.get(
          `/user/getUser?userId=${complaint.targetId}`,
        );
        // If the user object is nested (e.g., res.data.user), adjust accordingly:
        // setTargetUser(res.data.user || res.data);
        setTargetUser(res.data.user || res.data);
        setTargetAuction(null);
      } else {
        setTargetAuction(null);
        setTargetUser(null);
      }
    } catch {
      setTargetAuction(null);
      setTargetUser(null);
    }
  };

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/complaints/${id}`);
        setComplaint(response.data);
        setSelectedStatus(response.data.status);
      } catch (err) {
        setError('Failed to fetch complaint.');
      } finally {
        setLoading(false);
      }
    };

    const fetchTimeline = async () => {
      setTimelineLoading(true);
      try {
        const response = await axiosInstance.get(`/complaints/${id}/timeline`);
        setTimelineActivities(response.data);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setTimelineLoading(false);
      }
    };

    fetchComplaint();
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (complaint) {
      fetchTargetDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint]);

  const handleStatusChange = async (newStatus: string) => {
    if (!complaint) return;

    setUpdating(true);
    try {
      await axiosInstance.put(`/complaints/${id}/status`, newStatus, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setComplaint((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : null,
      );

      const response = await axiosInstance.get(`/complaints/${id}/timeline`);
      setTimelineActivities(response.data);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !complaint) return;

    setUpdating(true);
    try {
      await axiosInstance.post(`/complaints/${id}/comments`, comment.trim(), {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      setComment('');

      const response = await axiosInstance.get(`/complaints/${id}/timeline`);
      setTimelineActivities(response.data);
    } catch (err) {
      setError('Failed to add comment.');
    } finally {
      setUpdating(false);
    }
  };

  // Move getAuctionImageUrl to component scope so it's accessible everywhere
  const getAuctionImageUrl = (auction: any) => {
    if (auction.images && auction.images.length > 0) {
      const imageUrl = `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.images[0]}`;
      return imageUrl;
    }
    return '/api/placeholder/400/250';
  };

  // Helper for avatar fallback
  const getInitials = (user?: User | null) =>
    user
      ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || user.username?.[0] || ''}`.toUpperCase()
      : '';

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusClasses = (status: string) => {
      switch (status.toLowerCase()) {
        case 'resolved':
          return 'bg-green-100 text-green-600 border-none';
        case 'pending':
          return 'bg-yellow-100 text-yellow-600 border-none';
        case 'rejected':
          return 'bg-red-100 text-red-600 border-none';
        case 'under_review':
          return 'bg-blue-100 text-blue-600 border-none';
        default:
          return 'bg-gray-100 text-gray-600 border-none';
      }
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold tracking-wide shadow-sm border ${getStatusClasses(status)}`}
      >
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-2" />
        <span className="text-lg font-semibold text-amber-700">
          Loading complaint details...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center shadow">
        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
        <span className="text-red-600 font-medium">{error}</span>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center shadow">
        <span className="text-gray-500 font-medium">No complaint found.</span>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header part */}
      <header className="relative h-32 w-full bg-gradient-to-b from-yellow-400 to-black/90 shadow-lg">
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 mb-4 flex items-center gap-4">
          <Button variant="ghost" className="text-white" size="icon" asChild>
            <Link to="/complaints">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            Complaint Details
          </h1>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Complaint Summary */}
            <div className="rounded-lg border border-gray-200 p-6">
              <span className="text-xs text-gray-400 font-mono mb-2">
                Complaint ID: {complaint.readableId || complaint.id}
              </span>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {complaint.reason}
                </h2>
                <StatusBadge status={complaint.status} />
              </div>
              {complaint.description && complaint.description.trim() && (
                <div className="mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {complaint.description}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(complaint.dateReported).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {/* Target Details */}
              {(targetAuction || targetUser) && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-1">
                    {targetUser
                      ? 'Reported User'
                      : targetAuction
                        ? 'Reported Auction'
                        : 'Target Details'}
                  </h3>
                  <div className="p-3 bg-gray-100 rounded-lg text-sm flex items-center gap-4">
                    {targetAuction && (
                      <a
                        href={`/auction-details/${targetAuction.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 rounded cursor-pointer px-2 py-1"
                        title="View Auction"
                      >
                        <img
                          src={getAuctionImageUrl(targetAuction)}
                          className="w-20 h-20 rounded object-cover border border-gray-200"
                          alt={targetAuction.title}
                        />
                        <div>
                          <div className="font-semibold text-gray-800">
                            {targetAuction.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            Auction ID: {targetAuction.id}
                          </div>
                          {targetAuction.status && (
                            <div className="text-xs text-gray-400">
                              Status: {targetAuction.status}
                            </div>
                          )}
                        </div>
                      </a>
                    )}
                    {targetUser && (
                      <a
                        href={`/profile/seller/${targetUser.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 rounded cursor-pointer px-2 py-1"
                        title="View Seller Public Profile"
                      >
                        {targetUser.profile_photo ? (
                          <img
                            src={targetUser.profile_photo}
                            alt={targetUser.username}
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <img
                            src="/defaultProfilePhoto.jpg"
                            alt="Default Profile"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">
                              {targetUser.firstName || targetUser.lastName ? (
                                <>
                                  {targetUser.firstName || ''}{' '}
                                  {targetUser.lastName || ''}
                                </>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </span>
                            {targetUser.role && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-white hover:bg-white px-2 py-0.5 capitalize"
                              >
                                {targetUser.role === 'seller'
                                  ? 'Seller'
                                  : targetUser.role === 'bidder'
                                    ? 'Bidder'
                                    : targetUser.role}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {targetUser.username ? (
                              <>@{targetUser.username}</>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {targetUser.email || (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Section */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-400" />
                Complaint History
              </h2>
              <div className="space-y-6">
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    <span className="ml-3 text-lg text-amber-700">
                      Loading timeline...
                    </span>
                  </div>
                ) : timelineActivities.length > 0 ? (
                  timelineActivities.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {entry.type === 'STATUS_CHANGE' ? (
                          <div className="bg-green-100 w-9 h-9 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="bg-amber-100 w-9 h-9 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {entry.performedBy}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                        {entry.type === 'STATUS_CHANGE' ? (
                          <div className="text-sm mt-1">
                            {(() => {
                              const statusRegex = /from\s+(\w+)\s+to\s+(\w+)/i;
                              const match = entry.message.match(statusRegex);
                              if (match && match.length >= 3) {
                                const fromStatus = match[1];
                                const toStatus = match[2];
                                return (
                                  <>
                                    Changed status from{' '}
                                    <StatusBadge status={fromStatus} /> to{' '}
                                    <StatusBadge status={toStatus} />
                                  </>
                                );
                              }
                              return entry.message;
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            {entry.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500 border border-gray-100">
                    No activity yet.
                  </div>
                )}
                {/* Add Comment Form */}
                <div className="flex pt-4 gap-3">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-200 w-9 h-9 rounded-full"></div>
                  </div>
                  <div className="flex-grow">
                    <Textarea
                      placeholder="Add a comment to the timeline..."
                      className="w-full p-3 text-sm border border-amber-200 rounded-lg shadow focus:ring-amber-400 focus:border-amber-400"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button
                      className="mt-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 shadow"
                      onClick={handleAddComment}
                      disabled={!comment.trim() || updating}
                    >
                      {updating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6">
            {/* Customer Info */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-amber-400" />
                Reporter Info
              </h3>
              <div className="flex items-center gap-3 mb-2">
                {complaint.reportedBy?.profile_photo ? (
                  <img
                    src={complaint.reportedBy.profile_photo}
                    alt={complaint.reportedBy.username}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <img
                    src="/defaultProfilePhoto.jpg"
                    alt="Default Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {complaint.reportedBy.firstName ||
                      complaint.reportedBy.lastName ? (
                        <>
                          {complaint.reportedBy.firstName || ''}{' '}
                          {complaint.reportedBy.lastName || ''}
                        </>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </span>
                    {complaint.reportedBy.role && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white hover:bg-white px-2 py-0.5 capitalize"
                      >
                        {complaint.reportedBy.role === 'seller'
                          ? 'Seller'
                          : complaint.reportedBy.role === 'bidder'
                            ? 'Bidder'
                            : complaint.reportedBy.role}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {complaint.reportedBy.username ? (
                      <>@{complaint.reportedBy.username}</>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {complaint.reportedBy.email || (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className=" ">
              <div className="flex flex-col gap-2">
                {complaint.status === 'PENDING' ? (
                  <Button
                    variant="default"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black"
                    onClick={() => handleStatusChange('UNDER_REVIEW')}
                    disabled={updating}
                  >
                    Assign to Me
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="default"
                      className="justify-start text-gray-700 border-gray-300 bg-gray-50 hover:bg-gray-100"
                      onClick={() => {
                        if (complaint.reportedBy?.email) {
                          window.location.href = `mailto:${complaint.reportedBy.email}`;
                        }
                      }}
                      disabled={!complaint.reportedBy?.email}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Email Reporter
                    </Button>
                    <Button
                      variant="default"
                      className="justify-start text-green-700 border-green-300 bg-green-50 hover:bg-green-100"
                      onClick={() => handleStatusChange('RESOLVED')}
                      disabled={
                        updating ||
                        complaint.status === 'RESOLVED' ||
                        complaint.status === 'REJECTED'
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark as Solved
                    </Button>
                    <Button
                      variant="default"
                      className="justify-start text-red-700 border-red-300 bg-red-50 hover:bg-red-100"
                      onClick={() => handleStatusChange('REJECTED')}
                      disabled={
                        updating ||
                        complaint.status === 'RESOLVED' ||
                        complaint.status === 'REJECTED'
                      }
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Reject Complaint
                    </Button>
                    {/* Ban User Button */}
                    {targetUser && (
                      <Button
                        variant="destructive"
                        className="justify-start"
                        onClick={() =>
                          appDispatch(
                            openTool({
                              user: targetUser.username,
                              tool: AdminToolsEnum.BAN_USER,
                            }),
                          )
                        }
                      >
                        Ban User
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Manage Complaint */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-bold text-gray-700 mb-3">
                Manage Complaint
              </h3>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-amber-300 rounded-md px-3 py-2 bg-white text-gray-700 font-semibold shadow focus:ring-amber-400 focus:border-amber-400 transition"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={updating}
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 shadow"
                disabled={updating}
                onClick={() => handleStatusChange(selectedStatus)}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Update Complaint
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
