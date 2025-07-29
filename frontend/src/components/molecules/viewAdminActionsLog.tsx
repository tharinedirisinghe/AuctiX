'use client';

import type React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Activity, Loader2, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getFilteredAdminActionsLog } from '@/services/adminService';
import AxiosRequest from '@/services/axiosInspector';

export interface IAdminAction {
  id: string;
  adminId: string;
  adminUsername: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminRole: string;
  adminProfilePhotoId: string | null;
  userId: string;
  userUsername: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userRole: string;
  userProfilePhotoId: string | null;
  activityType: string;
  description: string;
  createdAt: string;
}

enum ActionType {
  ALL = 'ALL',
  USER_PROFILE_PHOTO_REMOVE = 'USER_PROFILE_PHOTO_REMOVE',
  USER_BAN = 'USER_BAN',
  USER_UNBAN = 'USER_UNBAN',
  VERIFICATION_DOCS_APPROVE = 'VERIFICATION_DOCS_APPROVE',
  VERIFICATION_DOCS_VIEW = 'VERIFICATION_DOCS_VIEW',
  VERIFICATION_DOCS_REJECT = 'VERIFICATION_DOCS_REJECT',
}

const ACTION_TYPE_LABELS = {
  [ActionType.ALL]: 'All Actions',
  [ActionType.USER_PROFILE_PHOTO_REMOVE]: 'Profile Photo Remove',
  [ActionType.USER_BAN]: 'User Ban',
  [ActionType.USER_UNBAN]: 'User Unban',
  [ActionType.VERIFICATION_DOCS_APPROVE]: 'Verification Docs Approve',
  [ActionType.VERIFICATION_DOCS_VIEW]: 'Verification Docs View',
  [ActionType.VERIFICATION_DOCS_REJECT]: 'Verification Docs Reject',
};

export function ViewAdminActionsLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    ActionType.ALL,
  );
  const [adminActions, setAdminActions] = useState<IAdminAction[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const axiosInstance = AxiosRequest().axiosInstance;

  const ITEMS_PER_PAGE = 10;

  const fetchAdminActions = useCallback(
    async (page = 0, reset = false) => {
      // Don't fetch if we've reached the end
      if (!reset && page >= totalPages) {
        setHasMore(false);
        return;
      }

      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const offset = page * ITEMS_PER_PAGE;
        const data = await getFilteredAdminActionsLog(axiosInstance, {
          limit: ITEMS_PER_PAGE,
          offset,
          order: 'desc',
          search: searchQuery,
          actionTypeFilter: selectedActionType,
        });

        const newActions = data?.content || [];
        const newTotalPages = data?.page?.totalPages || 1;

        if (reset) {
          setAdminActions(newActions);
          setCurrentPage(0);
          setTotalPages(newTotalPages);
          setHasMore(newTotalPages > 1);
        } else {
          setAdminActions((prev) => [...prev, ...newActions]);
          setCurrentPage(page);
          setHasMore(page + 1 < newTotalPages);
        }
      } catch (error) {
        console.error('Error fetching admin actions log:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchQuery, selectedActionType],
  );

  // Initial load and when filters change
  useEffect(() => {
    setCurrentPage(0);
    setHasMore(true);
    fetchAdminActions(0, true);
  }, [searchQuery, selectedActionType]);

  // Handle scroll to load more
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasMore && !isLoadingMore && !isLoading) {
        const nextPage = currentPage + 1;
        if (nextPage < totalPages) {
          fetchAdminActions(nextPage, false);
        }
      }
    },
    [
      hasMore,
      isLoadingMore,
      isLoading,
      currentPage,
      totalPages,
      fetchAdminActions,
    ],
  );

  const handleActionTypeChange = (actionType: ActionType) => {
    setSelectedActionType(actionType);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'USER_BAN':
        return 'bg-red-100 text-red-800';
      case 'USER_UNBAN':
        return 'bg-green-100 text-green-800';
      case 'VERIFICATION_DOCS_APPROVE':
        return 'bg-blue-100 text-blue-800';
      case 'VERIFICATION_DOCS_REJECT':
        return 'bg-orange-100 text-orange-800';
      case 'USER_PROFILE_PHOTO_REMOVE':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Activity className="h-6 w-6" />
          Admin Action Log
        </CardTitle>
        <CardDescription>
          View a history of actions performed by administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pt-6">
          {/* Search and Filter Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-500">
              Search & Filter
            </h3>
            <Separator className="my-4 border-gray-200 border-t-2" />
          </div>
          <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by admin, action, or target"
                  className="pl-8 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter Actions</span>
                    <span className="sm:hidden">Filter</span>
                    {selectedActionType !== ActionType.ALL && (
                      <Badge variant="secondary" className="ml-1">
                        1
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={selectedActionType === value}
                      onCheckedChange={() =>
                        handleActionTypeChange(value as ActionType)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Actions Log Section */}
          <div className="space-y-6 pt-12">
            <div>
              <h3 className="text-lg font-medium text-gray-500">
                Activity Log
                {!isLoading && (
                  <span className="text-sm font-normal text-gray-400 ml-2">
                    (Page {currentPage + 1} of {totalPages})
                  </span>
                )}
              </h3>
              <Separator className="my-4 border-gray-200 border-t-2" />
            </div>
            <div className="p-6 rounded-lg border-l-2 border-yellow-500 bg-gray-50">
              <ScrollArea
                className="h-[500px] rounded-md"
                onScrollCapture={handleScroll}
                ref={scrollAreaRef}
              >
                <div className="space-y-4 pr-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-[300px]">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading admin actions...
                      </div>
                    </div>
                  ) : adminActions.length > 0 ? (
                    <>
                      {adminActions.map((action, index) => (
                        <motion.div
                          key={action.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-4 rounded-lg border-l-2 border-yellow-400 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-900">
                                  {action.adminFirstName} {action.adminLastName}
                                </p>
                                <Badge
                                  className={`text-xs ${getActionTypeColor(action.activityType)}`}
                                >
                                  {action.activityType.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  {action.description}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Target: {action.userFirstName}{' '}
                                {action.userLastName} ({action.userEmail})
                              </p>
                            </div>
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                              {formatDate(action.createdAt)}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {/* Loading more indicator */}
                      {isLoadingMore && (
                        <div className="flex items-center justify-center py-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading more actions...
                          </div>
                        </div>
                      )}

                      {/* End of list indicator */}
                      {!hasMore && adminActions.length > 0 && (
                        <div className="flex items-center justify-center py-4 text-gray-500">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            You've reached the end of the list (
                            {adminActions.length} total items)
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No actions found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
