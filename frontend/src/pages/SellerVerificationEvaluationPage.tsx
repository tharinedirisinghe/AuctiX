import ProfileCard from '@/components/molecules/ProfileCard';
import { DocumentPreviewCard } from '@/components/organisms/DocumentPreviewCard';
import {
  VerificationDocument,
  VerificationSubmissionList,
} from '@/components/organisms/VerificationSubmissionList';
import { Separator } from '@/components/ui/separator';
import {
  getSellerDetails,
  getSellerVerifications,
} from '@/services/adminService';
import AxiosRequest from '@/services/axiosInspector';
import { ISeller } from '@/types/IUser';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function SellerVerificationEvaluationPage() {
  const [isSellerLoading, setIsSellerLoading] = useState(true);
  const [isVerificationsLoading, setIsVerificationsLoading] = useState(true);
  const [sellerData, setSellerData] = useState<ISeller | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<VerificationDocument | null>(null);
  const { username } = useParams();
  const axiosInstance = AxiosRequest().axiosInstance;

  useEffect(() => {
    if (username) {
      setIsSellerLoading(true);
      getSellerDetails(axiosInstance, username)
        .then((data) => {
          setSellerData(data as ISeller);
        })
        .catch((error) => {
          console.error('Error fetching seller details:', error);
        })
        .finally(() => {
          setIsSellerLoading(false);
        });

      setIsVerificationsLoading(true);
      getSellerVerifications(axiosInstance, username)
        .then((data) => {
          const verificationDocs: VerificationDocument[] = data || [];
          setDocuments(verificationDocs);

          if (verificationDocs.length > 0) {
            setSelectedDocument(verificationDocs[0]);
          }
        })
        .catch((error) => {
          console.error('Error fetching seller verifications:', error);
        })
        .finally(() => {
          setIsVerificationsLoading(false);
        });
    }
  }, [username]);

  return (
    <div className="py-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Seller Verification Review
          {(isSellerLoading || isVerificationsLoading) && (
            <Badge className="bg-brandGoldYellow text-gray-900">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </Badge>
          )}
        </h1>
        <p className="text-gray-500 mt-1">
          Review and evaluate seller verification documents
        </p>
      </div>

      {/* Profile Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-500">Seller Profile</h3>
          <Separator className="my-4 border-gray-200 border-t-2" />
        </div>
        <div className="p-6 rounded-lg border-l-4 border-l-yellow-500 bg-gray-50">
          <ProfileCard
            isInEditMode={false}
            username={sellerData?.username || ''}
            email={sellerData?.email || ''}
            role={sellerData?.role || ''}
            profilePhoto={sellerData?.profile_photo || ''}
            bannerPhoto={sellerData?.banner_photo || ''}
            isProfileLoading={isSellerLoading}
            isBannerLoading={isSellerLoading}
            onProfilePhotoSet={() => {}}
            onProfilePhotoDelete={() => {}}
            onBannerPhotoSet={() => {}}
            onRemoveBanner={() => {}}
          />
        </div>
      </div>

      {/* Document Review Section */}
      <div className="space-y-6 pt-12">
        <div>
          <h3 className="text-lg font-medium text-gray-500">
            Document Review & Verification
          </h3>
          <Separator className="my-4 border-gray-200 border-t-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DocumentPreviewCard document={selectedDocument} />
          </div>
          <div className="lg:col-span-1">
            <VerificationSubmissionList
              documents={documents}
              isLoading={isVerificationsLoading}
              selectedDocumentId={selectedDocument?.docId}
              onDocumentSelect={setSelectedDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
