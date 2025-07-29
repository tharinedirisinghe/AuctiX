import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share, Flag, Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import AuctionReport from '@/components/organisms/AuctionReport';
import { title } from 'process';
import LiveChat from '@/components/organisms/live-chat';
import AddToWatchlistButton from '@/components/molecules/AddToWatchlistButton';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuctionWebSocket } from '@/hooks/useAuctionWebSocket';
import { Link } from 'react-router-dom';

// Import the timer utilities from your auction page or create them here
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export type AuctionStatus = 'upcoming' | 'active' | 'expired';

export function useAuctionTimer(
  startTime: string,
  endTime: string,
): [TimeRemaining, AuctionStatus] {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [status, setStatus] = useState<AuctionStatus>('active');
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [isOffsetReady, setIsOffsetReady] = useState<boolean>(false);

  // Fetch server time offset once on mount
  useEffect(() => {
    const fetchServerOffset = async () => {
      try {
        // TEMPORARILY SKIP SERVER TIME SYNC FOR TESTING
        setServerOffset(0);
        setIsOffsetReady(true);
        console.log('Using client time for testing');
      } catch (error) {
        console.error('Failed to sync server time, using client time:', error);
        setServerOffset(0);
        setIsOffsetReady(true);
      }
    };

    fetchServerOffset();
  }, []);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      // Don't calculate until we have server offset (or failed to get it)
      if (!isOffsetReady) return;

      // Get current time with server offset
      const now = Date.now() + serverOffset;

      let start: number;
      let end: number;

      try {
        start = new Date(startTime).getTime();
        end = new Date(endTime).getTime();

        if (isNaN(start) || isNaN(end)) {
          console.error('Invalid date format:', { startTime, endTime });
          setStatus('active');
          return;
        }

        if (end <= start) {
          console.error('End time must be after start time:', {
            startTime,
            endTime,
          });
          setStatus('expired');
          return;
        }
      } catch (error) {
        console.error('Date parsing error:', error);
        setStatus('active');
        return;
      }

      // Add small buffer to prevent flickering during transitions
      const BUFFER_MS = 2000; // 2 second buffer

      // Determine status with buffer zones
      if (now < start - BUFFER_MS) {
        // Auction hasn't started yet
        const diff = start - now;
        setStatus('upcoming');
        setTimeRemaining(calculateTimeComponents(diff));
      } else if (now > end + BUFFER_MS) {
        // Auction has ended
        setStatus('expired');
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        // Auction is active (includes buffer zones around start/end)
        const diff = end - now;
        setStatus('active');
        setTimeRemaining(
          diff > 0
            ? calculateTimeComponents(diff)
            : { days: 0, hours: 0, minutes: 0, seconds: 0 },
        );
      }
    };

    const calculateTimeComponents = (milliseconds: number): TimeRemaining => {
      if (milliseconds <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(milliseconds / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((milliseconds % (1000 * 60)) / 1000),
      };
    };

    if (startTime && endTime && isOffsetReady) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime, serverOffset, isOffsetReady]);

  return [timeRemaining, status];
}

// Keep your existing getAuctionTimerText function unchanged
export function getAuctionTimerText(
  time: TimeRemaining,
  status: AuctionStatus,
) {
  const { days, hours, minutes, seconds } = time;

  if (status === 'expired') {
    return 'Expired';
  }

  const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  return timeString;
}

interface BidHistory {
  bidder: {
    id: string;
    name: string;
    avatar: string;
  };
  amount: number;
  timestamp: string;
}

interface ProductDetails {
  id: string;
  category: string;
  title: string;
  description: string;
  images: string[];
  startingPrice: number;
  currentBid: number;
  bidIncrement: number;
  currentBidder: {
    id: string;
    name: string;
    avatar: string;
  };
  seller: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    seller?: {
      sellerId: string;
      isVerified: boolean;
      isActive: boolean;
      bannerId: string | null;
    };
  };
  endTime: string;
  startTime: string;
  bidHistory: BidHistory[];
  deletionStatus?: 'ACTIVE' | 'DELETED';
  deleted?: boolean;
}

