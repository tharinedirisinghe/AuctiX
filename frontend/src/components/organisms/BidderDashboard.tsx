import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AxiosRequest from '@/services/axiosInspector';
import { useNavigate } from 'react-router-dom';
// import { BarChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';

type WalletInfo = {
  amount: number;
  freezeAmount: number;
  updatedAt: string;
};

type AuctionData = {
  auctionId: string;
  title: string;
  description: string;
  currentPrice: number;
  yourHighestBid: number;
  status: string;
  startTime: string;
  endTime: string;
  isLeadingBid: boolean;
  category: string;
  imagePaths: string[];
};

export default function BidderDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBids, setRecentBids] = useState<AuctionData[]>([]);
  const [watchedAuctions, setWatchedAuctions] = useState<AuctionData[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('90d');
  const [walletRange, setWalletRange] = useState<'1d' | '1w' | '1m'>('1w');
  const userData = useAppSelector((state) => state.user);
  const authData = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const axiosInstance = AxiosRequest().axiosInstance;
  const token = authData?.token;

  // Mock chart data and config
  const chartConfig = {}; // Replace with actual config if needed
  const chartData = [
    { date: '2024-04-01', mobile: 120, desktop: 200 },
    { date: '2024-04-02', mobile: 150, desktop: 180 },
    { date: '2024-04-03', mobile: 170, desktop: 210 },
    { date: '2024-04-04', mobile: 130, desktop: 190 },
    { date: '2024-04-05', mobile: 160, desktop: 220 },
    { date: '2024-04-06', mobile: 140, desktop: 205 },
    { date: '2024-04-07', mobile: 180, desktop: 215 },
    // ...add more data as needed
  ];

  const [walletHistory, setWalletHistory] = useState<
    { date: string; available: number; frozen: number }[]
  >([]);

  // Filter chart data based on selected time range
  const filteredData = React.useMemo(() => {
    if (timeRange === '7d') {
      return chartData.slice(-7);
    } else if (timeRange === '30d') {
      return chartData.slice(-30);
    }
    return chartData;
  }, [timeRange, chartData]);

  // Filter walletHistory based on selected range
  const walletChartData = React.useMemo(() => {
    if (!walletHistory.length) return [];
    if (walletRange === '1d') {
      // Show intraday points: reconstruct from transactions for the last 24 hours
      const transactions = walletHistory.__rawTransactions || [];
      if (!transactions.length) return walletHistory.slice(-1);

      // Find the latest transaction date
      const lastTx = transactions[transactions.length - 1];
      const lastDateTime = new Date(lastTx.transactionDate);
      // Get all transactions within the last 24 hours
      const startDateTime = new Date(lastDateTime);
      startDateTime.setHours(lastDateTime.getHours() - 23, 0, 0, 0);

      let available = 0;
      let frozen = 0;
      const intradayTxs: { date: string; available: number; frozen: number }[] =
        [];

      transactions.forEach((tx: any) => {
        const txTime = new Date(tx.transactionDate);
        if (txTime >= startDateTime && txTime <= lastDateTime) {
          // Update balances
          if (tx.status === 'CREDITED') {
            available += tx.amount || 0;
          } else if (tx.status === 'DEBITED') {
            available -= tx.amount || 0;
          } else if (tx.status === 'FREEZED') {
            available -= tx.amount || 0;
            frozen += tx.amount || 0;
          } else if (tx.status === 'UNFREEZED') {
            available += tx.amount || 0;
            frozen -= tx.amount || 0;
          }
          intradayTxs.push({
            date: tx.transactionDate.slice(0, 16).replace('T', ' '), // "YYYY-MM-DD HH:mm"
            available: Math.max(available, 0),
            frozen: Math.max(frozen, 0),
          });
        }
      });
      // If no transactions in last 24h, show last balance
      return intradayTxs.length ? intradayTxs : walletHistory.slice(-1);
    }
    if (walletRange === '1w') {
      return walletHistory.slice(-7);
    }
    if (walletRange === '1m') {
      return walletHistory.slice(-30);
    }
    return walletHistory;
  }, [walletHistory, walletRange]);

  useEffect(() => {
    fetchBidderData();

    const fetchWalletHistory = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get('/coins/transaction-history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Transform transaction history into daily balances
        const transactions = response.data;
        // Sort by transactionDate ascending
        transactions.sort(
          (a: any, b: any) =>
            new Date(a.transactionDate).getTime() -
            new Date(b.transactionDate).getTime(),
        );

        // Build daily balances by iterating once through transactions
        let history: { date: string; available: number; frozen: number }[] = [];
        let available = 0;
        let frozen = 0;
        let lastDate = '';
        transactions.forEach((tx: any, idx: number) => {
          const date = tx.transactionDate.slice(0, 10);
          // Update balances
          if (tx.status === 'CREDITED') {
            available += tx.amount || 0;
          } else if (tx.status === 'DEBITED') {
            available -= tx.amount || 0;
          } else if (tx.status === 'FREEZED') {
            available -= tx.amount || 0;
            frozen += tx.amount || 0;
          } else if (tx.status === 'UNFREEZED') {
            available += tx.amount || 0;
            frozen -= tx.amount || 0;
          }
          // If date changes or last transaction, record balance for the day
          if (date !== lastDate) {
            history.push({
              date,
              available: Math.max(available, 0),
              frozen: Math.max(frozen, 0),
            });
            lastDate = date;
          } else if (idx === transactions.length - 1) {
            // For last transaction, ensure last date is recorded
            history[history.length - 1] = {
              date,
              available: Math.max(available, 0),
              frozen: Math.max(frozen, 0),
            };
          }
        });

        // Fill missing days (carry forward previous balance)
        if (history.length > 0) {
          // Determine how many days to fill based on selected range
          // Always fill 30 days for "1 Month", 7 for "1 Week", 1 for "1 Day"
          // But since walletHistory is used for all ranges, fill 30 days here
          const filledHistory: {
            date: string;
            available: number;
            frozen: number;
          }[] = [];
          const endDate = new Date(history[history.length - 1].date);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 29); // last 30 days

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

        // Attach raw transactions for intraday chart
        (history as any).__rawTransactions = transactions;

        setWalletHistory(history);
      } catch (error) {
        console.error('Error fetching wallet history:', error);
        setWalletHistory([]);
      }
    };
    fetchWalletHistory();
  }, []);

  const fetchBidderData = async () => {
    if (!token) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const [walletData, auctionData] = await Promise.all([
        axiosInstance
          .get('/coins/wallet-info', {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => response.data)
          .catch((error) => {
            console.error('Error fetching wallet info:', error);
            return null;
          }),
        axiosInstance
          .get('/bids/my-auctions', {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => response.data)
          .catch((error) => {
            console.error('Error fetching auction data:', error);
            return [];
          }),
      ]);

      setWalletInfo(walletData);

      if (auctionData && Array.isArray(auctionData)) {
        setRecentBids(auctionData.slice(0, 5));
        setWatchedAuctions(
          auctionData.filter((auction) => auction.status === 'active'),
        );

        const totalBids = auctionData.length;
        const wonAuctions = auctionData.filter(
          (auction) => auction.status === 'completed' && auction.isLeadingBid,
        ).length;
        const activeBids = auctionData.filter(
          (auction) => auction.status === 'active',
        ).length;

        setStats({ totalBids, wonAuctions, activeBids });
      }
    } catch (error) {
      console.error('Error fetching bidder data:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  onClick={() => navigate('/settings')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card className="p-4 bg-gray-100 border-none">
            <div className="text-4xl font-bold">{stats?.totalBids || 0}</div>
            <div className="text-sm font-bold text-gray-500">Total Bids</div>
          </Card>
          <Card className="p-4 border-yellow-300 shadow-lg shadow-yellow-100">
            <div className="text-4xl font-bold">{stats?.wonAuctions || 0}</div>
            <div className="text-sm text-gray-500">Won Auctions</div>
          </Card>
          <Card className="p-4">
            <div className="text-4xl font-bold">{stats?.activeBids || 0}</div>
            <div className="text-sm text-gray-500">Active Bids</div>
          </Card>
          <Card className="p-4">
            <div className="text-4xl font-bold">
              {watchedAuctions?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Watching</div>
          </Card>
        </div>
        {/* Split screen: Wallet Card (left) and placeholder (right) */}
        <div className="flex gap-6 mb-8">
          {/* Wallet Card (left) */}
          {/* Wallet Card (left) */}
          <div className="w-full md:w-2/5">
            <Card className="bg-gradient-to-br from-gray-50 to-zinc-300 text-gray-800 p-6 rounded-lg h-full shadow-sm border-none">
              <div className="flex justify-between items-start mb-4">
                <div className="text-gray-600 text-sm font-medium">Wallet</div>
                <div className="text-gray-800 text-lg ">
                  Aucti<span className="text-[#eaac26]">X</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-gray-500 text-xs mb-1">
                  Available Balance
                </div>
                <div className="text-2xl font-bold tracking-wider text-gray-900">
                  {loading
                    ? 'Loading...'
                    : walletInfo?.amount !== undefined
                      ? `LKR ${walletInfo.amount.toLocaleString()}`
                      : 'LKR 0'}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <div className="text-gray-500 text-xs">Frozen</div>
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
          {/* Placeholder for right side */}
          <div className="hidden md:block w-3/5 bg-gray-100 rounded-lg">
            <div className="w-full">
              <Card className="bg-gradient-to-br from-gray-50 to-zinc-300 text-gray-800 p-6 rounded-lg h-full shadow-sm border-none">
                {/* ...existing wallet info... */}
                <div className="mt-8">
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
                            ? date.slice(11, 16) // "HH:mm"
                            : new Date(date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })
                        }
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
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
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bidder Stats Cards */}
        <div className="p-6 border border-gray-200 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4">Recent Bids</h3>
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : recentBids.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Auction</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Your Bid</th>
                    <th className="text-left py-2">Current Price</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBids.map((auction) => (
                    <tr
                      key={auction.auctionId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <div className="font-medium">{auction.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {auction.description}
                        </div>
                      </td>
                      <td className="py-3 text-sm">{auction.category}</td>
                      <td className="py-3">
                        <span
                          className={`font-semibold ${auction.isLeadingBid ? 'text-green-600' : 'text-gray-700'}`}
                        >
                          LKR {auction.yourHighestBid.toLocaleString()}
                        </span>
                        {auction.isLeadingBid && (
                          <div className="text-xs text-green-600">Leading</div>
                        )}
                      </td>
                      <td className="py-3 font-semibold">
                        LKR {auction.currentPrice.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            auction.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : auction.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {auction.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(auction.endTime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No recent bids found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
