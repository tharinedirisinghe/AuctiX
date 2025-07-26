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
import { SellerRatingStatsComponent } from '@/components/review/SellerRatingStats';
import { reviewService, Review, PaginatedReviews } from '@/services/reviewService';
import { ReviewDisplay } from '@/components/review/ReviewDisplay';
import { Pagination } from '@/components/ui/pagination';

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  // Reviews state
  const [reviews, setReviews] = useState<PaginatedReviews | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(0);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:8080/api/auctions/seller/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setAuctions(data);

        // Extract seller info from first auction if available
        if (data.length > 0 && data[0].seller) {
          const seller = data[0].seller;
          setSellerInfo(seller);
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching auctions:', error);
        setLoading(false);
      });
  }, [id]);

  // Fetch seller reviews
  const fetchSellerReviews = async (page: number = 0) => {
    if (!id) {
      console.log('No seller ID provided');
      return;
    }
    
    console.log('Fetching reviews for seller ID:', id);
    
    try {
      setReviewsLoading(true);
      const reviewsData = await reviewService.getSellerReviews(id, page, 10);
      console.log('Reviews data received:', reviewsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch reviews when tab changes to Reviews
  useEffect(() => {
    console.log('Tab changed to:', activeTab, 'ID:', id);
    if (activeTab === 'Reviews' && id) {
      console.log('Triggering fetchSellerReviews');
      fetchSellerReviews(currentReviewPage);
    }
  }, [activeTab, id, currentReviewPage]);

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
          Seller Information
        </div>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-3 sm:mt-4">
          <TabsList>
            {['All', 'Ongoing', 'Upcoming', 'Ended', 'Reviews'].map((filter) => (
              <TabsTrigger key={filter} value={filter}>
                {filter === 'All' ? 'All Auctions' : filter}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Auctions Tab Content */}
          <TabsContent value="All" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">All Auctions</h3>
            {loading ? (
              <div className="mt-8 text-center">Loading...</div>
            ) : auctions.length === 0 ? (
              <div className="mt-8 text-center text-muted-foreground">
                No auctions found for this seller
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
          </TabsContent>

          <TabsContent value="Ongoing" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Ongoing Auctions</h3>
            {/* Add filtered auctions logic here */}
            <div className="mt-8 text-center text-muted-foreground">
              Feature coming soon
            </div>
          </TabsContent>

          <TabsContent value="Upcoming" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Upcoming Auctions</h3>
            <div className="mt-8 text-center text-muted-foreground">
              Feature coming soon
            </div>
          </TabsContent>

          <TabsContent value="Ended" className="mt-4">
            <h3 className="text-lg font-semibold mb-4">Ended Auctions</h3>
            <div className="mt-8 text-center text-muted-foreground">
              Feature coming soon
            </div>
          </TabsContent>

          {/* Reviews Tab Content */}
          <TabsContent value="Reviews" className="mt-4">
            <div className="space-y-6">
              <div className="text-sm text-gray-500 mb-4">
                Debug: Seller ID = {id}, Active Tab = {activeTab}, Reviews Loading = {reviewsLoading.toString()}
              </div>
              
              {/* Seller Rating Statistics */}
              {id && (
                <SellerRatingStatsComponent
                  sellerId={id}
                  sellerName={
                    sellerInfo?.firstName && sellerInfo?.lastName
                      ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
                      : 'This Seller'
                  }
                />
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Reviews</h3>
                
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading reviews...</p>
                  </div>
                ) : reviews && reviews.content && reviews.content.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {reviews.content.map((review: Review) => (
                        <ReviewDisplay
                          key={review.id}
                          review={review}
                          showAuctionInfo={true}
                          showBuyerInfo={true}
                        />
                      ))}
                    </div>
                    
                    {/* Pagination */}
                    {reviews.totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentReviewPage(Math.max(0, currentReviewPage - 1))}
                            disabled={currentReviewPage === 0}
                          >
                            Previous
                          </Button>
                          <span className="flex items-center px-3 text-sm">
                            Page {currentReviewPage + 1} of {reviews.totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentReviewPage(Math.min(reviews.totalPages - 1, currentReviewPage + 1))}
                            disabled={currentReviewPage >= reviews.totalPages - 1}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                    <p className="text-sm">This seller hasn't received any reviews.</p>
                    <div className="text-xs mt-2 text-gray-400">
                      Debug: Reviews = {reviews ? JSON.stringify(reviews, null, 2) : 'null'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <SellerReport
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        sellerId={id || ''}
      />
    </div>
  );
}
