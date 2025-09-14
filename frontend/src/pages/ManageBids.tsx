import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AxiosRequest from '@/services/axiosInspector';
import { useAppSelector } from '@/hooks/hooks';

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

type BidStats = {
  totalBids: number;
  leadingBidAuctions: number;
  activeOutbidAuctions: number;
  wonAuctions: number;
};

const ManageBids: React.FC = () => {
  const [data, setData] = useState<AuctionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BidStats | null>(null);
  const [activeShowCount, setActiveShowCount] = useState(10);
  const [endedShowCount, setEndedShowCount] = useState(10);
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');
  const authData = useAppSelector((state) => state.auth);
  const token = authData?.token;
  const axiosInstance = AxiosRequest().axiosInstance;

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get('/bids/my-auctions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const apiBids = Array.isArray(response.data?.content)
          ? response.data.content
          : response.data;
        setData(apiBids || []);
      } catch (err) {
        setError('Failed to fetch bids.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();

    const fetchStats = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get('/bids/my-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (err) {
        setStats(null);
      }
    };
    fetchStats();
  }, [token]);

  // Split data into active and ended
  const activeBids = useMemo(() => {
    const outbid = data.filter(
      (row) =>
        row.status === 'active' &&
        !(row.isLeadingBid || row.yourHighestBid === row.currentPrice),
    );
    const leading = data.filter(
      (row) =>
        row.status === 'active' &&
        (row.isLeadingBid || row.yourHighestBid === row.currentPrice),
    );
    return [...outbid, ...leading];
  }, [data]);

  const endedBids = useMemo(
    () => data.filter((row) => row.status !== 'active'),
    [data],
  );

  // Card component for a bid
  const BidCard: React.FC<{ bid: AuctionData }> = ({ bid }) => {
    const isLeading =
      bid.isLeadingBid || bid.yourHighestBid === bid.currentPrice;

    let imageUrl = '';
    if (bid.imagePaths && bid.imagePaths.length > 0) {
      const img = bid.imagePaths[0];
      imageUrl = img.startsWith('http')
        ? img
        : `http://localhost:8080/api/auctions/getAuctionImages?file_uuid=${img}`;
    }

    // Dynamic countdown timer state
    const [endDisplay, setEndDisplay] = useState(() => {
      if (bid.status === 'active') {
        const endDate = new Date(bid.endTime);
        const now = new Date();
        const diffMs = endDate.getTime() - now.getTime();
        if (diffMs > 0) {
          const diffSec = Math.floor(diffMs / 1000);
          const days = Math.floor(diffSec / (3600 * 24));
          const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
          const minutes = Math.floor((diffSec % 3600) / 60);
          const seconds = diffSec % 60;
          return (
            (days > 0 ? `${days}d ` : '') +
            (hours > 0 ? `${hours}h ` : '') +
            (minutes > 0 ? `${minutes}m ` : '') +
            `${seconds}s left`
          );
        } else {
          return 'Ending...';
        }
      } else {
        return 'Ended';
      }
    });

    useEffect(() => {
      if (bid.status !== 'active') {
        setEndDisplay('Ended');
        return;
      }
      const interval = setInterval(() => {
        const endDate = new Date(bid.endTime);
        const now = new Date();
        const diffMs = endDate.getTime() - now.getTime();
        if (diffMs > 0) {
          const diffSec = Math.floor(diffMs / 1000);
          const days = Math.floor(diffSec / (3600 * 24));
          const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
          const minutes = Math.floor((diffSec % 3600) / 60);
          const seconds = diffSec % 60;
          setEndDisplay(
            (days > 0 ? `${days}d ` : '') +
              (hours > 0 ? `${hours}h ` : '') +
              (minutes > 0 ? `${minutes}m ` : '') +
              `${seconds}s left`,
          );
        } else {
          setEndDisplay('Ending...');
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [bid.status, bid.endTime]);

    // Use a local state to avoid blinking on error
    const [imgError, setImgError] = useState(false);

    return (
      <Card className="flex flex-row items-center gap-6 p-4 mb-4 shadow-sm">
        <div>
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt="auction"
              className="w-24 h-24 object-cover rounded-md border"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg truncate">{bid.title}</div>
          <div className="text-xs text-muted-foreground truncate max-w-md mb-1">
            {bid.description}
          </div>
          <div className="flex gap-4 text-sm mb-1">
            <span className="text-gray-600">Category: {bid.category}</span>
            <span>End: {endDisplay}</span>
          </div>
          <div className="flex gap-4 text-sm mb-1">
            <span>
              Your Bid:{' '}
              <span
                className={
                  isLeading
                    ? 'font-semibold text-green-600'
                    : 'font-semibold text-red-600'
                }
              >
                LKR {bid.yourHighestBid.toLocaleString()}
              </span>
            </span>
            <span>
              Current Price:{' '}
              <span className="font-semibold">
                LKR {bid.currentPrice.toLocaleString()}
              </span>
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <Badge
              variant={
                bid.status === 'active'
                  ? 'default'
                  : bid.status === 'completed'
                    ? 'secondary'
                    : 'secondary'
              }
            >
              {bid.status}
            </Badge>
            {bid.status === 'active' &&
              (isLeading ? (
                <span className="text-green-600 text-xs font-semibold flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Leading
                </span>
              ) : (
                <span className="text-red-600 text-xs font-semibold flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                  Outbid
                </span>
              ))}
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`/auction-details/${bid.auctionId}`, '_blank')
            }
          >
            View
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="bg-white min-h-screen">
      <header
        className="relative h-28 w-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))]
from-[#ffcc5f]
via-[#eedca6]
to-[#f1f1ec] mb-0"
      >
        <h1 className="text-4xl font-semibold text-gray-800 absolute bottom-0 left-0 right-0 px-6 md:px-8 mb-4">
          My Bids
        </h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="p-4 bg-gray-100 border-none">
              <div className="text-3xl font-bold">{stats.totalBids ?? 0}</div>
              <div className="text-sm font-bold text-gray-500">Total Bids</div>
            </Card>
            <Card className="p-4">
              <div className="text-3xl font-bold text-red-600">
                {stats.activeOutbidAuctions ?? 0}
              </div>
              <div className="text-sm text-red-500">Active Outbid</div>
            </Card>
            <Card className="p-4">
              <div className="text-3xl font-bold">
                {stats.leadingBidAuctions ?? 0}
              </div>
              <div className="text-sm text-gray-500">Leading Bids</div>
            </Card>
            <Card className="p-4">
              <div className="text-3xl font-bold">{stats.wonAuctions ?? 0}</div>
              <div className="text-sm text-gray-500">Won Auctions</div>
            </Card>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8 text-lg text-gray-500">
            Loading...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-lg text-red-500">{error}</div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'active' | 'ended')}
          >
            <TabsList className="mb-2">
              <TabsTrigger value="active">Active Bids</TabsTrigger>
              <TabsTrigger value="ended">Ended Auctions</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <Card className="border-none shadow-none mb-4">
                <h2 className="text-xl font-bold px-4 pt-4 pb-2">
                  Active Bids
                </h2>
                <div className="flex flex-col gap-2">
                  {activeBids.length ? (
                    <>
                      {activeBids.slice(0, activeShowCount).map((bid) => (
                        <BidCard key={bid.auctionId} bid={bid} />
                      ))}
                      {activeShowCount < activeBids.length && (
                        <div className="flex justify-center py-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setActiveShowCount((prev) => prev + 10)
                            }
                          >
                            View More
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active bids.
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="ended">
              <Card className="border-none mb-4">
                <h2 className="text-xl font-bold px-4 pt-4 pb-2">
                  Ended Auctions
                </h2>
                <div className="flex flex-col gap-2">
                  {endedBids.length ? (
                    <>
                      {endedBids.slice(0, endedShowCount).map((bid) => (
                        <BidCard key={bid.auctionId} bid={bid} />
                      ))}
                      {endedShowCount < endedBids.length && (
                        <div className="flex justify-center py-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              setEndedShowCount((prev) => prev + 10)
                            }
                          >
                            View More
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No ended auctions.
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ManageBids;
