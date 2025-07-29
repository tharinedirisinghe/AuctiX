import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package, Truck, Check, AlertTriangle } from 'lucide-react';

interface StatusChangeConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: string;
  newStatus: string;
  deliveryId: string;
  auctionTitle?: string;
  isLoading?: boolean;
}

export const StatusChangeConfirmDialog: React.FC<StatusChangeConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  newStatus,
  deliveryId,
  auctionTitle,
  isLoading = false,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'packing':
        return <Package className="w-5 h-5 text-amber-600" />;
      case 'shipping':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'delivered':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getConfirmationMessage = () => {
    const newStatusDisplay = getStatusDisplayName(newStatus);
    const currentStatusDisplay = getStatusDisplayName(currentStatus);
    
    switch (newStatus.toLowerCase()) {
      case 'packing':
        return {
          title: 'Mark as Packing?',
          description: `Are you sure you want to mark this delivery as "${newStatusDisplay}"? This indicates you are preparing the item for shipment.`,
          actionText: 'Mark as Packing',
          variant: 'default' as const
        };
      case 'shipping':
        return {
          title: 'Mark as Shipping?',
          description: `Are you sure you want to mark this delivery as "${newStatusDisplay}"? This indicates the item has been shipped and is on its way to the buyer.`,
          actionText: 'Mark as Shipping',
          variant: 'default' as const
        };
      case 'delivered':
        return {
          title: 'Mark as Delivered?',
          description: `Are you sure you want to mark this delivery as "${newStatusDisplay}"? This indicates the item has been successfully delivered to the buyer. This action cannot be undone.`,
          actionText: 'Mark as Delivered',
          variant: 'default' as const
        };
      case 'cancelled':
        return {
          title: 'Cancel Delivery?',
          description: `Are you sure you want to cancel this delivery? This will mark the delivery as cancelled and may require additional coordination with the buyer.`,
          actionText: 'Cancel Delivery',
          variant: 'destructive' as const
        };
      default:
        return {
          title: 'Change Status?',
          description: `Are you sure you want to change the delivery status from "${currentStatusDisplay}" to "${newStatusDisplay}"?`,
          actionText: 'Change Status',
          variant: 'default' as const
        };
    }
  };

  const confirmationData = getConfirmationMessage();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getStatusIcon(newStatus)}
            {confirmationData.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <div className="text-sm text-gray-600">
              <strong>Delivery:</strong> {auctionTitle || `ID: ${deliveryId.substring(0, 8)}...`}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                {getStatusIcon(currentStatus)}
                {getStatusDisplayName(currentStatus)}
              </span>
              <span>→</span>
              <span className="flex items-center gap-1">
                {getStatusIcon(newStatus)}
                {getStatusDisplayName(newStatus)}
              </span>
            </div>
            <div className="mt-3">
              {confirmationData.description}
            </div>
            {newStatus.toLowerCase() === 'delivered' && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>Note:</strong> Once marked as delivered, you cannot change the status back to shipping or packing.
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              confirmationData.variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary/90'
            }
          >
            {isLoading ? 'Updating...' : confirmationData.actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};