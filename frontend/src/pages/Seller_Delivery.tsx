// File: src/pages/Seller_Delivery.tsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchSellerDeliveries,
  updateStatus,
  updateDate,
  selectSellerDeliveries,
  selectDeliveryLoading,
  selectDeliveryError,
  clearDeliveryError,
} from '@/store/slices/deliverySlice';
import { AppDispatch } from '@/store/store'; // Added missing import
import { toast } from '@/components/ui/use-toast';
import { Delivery } from '@/services/deliveryService';

// Import components
import { DeliveryHeroBanner } from '@/components/delivery/seller/DeliveryHeroBanner';
import { DeliveryStats } from '@/components/delivery/seller/DeliveryStats';
import { DeliveryFilter } from '@/components/delivery/seller/DeliveryFilter';
import { DeliveryCard } from '@/components/delivery/seller/DeliveryCard';
import { DatePickerDialog } from '@/components/delivery/seller/DatePickerDialog';
import { DeliveryDetailsDialog } from '@/components/delivery/seller/DeliveryDetailsDialog';
import { EmptyDeliveryState } from '@/components/delivery/seller/EmptyDeliveryState';
import { Pagination } from '@/components/delivery/seller/Pagination';
import { ErrorDisplay } from '@/components/delivery/seller/ErrorDisplay';
import { LoadingIndicator } from '@/components/delivery/shared/LoadingIndicator';
import { DeliverySkeletons } from '@/components/delivery/shared/DeliverySkeletons';
import { isValidDate } from '@/components/delivery/shared/DateHelper';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';


const SellerDeliveryPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const deliveries = useSelector(selectSellerDeliveries);
  const isLoading = useSelector(selectDeliveryLoading);
  const error = useSelector(selectDeliveryError);

  // Local state for UI
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );
  const [newDate, setNewDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Fetch deliveries on mount
  useEffect(() => {
    dispatch(fetchSellerDeliveries());
  }, [dispatch]);

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, typeFilter, statusFilter, dateFilter]);

  // Apply all filters to deliveries
  const applyFilters = (deliveries: Delivery[]) => {
    let filtered = [...deliveries]; // Create a copy to avoid mutation

    // Apply active tab filter (primary filter)
    if (activeTab !== 'all') {
      filtered = filtered.filter(
        (delivery) => delivery.status?.toLowerCase() === activeTab,
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (delivery) =>
          delivery.auctionTitle?.toLowerCase().includes(search) ||
          delivery.buyerName?.toLowerCase().includes(search) ||
          delivery.id?.toLowerCase().includes(search) ||
          delivery.buyerLocation?.toLowerCase().includes(search),
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
        (delivery) =>
          delivery.status?.toLowerCase() === statusFilter.toLowerCase(),
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
        try {
          const deliveryDate = new Date(delivery.deliveryDate);
          if (isNaN(deliveryDate.getTime())) {
            // Skip invalid dates
            return false;
          }

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
        } catch (error) {
          console.error('Error filtering by date:', error);
          return false;
        }
      });
    }

    return filtered;
  };

  // Get filtered deliveries
  const filteredDeliveries = applyFilters(deliveries || []);

  // Handle pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = filteredDeliveries.slice(
    indexOfFirstItem,
    Math.min(indexOfLastItem, filteredDeliveries.length),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeliveries.length / itemsPerPage),
  );

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

  // Update delivery status
  const handleUpdateStatus = (id: string, newStatus: string) => {
    dispatch(updateStatus({ id, status: newStatus }))
      .unwrap()
      .then(() => {
        toast({
          title: 'Status Updated',
          description: `Delivery status has been updated to ${newStatus}`,
          variant: 'default',
        });
      })
      .catch((error) => {
        toast({
          title: 'Update Failed',
          description:
            typeof error === 'string' ? error : 'Could not update status',
          variant: 'destructive',
        });
      });
  };

  // Update delivery date
  const handleUpdateDeliveryDate = (id: string, newDate: string) => {
    if (!id || !newDate || !isValidDate(newDate)) {
      toast({
        title: 'Invalid Date',
        description: 'Please select a valid date',
        variant: 'destructive',
      });
      return;
    }

    dispatch(updateDate({ id, date: newDate }))
      .unwrap()
      .then(() => {
        setIsDatePickerOpen(false);
        setSelectedDeliveryId(null);
        setNewDate('');
        toast({
          title: 'Date Updated',
          description: `Delivery date has been updated to ${new Date(
            newDate,
          ).toLocaleDateString()}`,
          variant: 'default',
        });
      })
      .catch((error) => {
        toast({
          title: 'Update Failed',
          description:
            typeof error === 'string'
              ? error
              : 'Could not update delivery date',
          variant: 'destructive',
        });
      });
  };

  // Open date picker dialog
  const openDatePicker = (id: string, currentDate: string) => {
    setSelectedDeliveryId(id);
    setNewDate(currentDate);
    setIsDatePickerOpen(true);
  };

  // View delivery details
  const viewDeliveryDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
  };


  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  // Refresh deliveries
  const handleRefresh = () => {
    dispatch(clearDeliveryError());
    dispatch(fetchSellerDeliveries());
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Delivery Management</h1>
              <p className="text-gray-500">
                Track and manage your auction deliveries to buyers
              </p>
            </div>
            <Button
              onClick={() => navigate('/seller-reviews')}
              className="bg-amber-500 hover:bg-amber-600 text-white flex items-center"
            >
              <Star className="w-4 h-4 mr-2" />
              View My Reviews
            </Button>
          </div>
        </header>

        <DeliveryHeroBanner />

        {/* Error Display */}
        <ErrorDisplay error={error} handleRefresh={handleRefresh} />

        {/* Loading indicator */}
        <LoadingIndicator isLoading={isLoading} />

        {/* Stats Cards */}
        <DeliveryStats
          deliveries={deliveries || []}
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
        {isLoading && !deliveries?.length ? (
          <DeliverySkeletons count={3} />
        ) : filteredDeliveries.length === 0 ? (
          <EmptyDeliveryState
            activeTab={activeTab}
            />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                handleUpdateStatus={handleUpdateStatus}
                openDatePicker={openDatePicker}
                viewDeliveryDetails={viewDeliveryDetails}
                isLoading={isLoading}
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

      {/* Date picker dialog */}
      <DatePickerDialog
        isOpen={isDatePickerOpen}
        onClose={() => {
          setIsDatePickerOpen(false);
          setSelectedDeliveryId(null);
        }}
        newDate={newDate}
        setNewDate={setNewDate}
        handleUpdateDeliveryDate={handleUpdateDeliveryDate}
        selectedDeliveryId={selectedDeliveryId}
        isLoading={isLoading}
      />

      {/* Delivery Details Dialog */}
      <DeliveryDetailsDialog
        selectedDelivery={selectedDelivery}
        setSelectedDelivery={setSelectedDelivery}
        openDatePicker={openDatePicker}
      />

    </div>
  );
};

export default SellerDeliveryPage;
