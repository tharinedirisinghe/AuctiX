// File: components/delivery/seller/DeliveryFilter.tsx
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DeliveryFilterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isLoading: boolean;
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  resetFilters: () => void;
}

export const DeliveryFilter: React.FC<DeliveryFilterProps> = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  isLoading,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  resetFilters,
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Tabs
          defaultValue="all"
          className="w-full md:w-auto"
          onValueChange={(value) => setActiveTab(value)}
          value={activeTab}
        >
          <TabsList className="grid grid-cols-4 w-full md:w-auto bg-gray-100 p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-amber-300 data-[state=active]:text-gray-900"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="packing"
              className="data-[state=active]:bg-amber-300 data-[state=active]:text-gray-900"
            >
              Packing
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="data-[state=active]:bg-amber-300 data-[state=active]:text-gray-900"
            >
              Shipping
            </TabsTrigger>
            <TabsTrigger
              value="delivered"
              className="data-[state=active]:bg-amber-300 data-[state=active]:text-gray-900"
            >
              Delivered
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search deliveries"
              className="pl-8 border-gray-300 focus-visible:ring-amber-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-1 border-amber-300 text-amber-600 hover:bg-amber-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Category
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              <option value="furniture">Furniture</option>
              <option value="collectibles">Collectibles</option>
              <option value="electronics">Electronics</option>
              <option value="home decor">Home Decor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="packing">Packing</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <Button
              onClick={resetFilters}
              variant="link"
              className="text-amber-600 hover:text-amber-700 text-sm p-0"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
