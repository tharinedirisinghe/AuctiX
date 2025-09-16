// File: components/delivery/buyer/DeliveryDetailsDialog.tsx
import {
  AlertCircle,
  CalendarClock,
  MapPin,
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
  isContactSellerModalOpen,
}) => {
  // Create a local state to control the dialog visibility
  const [isOpen, setIsOpen] = useState(false);
  
  // Image gallery state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Gallery control functions
  const handlePreviousImage = (e: React.MouseEvent) => {
    console.log('Previous image button clicked!');
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === 0 ? (selectedDelivery?.auctionImages?.length || 1) - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    console.log('Next image button clicked!');
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === (selectedDelivery?.auctionImages?.length || 1) - 1 ? 0 : prev + 1));
  };

  const handleCloseGallery = (e: React.MouseEvent) => {
    console.log('Close gallery button clicked!');
    e.stopPropagation();
    e.preventDefault();
    setIsGalleryOpen(false);
  };
  
  // Handle opening image gallery
  const openImageGallery = () => {
    if (selectedDelivery) {
      const images = selectedDelivery.auctionImages || (selectedDelivery.auctionImage ? [selectedDelivery.auctionImage] : []);
      if (images.length > 0) {
        setCurrentImageIndex(0);
        setIsGalleryOpen(true);
      }
    }
  };

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
    <>
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
            <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
              {(() => {
                const images = selectedDelivery.auctionImages || (selectedDelivery.auctionImage ? [selectedDelivery.auctionImage] : []);
                return images.length > 0 ? (
                  <>
                    <img
                      src={images[0]}
                      alt={selectedDelivery.auctionTitle}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={openImageGallery}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                      }}
                    />
                    {images.length > 1 && (
                      <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                        +{images.length - 1}
                      </div>
                    )}
                  </>
                ) : (
                  getItemIcon(selectedDelivery.auctionCategory)
                );
              })()}
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
                  const StatusIcon = getStatusInfo(
                    selectedDelivery.status,
                  ).iconComponent;
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

    {/* Image Gallery Modal - Outside Dialog */}
    {isGalleryOpen && selectedDelivery && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]" onClick={() => setIsGalleryOpen(false)}>
        <div className="max-w-4xl max-h-screen w-full h-full flex flex-col items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          {(() => {
            const images = selectedDelivery.auctionImages || (selectedDelivery.auctionImage ? [selectedDelivery.auctionImage] : []);
            return images.length > 0 ? (
              <>
                <div className="relative">
                  <img
                    src={images[currentImageIndex]}
                    alt={`${selectedDelivery.auctionTitle} - Image ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain"
                  />

                  {/* Navigation buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-3 rounded-full hover:bg-opacity-90 z-[110] text-xl font-bold"
                        aria-label="Previous image"
                      >
                        ←
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-3 rounded-full hover:bg-opacity-90 z-[110] text-xl font-bold"
                        aria-label="Next image"
                      >
                        →
                      </button>
                    </>
                  )}

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGalleryOpen(false);
                    }}
                    className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded-full hover:bg-opacity-90 z-[110] text-xl font-bold leading-none"
                    aria-label="Close image gallery"
                  >
                    ×
                  </button>
                </div>

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="mt-4 text-white text-center">
                    {currentImageIndex + 1} of {images.length}
                  </div>
                )}

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4 max-w-full overflow-x-auto">
                    {images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 object-cover cursor-pointer rounded ${
                          index === currentImageIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null;
          })()}
        </div>
      </div>
    )}
    </>
  );
};
