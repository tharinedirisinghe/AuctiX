import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reviewService, Review, PaginatedReviews, SellerRatingStats } from '@/services/reviewService';
import { ReviewDisplay } from './ReviewDisplay';
import { useToast } from '@/components/ui/use-toast';

interface SellerReviewsSectionProps {
  sellerId: string;
}

export const SellerReviewsSection: React.FC<SellerReviewsSectionProps> = ({
  sellerId,
}) => {
  const [reviews, setReviews] = useState<PaginatedReviews | null>(null);
  const [stats, setStats] = useState<SellerRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  const fetchReviews = async (page: number = 0) => {
    try {
      setLoading(true);
      const [reviewsData, statsData] = await Promise.all([
        reviewService.getSellerReviews(sellerId, page, 10),
        reviewService.getSellerRatingStats(sellerId)
      ]);
      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [sellerId, currentPage]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {stats && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Your Rating Overview
            </h3>
            <Badge variant="outline" className="flex items-center">
              <MessageSquare className="w-3 h-3 mr-1" />
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </Badge>
          </div>

          {stats.totalReviews === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Complete some deliveries to start receiving reviews!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className={`text-3xl font-bold ${getRatingColor(stats.averageRating)}`}>
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(stats.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">Average Rating</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Rating Breakdown</h4>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating] || 0;
                  const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1 w-12">
                        <span>{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="w-8 text-right text-gray-600">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reviews List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        
        {reviews && reviews.content.length > 0 ? (
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
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Page {currentPage + 1} of {reviews.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(reviews.totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= reviews.totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reviews yet</p>
            <p className="text-sm">Complete deliveries to start receiving reviews from buyers!</p>
          </div>
        )}
      </Card>
    </div>
  );
};