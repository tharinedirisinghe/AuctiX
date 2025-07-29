// File: components/delivery/buyer/DeliveryDetailsDialog.tsx
import {
  AlertCircle,
  CalendarClock,
  MapPin,
  MessageCircle,
  Package,
  Truck,
  User,
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
import { getDaysInfo } from '../shared/DateHelper';
import { formatCurrency } from '../shared/FormatHelper';
import { useState, useEffect } from 'react';

interface DeliveryDetailsDialogProps {
  selectedDelivery: Delivery | null;
  setSelectedDelivery: (delivery: Delivery | null) => void;
  handleContactSeller: (delivery: Delivery) => void;
  isContactSellerModalOpen: boolean;
}

export const DeliveryDetailsDialog: React.FC<DeliveryDetailsDialogProps> = ({
  selectedDelivery,
  setSelectedDelivery,
  handleContactSeller,
  isContactSellerModalOpen,
}) => {
  // Create a local state to control the dialog visibility
  const [isOpen, setIsOpen] = useState(false);

  // Update local open state when selectedDelivery changes
  useEffect(() => {
    if (selectedDelivery && !isContactSellerModalOpen) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [selectedDelivery, isContactSellerModalOpen]);

  // Handle dialog close
  const handleClose = () => {
    setIsOpen(false);
    // Use setTimeout to prevent state update conflicts
    setTimeout(() => {
      setSelectedDelivery(null);
    }, 0);
  };

  // If no delivery is selected, render nothing
  if (!selectedDelivery) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
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
                  alt={selectedDelivery.auctionTitle}
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
                {selectedDelivery.auctionTitle}
              </h3>
              {selectedDelivery.auctionCategory && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 mt-1">
                  {selectedDelivery.auctionCategory}
                </Badge>
              )}
              {selectedDelivery.amount && (
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
                Seller Information
              </h4>
              <p className="font-medium">{selectedDelivery.sellerName}</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <CalendarClock className="w-4 h-4 mr-1" />
                Delivery Timeline
              </h4>
              <p className="font-medium">
                {new Date(selectedDelivery.deliveryDate).toLocaleDateString(
                  undefined,
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )}
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
                Last updated:{' '}
                {new Date(selectedDelivery.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Delivery Address
            </h4>
            <p className="text-sm text-gray-600">
              {selectedDelivery.deliveryAddress}
            </p>
          </div>

          {getDaysInfo(selectedDelivery.deliveryDate, selectedDelivery.status)
            .isOverdue && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              This delivery is overdue. Contact the seller for more information.
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
              onClick={handleClose}
              type="button"
            >
              Close
            </Button>

            <div className="flex gap-2">
              {selectedDelivery.trackingNumber && (
                <Button
                  size="sm"
                  className="border-amber-300 text-amber-600 hover:bg-amber-50 flex items-center"
                  variant="outline"
                  type="button"
                >
                  <Truck className="mr-1.5" size={16} />
                  Track Package
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
