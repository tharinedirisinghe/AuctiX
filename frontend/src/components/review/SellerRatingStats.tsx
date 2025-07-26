import React, { useEffect, useState } from 'react';
import { Star, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { reviewService, SellerRatingStats } from '@/services/reviewService';
import { ReviewDisplay } from './ReviewDisplay';

interface SellerRatingStatsProps {
  sellerId: string;
  sellerName: string;
}

export const SellerRatingStatsComponent: React.FC<SellerRatingStatsProps> = ({
  sellerId,
  sellerName,
}) => {
  const [stats, setStats] = useState<SellerRatingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviews, setShowReviews] = useState<boolean>(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const ratingStats = await reviewService.getSellerRatingStats(sellerId);
        setStats(ratingStats);
      } catch (err: any) {
        console.error('Error fetching seller rating stats:', err);
        setError('Failed to load rating statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sellerId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error || 'No rating data available'}</p>
        </div>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 4) return "bg-green-50 text-green-700 border-green-200";
    if (rating >= 3) return "bg-yellow-50 text-yellow-700 border-yellow-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Seller Rating
        </h3>
        <Badge variant="outline" className="flex items-center">
          <Users className="w-3 h-3 mr-1" />
          {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
        </Badge>
      </div>

      {stats.totalReviews === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No reviews yet</p>
          <p className="text-sm">Be the first to review {sellerName}!</p>
        </div>
      ) : (
        <>
          {/* Average Rating */}
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getRatingColor(stats.averageRating)}`}>
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center space-x-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <Badge className={`mt-2 border ${getRatingBadgeColor(stats.averageRating)}`}>
                {stats.averageRating >= 4.5 ? 'Excellent' :
                 stats.averageRating >= 4 ? 'Very Good' :
                 stats.averageRating >= 3 ? 'Good' :
                 stats.averageRating >= 2 ? 'Fair' : 'Poor'}
              </Badge>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Rating Distribution</h4>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-1 w-16">
                    <span>{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-gray-600">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Reviews */}
          {stats.recentReviews.length > 0 && (
            <Collapsible open={showReviews} onOpenChange={setShowReviews}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  {showReviews ? 'Hide' : 'Show'} Recent Reviews
                  <MessageSquare className="w-4 h-4 ml-2" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                {stats.recentReviews.map((review) => (
                  <ReviewDisplay
                    key={review.id}
                    review={review}
                    showAuctionInfo={true}
                    showBuyerInfo={true}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </Card>
  );
};