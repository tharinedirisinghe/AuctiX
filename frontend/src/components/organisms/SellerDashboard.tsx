import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AxiosRequest from '@/services/axiosInspector';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

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

// Seller stats chart config for shadcn chart
const sellerChartConfig: ChartConfig = {
  value: { label: 'Auctions' },
  Active: { label: 'Active', color: '#22c55e' },
  Upcoming: { label: 'Upcoming', color: '#3b82f6' },
  Ended: { label: 'Ended', color: '#eaac26' },
  Unlisted: { label: 'Unlisted', color: '#fbbf24' },
  Deleted: { label: 'Deleted', color: '#f87171' },
};

export default function SellerDashboard() {
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
      setRecentAuctions(auctionsResponse.data.slice(0, 5)); // Show only recent 5
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

  // Wallet chart data logic (same as bidder dashboard)
  const walletChartData = React.useMemo(() => {
    if (!walletHistory.length) return [];
    if (walletRange === '1d') {
      const transactions = (walletHistory as any).__rawTransactions || [];
      if (!transactions.length) return walletHistory.slice(-1);
      const lastTx = transactions[transactions.length - 1];
      const lastDateTime = new Date(lastTx.transactionDate);
      const startDateTime = new Date(lastDateTime);
      startDateTime.setHours(lastDateTime.getHours() - 23, 0, 0, 0);
      let available = 0;
      let frozen = 0;
      const intradayTxs: { date: string; available: number; frozen: number }[] =
        [];
      transactions.forEach((tx: any) => {
        const txTime = new Date(tx.transactionDate);
        if (txTime >= startDateTime && txTime <= lastDateTime) {
          if (tx.status === 'CREDITED') available += tx.amount || 0;
          else if (tx.status === 'DEBITED') available -= tx.amount || 0;
          else if (tx.status === 'FREEZED') {
            available -= tx.amount || 0;
            frozen += tx.amount || 0;
          } else if (tx.status === 'UNFREEZED') {
            available += tx.amount || 0;
            frozen -= tx.amount || 0;
          }
          intradayTxs.push({
            date: tx.transactionDate.slice(0, 16).replace('T', ' '),
            available: Math.max(available, 0),
            frozen: Math.max(frozen, 0),
          });
        }
      });
      return intradayTxs.length ? intradayTxs : walletHistory.slice(-1);
    }
    if (walletRange === '1w') return walletHistory.slice(-7);
    if (walletRange === '1m') return walletHistory.slice(-30);
    return walletHistory;
  }, [walletHistory, walletRange]);

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
  }, [token, axiosInstance]);

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

  // Pie chart data for shadcn chart
  const sellerPieData = [
    {
      label: 'Active',
      value: stats?.ongoingAuctions || 0,
      fill: '#22c55e',
    },
    {
      label: 'Upcoming',
      value: stats?.upcomingAuctions || 0,
      fill: '#3b82f6',
    },
    {
      label: 'Ended',
      value: stats?.completedAuctions || 0,
      fill: '#eaac26',
    },
    {
      label: 'Unlisted',
      value: stats?.unlistedAuctions || 0,
      fill: '#fbbf24',
    },
    {
      label: 'Deleted',
      value: stats?.deletedAuctions || 0,
      fill: '#f87171',
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white">
      <section className="relative w-full mb-5">
        {/* Banner image without padding */}
        <div className="relative h-64 w-full">
          <img
            src={userData.banner_photo}
            alt="cover-image"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          {/* Profile content positioned at bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex items-end justify-between">
                <div className="flex items-end">
                  <img
                    src={userData.profile_photo}
                    alt="user-avatar-image"
                    className="rounded-md w-20 h-20 object-cover shadow-lg shadow-white/10 border-2 border-white/20"
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
      </section>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        {/* Seller Stats Pie Chart - full width, left 1/3 titles, right 2/3 graph */}
        <div className="mb-8 w-full flex flex-row items-center justify-center">
          {/* Left: Titles */}
          <div className="w-full md:w-2/5 flex flex-col justify-center items-end px-4 py-8">
            <div className="text-3xl md:text-4xl font-bold mb-3">
              Auction Distribution
            </div>
            <div className="text-lg md:text-xl text-gray-500">
              Current Auction Status Breakdown
            </div>
          </div>
          {/* Right: Graph */}
          <div className="w-full md:w-3/5 flex justify-center items-start px-4 py-8">
            <ChartContainer
              config={sellerChartConfig}
              className="[&_.recharts-pie-label-text]:fill-foreground mx-auto"
              style={{ width: '100%', height: '350px', maxWidth: '100%' }}
            >
              <PieChart
                width={window.innerWidth > 900 ? 600 : window.innerWidth - 40}
                height={320}
              >
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={sellerPieData}
                  dataKey="value"
                  label={({ label, value }) => `${label} (${value})`}
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                >
                  {sellerPieData.map((entry, idx) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
        {/* Split screen: Wallet Card (left) and wallet graph (right) */}
        <div className="flex gap-6 mb-8">
          {/* Wallet Card (left) */}
          <div className="w-full md:w-2/5">
            <Card className="bg-gradient-to-br from-gray-50 to-zinc-300 text-gray-800 p-6 rounded-lg h-full shadow-sm border-none flex flex-col justify-between">
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
          {/* Wallet Graph (right) */}
          <div className="hidden md:block w-3/5 border border-gray-200 rounded-lg">
            <div className="w-full">
              <Card className="text-gray-800 p-6 border-none h-full border-none">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Balance Trend
                  </h4>
                  <Select
                    value={walletRange}
                    onValueChange={(v) =>
                      setWalletRange(v as '1d' | '1w' | '1m')
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                      <SelectItem value="1m">1 Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart
                    data={walletChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="availableColor"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#eaac26"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#eaac26"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="frozenColor"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f87171"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f87171"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) =>
                        walletRange === '1d'
                          ? date.slice(11, 16)
                          : new Date(date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                      }
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#fff',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                      labelFormatter={(date) =>
                        walletRange === '1d'
                          ? date.slice(0, 16).replace('T', ' ')
                          : new Date(date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                      }
                      labelStyle={{ color: '#333' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="available"
                      stroke="#eaac26"
                      fillOpacity={1}
                      fill="url(#availableColor)"
                      name="Available"
                    />
                    <Area
                      type="monotone"
                      dataKey="frozen"
                      stroke="#f87171"
                      fillOpacity={1}
                      fill="url(#frozenColor)"
                      name="Frozen"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
