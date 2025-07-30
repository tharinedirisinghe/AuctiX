import React, { useState, useEffect, useCallback } from 'react';
import { WatchlistGridItem } from '@/components/molecules/WatchlistGridItem';
// import {
//   DropdownMenu,
//   DropdownMenuCheckboxItem,
//   DropdownMenuContent,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Button } from '@/components/ui/button';

import {
  getWatchList,
  removeAuctionFromWatchList,
  WatchListAuctionItem,
} from '@/services/watchlistService';

import { PaginationNav } from '@/components/molecules/Pagination';
import { AxiosInstance } from 'axios';
import AxiosRequest from '@/services/axiosInspector';

const ITEMS_PER_PAGE = 12;

export default function WatchlistPage() {
  const [watchlistItems, setWatchlistItems] = useState<WatchListAuctionItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [sortBy, setSortBy] = useState<string | null>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState<string>('');
  const [filterHighestBidder, setFilterHighestBidder] = useState<
    boolean | undefined
  >();
  const [filterOutbid, setFilterOutbid] = useState<boolean | undefined>();
  const [filterNoBid, setFilterNoBid] = useState<boolean | undefined>();

  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;

  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWatchList({
        axiosInstance,
        sortBy,
        order,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
        search: search || null,
        filterHighestBidder,
        filterOutbid,
        filterNoBid,
      });
      setWatchlistItems(result.data);
      setTotalPages(result.totalPages);
      setTotalItems(result.totalElements);
      console.log(
        'total pages',
        result.totalPages,
        'total items',
        result.totalElements,
      );
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
      setError('Failed to load watchlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    sortBy,
    order,
    search,
    filterHighestBidder,
    filterOutbid,
    filterNoBid,
  ]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemoveItem = async (auctionId: string) => {
    const originalWatchlist = watchlistItems;
    setWatchlistItems((prevItems) =>
      prevItems.filter((item) => item.id !== auctionId),
    );
    try {
      await removeAuctionFromWatchList(auctionId, axiosInstance);
      if (watchlistItems.length === 1 && currentPage > 0) {
        setCurrentPage((prev) => prev - 1);
      } else {
        fetchWatchlist();
      }
    } catch (err) {
      console.error(`Failed to remove auction ${auctionId}:`, err);
      setError('Failed to remove item. Please try again.');
      setWatchlistItems(originalWatchlist);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(0); // reset pagination
  };

  const handleSortChange = (value: string) => {
    const [field, direction] = value.split(':');
    setSortBy(field);
    setOrder(direction as 'asc' | 'desc');
    setCurrentPage(0);
  };

  const toggleFilter = (filterType: 'highest' | 'outbid' | 'nobid') => {
    if (filterType === 'highest')
      setFilterHighestBidder((prev) => (prev === true ? undefined : true));
    if (filterType === 'outbid')
      setFilterOutbid((prev) => (prev === true ? undefined : true));
    if (filterType === 'nobid')
      setFilterNoBid((prev) => (prev === true ? undefined : true));
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen flex flex-col px-6 md:px-8 py-8 max-w-7xl mx-auto container">
      <div className="flex-grow">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">My Watchlist</h1>
        <p className="mb-4">
          Stay informed by adding auctions to your watchlist, receive
          notifications on the auction and auction chat.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <input
            type="text"
            placeholder="Search auctions..."
            value={search}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/3"
          />
        </div>

        {/*

        <Select
          onValueChange={(value) => handleSortChange(value)}
          value={`${sortBy}:${order}`}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Newest</SelectItem>
            <SelectItem value="createdAt:asc">Oldest</SelectItem>
            <SelectItem value="title:asc">Title A–Z</SelectItem>
            <SelectItem value="title:desc">Title Z–A</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Filters</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem
              checked={!!filterHighestBidder}
              onCheckedChange={() => toggleFilter('highest')}
            >
              Highest Bidder
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={!!filterOutbid}
              onCheckedChange={() => toggleFilter('outbid')}
            >
              Outbid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={!!filterNoBid}
              onCheckedChange={() => toggleFilter('nobid')}
            >
              No Bid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        */}

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
              <div className="text-gray-600">Loading...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {watchlistItems.length === 0 ? (
            <div className="bg-white rounded-md p-6 text-center text-gray-600 border border-gray-200">
              <p className="text-lg font-medium mb-2">
                Your watchlist is empty!
              </p>
              <p>Start browsing auctions to add items you're interested in.</p>
              <a href="/" className="text-blue-600 hover:underline mt-4 block">
                Browse Auctions
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 justify-items-start">
              {watchlistItems.map((auction) => (
                <WatchlistGridItem
                  key={auction.id}
                  auction={auction}
                  onRemove={handleRemoveItem}
                  userBidAmount={auction.userBidAmount}
                  isUserHighBidder={auction.isHighestBidder}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Always at bottom unless page fills up */}
      <div className="mt-8 flex justify-center">
        <PaginationNav
          pages={totalPages}
          currentPage={currentPage}
          handlePage={setCurrentPage}
        />
      </div>
    </div>
  );
}
