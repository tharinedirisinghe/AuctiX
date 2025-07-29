// File: src/components/delivery/seller/DeliveryDetailsDialog.tsx
import React from 'react';
import {
  Calendar,
  Package,
  User,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Delivery } from '@/services/deliveryService';
import { getItemIcon } from '../shared/ItemHelper';
import { getStatusInfo } from '../shared/StatusHelper';
import { getDaysInfo, isValidDate } from '../shared/DateHelper';
import { formatCurrency } from '../shared/FormatHelper';

interface DeliveryDetailsDialogProps {
  selectedDelivery: Delivery | null;
  setSelectedDelivery: (delivery: Delivery | null) => void;
  openDatePicker: (id: string, currentDate: string) => void;
}

export const DeliveryDetailsDialog: React.FC<DeliveryDetailsDialogProps> = ({
  selectedDelivery,
  setSelectedDelivery,
  openDatePicker,
}) => {
  if (!selectedDelivery) return null;

  // Improved date formatting with better error handling
  const formatDate = (dateString: string): string => {
    try {
      if (!isValidDate(dateString)) {
        return 'Invalid date';
      }
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog
      open={!!selectedDelivery}
      onOpenChange={(open) => !open && setSelectedDelivery(null)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
              {selectedDelivery.auctionImage ? (
                <img
                  src={selectedDelivery.auctionImage}
                  alt={selectedDelivery.auctionTitle || 'Auction item'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                  }}
                />
              ) : (
                getItemIcon(selectedDelivery.auctionCategory)
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDelivery.auctionTitle || 'Untitled Auction'}
              </h3>
              {selectedDelivery.auctionCategory && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 mt-1">
                  {selectedDelivery.auctionCategory}
                </Badge>
              )}
              {selectedDelivery.amount !== undefined && (
                <p className="mt-1 font-medium">
                  {formatCurrency(selectedDelivery.amount)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1" />
                Buyer Information
              </h4>
              <p className="font-medium">
                {selectedDelivery.buyerName || 'Unknown Buyer'}
              </p>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {selectedDelivery.buyerLocation ||
                  selectedDelivery.deliveryAddress ||
                  'No address provided'}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Delivery Timeline
              </h4>
              <p className="font-medium">
                {formatDate(selectedDelivery.deliveryDate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {
                  getDaysInfo(
                    selectedDelivery.deliveryDate,
                    selectedDelivery.status,
                  ).text
                }
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <Package className="w-4 h-4 mr-1" />
              Status Information
            </h4>
            <div className="flex items-center">
              <Badge
                className={`${getStatusInfo(selectedDelivery.status).color} border`}
              >
                {(() => {
                  const StatusIcon = getStatusInfo(selectedDelivery.status).iconComponent;
                  return <StatusIcon className="w-3 h-3 mr-1" />;
                })()}
                {getStatusInfo(selectedDelivery.status).text}
              </Badge>
              <span className="text-sm text-gray-500 ml-2">
                Last updated: {formatDate(selectedDelivery.updatedAt)}
              </span>
            </div>
          </div>

          {getDaysInfo(selectedDelivery.deliveryDate, selectedDelivery.status)
            .isOverdue && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              This delivery is overdue. Please update the status or change the
              delivery date.
            </div>
          )}

          {selectedDelivery.notes && (
            <div className="mt-4 bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{selectedDelivery.notes}</p>
            </div>
          )}

          {selectedDelivery.trackingNumber && (
            <div className="mt-4 bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Tracking Number
              </h4>
              <p className="text-sm font-mono bg-white p-2 border border-gray-200 rounded">
                {selectedDelivery.trackingNumber}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="flex flex-wrap gap-2 w-full justify-between">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-600 hover:bg-amber-50"
              onClick={() => setSelectedDelivery(null)}
            >
              Close
            </Button>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() =>
                  openDatePicker(
                    selectedDelivery.id,
                    selectedDelivery.deliveryDate,
                  )
                }
                className="border-amber-300 text-amber-600 hover:bg-amber-50 flex items-center"
                variant="outline"
              >
                <Calendar className="mr-1.5" size={16} />
                Update Date
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
