// File: src/pages/User_Delivery.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { toast } from '@/components/ui/use-toast';
import {
  fetchBuyerDeliveries,
  selectBuyerDeliveries,
  selectDeliveryLoading,
  selectDeliveryError,
  clearDeliveryError,
} from '@/store/slices/deliverySlice';
import { Delivery } from '@/services/deliveryService';
import { reviewService } from '@/services/reviewService';

// Import components
import { DeliveryHeroBanner } from '@/components/delivery/buyer/DeliveryHeroBanner';
import { BuyerDeliveryStats } from '@/components/delivery/buyer/BuyerDeliveryStats';
import { DeliveryFilter } from '@/components/delivery/buyer/DeliveryFilter';
import { DeliveryCard } from '@/components/delivery/buyer/DeliveryCard';
import { DeliveryDetailsDialog } from '@/components/delivery/buyer/DeliveryDetailsDialog';
import { ContactSellerDialog } from '@/components/delivery/buyer/ContactSellerDialog';
import { EmptyDeliveryState } from '@/components/delivery/buyer/EmptyDeliveryState';
import { ErrorDisplay } from '@/components/delivery/buyer/ErrorDisplay';
import { LoadingIndicator } from '@/components/delivery/shared/LoadingIndicator';
import { DeliverySkeletons } from '@/components/delivery/shared/DeliverySkeletons';
import { Pagination } from '@/components/delivery/seller/Pagination';
import { ReviewFormDialog } from '@/components/review/ReviewFormDialog';

const UserDeliveryPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const deliveries = useSelector(selectBuyerDeliveries);
  const isLoading = useSelector(selectDeliveryLoading);
  const error = useSelector(selectDeliveryError);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Local state for modals instead of using Redux for UI state
  const [localSelectedDelivery, setLocalSelectedDelivery] =
    useState<Delivery | null>(null);
  const [isContactSellerModalOpen, setIsContactSellerModalOpen] =
    useState<boolean>(false);
  const [contactMessage, setContactMessage] = useState<string>('');

  // Review state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState<boolean>(false);
  const [reviewDelivery, setReviewDelivery] = useState<Delivery | null>(null);
  const [reviewEligibility, setReviewEligibility] = useState<{[key: string]: boolean}>({});
  const [existingReviews, setExistingReviews] = useState<{[key: string]: boolean}>({});

  // Fetch deliveries on mount
  useEffect(() => {
    dispatch(fetchBuyerDeliveries());
  }, [dispatch]);

  // Check review eligibility and existing reviews for all deliveries
  useEffect(() => {
    const checkReviewStatus = async () => {
      if (deliveries.length === 0) return;

      const eligibilityPromises = deliveries.map(async (delivery) => {
        try {
          const canReview = await reviewService.canReviewDelivery(delivery.id);
          const existingReview = await reviewService.getReviewByDeliveryId(delivery.id);
          return {
            deliveryId: delivery.id,
            canReview,
            hasReview: existingReview !== null,
          };
        } catch (error) {
          console.error(`Error checking review status for delivery ${delivery.id}:`, error);
          return {
            deliveryId: delivery.id,
            canReview: false,
            hasReview: false,
          };
        }
      });

      const results = await Promise.all(eligibilityPromises);
      
      const eligibilityMap: {[key: string]: boolean} = {};
      const reviewsMap: {[key: string]: boolean} = {};
      
      results.forEach(({ deliveryId, canReview, hasReview }) => {
        eligibilityMap[deliveryId] = canReview;
        reviewsMap[deliveryId] = hasReview;
      });

      setReviewEligibility(eligibilityMap);
      setExistingReviews(reviewsMap);
    };

    checkReviewStatus();
  }, [deliveries]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, typeFilter, statusFilter, dateFilter]);

  // Apply all filters to deliveries
  const applyFilters = (deliveries: Delivery[]) => {
    let filtered = deliveries;

    // Apply active tab filter (primary filter)
    if (activeTab !== 'all') {
      filtered = filtered.filter(
        (delivery) => delivery.status.toLowerCase() === activeTab,
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (delivery) =>
          delivery.auctionTitle?.toLowerCase().includes(search) ||
          delivery.sellerName?.toLowerCase().includes(search) ||
          delivery.id?.toLowerCase().includes(search),
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((delivery) => {
        return (
          delivery.auctionCategory?.toLowerCase() === typeFilter.toLowerCase()
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (delivery) => delivery.status.toLowerCase() === statusFilter,
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      filtered = filtered.filter((delivery) => {
        const deliveryDate = new Date(delivery.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          return deliveryDate.toDateString() === today.toDateString();
        } else if (dateFilter === 'yesterday') {
          return deliveryDate.toDateString() === yesterday.toDateString();
        } else if (dateFilter === 'last7days') {
          return deliveryDate >= lastWeek;
        } else if (dateFilter === 'last30days') {
          return deliveryDate >= lastMonth;
        }
        return true;
      });
    }

    return filtered;
  };

  // Get filtered deliveries
  const filteredDeliveries = applyFilters(deliveries);

  // Handle pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = filteredDeliveries.slice(
    indexOfFirstItem,
    Math.min(indexOfLastItem, filteredDeliveries.length),
  );
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  // Pagination controls
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // View delivery details - Using local state instead of Redux
  const viewDeliveryDetails = (delivery: Delivery) => {
    setLocalSelectedDelivery(delivery);
  };

  // Handle contact seller
  const handleContactSeller = (delivery: Delivery) => {
    setLocalSelectedDelivery(delivery);
    setIsContactSellerModalOpen(true);
  };

  const sendContactMessage = () => {
    if (contactMessage.trim() === '') return;

    // In a real application, you would send this message to the backend
    toast({
      title: 'Message Sent',
      description: `Your message has been sent to ${localSelectedDelivery?.sellerName}`,
      variant: 'default',
    });

    setContactMessage('');
    setIsContactSellerModalOpen(false);
    setLocalSelectedDelivery(null);
  };

  // Handle review click
  const handleReviewClick = (delivery: Delivery) => {
    setReviewDelivery(delivery);
    setIsReviewDialogOpen(true);
  };

  // Handle review submitted
  const handleReviewSubmitted = () => {
    // Refresh review status after successful submission
    if (reviewDelivery) {
      setExistingReviews(prev => ({
        ...prev,
        [reviewDelivery.id]: true
      }));
      setReviewEligibility(prev => ({
        ...prev,
        [reviewDelivery.id]: false
      }));
    }
    setIsReviewDialogOpen(false);
    setReviewDelivery(null);
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  // Refresh deliveries
  const handleRefresh = () => {
    dispatch(clearDeliveryError());
    dispatch(fetchBuyerDeliveries());
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Deliveries</h1>
          <p className="text-gray-500">
            Track and manage your auction deliveries
          </p>
        </header>

        <DeliveryHeroBanner />

        {/* Error Display */}
        <ErrorDisplay error={error} handleRefresh={handleRefresh} />

        {/* Loading indicator */}
        <LoadingIndicator isLoading={isLoading} />

        {/* Stats Cards */}
        <BuyerDeliveryStats
          deliveries={deliveries}
          isLoading={isLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Search & Filter */}
        <DeliveryFilter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          isLoading={isLoading}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          resetFilters={resetFilters}
        />

        {/* Delivery Cards */}
        {isLoading && !deliveries.length ? (
          <DeliverySkeletons count={3} />
        ) : filteredDeliveries.length === 0 ? (
          <EmptyDeliveryState activeTab={activeTab} />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                handleContactSeller={handleContactSeller}
                viewDeliveryDetails={viewDeliveryDetails}
                onReviewClick={handleReviewClick}
                canReview={reviewEligibility[delivery.id] || false}
                hasReview={existingReviews[delivery.id] || false}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredDeliveries.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredDeliveries.length}
            currentItemsCount={currentDeliveries.length}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Delivery Details Dialog */}
      <DeliveryDetailsDialog
        selectedDelivery={localSelectedDelivery}
        setSelectedDelivery={setLocalSelectedDelivery}
        handleContactSeller={handleContactSeller}
        isContactSellerModalOpen={isContactSellerModalOpen}
      />

      {/* Contact Seller Modal */}
      <ContactSellerDialog
        selectedDelivery={localSelectedDelivery}
        isContactSellerModalOpen={isContactSellerModalOpen}
        setIsContactSellerModalOpen={setIsContactSellerModalOpen}
        contactMessage={contactMessage}
        setContactMessage={setContactMessage}
        sendContactMessage={sendContactMessage}
      />

      {/* Review Form Dialog */}
      <ReviewFormDialog
        isOpen={isReviewDialogOpen}
        onClose={() => setIsReviewDialogOpen(false)}
        delivery={reviewDelivery}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default UserDeliveryPage;
