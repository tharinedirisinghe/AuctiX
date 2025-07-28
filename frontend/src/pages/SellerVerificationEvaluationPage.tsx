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
    <div className="space-y-6">
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

      <Separator />

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
  );
}
