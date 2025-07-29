import React from 'react';
import { Star, Calendar, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Review } from '@/services/reviewService';

interface ReviewDisplayProps {
  review: Review;
  showAuctionInfo?: boolean;
  showBuyerInfo?: boolean;
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  review,
  showAuctionInfo = false,
  showBuyerInfo = true,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600 bg-green-50 border-green-200";
    if (rating >= 3) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Header with rating and date */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <Badge className={`${getRatingColor(review.rating)} border`}>
            {getRatingText(review.rating)}
          </Badge>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(review.createdAt)}
        </div>
      </div>

      {/* Buyer info */}
      {showBuyerInfo && (
        <div className="flex items-center text-sm text-gray-600">
          <User className="w-4 h-4 mr-2" />
          <span>Reviewed by: {review.buyerName}</span>
        </div>
      )}

      {/* Auction info */}
      {showAuctionInfo && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Item:</span> {review.auctionTitle}
        </div>
      )}

      {/* Review text */}
      {review.reviewText && (
        <div className="text-gray-800">
          <p className="leading-relaxed">{review.reviewText}</p>
        </div>
      )}

      {/* Update indicator */}
      {review.updatedAt !== review.createdAt && (
        <div className="text-xs text-gray-400 italic">
          Updated on {formatDate(review.updatedAt)}
        </div>
      )}
    </Card>
  );
};