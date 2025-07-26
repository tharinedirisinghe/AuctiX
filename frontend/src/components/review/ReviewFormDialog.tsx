import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReviewForm } from './ReviewForm';
import { Delivery } from '@/services/deliveryService';

interface ReviewFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onReviewSubmitted?: () => void;
}

export const ReviewFormDialog: React.FC<ReviewFormDialogProps> = ({
  isOpen,
  onClose,
  delivery,
  onReviewSubmitted,
}) => {
  if (!delivery) {
    return null;
  }

  const handleReviewSubmitted = () => {
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>
        <ReviewForm
          deliveryId={delivery.id}
          auctionTitle={delivery.auctionTitle}
          sellerName={delivery.sellerName}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};