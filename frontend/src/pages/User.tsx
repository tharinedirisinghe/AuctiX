import UserDataTable from '@/components/organisms/UserDataTable';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import useAxiosRequest from '@/services/axiosInspector';
import { getUserStats, IUserStats } from '@/services/userService';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { getServerErrorMessage } from '@/lib/errorMsg';

export default function User() {
  // TODO: fetch statistics from the backend
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<IUserStats | null>(null);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  useEffect(() => {
    getUserStats(axiosInstance)
      .then((data) => {
        setUserStats(data);
      })
      .catch((error) => {
        console.error('Error fetching user stats:', error);
        toast({
          title: 'Error fetching user stats',
          description: getServerErrorMessage(error),
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-white">
      <div className="p-6 max-w-6xl mx-auto">
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-1">User management</h1>
          <p className="text-gray-500">View and manage users</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 shadow-none">
                <div className="h-10 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : userStats ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border-none shadow-none bg-gray-100">
              <div className="text-4xl font-bold">{userStats.totalUsers}</div>
              <div className="text-sm font-semibold text-gray-500">
                ALL USERS
              </div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">{userStats.bidders}</div>
              <div className="text-sm text-gray-500">BIDDERS</div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">{userStats.sellers}</div>
              <div className="text-sm text-gray-500">SELLERS</div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">{userStats.admins}</div>
              <div className="text-sm text-gray-500">ADMINS</div>
            </Card>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-md">
            Unable to load user statistics. Please try again later.
          </div>
        )}

        <UserDataTable />
      </div>
    </div>
  );
}
