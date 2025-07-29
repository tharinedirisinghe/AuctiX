import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { getServerErrorMessage } from '@/lib/errorMsg';
import SellerVerificationRequestsTable from '@/components/organisms/SellerVerificationDataTable';
import { getSellerVerificationStats } from '@/services/sellerVerificationService';

// Define interface for seller verification stats
interface ISellerVerificationStats {
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  verifiedSellers: number;
}

export default function SellerVerificationMngPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStats, setVerificationStats] =
    useState<ISellerVerificationStats | null>(null);
  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  useEffect(() => {
    getSellerVerificationStats(axiosInstance)
      .then((data) => {
        setVerificationStats(data);
      })
      .catch((error) => {
        console.error('Error fetching verification stats:', error);
        toast({
          title: 'Error fetching verification stats',
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
          <h1 className="text-3xl font-bold mb-1">
            Verification Requests management
          </h1>
          <p className="text-gray-500">
            View and manage seller verification requests
          </p>
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
        ) : verificationStats ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border-none shadow-none bg-gray-100">
              <div className="text-4xl font-bold">
                {verificationStats?.pendingVerifications}
              </div>
              <div className="text-sm font-semibold text-gray-500">PENDING</div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">
                {verificationStats?.approvedVerifications}
              </div>
              <div className="text-sm text-gray-500">APPROVED</div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">
                {verificationStats?.rejectedVerifications}
              </div>
              <div className="text-sm text-gray-500">REJECTED</div>
            </Card>
            <Card className="p-4 shadow-none">
              <div className="text-4xl font-bold">
                {verificationStats?.verifiedSellers}
              </div>
              <div className="text-sm text-gray-500">VERIFIED SELLERS</div>
            </Card>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-md">
            Unable to load verification requests statistics. Please try again
            later.
          </div>
        )}

        <SellerVerificationRequestsTable />
      </div>
    </div>
  );
}
