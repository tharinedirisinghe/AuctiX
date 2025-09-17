import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AxiosRequest from '@/services/axiosInspector';
import { toast } from 'react-toastify';

type SellerStats = {
  totalAuctions: number;
  ongoingAuctions: number;
  upcomingAuctions: number;
  completedAuctions: number;
  deletedAuctions: number;
  walletBalance: number;
};

type WalletInfo = {
  amount: number;
  freezeAmount: number;
  updatedAt: string;
  // Add other properties based on your API response
};

export default function SellerDashboard() {
  // Helper to show time left for auction
  function getTimeLeft(endTime: string, status: string) {
    if (status === 'completed' || status === 'ended') return 'Ended';
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let str = '';
    if (days > 0) str += `${days}d `;
    if (hours > 0 || days > 0) str += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) str += `${minutes}m `;
    str += `${seconds}s`;
    return str.trim();
  }
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentAuctions, setRecentAuctions] = useState([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [walletRange, setWalletRange] = useState<'1d' | '1w' | '1m'>('1w');
  const [walletHistory, setWalletHistory] = useState<
    { date: string; available: number; frozen: number }[]
  >([]);
  const userData = useAppSelector((state) => state.user);
  const authData = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const axiosInstance = AxiosRequest().axiosInstance;
  const token = authData?.token;

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    if (!token) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Get seller statistics
      const statsResponse = await axiosInstance.get('/auctions/seller/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Get recent auctions (limit to 5 for dashboard)
      const auctionsResponse = await axiosInstance.get(
        '/auctions/seller/auctions?filter=total',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Get wallet information
      const getWalletInfo = async () => {
        try {
          const response = await axiosInstance.get('/coins/wallet-info', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching wallet info:', error);
          return null;
        }
      };

      const walletData = await getWalletInfo();

      setStats(statsResponse.data);
      setWalletInfo(walletData);
      // Handle paginated response structure like ManageAuctions
      let auctionsArr = [];
      if (
        auctionsResponse.data.content &&
        Array.isArray(auctionsResponse.data.content)
      ) {
        auctionsArr = auctionsResponse.data.content;
      } else if (Array.isArray(auctionsResponse.data)) {
        auctionsArr = auctionsResponse.data;
      } else if (Array.isArray(auctionsResponse.data.auctions)) {
        auctionsArr = auctionsResponse.data.auctions;
      }
      console.log('Fetched auctions:', auctionsArr);
      setRecentAuctions(auctionsArr.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
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

  const statusDisplayMap: Record<string, string> = {
    ongoing: 'Active',
    active: 'Active',
    upcoming: 'Upcoming',
    ended: 'Ended',
    completed: 'Ended',
    unlisted: 'Unlisted',
    deleted: 'Deleted',
    pending_admin_approval: 'Pending Deletion',
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return `LKR ${price?.toLocaleString() || 0}`;
  };

  const handleAuctionAction = async (
    action: 'view' | 'edit' | 'delete',
    auctionId: string,
  ) => {
    switch (action) {
      case 'view':
        navigate(`/auction-details/${auctionId}`);
        break;
      case 'edit':
        navigate(`/auctions/update/${auctionId}`);
        break;
      case 'delete':
        const confirmed = window.confirm(
          'Are you sure you want to delete this auction?',
        );
        if (!confirmed) return;

        try {
          await axiosInstance.delete(`/auctions/delete/${auctionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success('Auction deleted successfully');
          fetchSellerData(); // Refresh data
        } catch (error: any) {
          if (error.response?.status === 400) {
            toast.error(error.response.data || 'Cannot delete auction');
          } else {
            toast.error('Failed to delete auction');
          }
        }
        break;
    }
    setShowDropdown(null);
  };

  // Fetch wallet history (same as bidder dashboard)
  useEffect(() => {
    const fetchWalletHistory = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get('/coins/transaction-history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const transactions = response.data;
        transactions.sort(
          (a: any, b: any) =>
            new Date(a.transactionDate).getTime() -
            new Date(b.transactionDate).getTime(),
        );
        let history: { date: string; available: number; frozen: number }[] = [];
        let available = 0;
        let frozen = 0;
        let lastDate = '';
        transactions.forEach((tx: any, idx: number) => {
          const date = tx.transactionDate.slice(0, 10);
          if (tx.status === 'CREDITED') available += tx.amount || 0;
          else if (tx.status === 'DEBITED') available -= tx.amount || 0;
          else if (tx.status === 'FREEZED') {
            available -= tx.amount || 0;
            frozen += tx.amount || 0;
          } else if (tx.status === 'UNFREEZED') {
            available += tx.amount || 0;
            frozen -= tx.amount || 0;
          }
          if (date !== lastDate) {
            history.push({
              date,
              available: Math.max(available, 0),
              frozen: Math.max(frozen, 0),
            });
            lastDate = date;
          } else if (idx === transactions.length - 1) {
            history[history.length - 1] = {
              date,
              available: Math.max(available, 0),
              frozen: Math.max(frozen, 0),
            };
          }
        });
        if (history.length > 0) {
          const filledHistory: {
            date: string;
            available: number;
            frozen: number;
          }[] = [];
          const endDate = new Date(history[history.length - 1].date);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 29);
          let prev = { available: 0, frozen: 0 };
          let historyIdx = 0;
          for (let d = 0; d < 30; d++) {
            const currDate = new Date(startDate);
            currDate.setDate(startDate.getDate() + d);
            const dateStr = currDate.toISOString().slice(0, 10);
            if (
              historyIdx < history.length &&
              history[historyIdx].date === dateStr
            ) {
              prev = {
                available: history[historyIdx].available,
                frozen: history[historyIdx].frozen,
              };
              historyIdx++;
            }
            filledHistory.push({
              date: dateStr,
              available: prev.available,
              frozen: prev.frozen,
            });
          }
          history = filledHistory;
        }
        (history as any).__rawTransactions = transactions;
        setWalletHistory(history);
      } catch (error) {
        setWalletHistory([]);
      }
    };
    fetchWalletHistory();
  }, [token]);

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
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="flex gap-6 mb-8">
          {/* Banner/Profile (left) */}
          <div className="hidden md:block w-3/5 border border-gray-200 rounded-lg">
            <div className="w-full">
              <Card className="text-gray-800 border-none relative p-0 overflow-hidden">
                <div className="relative w-full h-64">
                  <img
                    src={userData.banner_photo}
                    alt="cover-image"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="w-full max-w-7xl mx-auto">
                      <div className="flex items-end justify-between">
                        <div className="flex items-end">
                          <img
                            src={userData.profile_photo}
                            alt="user-avatar-image"
                            className="rounded-md w-20 h-20 object-cover"
                          />
                          <div className="flex flex-col items-start ml-4 md:ml-6 mb-2">
                            <div className="text-white/80 font-medium leading-none text-sm">
                              Hello,
                            </div>
                            <h3 className="font-manrope font-bold text-2xl md:text-4xl text-white">
                              {userData.username || 'Guest'}
                            </h3>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/settings/profile')}
                        >
                          Go to Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          {/* Wallet Card (right) */}
          <div className="w-full md:w-2/5">
            <Card className="bg-gradient-to-br from-gray-50 to-zinc-300 text-gray-800 p-6 rounded-lg h-full shadow-none border-none flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="text-gray-600 text-md font-medium">
                    Wallet
                  </div>
                  <div className="text-gray-800 text-4xl ">
                    Aucti<span className="text-[#eaac26]">X</span>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="text-gray-500 text-lg mb-1">
                    Available Balance
                  </div>
                  <div className="text-4xl font-bold tracking-wider text-gray-900">
                    {loading
                      ? 'Loading...'
                      : walletInfo?.amount !== undefined
                        ? `LKR ${walletInfo.amount.toLocaleString()}`
                        : 'LKR 0'}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  <div className="text-gray-500 text-md">Frozen</div>
                  <div className="text-sm font-semibold text-orange-600">
                    {walletInfo?.freezeAmount !== undefined
                      ? `LKR ${walletInfo.freezeAmount.toLocaleString()}`
                      : 'LKR 0'}
                  </div>
                </div>
                <div>
                  <Button
                    variant="secondary"
                    className="text-xs px-3 py-1 text-gray-700 hover:text-gray-900"
                    onClick={() => navigate('/wallet')}
                  >
                    Go to Wallet
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-8 w-full">
          <div className="text-xl font-semibold mb-4 text-gray-800">
            Your Recent Auctions
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentAuctions.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-8">
                No auctions found.
              </div>
            ) : (
              recentAuctions.map((auction: any) => {
                // Use correct property names from sample
                const auctionId = auction.id;
                const imageId = auction.images?.[0];
                const imageUrl = imageId
                  ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${imageId}`
                  : '/vite.svg';
                const currentPrice =
                  auction.currentHighestBid?.amount ?? auction.startingPrice;
                const status = auction.status ?? '';
                return (
                  <div
                    key={auctionId}
                    className="group bg-white border border-gray-200 rounded-xl flex flex-col justify-between p-0 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/auction-details/${auctionId}`)}
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-t-xl">
                      <img
                        src={imageUrl}
                        alt="auction"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <div className="bg-black/70 text-white rounded px-2 py-1 text-xs font-semibold shadow flex items-center">
                          {getTimeLeft(auction.endTime, status)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3">
                      <div
                        className="font-bold text-gray-800 text-lg truncate"
                        title={auction.title}
                      >
                        {auction.title}
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Current Price:</span>
                        <span className="font-semibold text-gray-900">
                          LKR {currentPrice?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Category:</span>
                        <span className="font-semibold text-gray-900">
                          {auction.category}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Ends:</span>
                        <span className="font-semibold text-gray-900">
                          {auction.endTime
                            ? new Date(auction.endTime).toLocaleString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/manage-auctions')}
            >
              View All Auctions
            </Button>
          </div>
        </div>

        {/* Wallet Graph (below) */}
      </div>
    </div>
  );
}