function calculateBidIncrement(
  startingPrice: number,
  currentBid: number,
): number {
  const effectiveBid = Math.max(startingPrice, currentBid || 0);

  // Industry-standard tiered increment system
  if (effectiveBid < 1000) {
    return 50; // LKR 50 increments for bids under 1K
  } else if (effectiveBid < 5000) {
    return 100; // LKR 100 increments for 1K-5K
  } else if (effectiveBid < 10000) {
    return 250; // LKR 250 increments for 5K-10K
  } else if (effectiveBid < 25000) {
    return 500; // LKR 500 increments for 10K-25K
  } else if (effectiveBid < 50000) {
    return 1000; // LKR 1K increments for 25K-50K
  } else if (effectiveBid < 100000) {
    return 2500; // LKR 2.5K increments for 50K-100K
  } else if (effectiveBid < 250000) {
    return 5000; // LKR 5K increments for 100K-250K
  } else if (effectiveBid < 500000) {
    return 10000; // LKR 10K increments for 250K-500K
  } else if (effectiveBid < 1000000) {
    return 25000; // LKR 25K increments for 500K-1M
  } else if (effectiveBid < 2500000) {
    return 50000; // LKR 50K increments for 1M-2.5M
  } else {
    return 100000; // LKR 100K increments for 2.5M+
  }
}

