import React, { useState, useEffect, useMemo } from 'react';
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
import AxiosRequest from '@/services/axiosInspector';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip as RechartsTooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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
  const [walletRange, setWalletRange] = useState<'1d' | '1w' | '1m'>('1w');
  const [bidStats, setBidStats] = useState<{
    activeBids: number;
    totalBids: number;
    leadingBidAuctions: number;
    activeOutbidAuctions: number;
    wonAuctions: number;
  } | null>(null);
  const userData = useAppSelector((state) => state.user);
  const authData = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const axiosInstance = AxiosRequest().axiosInstance;
  const token = authData?.token;

  const [walletHistory, setWalletHistory] = useState<
    { date: string; available: number; frozen: number }[]
  >([]);

  const walletChartData = React.useMemo(() => {
    if (!walletHistory.length) return [];
    if (walletRange === '1d') {
      const transactions = walletHistory.__rawTransactions || [];
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

  useEffect(() => {
    fetchBidderData();
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
  }, []);

  const fetchBidderData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [walletData, auctionData] = await Promise.all([
        axiosInstance
          .get('/coins/wallet-info', {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => response.data)
          .catch(() => null),
        axiosInstance
          .get('/bids/my-auctions', {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => response.data)
          .catch(() => []),
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

  useEffect(() => {
    // Fetch bid stats for analytics chart
    const fetchBidStats = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get('/bids/my-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBidStats(response.data);
      } catch (err) {
        setBidStats(null);
      }
    };
    fetchBidStats();
  }, [token]);

  // Prepare chart data for bidder analytics
  const bidderChartData = useMemo(() => {
    if (!bidStats) return [];
    return [
      {
        name: 'Total Bids',
        value: bidStats.totalBids,
        color: '#eaac26',
      },
      {
        name: 'Active',
        value: bidStats.activeBids,
        color: '#fbbf24',
      },
      {
        name: 'Leading',
        value: bidStats.leadingBidAuctions,
        color: '#22c55e',
      },
      {
        name: 'Outbid',
        value: bidStats.activeOutbidAuctions,
        color: '#f87171',
      },
      {
        name: 'Won',
        value: bidStats.wonAuctions,
        color: '#2563eb',
      },
    ].filter((d) => d.value > 0);
  }, [bidStats]);

  // Prepare pie chart data for bid status distribution
  const bidPieData = useMemo(() => {
    if (!bidStats) return [];
    return [
      {
        name: 'Active',
        value: bidStats.activeBids,
        color: '#fbbf24',
      },
      {
        name: 'Leading',
        value: bidStats.leadingBidAuctions,
        color: '#22c55e',
      },
      {
        name: 'Outbid',
        value: bidStats.activeOutbidAuctions,
        color: '#f87171',
      },
      {
        name: 'Won',
        value: bidStats.wonAuctions,
        color: '#2563eb',
      },
      {
        name: 'Other',
        value:
          bidStats.totalBids -
          bidStats.activeBids -
          bidStats.leadingBidAuctions -
          bidStats.activeOutbidAuctions -
          bidStats.wonAuctions,
        color: '#eaac26',
      },
    ].filter((d) => d.value > 0);
  }, [bidStats]);

  // Pie chart data for each graph (yellow theme, use hex codes)
  const activeBidsPieData = useMemo(() => {
    if (!bidStats || bidStats.activeBids === 0) return [];
    return [
      {
        label: 'Leading',
        value: bidStats.leadingBidAuctions,
        fill: '#FFD600', // yellow
      },
      {
        label: 'Outbid',
        value: bidStats.activeOutbidAuctions,
        fill: '#FFB300', // darker yellow
      },
    ].filter((d) => d.value > 0);
  }, [bidStats]);

  const allBidsPieData = useMemo(() => {
    if (!bidStats || bidStats.totalBids === 0) return [];
    return [
      {
        label: 'Active',
        value: bidStats.activeBids,
        fill: '#FFD600',
      },
      {
        label: 'Ended',
        value: bidStats.totalBids - bidStats.activeBids,
        fill: '#FFB300',
      },
    ].filter((d) => d.value > 0);
  }, [bidStats]);

  const endedBidsPieData = useMemo(() => {
    if (!bidStats || bidStats.totalBids - bidStats.activeBids === 0) return [];
    const ended = bidStats.totalBids - bidStats.activeBids;
    return [
      {
        label: 'Won',
        value: bidStats.wonAuctions,
        fill: '#FFD600',
      },
      {
        label: 'Lost',
        value: ended - bidStats.wonAuctions,
        fill: '#FFB300',
      },
    ].filter((d) => d.value > 0);
  }, [bidStats]);

  // Chart config for shadcn chart (not used for color, just for label)
  const chartConfig = {
    Leading: { label: 'Leading', color: '#FFD600' },
    Outbid: { label: 'Outbid', color: '#FFB300' },
    Active: { label: 'Active', color: '#FFD600' },
    Ended: { label: 'Ended', color: '#FFB300' },
    Won: { label: 'Won', color: '#FFD600' },
    Lost: { label: 'Lost', color: '#FFB300' },
  };

  return (
    <div className="bg-white">
      {/*<section className="relative w-full mb-5">
        <div className="relative h-64 w-full">
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
                  onClick={() => navigate('/settings')}
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>*/}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        <div className="flex gap-6 mb-8">
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
                          onClick={() => navigate('/settings')}
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
          <div className="w-full md:w-2/5">
            <Card className="bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#ffeaa3] via-[#f2ecda] to-[#fefefe] p-6 rounded-lg h-full shadow-none border-none flex flex-col justify-between">
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

        {/* Bidder Analytics Graphs - Shadcn Pie Chart style */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-none bg-gray-50 rounded-lg p-4">
          {/* All Bids: Active vs Ended */}
          <Card className="flex flex-col shadow-none border-none">
            <CardHeader className="items-center pb-0">
              <CardTitle>All Bids ({bidStats?.totalBids ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square pb-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={allBidsPieData}
                    dataKey="value"
                    label={({ label, value }) => `${label} (${value})`}
                    nameKey="label"
                  >
                    {allBidsPieData.map((entry, idx) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Active Bids: Leading vs Outbid */}
          <Card className="flex flex-col shadow-none border-none">
            <CardHeader className="items-center pb-0">
              <CardTitle>Active Bids ({bidStats?.activeBids ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square  pb-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={activeBidsPieData}
                    dataKey="value"
                    label={({ label, value }) => `${label} (${value})`}
                    nameKey="label"
                  >
                    {activeBidsPieData.map((entry, idx) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          {/* Ended Bids: Won vs Lost */}
          <Card className="flex flex-col shadow-none border-none">
            <CardHeader className="items-center pb-0">
              <CardTitle>
                Ended Bids (
                {bidStats ? bidStats.totalBids - bidStats.activeBids : 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4">
              <ChartContainer
                config={chartConfig}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square pb-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={endedBidsPieData}
                    dataKey="value"
                    label={({ label, value }) => `${label} (${value})`}
                    nameKey="label"
                  >
                    {endedBidsPieData.map((entry, idx) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-6 mb-8">
          <div className="w-full md:w-2/5">
            <Card className="bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#ffeaa3] via-[#f2ecda] to-[#fefefe] p-6 rounded-lg h-full shadow-sm border-none flex flex-col justify-between">
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
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
