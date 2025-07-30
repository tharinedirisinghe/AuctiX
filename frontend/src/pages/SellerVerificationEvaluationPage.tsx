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
import { IUser } from '@/types/IUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function SellerVerificationEvaluationPage() {
  const [isSellerLoading, setIsSellerLoading] = useState(true);
  const [isVerificationsLoading, setIsVerificationsLoading] = useState(true);
  const [sellerData, setSellerData] = useState<IUser | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<VerificationDocument | null>(null);
  const { username } = useParams();
  const axiosInstance = AxiosRequest().axiosInstance;
  const navigate = useNavigate();

  useEffect(() => {
    if (username) {
      setIsSellerLoading(true);
      getSellerDetails(axiosInstance, username)
        .then((data) => {
          setSellerData(data as IUser);
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

  const refreshVerifications = () => {
    if (username) {
      setIsVerificationsLoading(true);
      getSellerVerifications(axiosInstance, username)
        .then((data) => {
          const verificationDocs: VerificationDocument[] = data || [];
          setDocuments(verificationDocs);

          // Update selected document if it still exists
          if (selectedDocument) {
            const updatedDoc = verificationDocs.find(
              (doc) => doc.id === selectedDocument.id,
            );
            setSelectedDocument(updatedDoc || verificationDocs[0] || null);
          }
        })
        .catch((error) => {
          console.error('Error fetching seller verifications:', error);
        })
        .finally(() => {
          setIsVerificationsLoading(false);
        });
    }
  };

  return (
    <div className="py-4 px-4 sm:py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 text-sm hover:bg-gray-100"
      >
        &larr; Back
      </Button>

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Seller Verification Review
          </h1>
          {(isSellerLoading || isVerificationsLoading) && (
            <Badge className="bg-brandGoldYellow text-gray-900 self-start sm:self-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </Badge>
          )}
        </div>
        <p className="text-gray-500 mt-2 text-sm sm:text-base">
          Review and evaluate seller verification documents
        </p>
      </div>

      {/* Profile Section */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-500">
            Seller Profile
          </h3>
          <Separator className="my-3 sm:my-4 border-gray-200 border-t-2" />
        </div>
        <div className="p-4 sm:p-6 rounded-lg border-l-4 border-l-yellow-500 bg-gray-50">
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
      <div className="space-y-4 sm:space-y-6 pt-8 sm:pt-12">
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-500">
            Document Review & Verification
          </h3>
          <Separator className="my-3 sm:my-4 border-gray-200 border-t-2" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2 order-2 xl:order-1">
            <DocumentPreviewCard
              sellerUserName={username ? username : null}
              document={selectedDocument}
              onRefresh={refreshVerifications}
            />
          </div>
          <div className="xl:col-span-1 order-1 xl:order-2">
            <VerificationSubmissionList
              documents={documents}
              isLoading={isVerificationsLoading}
              selectedDocumentId={selectedDocument?.id}
              onDocumentSelect={setSelectedDocument}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
