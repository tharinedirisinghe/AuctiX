import React, { useState, useMemo, useEffect } from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AxiosRequest from '@/services/axiosInspector';
import { useAppSelector } from '@/hooks/hooks';

const ManageAuctions = () => {
  type FilterKey =
    | 'total'
    | 'active'
    | 'upcoming'
    | 'ended'
    | 'unlisted'
    | 'deleted';

  const [selectedFilter, setSelectedFilter] = useState<FilterKey>('total');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    auctionId: '',
    auctionTitle: '',
    hasBids: false,
  });
  const [deletionReason, setDeletionReason] = useState('');

  // Map frontend filter keys to backend filter values
  const filterMap: Record<FilterKey, string> = {
    total: 'total',
    active: 'active',
    upcoming: 'upcoming',
    ended: 'ended',
    unlisted: 'unlisted',
    deleted: 'deleted',
  };

  // Map backend status to frontend display
  const statusDisplayMap: Record<string, string> = {
    ongoing: 'Active',
    active: 'Active',
    upcoming: 'Upcoming',
    ended: 'Ended',
    completed: 'Ended',
    unlisted: 'Unlisted',
    deleted: 'Deleted',
    PENDING_ADMIN_APPROVAL: 'Pending Deletion',
    DELETED: 'Deleted',
  };

  // Helper function to determine auction status based on dates
  const getAuctionStatus = (auction: any) => {
    const now = new Date();
    const startTime = new Date(auction.startTime);
    const endTime = new Date(auction.endTime);

    // Check for deletion status first
    if (
      auction.deletionStatus === 'PENDING_ADMIN_APPROVAL' ||
      auction.status === 'PENDING_ADMIN_APPROVAL'
    ) {
      return 'PENDING_ADMIN_APPROVAL';
    }

    if (auction.deleted || auction.status?.toLowerCase() === 'deleted') {
      return 'deleted';
    }

    if (auction.status?.toLowerCase() === 'unlisted') {
      return 'unlisted';
    }

    // Determine status based on time
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'active';
    } else {
      return 'ended';
    }
  };

  // Helper function to get current bid amount
  const getCurrentBidAmount = (auction: any) => {
    // Check if currentHighestBid exists and has amount
    if (auction.currentHighestBid && auction.currentHighestBid.amount) {
      return auction.currentHighestBid.amount;
    }

    // Fall back to currentBid if it exists
    if (auction.currentBid && auction.currentBid > 0) {
      return auction.currentBid;
    }

    // No bids yet
    return null;
  };

  // Helper function to check if auction has bids
  const hasBids = (auction: any) => {
    return (
      (auction.currentHighestBid && auction.currentHighestBid.amount) ||
      (auction.bidHistory && auction.bidHistory.length > 0) ||
      (auction.currentBid && auction.currentBid > 0)
    );
  };

  const isPendingDeletion = (auction: any) => {
    return (
      auction.status === 'PENDING_ADMIN_APPROVAL' ||
      (auction.status === 'unlisted' && auction.pendingDeletion === true) ||
      auction.deletionStatus === 'PENDING_ADMIN_APPROVAL'
    );
  };

  const isDeletedOrPending = (auction: any) =>
    isPendingDeletion(auction) || auction.status?.toLowerCase() === 'deleted';

  const isAuctionEndingSoon = (auction: any) => {
    const endTime = new Date(auction.endTime || auction.end);
    const now = new Date();
    const diffInMs = endTime.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours <= 1 && diffInHours > 0;
  };

  const isAuctionEnded = (auction: any) => {
    const endTime = new Date(auction.endTime || auction.end);
    const now = new Date();
    return endTime < now;
  };

  const itemsPerPage = 10;
  const axiosInstance = AxiosRequest().axiosInstance;
  const [allAuctions, setAllAuctions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const userData = useAppSelector((state) => state.auth);
  const token = userData?.token;
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.isUserLoggedIn || userData.role !== 'SELLER') {
      toast.error('Access denied. Seller account required.');
      navigate('/login', { replace: true });
    }
  }, [userData, navigate]);

  if (!userData?.isUserLoggedIn || userData.role !== 'SELLER') {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        Access denied. Only sellers can view this page.
      </div>
    );
  }

  // Fetch auctions based on filter and search
  const fetchAuctions = async (
    filter: FilterKey = 'total',
    search: string = '',
    page: number = currentPage,
    size: number = itemsPerPage,
  ) => {
    if (!token) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();

      let backendFilter = filterMap[filter];
      if (filter === 'active') backendFilter = 'ongoing';
      else if (filter === 'ended') backendFilter = 'completed';

      params.append('filter', backendFilter);
      params.append('page', (page - 1).toString());
      params.append('size', size.toString());
      if (search) params.append('search', search);

      const url = `/auctions/seller/auctions?${params.toString()}`;
      const response = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAllAuctions(response.data.content || response.data);
    } catch (error) {
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch seller stats
  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await axiosInstance.get('/auctions/seller/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      fetchAuctions();
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    fetchAuctions(selectedFilter, searchTerm, currentPage);
  }, [currentPage]);

  // Refetch when filter or search changes
  useEffect(() => {
    if (token) {
      fetchAuctions(selectedFilter, searchTerm);
    }
  }, [selectedFilter, searchTerm, token]);

  // Filter auctions on frontend (backup filtering)
  const filteredAuctions = useMemo(() => {
    return allAuctions;
  }, [allAuctions]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAuctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAuctions = filteredAuctions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, searchTerm]);

  // Calculate stats from API response
  const calculatedStats: { title: string; count: number; key: FilterKey }[] = [
    {
      title: 'Total Auctions',
      count: stats?.totalAuctions || 0,
      key: 'total',
    },
    {
      title: 'Active Auctions',
      count: stats?.ongoingAuctions || 0,
      key: 'active',
    },
    {
      title: 'Upcoming Auctions',
      count: stats?.upcomingAuctions || 0,
      key: 'upcoming',
    },
    {
      title: 'Ended Auctions',
      count: stats?.completedAuctions || 0,
      key: 'ended',
    },
    {
      title: 'Unlisted Auctions',
      count: stats?.unlistedAuctions || 0,
      key: 'unlisted',
    },
    {
      title: 'Deleted Auctions',
      count: stats?.deletedAuctions || 0,
      key: 'deleted',
    },
  ];

  const handleAuctionAction = async (
    action: 'update' | 'delete' | 'view',
    auctionId: string,
  ) => {
    if (action === 'view') {
      navigate(`/auction-details/${auctionId}`);
      setShowDropdown(null);
      return;
    }

    if (action === 'update') {
      navigate(`/auctions/update/${auctionId}`);
      setShowDropdown(null);
      return;
    }

    if (action === 'delete') {
      const auction = allAuctions.find((a) => a.id === auctionId);
      const auctionHasBids = hasBids(auction);

      setDeleteModal({
        isOpen: true,
        auctionId: auctionId,
        auctionTitle: auction?.title || auction?.name || 'Unknown Auction',
        hasBids: auctionHasBids,
      });
      setDeletionReason('');
    }

    setShowDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.hasBids && !deletionReason.trim()) {
      toast.error(
        'Please provide a reason for deleting this auction with bids',
      );
      return;
    }

    try {
      const requestBody = deleteModal.hasBids ? { reason: deletionReason } : {};

      await axiosInstance.delete(`/auctions/delete/${deleteModal.auctionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: requestBody,
      });

      toast.success('Auction deleted successfully');

      setDeleteModal({
        isOpen: false,
        auctionId: '',
        auctionTitle: '',
        hasBids: false,
      });
      setDeletionReason('');

      fetchAuctions(selectedFilter, searchTerm);
      fetchStats();
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data ||
        'Failed to delete auction';
      toast.error(errorMessage);
    }
  };

  const getStatusBadgeColor = (status: string, auction?: any) => {
    const normalizedStatus = status?.toLowerCase();

    if (isPendingDeletion(auction)) {
      return 'bg-orange-100 text-orange-800 border border-orange-300';
    }

    switch (normalizedStatus) {
      case 'ongoing':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'unlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'deleted':
      case 'pending_admin_approval':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return `LKR ${price?.toLocaleString() || 0}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showDropdown &&
        !(event.target as Element).closest('.dropdown-container')
      ) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200 rounded"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-2">Auctions</h1>
        <p className="text-gray-600">
          You can view and manage your auctions here
        </p>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        {calculatedStats.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 text-center cursor-pointer transition-all rounded-lg border ${
              selectedFilter === item.key
                ? 'bg-blue-50 border-blue-300 shadow-md'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            onClick={() => setSelectedFilter(item.key)}
          >
            <h2 className="text-2xl font-bold">{item.count}</h2>
            <p className="text-sm text-gray-500">{item.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Manage Auctions</h2>
          <button
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            onClick={() => navigate('/auctions/new')}
          >
            Add Auction +
          </button>
        </div>

        <div className="flex justify-between mb-4">
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedFilter === 'unlisted' &&
          paginatedAuctions.some((auction) => isPendingDeletion(auction)) && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-orange-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    Pending Deletion Requests
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      Auctions marked as "Pending Admin Approval" have deletion
                      requests that require admin review. These auctions cannot
                      be updated or deleted until the admin processes the
                      request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">Loading auctions...</div>
          </div>
        ) : (
          <>
            <div className="relative overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Auction ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Start
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      End
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Start Price
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Current Bid
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="w-12 py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAuctions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        No auctions found
                      </td>
                    </tr>
                  ) : (
                    paginatedAuctions.map((auction, idx) => {
                      const currentBidAmount = getCurrentBidAmount(auction);
                      const auctionStatus = getAuctionStatus(auction);

                      return (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">{auction.id}</td>
                          <td className="py-3 px-4">
                            {auction.title || auction.name}
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(auction.startTime || auction.start)}
                          </td>
                          <td className="py-3 px-4">
                            {formatDate(auction.endTime || auction.end)}
                          </td>
                          <td className="py-3 px-4">
                            {formatPrice(auction.startingPrice)}
                          </td>
                          <td className="py-3 px-4">
                            {currentBidAmount ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-green-600">
                                  {formatPrice(currentBidAmount)}
                                </span>
                                {auction.bidHistory &&
                                  auction.bidHistory.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {auction.bidHistory.length} bid
                                      {auction.bidHistory.length !== 1
                                        ? 's'
                                        : ''}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No bids yet</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(auctionStatus, auction)}`}
                              >
                                {isPendingDeletion(auction)
                                  ? 'Pending Admin Approval'
                                  : statusDisplayMap[auctionStatus] ||
                                    auctionStatus}
                              </span>
                              {isPendingDeletion(auction) && (
                                <span className="text-xs text-orange-600 mt-1">
                                  Deletion Request Submitted
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 relative">
                            <div className="dropdown-container">
                              <button
                                className="p-1 hover:bg-gray-200 rounded"
                                onClick={() =>
                                  setShowDropdown(
                                    showDropdown === auction.id
                                      ? null
                                      : auction.id,
                                  )
                                }
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {showDropdown === auction.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <div className="py-1">
                                    {isDeletedOrPending(auction) ||
                                    isAuctionEnded(auction) ? (
                                      <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() =>
                                          navigate(
                                            `/auction-details/${auction.id}`,
                                          )
                                        }
                                      >
                                        View Auction Details
                                      </div>
                                    ) : (
                                      <>
                                        <div
                                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                          onClick={() =>
                                            handleAuctionAction(
                                              'view',
                                              auction.id,
                                            )
                                          }
                                        >
                                          View Auction Details
                                        </div>
                                        <div
                                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                          onClick={() =>
                                            handleAuctionAction(
                                              'update',
                                              auction.id,
                                            )
                                          }
                                        >
                                          Update Auction
                                        </div>
                                        {!isAuctionEndingSoon(auction) ? (
                                          <div
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                                            onClick={() =>
                                              handleAuctionAction(
                                                'delete',
                                                auction.id,
                                              )
                                            }
                                          >
                                            Delete Auction
                                          </div>
                                        ) : (
                                          <div className="px-4 py-2 text-gray-400 cursor-not-allowed">
                                            Cannot Delete (Last Hour)
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + itemsPerPage, filteredAuctions.length)}{' '}
                of {filteredAuctions.length} auctions
              </span>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Auction</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteModal.auctionTitle}"?
            </p>

            {deleteModal.hasBids && (
              <div className="mb-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <p className="text-orange-800 text-sm">
                    ⚠️ This auction has bids. Deleting will immediately unfreeze
                    all bid amounts and remove the auction permanently.
                  </p>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deletion *
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Please explain why you need to delete this auction..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModal({
                    isOpen: false,
                    auctionId: '',
                    auctionTitle: '',
                    hasBids: false,
                  });
                  setDeletionReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteModal.hasBids && !deletionReason.trim()}
                className={`px-4 py-2 text-white rounded ${
                  deleteModal.hasBids && !deletionReason.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Delete Auction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAuctions;
