import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

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

export function ViewAdminActionsLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    ActionType.ALL,
  );
  const [adminActions, setAdminActions] = useState<IAdminAction[]>([]);
  const axiosInstance = AxiosRequest().axiosInstance;

  useEffect(() => {
    setSearchQuery('');
    setSelectedActionType(ActionType.ALL);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getFilteredAdminActionsLog(axiosInstance, {
      limit: 10,
      offset: 0,
      order: 'desc',
      search: searchQuery,
      actionTypeFilter: selectedActionType,
    })
      .then((data) => {
        console.log('Fetched admin actions log:', data);
        setAdminActions(data?.content);
      })
      .catch((error) => {
        console.error('Error fetching admin actions log:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, selectedActionType]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Admin Action Log</CardTitle>
          <CardDescription>
            View a history of actions performed by administrators
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by admin, action, or target"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuCheckboxItem
                  checked={selectedActionType === ActionType.ALL}
                  onCheckedChange={() => handleActionTypeChange(ActionType.ALL)}
                >
                  All Actions
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    selectedActionType === ActionType.USER_PROFILE_PHOTO_REMOVE
                  }
                  onCheckedChange={() =>
                    handleActionTypeChange(ActionType.USER_PROFILE_PHOTO_REMOVE)
                  }
                >
                  Profile Photo Remove
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={selectedActionType === ActionType.USER_BAN}
                  onCheckedChange={() =>
                    handleActionTypeChange(ActionType.USER_BAN)
                  }
                >
                  User Ban
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={selectedActionType === ActionType.USER_UNBAN}
                  onCheckedChange={() =>
                    handleActionTypeChange(ActionType.USER_UNBAN)
                  }
                >
                  User Unban
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={
                    selectedActionType === ActionType.VERIFICATION_DOCS_APPROVE
                  }
                  onCheckedChange={() =>
                    handleActionTypeChange(ActionType.VERIFICATION_DOCS_APPROVE)
                  }
                >
                  Verification Docs Approve
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4">
              {adminActions.length > 0 ? (
                <ul className="space-y-4">
                  {adminActions.map((action, index) => (
                    <motion.li
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {action.adminFirstName} {action.adminLastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {action.activityType}:{' '}
                          <span className="font-medium">
                            {action.description}
                          </span>
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                        {formatDate(action.createdAt)}
                      </div>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No actions found matching your filters
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