const AuctionDetailsPage = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  // console.log('Product Deleted Status:', product?.deletionStatus);

  const isBiddingDisabled = product?.deletionStatus === 'DELETED';

  // Use the auction timer hook
  const [timeRemaining, auctionStatus] = useAuctionTimer(
    product?.startTime || '',
    product?.endTime || '',
  );
  const timerText = getAuctionTimerText(timeRemaining, auctionStatus);

  function transformBidData(backendData: any) {
    const getAvatarUrl = (profilePicture: { id: any } | null | undefined) => {
      if (profilePicture?.id) {
        return `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${profilePicture.id}`;
      }
      return '/defaultProfilePhoto.jpg';
    };

    const transformUser = (user: {
      username: any;
      firstName: any;
      lastName: any;
      profilePicture?: { id: any } | null;
    }) => ({
      id: user.username,
      name: `${user.firstName} ${user.lastName}`,
      avatar: getAvatarUrl(user?.profilePicture),
    });

    // REPLACE the return statement in transformBidData function with this:
    return {
      id: backendData.id,
      category: backendData.category,
      title: backendData.title,
      description: backendData.description,
      images: backendData.images || [],
      startingPrice: backendData.startingPrice || 5000,
      currentBid: backendData.currentHighestBid?.amount || 0,
      bidIncrement: calculateBidIncrement(
        backendData.startingPrice,
        backendData.currentHighestBid?.amount || 0,
      ),
      currentBidder: backendData.currentHighestBid?.bidder
        ? transformUser(backendData.currentHighestBid.bidder)
        : {
            id: '',
            name: 'No bidder yet',
            avatar: '/defaultProfilePhoto.jpg',
          },
      seller: {
        ...backendData.seller,
        profilePicture: getAvatarUrl(backendData.seller.profilePicture),
      },
      endTime: backendData.endTime,
      startTime: backendData.startTime,
      // Add deletion status fields
      isDeleted: backendData.isDeleted || false,
      deletionStatus: backendData.deletionStatus || null,
      status: backendData.status,
      bidHistory: backendData.bidHistory.map((bid: any) => ({
        bidder: transformUser(bid.bidder),
        amount: bid.amount,
        timestamp: bid.bidTime,
      })),
    };
  }

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/auctions/${auctionId}`);
        const transformedData = transformBidData(response.data);
        setProduct(transformedData);
        // --- MODIFICATION HERE ---
        const initialBidSuggestion =
          transformedData.currentBid > 0
            ? transformedData.currentBid + transformedData.bidIncrement
            : transformedData.startingPrice; // If no current bid, start from startingPrice

        setBidAmount(initialBidSuggestion);
        // --- END MODIFICATION ---
      } catch (err) {
        console.error('Error fetching auction details:', err);
        setError('Failed to load auction details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (auctionId) {
      fetchAuctionDetails();
    }
  }, [auctionId]);

  // FIXED WebSocket callback with proper error handling
  const handleBidUpdate = useCallback(
    (payload: any) => {
      console.log('WebSocket received payload:', payload); // ✅ Add this
      try {
        if (!payload || !payload.newBid) {
          console.warn('Invalid WebSocket payload received:', payload);
          return;
        }

        const newBid = payload.newBid;
        const updatedHistory = payload.bidHistory || [];

        if (!product) {
          console.warn('Product not loaded yet, skipping WebSocket update');
          return;
        }

        const updatedProduct = { ...product };
        updatedProduct.currentBid = newBid.amount || 0;

        if (newBid.bidder) {
          updatedProduct.currentBidder = {
            id: newBid.bidder.username || '',
            name: `${newBid.bidder.firstName || 'Unknown'} ${newBid.bidder.lastName || 'User'}`,
            avatar: newBid.bidder.profilePicture?.id
              ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${newBid.bidder.profilePicture.id}`
              : '/defaultProfilePhoto.jpg',
          };
        } else {
          updatedProduct.currentBidder = {
            id: '',
            name: 'Anonymous Bidder',
            avatar: '/defaultProfilePhoto.jpg',
          };
        }

        updatedProduct.bidHistory = updatedHistory.map((bid: any) => ({
          bidder: {
            id: bid.bidder?.username || '',
            name: `${bid.bidder?.firstName || 'Unknown'} ${bid.bidder?.lastName || 'User'}`,
            avatar: bid.bidder?.profilePicture?.id
              ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${bid.bidder.profilePicture.id}`
              : '/defaultProfilePhoto.jpg',
          },
          amount: bid.amount || 0,
          timestamp: bid.bidTime || new Date().toISOString(),
        }));

        // Recalculate increment with new system
        updatedProduct.bidIncrement = calculateBidIncrement(
          updatedProduct.startingPrice,
          updatedProduct.currentBid,
        );

        setProduct(updatedProduct);
        // 🔥 KEY FIX: Update bid amount input when new bid comes in
        const newMinimumBid =
          updatedProduct.currentBid + updatedProduct.bidIncrement;
        setBidAmount(newMinimumBid);
      } catch (error) {
        console.error('Error processing WebSocket update:', error);
      }
    },
    [product],
  ); // only include 'product', no need for bidAmount

  // Attach the memoized function
  useAuctionWebSocket(auctionId!, handleBidUpdate);

  useEffect(() => {
    if (product) {
      console.log('Auction dates received:', {
        startTime: product.startTime,
        endTime: product.endTime,
        startTimeParsed: new Date(product.startTime).toString(),
        endTimeParsed: new Date(product.endTime).toString(),
        now: new Date().toString(),
      });
    }
  }, [product]);

  const handleIncrementBid = () => {
    if (!product) return;
    setBidAmount(bidAmount + product.bidIncrement);
  };

  const handleDecrementBid = () => {
    if (!product) return;

    const minAllowedBid =
      product.currentBid > 0
        ? product.currentBid + product.bidIncrement
        : product.startingPrice;

    // Decrease by one increment, but don't go below minimum
    const newBidAmount = bidAmount - product.bidIncrement;
    if (newBidAmount >= minAllowedBid) {
      setBidAmount(newBidAmount);
    } else {
      setBidAmount(minAllowedBid);
    }
  };

  // Updated bid validation with better UX
  const validateBidAmount = (
    amount: number,
  ): { isValid: boolean; message?: string } => {
    if (!product) return { isValid: false, message: 'Product not loaded' };

    const minAllowedBid =
      product.currentBid > 0
        ? product.currentBid + product.bidIncrement
        : product.startingPrice;

    if (amount < minAllowedBid) {
      return {
        isValid: false,
        message: `Minimum bid is LKR ${minAllowedBid.toLocaleString()}${product.currentBid > 0 ? ` (${product.bidIncrement.toLocaleString()} increment)` : ''}`,
      };
    }

    if (amount > 999_999_999) {
      return { isValid: false, message: 'Bid amount too large' };
    }

    return { isValid: true };
  };

  const handlePlaceBid = async () => {
    if (!product || !auctionId) return;

    if (product.deleted) {
      toast({
        title: 'Auction Deleted',
        description: 'You cannot place a bid on a deleted auction.',
        variant: 'destructive',
      });
      return;
    }

    // Pre-validation checks
    if (auctionStatus !== 'active') {
      toast({
        title: 'Bid Not Allowed',
        description:
          auctionStatus === 'upcoming'
            ? 'This auction has not started yet'
            : 'This auction has already ended',
        variant: 'destructive',
      });
      return;
    }

    const minAllowedBid =
      product.currentBid > 0
        ? product.currentBid + product.bidIncrement
        : product.startingPrice;

    if (bidAmount < minAllowedBid) {
      toast({
        title: 'Invalid Bid Amount',
        description: `Minimum bid is LKR ${minAllowedBid.toLocaleString()}`,
        variant: 'destructive',
      });
      setBidAmount(minAllowedBid);
      return;
    }

    try {
      await axiosInstance.post(`/bids/place`, {
        auctionId: auctionId,
        amount: bidAmount.toString(),
      });

      toast({
        title: 'Bid Placed Successfully!',
        description: `Your bid of LKR ${bidAmount.toLocaleString()} was placed successfully.`,
        variant: 'default',
      });

      // Clear any previous errors
      setError(null);
    } catch (err: any) {
      console.error('Error placing bid:', err);

      // Handle different error types based on response structure
      const errorData = err?.response?.data;
      let errorTitle = 'Bid Failed';
      let errorMessage = 'Failed to place bid. Please try again.';

      if (errorData) {
        // Handle structured error responses
        if (
          typeof errorData === 'object' &&
          errorData.error &&
          errorData.message
        ) {
          errorTitle = getErrorTitle(errorData.error);
          errorMessage = errorData.message;
        }
        // Handle simple string responses
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      // Handle specific HTTP status codes
      if (err?.response?.status === 401) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please log in to place a bid';

        // Optional: Redirect to login page
        // window.location.href = '/login';
      } else if (err?.response?.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage =
          errorData?.message ||
          'You are not allowed to place bids on this auction';
      } else if (err?.response?.status === 409) {
        errorTitle = 'Bid Conflict';
        // The error message from backend should be descriptive enough
      } else if (err?.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'A server error occurred. Please try again later.';
      }

      setError(errorMessage);

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });

      // Clear error after 10 seconds for better UX
      setTimeout(() => setError(null), 10000);
    }
  };

  const handleShareAuction = async () => {
    if (!product) return;

    const shareData = {
      title: `${product.title} - Auction`,
      text: `Check out this auction: ${product.title}\nCurrent bid: LKR ${product.currentBid?.toLocaleString()}\n${getTimerLabel(auctionStatus)}: ${timerText}`,
      url: window.location.href,
    };

    // Check if the Web Share API is supported
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
        // toast({
        //   title: 'Shared Successfully',
        //   description: 'Auction shared successfully!',
        //   variant: 'default',
        // });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Auction link copied to clipboard!',
          variant: 'default',
        });
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        toast({
          title: 'Link Copied',
          description: 'Auction link copied to clipboard!',
          variant: 'default',
        });
      }
    }
  };

  const renderBidButton = () => {
    if (!product) return null;

    // console.log('DEBUG: product status', {
    //   isDeleted: product.deleted,
    //   // status: product.status,
    // });

    if (product.deleted) {
      return (
        <Button
          className="w-full bg-gray-200 text-gray-600 cursor-not-allowed"
          disabled
        >
          Auction Deleted
        </Button>
      );
    }

    if (auctionStatus === 'upcoming') {
      return (
        <Button
          className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
          disabled
        >
          Auction Starts {getAuctionTimerText(timeRemaining, auctionStatus)}
        </Button>
      );
    }

    if (auctionStatus === 'expired') {
      return (
        <Button
          className="w-full bg-gray-200 text-gray-600 cursor-not-allowed"
          disabled
        >
          Auction Ended
        </Button>
      );
    }

    const validation = validateBidAmount(bidAmount);
    const minAllowedBid =
      product.currentBid > 0
        ? product.currentBid + product.bidIncrement
        : product.startingPrice;

    return (
      <div className="space-y-2">
        {isBiddingDisabled && (
          <p className="text-red-500 text-sm mt-2">
            ❌ This auction is deleted. Bidding is disabled.
          </p>
        )}

        <Button
          onClick={handlePlaceBid}
          disabled={!validation.isValid || isBiddingDisabled}
          className={`w-full ${
            validation.isValid
              ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {validation.isValid
            ? `Place Bid - LKR ${bidAmount.toLocaleString()}`
            : `Minimum: LKR ${minAllowedBid.toLocaleString()}`}
        </Button>

        {/* Show increment info */}
        <p className="text-xs text-gray-500 text-center">
          Bid increments: LKR {product.bidIncrement.toLocaleString()}
        </p>

        {!validation.isValid && validation.message && (
          <p className="text-xs text-red-500 text-center">
            {validation.message}
          </p>
        )}
      </div>
    );
  };

  // Helper function to get user-friendly error titles
  const getErrorTitle = (errorCode: string): string => {
    const errorTitles: { [key: string]: string } = {
      AUTHENTICATION_REQUIRED: 'Login Required',
      USER_NOT_FOUND: 'Session Expired',
      INVALID_BID: 'Invalid Bid',
      BID_CONFLICT: 'Bid Conflict',
      ACCESS_DENIED: 'Access Denied',
      INTERNAL_ERROR: 'Server Error',
    };

    return errorTitles[errorCode] || 'Bid Failed';
  };

  const [reportOpen, setReportOpen] = useState(false);
  const handleReportSubmit = async (
    itemId: string,
    reason: string,
    complaint: string,
  ) => {
    await axiosInstance.post(`/complaints`, {
      targetType: 'AUCTION',
      targetId: itemId,
      reason: reason,
      description: complaint,
    });
    toast({
      title: 'Report Submitted',
      description: `Your report for "${product?.title}" has been submitted.`,
      variant: 'success',
    });
  };

  // Function to get the appropriate label based on auction status
  const getTimerLabel = (status: AuctionStatus) => {
    switch (status) {
      case 'upcoming':
        return 'Starts in';
      case 'active':
        return 'Closes in';
      case 'expired':
        return 'Ended';
      default:
        return 'Closes in';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <p>Loading auction details...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <p>Auction not found</p>
      </div>
    );
  }

  const handleBidAmountChange = (value: number) => {
    if (!product) return;

    if (error) setError(null);

    if (value < 0) {
      setBidAmount(0);
      return;
    }

    if (value > 999_999_999) {
      toast({
        title: 'Bid Too Large',
        description: 'Please enter a reasonable bid amount',
        variant: 'destructive',
      });
      return;
    }

    setBidAmount(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <p className="text-sm text-gray-500">{product.category}</p>
            <h1 className="text-3xl font-semibold">{product.title}</h1>
          </div>

          <div className="mb-6">
            {product.images && product.images.length > 0 && (
              <>
                <div className="mb-4">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${product.images[selectedImageIndex]}`}
                    alt={`Product image ${selectedImageIndex + 1}`}
                    className="w-full max-h-[500px] object-contain rounded-xl border"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((imgId, index) => (
                    <img
                      key={index}
                      src={`${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${imgId}`}
                      alt={`Thumbnail ${index + 1}`}
                      className={`h-20 w-20 object-cover cursor-pointer border rounded-lg ${
                        selectedImageIndex === index
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="pb-4 border-b-4 border-yellow-400">
            <br></br>
            <p className="text-2xl">
              <span className="text-gray-400">
                {getTimerLabel(auctionStatus)}{' '}
              </span>
              <span className="">
                {timerText === '0d 0h 0m 0s' && auctionStatus !== 'expired'
                  ? 'Loading...'
                  : timerText}
              </span>
            </p>
            {/* Enhanced debug info - remove after testing */}
            {/* <p className="text-xs text-gray-500">Status: {auctionStatus}</p> */}
          </div>

          <div className="bg-gray-100 p-4 rounded-md mt-4">
            <p className="text-sm text-gray-700 ">Current Highest Bid</p>
            <p className="text-4xl font-bold mb-2">
              LKR {product.currentBid?.toLocaleString()}
            </p>
            <div className="flex items-center text-sm">
              <p>By</p>
              <img
                src={
                  product.currentBidder?.avatar !== 'NULL'
                    ? product.currentBidder?.avatar
                    : '/defaultProfilePhoto.jpg'
                }
                alt={product.currentBidder?.name}
                className="w-6 h-6 rounded-full ml-2 mr-1"
              />
              <p>{product.currentBidder?.name}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">
              Starting Price: LKR {product.startingPrice?.toLocaleString()}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecrementBid}
                className="w-8 h-8 p-0"
              >
                -
              </Button>
              <Input
                type="number"
                value={bidAmount}
                onChange={(e) => handleBidAmountChange(Number(e.target.value))}
                className="text-center"
                min="0"
                max="999999999"
                step="100"
                readOnly
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleIncrementBid}
                className="w-8 h-8 p-0"
              >
                +
              </Button>
            </div>

            {renderBidButton()}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <Button
              variant="ghost"
              className="flex flex-col items-center text-xs"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="h-5 w-5 mb-1" />
              Report
            </Button>
            {/* <Button
              variant="ghost"
              className="flex flex-col items-center text-xs"
            >
              <Heart className="h-5 w-5 mb-1" />
              Add to Watchlist
            </Button> */}
            <AddToWatchlistButton
              auctionId={product.id}
              endTime={product.endTime}
            />
            <Button
              variant="ghost"
              className="flex flex-col items-center text-xs"
              onClick={handleShareAuction}
            >
              <Share className="h-5 w-5 mb-1" />
              Share
            </Button>
          </div>

          <div className="flex items-center mt-6">
            <p className="text-sm mr-2">By</p>
            <Link
              to={`/seller/${product.seller.seller?.sellerId}`}
              className="border rounded-full p-1 pr-2 flex items-center hover:bg-gray-100 transition"
            >
              <img
                src={
                  product.seller.profilePicture || '/defaultProfilePhoto.jpg'
                }
                alt={`${product.seller.firstName} ${product.seller.lastName}`}
                className="w-6 h-6 rounded-full mr-1"
              />
              <p className="text-sm">
                {product.seller.firstName} {product.seller.lastName}
              </p>
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="bid-history">Bid History</TabsTrigger>
          </TabsList>

          <TabsContent
            value="information"
            className="p-4 border rounded-md mt-2"
          >
            <h2 className="text-lg font-semibold mb-4">About this product</h2>
            <div className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
              {product.description}
            </div>
          </TabsContent>

          <TabsContent
            value="bid-history"
            className="p-4 border rounded-md mt-2"
          >
            <h2 className="text-lg font-semibold mb-4">Bid History</h2>
            {product.bidHistory.length > 0 ? (
              <ul>
                {product.bidHistory.map((bid, index) => (
                  <li key={index} className="mb-2 pb-2 border-b">
                    <div className="flex items-center">
                      <img
                        src={
                          bid.bidder?.avatar !== 'NULL'
                            ? bid.bidder?.avatar
                            : '/default-avatar.png'
                        }
                        alt={bid.bidder?.name || 'Bidder'}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <div>
                        <p className="text-sm font-medium">{bid.bidder.name}</p>
                        <p className="text-xs text-gray-500">
                          LKR {bid.amount.toLocaleString()} •{' '}
                          {new Date(bid.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No bid history available yet.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="border rounded-md p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Live Chat</h2>
        <p className="text-sm text-gray-500">
          {auctionId ? (
            <LiveChat
              auctionId={auctionId}
              type="AUCTION"
              title="Auction Chat"
            />
          ) : (
            <div>Sorry chat is unavailable</div>
          )}
        </p>
      </div>
      // Enhanced error display with better styling
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <AuctionReport
        itemId={product.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};

export default AuctionDetailsPage;
