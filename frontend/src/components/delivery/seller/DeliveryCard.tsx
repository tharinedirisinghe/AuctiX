// File: components/delivery/seller/DeliveryCard.tsx
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  MapPin,
  Package,
  Truck,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Delivery } from '@/services/deliveryService';
import { getItemIcon } from '../shared/ItemHelper';
import { getStatusInfo, isStatusButtonDisabled } from '../shared/StatusHelper';
import { getDaysInfo } from '../shared/DateHelper';
import { StatusChangeConfirmDialog } from '../shared/StatusChangeConfirmDialog';
import { useState } from 'react';

interface DeliveryCardProps {
  delivery: Delivery;
  handleUpdateStatus: (id: string, newStatus: string) => void;
  openDatePicker: (id: string, currentDate: string) => void;
  viewDeliveryDetails: (delivery: Delivery) => void;
  handleRequestAddress?: (id: string) => void;
  isLoading: boolean;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  handleUpdateStatus,
  openDatePicker,
  viewDeliveryDetails,
  handleRequestAddress,
  isLoading,
}) => {
  const statusInfo = getStatusInfo(delivery.status);
  const daysInfo = getDaysInfo(delivery.deliveryDate, delivery.status);

  // Check if buyer has valid address
  const hasValidAddress = delivery.deliveryAddress && 
    delivery.deliveryAddress.trim() !== '' && 
    !delivery.deliveryAddress.includes('Address not provided');

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    newStatus: string;
  }>({
    isOpen: false,
    newStatus: '',
  });

  // Handle status update with confirmation
  const handleStatusUpdateClick = (newStatus: string) => {
    setConfirmDialog({
      isOpen: true,
      newStatus: newStatus.toLowerCase(),
    });
  };

  // Confirm status update
  const confirmStatusUpdate = () => {
    handleUpdateStatus(delivery.id, confirmDialog.newStatus.toUpperCase());
    setConfirmDialog({ isOpen: false, newStatus: '' });
  };

  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, newStatus: '' });
  };


  return (
    <Card key={delivery.id} className="p-5 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Image and basic info */}
        <div className="flex gap-4 flex-grow">
          <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
            {delivery.auctionImage ? (
              <img
                src={delivery.auctionImage}
                alt={delivery.auctionTitle || 'Auction item'}
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
                {delivery.auctionTitle || 'Untitled Item'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:gap-4">
                <div className="text-gray-500 text-sm flex items-center mt-1">
                  <User className="w-3 h-3 mr-1" />
                  Buyer: {delivery.buyerName || 'Unknown'}
                </div>
                <div className="text-gray-500 text-sm flex items-center mt-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {delivery.buyerLocation ||
                    delivery.deliveryAddress ||
                    'No location'}
                </div>
              </div>
              {delivery.amount && (
                <div className="text-amber-600 text-sm font-semibold flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Created: {new Date(delivery.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <Badge
              className={`w-fit flex items-center ${statusInfo.color} border mt-2 sm:mt-0`}
            >
              <statusInfo.iconComponent className="w-3 h-3 mr-1" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>

        {/* Delivery details */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <div className="flex flex-col justify-center px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
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
              <Calendar className="w-3 h-3 mr-1" />
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
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Display buyer address status */}
      {hasValidAddress ? (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
          <div className="flex items-start">
            <MapPin size={16} className="mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Buyer's Delivery Address</p>
              <p className="text-sm">{delivery.deliveryAddress}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-md flex items-center justify-between text-sm border border-amber-200">
          <div className="flex items-center">
            <MapPin size={16} className="mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Buyer Address Required</p>
              <p>{delivery.addressRequested ? 'Waiting for buyer to provide delivery address. The buyer has been notified.' : 'Click to request delivery address from buyer.'}</p>
            </div>
          </div>
          {!delivery.addressRequested && handleRequestAddress && (
            <Button
              size="sm"
              onClick={() => handleRequestAddress(delivery.id)}
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white ml-4 flex-shrink-0"
            >
              Request Address
            </Button>
          )}
        </div>
      )}

      {/* Warning for overdue deliveries */}
      {daysInfo.isOverdue && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          This delivery is overdue. Please update the status or change the
          delivery date.
        </div>
      )}

      {/* Action buttons - Updated with status progression validation */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        <Button
          onClick={() => handleStatusUpdateClick('packing')}
          disabled={
            isStatusButtonDisabled(delivery.status, 'packing') || isLoading
          }
          className={`flex items-center ${
            isStatusButtonDisabled(delivery.status, 'packing')
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100'
              : 'bg-amber-300 hover:bg-amber-400 text-gray-900'
          }`}
          size="sm"
        >
          <Package className="mr-1.5" size={16} />
          Mark as Packing
        </Button>

        <Button
          onClick={() => handleStatusUpdateClick('shipping')}
          disabled={
            isStatusButtonDisabled(delivery.status, 'shipping') || isLoading
          }
          className={`flex items-center ${
            isStatusButtonDisabled(delivery.status, 'shipping')
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          size="sm"
        >
          <Truck className="mr-1.5" size={16} />
          Mark as Shipping
        </Button>

        <Button
          onClick={() => handleStatusUpdateClick('delivered')}
          disabled={
            isStatusButtonDisabled(delivery.status, 'delivered') || isLoading
          }
          className={`flex items-center ${
            isStatusButtonDisabled(delivery.status, 'delivered')
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          size="sm"
        >
          <Check className="mr-1.5" size={16} />
          Mark as Delivered
        </Button>

        <Button
          onClick={() => openDatePicker(delivery.id, delivery.deliveryDate)}
          disabled={isLoading}
          className="flex items-center border-amber-300 text-amber-600 hover:bg-amber-50 ml-auto"
          variant="outline"
          size="sm"
        >
          <Calendar className="mr-1.5" size={16} />
          Change Date
        </Button>
      </div>

      {/* Status Change Confirmation Dialog */}
      <StatusChangeConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmStatusUpdate}
        currentStatus={delivery.status}
        newStatus={confirmDialog.newStatus}
        deliveryId={delivery.id}
        auctionTitle={delivery.auctionTitle}
        isLoading={isLoading}
      />
    </Card>
  );
};
