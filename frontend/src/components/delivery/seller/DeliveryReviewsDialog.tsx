import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, Calendar, MessageSquare } from 'lucide-react';
import { Delivery } from '@/services/deliveryService';
import { reviewService, Review } from '@/services/reviewService';

interface DeliveryReviewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
}

export const DeliveryReviewsDialog: React.FC<DeliveryReviewsDialogProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      if (isOpen && delivery) {
        setIsLoading(true);
        setError(null);
        try {
          const reviewData = await reviewService.getReviewByDeliveryId(delivery.id);
          setReview(reviewData);
        } catch (error) {
          console.error('Error fetching review:', error);
          setError('Failed to load review');
          setReview(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchReview();
  }, [isOpen, delivery]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
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

  if (!delivery) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Customer Review - {delivery.auctionTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Delivery Info */}
          <Card className="p-4 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Buyer:</span>
                <p className="flex items-center mt-1">
                  <User className="w-4 h-4 mr-1" />
                  {delivery.buyerName}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Delivered:</span>
                <p className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(delivery.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Review Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Loading review...</div>
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <div className="text-red-500 mb-2">⚠️ {error}</div>
              <p className="text-sm text-gray-600">
                Unable to load the review for this delivery.
              </p>
            </Card>
          ) : !review ? (
            <Card className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              </div>
              <h3 className="font-medium text-gray-600 mb-2">No Review Yet</h3>
              <p className="text-sm text-gray-500">
                The customer hasn't left a review for this delivery yet.
              </p>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-4">
                {/* Rating Header */}
                <div className="flex items-center justify-between">
                  <div>
                    {renderStars(review.rating)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getRatingText(review.rating)}
                  </Badge>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Customer Feedback:</h4>
                  <div className="bg-gray-50 p-4 rounded-md border-l-4 border-blue-200">
                    <p className="text-gray-700 italic">"{review.reviewText}"</p>
                  </div>
                </div>

                {/* Review Date */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Reviewed on {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};