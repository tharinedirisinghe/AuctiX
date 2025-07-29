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
import {
  reviewService,
  Review,
  PaginatedReviews,
} from '@/services/reviewService';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('All');
  const pageSize = 8; // You can adjust page size as needed

  // Reviews state
  const [reviews, setReviews] = useState<PaginatedReviews | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(0);
  const [activeTab, setActiveTab] = useState('All');

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

  // Fetch seller reviews
  const fetchSellerReviews = async (page: number = 0) => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const reviewsData = await reviewService.getSellerReviews(id, page, 10);
      setReviews(reviewsData);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Reviews' && id) fetchSellerReviews(currentReviewPage);
  }, [activeTab, id, currentReviewPage]);

  const getAuctionImageUrl = (auction: any) =>
    auction.images && auction.images.length > 0
      ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.images[0]}`
      : '/api/placeholder/400/250';

  const getSellerAvatarUrl = (auction: any) =>
    auction.seller?.profilePicture?.id
      ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.seller.profilePicture.id}`
      : '/api/placeholder/24/24';

  const getSellerProfileImage = () =>
    sellerInfo?.profilePicture?.id
      ? `${import.meta.env.VITE_API_URL}/user/getUserProfilePhoto?file_uuid=${sellerInfo.profilePicture.id}`
      : '/defaultProfilePhoto.jpg';

  const getBannerPhotoUrl = () =>
    sellerInfo?.seller?.bannerId
      ? `${import.meta.env.VITE_API_URL}/user/getUserBannerPhoto?file_uuid=${sellerInfo.seller.bannerId}`
      : assets.default_banner_image;

  const handleReportSubmit = async (
    itemId: string,
    reason: string,
    complaint: string,
  ) => {
    try {
      await axiosInstance.post(`/complaints`, {
        targetType: 'USER',
        targetId: id,
        reason,
        description: complaint,
      });
      toast({
        title: 'Report Submitted',
        description: `Your report for this seller has been submitted.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Report Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <section className="relative w-full mb-5">
        {/* Banner image without padding */}
        <div className="relative h-64 w-full">
          <img
            src={`${getBannerPhotoUrl()}`}
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
                    src={getSellerProfileImage()}
                    alt="user-avatar-image"
                    className="rounded-md w-20 h-20 object-cover"
                  />
                  <div className="flex flex-col items-start ml-4 md:ml-6 ">
                    <div className="flex items-center">
                      <h3 className="font-manrope font-bold text-2xl md:text-4xl text-white">
                        {sellerInfo?.firstName && sellerInfo?.lastName
                          ? `${sellerInfo.firstName} ${sellerInfo.lastName}`
                          : 'Loading...'}
                      </h3>
                      <svg
                        className="ml-3 w-5 h-5 p-0.5 rounded-full bg-white text-gray-700 font-bold"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm md:text-base text-gray-300">
                      @{sellerInfo?.username}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                >
                  Report Seller
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="min-h-screen mx-auto  sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        <div className="text-xl sm:text-4xl font-semibold mt-6 sm:mt-10">
          Seller Information
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
                {auctions.map((auction, index) => (
                  <AuctionCard
                    key={auction.id || index}
                    imageUrl={getAuctionImageUrl(auction)}
                    productName={auction.title}
                    category={auction.category}
                    sellerName={
                      auction.seller?.firstName && auction.seller?.lastName
                        ? `${auction.seller.firstName} ${auction.seller.lastName}`
                        : 'Unknown Seller'
                    }
                    sellerAvatar={getSellerAvatarUrl(auction)}
                    startingPrice={
                      auction.startingPrice?.toLocaleString() || 'N/A'
                    }
                    startTime={auction.startTime}
                    endTime={auction.endTime}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Placeholder for other tabs */}
          {['Ongoing', 'Upcoming', 'Ended'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <h3 className="text-lg font-semibold mb-4">{tab} Auctions</h3>
              <div className="mt-8 text-center text-muted-foreground">
                Feature coming soon
              </div>
            </TabsContent>
          ))}

          {/* Reviews Tab Content */}
          <TabsContent value="Reviews" className="mt-4">
            <div className="space-y-6">
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
                            onClick={() =>
                              setCurrentReviewPage(
                                Math.max(0, currentReviewPage - 1),
                              )
                            }
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
                            onClick={() =>
                              setCurrentReviewPage(
                                Math.min(
                                  reviews.totalPages - 1,
                                  currentReviewPage + 1,
                                ),
                              )
                            }
                            disabled={
                              currentReviewPage >= reviews.totalPages - 1
                            }
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
                    <p className="text-sm">
                      This seller hasn't received any reviews.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
