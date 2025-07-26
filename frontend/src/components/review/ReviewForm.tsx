import React, { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { reviewService, ReviewCreateRequest } from '@/services/reviewService';
import { useToast } from '@/components/ui/use-toast';

interface ReviewFormProps {
  deliveryId: string;
  auctionTitle: string;
  sellerName: string;
  onReviewSubmitted?: (review: any) => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  deliveryId,
  auctionTitle,
  sellerName,
  onReviewSubmitted,
  onCancel,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleStarHover = (starValue: number) => {
    setHoveredRating(starValue);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting your review.",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.trim().length === 0) {
      toast({
        title: "Review Text Required",
        description: "Please write a review before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reviewData: ReviewCreateRequest = {
        deliveryId,
        rating,
        reviewText: reviewText.trim(),
      };

      const createdReview = await reviewService.createReview(reviewData);
      
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully!",
      });

      if (onReviewSubmitted) {
        onReviewSubmitted(createdReview);
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.response?.data || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Write a Review
          </h3>
          <div className="text-sm text-gray-600">
            <p><strong>Item:</strong> {auctionTitle}</p>
            <p><strong>Seller:</strong> {sellerName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rating *</label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
              {(rating > 0 || hoveredRating > 0) && (
                <Badge variant="outline" className="ml-3">
                  {getRatingText(hoveredRating || rating)}
                </Badge>
              )}
            </div>
          </div>

          {/* Review Text Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review *</label>
            <Textarea
              placeholder="Share your experience with this seller and the delivery process..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              className="resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {reviewText.length}/1000 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || reviewText.trim().length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};