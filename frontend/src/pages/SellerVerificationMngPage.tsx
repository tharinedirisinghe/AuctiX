import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { getServerErrorMessage, SectionEnum } from '@/lib/errorMsg';
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
          description: getServerErrorMessage(
            error,
            SectionEnum.SELLER_VERIFICATION,
          ),
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="bg-white">
      <header className="relative h-28 w-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#ffcc5f] via-[#eedca6] to-[#f1f1ec] mb-0">
        <h1 className="text-4xl font-semibold text-gray-800 absolute bottom-0 left-0 right-0 px-6 md:px-8 mb-4">
          Seller Verification Management
        </h1>
      </header>
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-6">
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
