// File: components/delivery/buyer/DeliveryCard.tsx
import {
  AlertCircle,
  ChevronRight,
  MessageCircle,
  Truck,
  User,
  CalendarClock,
  Clock,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Delivery } from '@/services/deliveryService';
import { getItemIcon } from '../shared/ItemHelper';
import { getStatusInfo } from '../shared/StatusHelper';
import { getDaysInfo } from '../shared/DateHelper';

interface DeliveryCardProps {
  delivery: Delivery;
  handleContactSeller: (delivery: Delivery) => void;
  viewDeliveryDetails: (delivery: Delivery) => void;
  onReviewClick?: (delivery: Delivery) => void;
  canReview?: boolean;
  hasReview?: boolean;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  handleContactSeller,
  viewDeliveryDetails,
  onReviewClick,
  canReview = false,
  hasReview = false,
}) => {
  const statusInfo = getStatusInfo(delivery.status);
  const daysInfo = getDaysInfo(delivery.deliveryDate, delivery.status);

  return (
    <Card key={delivery.id} className="p-5 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Image and basic info */}
        <div className="flex gap-4 flex-grow">
          <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
            {delivery.auctionImage ? (
              <img
                src={delivery.auctionImage}
                alt={delivery.auctionTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                }}
              />
            ) : (
              getItemIcon(delivery.auctionCategory)
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                {delivery.auctionTitle}
              </h2>
              <div className="text-gray-500 text-sm flex items-center mt-1">
                <User className="w-3 h-3 mr-1" />
                Seller: {delivery.sellerName}
              </div>
            </div>

            <Badge
              className={`w-fit flex items-center ${statusInfo.color} border mt-2 sm:mt-0`}
            >
              {statusInfo.icon}
              {statusInfo.text}
            </Badge>
          </div>
        </div>

        {/* Delivery details */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <div className="flex flex-col justify-center px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-xs text-gray-500 flex items-center">
              <CalendarClock className="w-3 h-3 mr-1" />
              Delivery Date
            </span>
            <span className="font-medium">
              {new Date(delivery.deliveryDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex flex-col justify-center px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-xs text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Timeline
            </span>
            <span
              className={`font-medium ${daysInfo.isOverdue ? 'text-red-500' : ''}`}
            >
              {daysInfo.text}
            </span>
          </div>

          <Button
            variant="outline"
            className="self-center whitespace-nowrap flex items-center border-amber-300 text-amber-600 hover:bg-amber-50"
            onClick={() => viewDeliveryDetails(delivery)}
          >
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Warning for overdue deliveries */}
      {daysInfo.isOverdue && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          This delivery is overdue. Contact the seller for more information.
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
        <Button
          className="bg-amber-300 hover:bg-amber-400 text-gray-900 flex items-center"
          size="sm"
          onClick={() => handleContactSeller(delivery)}
        >
          <MessageCircle className="mr-1.5" size={16} />
          Contact Seller
        </Button>
        {delivery.trackingNumber && (
          <Button
            variant="outline"
            className="border-amber-300 text-amber-600 hover:bg-amber-50 flex items-center"
            size="sm"
          >
            <Truck className="mr-1.5" size={16} />
            Track Package
          </Button>
        )}
        {canReview && onReviewClick && (
          <Button
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50 flex items-center"
            size="sm"
            onClick={() => onReviewClick(delivery)}
          >
            <Star className="mr-1.5" size={16} />
            Write Review
          </Button>
        )}
        {hasReview && (
          <Button
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center"
            size="sm"
            disabled
          >
            <Star className="mr-1.5" size={16} />
            Reviewed
          </Button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Order placed on{' '}
        {new Date(delivery.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </div>
    </Card>
  );
};
