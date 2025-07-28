import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AuctionCard from '../components/molecules/auctionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { assets } from '@/config/assets';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import SellerReport from '@/components/organisms/SellerReport';

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('All');
  const pageSize = 8; // You can adjust page size as needed

  useEffect(() => {
    if (!id) return;

    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/auctions/seller/${id}`, {
          params: {
            page: currentPage,
            size: pageSize,
            filter: filter.toLowerCase(),
          },
        });

        const data = response.data;

        setAuctions(data.content || []);
        setTotalPages(data.totalPages || 0);

        // Extract seller info from the first item
        if (data.content?.length > 0 && data.content[0].seller) {
          setSellerInfo(data.content[0].seller);
        }
      } catch (error) {
        console.error('Error fetching auctions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [id, currentPage, filter]);

  // Helper function to get auction image URL
  const getAuctionImageUrl = (auction: any) => {
    if (auction.images && auction.images.length > 0) {
      const imageUrl = `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.images[0]}`;
      return imageUrl;
    }
    return '/api/placeholder/400/250';
  };

  // Helper function to get seller avatar URL
  const getSellerAvatarUrl = (auction: any) => {
    if (
      auction.seller &&
      auction.seller.profilePicture &&
      auction.seller.profilePicture.id
    ) {
      return `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.seller.profilePicture.id}`;
    }
    return '/api/placeholder/24/24';
  };

  const getSellerProfileImage = () => {
    if (sellerInfo?.profilePicture?.id) {
      return `${import.meta.env.VITE_API_URL}/user/getUserProfilePhoto?file_uuid=${sellerInfo.profilePicture.id}`;
    }
    return '/defaultProfilePhoto.jpg';
  };

  // Helper function to get background photo URL
  const getBannerPhotoUrl = () => {
    if (sellerInfo?.seller.bannerId) {
      return `${import.meta.env.VITE_API_URL}/user/getUserBannerPhoto?file_uuid=${sellerInfo.seller.bannerId}`;
    }
    return assets.default_banner_image;
  };

  const handleReportSubmit = async (
    itemId: string,
    reason: string,
    complaint: string,
  ) => {
    try {
      await axiosInstance.post(`/complaints`, {
        targetType: 'USER',
        targetId: id,
        reason: reason,
        description: complaint,
      });
      toast({
        title: 'Report Submitted',
        description: `Your report for this seller has been submitted.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Report Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <div className="min-h-screen mx-auto px-10 py-6 sm:py-8 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        {/* Header with banner background */}
        <div className="relative">
          {/* Banner background */}
          <div
            className="h-64 rounded-lg"
            style={{
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${getBannerPhotoUrl()}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          ></div>

          {/* Profile content */}
          <div className="bg-white rounded-lg shadow-sm -mt-20 mx-4 px-8 py-4 relative border">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <img
                  src={getSellerProfileImage()}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/defaultProfilePhoto.jpg';
                  }}
                />
              </div>

              {/* Profile Info */}
              <div className="flex-grow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {sellerInfo?.firstName && sellerInfo?.lastName
                        ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
                        : 'Loading...'}
                    </h1>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          sellerInfo?.verified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {sellerInfo?.verified
                          ? 'Verified Seller'
                          : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-4 md:mt-0"
                onClick={() => setReportOpen(true)}
              >
                Report
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xl sm:text-4xl font-semibold mt-6 sm:mt-10">
          Auctions by seller
        </div>
        {/* Filters */}
        <Tabs
          value={filter}
          onValueChange={(val) => {
            setFilter(val);
            setCurrentPage(0); // reset page on filter change
          }}
          className="w-full mt-3 sm:mt-4"
        >
          <TabsList>
            {['All', 'Ongoing', 'Upcoming', 'Ended'].map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Auction Cards Grid */}
        {loading ? (
          <div className="mt-8 text-center">Loading...</div>
        ) : auctions.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">
            No auctions found for this seller
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            {auctions.map((auction, index) => {
              const imageUrl = getAuctionImageUrl(auction);
              const avatarUrl = getSellerAvatarUrl(auction);

              return (
                <AuctionCard
                  key={auction.id || index}
                  imageUrl={imageUrl}
                  productName={auction.title}
                  category={auction.category}
                  sellerName={
                    auction.seller?.firstName && auction.seller?.lastName
                      ? `${auction.seller.firstName} ${auction.seller.lastName}`
                      : 'Unknown Seller'
                  }
                  sellerAvatar={avatarUrl}
                  startingPrice={
                    auction.startingPrice?.toLocaleString() || 'N/A'
                  }
                  timeRemaining={auction.endTime}
                />
              );
            })}
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-4">
          <Button
            variant="outline"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          >
            Previous
          </Button>
          <div className="flex items-center text-sm font-medium">
            Page {currentPage + 1} of {totalPages}
          </div>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages - 1}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
            }
          >
            Next
          </Button>
        </div>
      )}

      <SellerReport
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        sellerId={id || ''}
      />
    </div>
  );
}
