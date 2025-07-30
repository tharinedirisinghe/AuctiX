import { useEffect, useState } from 'react';
import { CheckCircle, ArrowDownCircle, EyeOffIcon, Image } from 'lucide-react'; // Removed Clock icon
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';
import { ImageSlider } from './ImageSlider';

interface WatchlistGridItemProps {
  auction: {
    id: string;
    category: string;
    title: string;
    description: string;
    images: string[];
    sellerName: string;
    startingPrice: number;
    startTime: string;
    endTime: string;
    currentHighestBidAmount: number;
    currentHighestBidderName: string;
    bidCount: number;
  };
  onRemove: (auctionId: string) => void;
  userBidAmount?: number | null;
  isUserHighBidder: boolean;
}

export function WatchlistGridItem({
  auction,
  onRemove,
  userBidAmount,
  isUserHighBidder,
}: WatchlistGridItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(price);
  };

  const getAuctionStatusAndTimer = (startTime: string, endTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    let status: 'upcoming' | 'active' | 'ended';
    let diff = 0;

    if (now < start) {
      status = 'upcoming';
      diff = start - now;
    } else if (now >= start && now <= end) {
      status = 'active';
      diff = end - now;
    } else {
      status = 'ended';
      diff = 0; // Auction has ended
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let bgColor, timerText;

    if (status === 'upcoming') {
      bgColor = 'bg-blue-400';
      timerText = `Starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (status === 'active') {
      bgColor = 'bg-yellow-400';
      timerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      // status === 'ended'
      bgColor = 'bg-red-500';
      timerText = 'Expired';
    }

    return { bgColor, timerText, status };
  };

  const [timer, setTimer] = useState(() =>
    getAuctionStatusAndTimer(auction.startTime, auction.endTime),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(getAuctionStatusAndTimer(auction.startTime, auction.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.startTime, auction.endTime]);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(auction.id);
    } finally {
      setIsRemoving(false);
    }
  };

  // user's bid status text and color
  let bidStatusText = '';
  let bidStatusClass = '';
  let BidStatusIcon = null;

  const hasUserBid =
    userBidAmount !== null && userBidAmount !== undefined && userBidAmount > 0;

  if (hasUserBid) {
    if (isUserHighBidder) {
      bidStatusText = 'You are High Bidder';
      bidStatusClass = 'text-green-700 bg-green-100';
      BidStatusIcon = CheckCircle;
    } else if (userBidAmount < auction.currentHighestBidAmount) {
      bidStatusText = 'Outbid';
      bidStatusClass = 'text-red-700 bg-red-100';
      BidStatusIcon = ArrowDownCircle;
    }
  }

  return (
    <Card className="w-full sm:max-w-[280px] rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <div className="relative w-full h-28 bg-gray-100 overflow-hidden">
        {/* <ImageSlider images={auction.images} /> */}
        <img
          src={auction.images[0] || '/placeholder.svg?height=112&width=280'}
          alt={auction.title}
          width={280}
          height={112}
          className="w-full h-full object-cover"
        />{' '}
        <div
          className={`absolute top-2 left-2 ${timer.bgColor} text-xs font-medium py-1 px-2 rounded-md text-black`}
        >
          {timer.timerText}
        </div>
      </div>

      <CardContent className="p-2 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="font-semibold text-base line-clamp-2 mb-0.5">
            {auction.title}
          </h3>
          <p className="text-xs text-gray-500 mb-1">{auction.category}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="text-[10px]">
                {auction.sellerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600">
              By {auction.sellerName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500">Current Bid</div>
              <div className="font-bold text-lg text-green-600">
                {formatPrice(auction.currentHighestBidAmount)}
              </div>
            </div>
            <div className="text-right">
              {/* <div className="text-xs text-gray-500">Bids</div>
              <div className="font-medium text-sm">{auction.bidCount}</div> */}
            </div>
          </div>

          <div className="flex items-center justify-center min-h-[28px] px-1 py-0.5">
            {bidStatusText ? (
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold ${bidStatusClass}`}
              >
                {BidStatusIcon && (
                  <BidStatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="truncate">{bidStatusText}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-500 truncate text-center w-full">
                {auction.currentHighestBidderName
                  ? `by ${auction.currentHighestBidderName}`
                  : ''}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-gray-100">
            <div className="text-xs text-gray-500">Starting Price</div>
            <div className="font-semibold text-base">
              {formatPrice(auction.startingPrice)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 mt-auto pt-2 border-t border-gray-100">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
              >
                <EyeOffIcon className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Watchlist</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{auction.title}" from your
                  watchlist? You will no longer receive notifications for
                  auction events and auction chat
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant={'destructive'}
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Link to={`/auction-details/` + auction.id}>
            <Button size="sm" className="h-7 px-3 text-xs">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
