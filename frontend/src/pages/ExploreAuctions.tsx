import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { Filter } from 'lucide-react';
import AuctionCard from '../components/molecules/auctionCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
interface Seller {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture?: {
    id: string;
  } | null;
}

interface Auction {
  id: string;
  title: string;
  category: string;
  seller: Seller;
  startingPrice: number;
  startTime: string;
  endTime: string;
  images: string[];
  isPublic: boolean;
  currentHighestBid?: {
    amount: number;
    bidder: any;
  };
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

type FilterType = 'active' | 'ended' | 'upcoming';

const CATEGORIES = [
  'Electronics',
  'Computers & Tech',
  'Fashion & Clothing',
  'Home & Garden',
  'Sports & Recreation',
  'Books & Media',
  'Toys & Games',
  'Musical Instruments',
  'Tools & Equipment',
  'Collectibles & Antiques',
  'Art & Crafts',
  'Automotive',
  'Jewelry & Watches',
  'Health & Beauty',
  'Business & Industrial',
  'Traditional Items',
  'Other',
];

// Utility function to sort auctions based on filter type
const sortAuctions = (
  auctions: Auction[],
  filterType: FilterType,
): Auction[] => {
  const now = Date.now();

  return auctions.sort((a, b) => {
    const aStart = new Date(a.startTime).getTime();
    const aEnd = new Date(a.endTime).getTime();
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();

    switch (filterType) {
      case 'active':
        // Sort by remaining time (ascending) - least remaining time first
        const aTimeLeft = aEnd - now;
        const bTimeLeft = bEnd - now;
        return aTimeLeft - bTimeLeft;

      case 'upcoming':
        // Sort by time to start (ascending) - nearest opening first
        const aTimeToStart = aStart - now;
        const bTimeToStart = bStart - now;
        return aTimeToStart - bTimeToStart;

      case 'ended':
        // Sort by end time (descending) - most recently ended first
        return bEnd - aEnd;

      default:
        return 0;
    }
  });
};

// FilterContent component for filter options
const FilterContent: React.FC<{
  activeFilter: FilterType;
  selectedCategory: string;
  onFilterChange: (filter: FilterType) => void;
  onCategoryChange: (category: string) => void;
  onClose?: () => void;
}> = ({
  activeFilter,
  selectedCategory,
  onFilterChange,
  onCategoryChange,
  onClose,
}) => {
  const filters = [
    { key: 'active' as FilterType, label: 'Active Auctions' },
    { key: 'upcoming' as FilterType, label: 'Upcoming Auctions' },
    {
      key: 'ended' as FilterType,
      label: 'Ended Auctions',
      subtitle: '(Last 3 days)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div>
        <h3 className="font-medium mb-3">Auction Status</h3>
        <div className="space-y-2">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                onFilterChange(filter.key);
                // DON'T close the sidebar here - let user select category too
              }}
            >
              <div className="text-left">
                <div>{filter.label}</div>
                {filter.subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {filter.subtitle}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="font-medium mb-3">Category</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <Button
            variant={selectedCategory === '' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              onCategoryChange('');
              // DON'T close the sidebar here either
            }}
          >
            All Categories
          </Button>
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'ghost'}
              className="w-full justify-start text-sm"
              onClick={() => {
                onCategoryChange(category);
                // DON'T close the sidebar here either
              }}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Apply/Clear Buttons */}
      <div className="space-y-2 pt-4 border-t">
        <Button
          className="w-full"
          onClick={onClose} // Only close when Apply is clicked
        >
          Apply Filters
        </Button>
        {selectedCategory !== '' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onCategoryChange('')}
          >
            Clear Category
          </Button>
        )}
      </div>
    </div>
  );
};

const AuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // These are the currently applied filters (used for fetching)
  const [appliedFilter, setAppliedFilter] = useState<FilterType>('active');
  const [appliedCategory, setAppliedCategory] = useState<string>('');

  // These are the selected filters in the sidebar (not yet applied)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12, // Show 12 auctions per page
  });
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';
  const navigate = useNavigate();

  const fetchAuctions = useCallback(
    async (filter: FilterType, page: number = 1, category: string = '') => {
      try {
        setLoading(true);
        setError(null);

        // Convert filter type for API call (ended -> expired for backend compatibility)
        const apiFilter = filter === 'ended' ? 'expired' : filter;

        // Build query parameters
        const params = new URLSearchParams({
          filter: apiFilter,
          page: page.toString(),
          limit: pagination.itemsPerPage.toString(),
          sort: 'latest',
          searchQuery: searchQuery,
        });

        if (category && category !== '') {
          params.append('category', category);
        }

        // DEBUG LOGS
        console.log('Fetching auctions with params:', {
          filter: apiFilter,
          category: category,
          page: page,
        });
        console.log(
          'Full URL:',
          `${import.meta.env.VITE_API_URL}/auctions/all?${params.toString()}`,
        );

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auctions/all?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch auctions: ${response.status}`);
        }

        const data = await response.json();

        // Handle different response formats
        if (data.auctions && Array.isArray(data.auctions)) {
          // If the API returns paginated data
          const sortedAuctions = sortAuctions(data.auctions, filter);
          setAuctions(sortedAuctions);
          setPagination((prev) => ({
            ...prev,
            currentPage: data.currentPage || page,
            totalPages: data.totalPages || 1,
            totalItems: data.totalItems || data.auctions.length,
          }));
        } else if (Array.isArray(data)) {
          // If the API returns a simple array (fallback for current API)
          // Sort the data first, then implement client-side pagination
          const sortedData = sortAuctions(data, filter);

          const itemsPerPage = pagination.itemsPerPage;
          const startIndex = (page - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedData = sortedData.slice(startIndex, endIndex);
          const totalPages = Math.ceil(sortedData.length / itemsPerPage);

          setAuctions(paginatedData);
          setPagination((prev) => ({
            ...prev,
            currentPage: page,
            totalPages,
            totalItems: sortedData.length,
          }));
        } else {
          setAuctions([]);
          setPagination((prev) => ({
            ...prev,
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
          }));
        }
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setAuctions([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.itemsPerPage, searchQuery],
  ); // Only depend on itemsPerPage

  // Initial load and when applied filters change
  useEffect(() => {
    fetchAuctions(appliedFilter, 1, appliedCategory);
  }, [appliedFilter, appliedCategory, fetchAuctions]);

  // Update handlers (only update selected filters, don't apply immediately)
  const handleFilterChange = (filter: FilterType) => {
    setSelectedFilter(filter);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Apply the selected filters
  const handleApplyFilters = () => {
    setAppliedFilter(selectedFilter);
    setAppliedCategory(selectedCategory);
    setFilterSidebarOpen(false);
  };

  // Separate handler for just closing the sidebar
  const handleCloseSidebar = () => {
    setFilterSidebarOpen(false);
  };

  const handlePageChange = (page: number) => {
    fetchAuctions(appliedFilter, page, appliedCategory);
  };

  const handleCardClick = (auctionId: string) => {
    navigate(`/auction-details/${auctionId}`);
  };

  // Remove AuctionCardWithTimer, use AuctionCard directly
  const renderedAuctions = useMemo(() => {
    return auctions.map((auction) => {
      const imageUrl =
        auction.images && auction.images.length > 0
          ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.images[0]}`
          : '/api/placeholder/400/250';

      const sellerAvatarUrl =
        auction.seller.profilePicture && auction.seller.profilePicture.id
          ? `${import.meta.env.VITE_API_URL}/auctions/getAuctionImages?file_uuid=${auction.seller.profilePicture.id}`
          : '/api/placeholder/24/24';

      const sellerName = auction.seller.firstName
        ? `${auction.seller.firstName} ${auction.seller.lastName}`
        : auction.seller.username;

      return (
        <div
          key={auction.id}
          className="cursor-pointer"
          onClick={() => handleCardClick(auction.id)}
        >
          <AuctionCard
            imageUrl={imageUrl}
            productName={auction.title}
            category={auction.category}
            sellerName={sellerName}
            sellerAvatar={sellerAvatarUrl}
            startingPrice={auction.startingPrice.toLocaleString()}
            startTime={auction.startTime}
            endTime={auction.endTime}
          />
        </div>
      );
    });
  }, [auctions]);

  if (loading) {
    return (
      <div className="min-h-screen mx-auto px-10 py-6 sm:py-8 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 sm:h-12 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen mx-auto px-10 py-6 sm:py-8 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Error: {error}</p>
          <Button
            onClick={() => fetchAuctions(appliedFilter, 1, appliedCategory)}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto px-10 py-6 sm:py-8 sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-7xl">
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Explore</p>
          <h1 className="text-xl sm:text-4xl font-semibold">All Auctions</h1>
        </div>

        <Sheet open={filterSidebarOpen} onOpenChange={setFilterSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setFilterSidebarOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filters
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {appliedFilter}
                </Badge>
                {appliedCategory && (
                  <Badge variant="outline" className="text-xs">
                    {appliedCategory}
                  </Badge>
                )}
              </div>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Filter Auctions</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent
                activeFilter={selectedFilter}
                selectedCategory={selectedCategory}
                onFilterChange={handleFilterChange}
                onCategoryChange={handleCategoryChange}
                onClose={handleApplyFilters}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {auctions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No {appliedFilter} auctions found
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-6">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{' '}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems,
              )}{' '}
              of {pagination.totalItems} {appliedFilter} auctions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {renderedAuctions}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6 sm:mt-8 gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>

              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const pageNum = pagination.currentPage - 2 + i;
                  if (pageNum < 1 || pageNum > pagination.totalPages)
                    return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.currentPage
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => handlePageChange(pageNum)}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}

              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuctionsPage;
