import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StatusNotice } from '@/components/molecules/StatusNotice';
import { SubmittedFilesList } from '@/components/molecules/SubmittedFilesList';
import { IssuesList } from '@/components/molecules/IssuesList';
import { VerificationStatus } from '../organisms/VerificationForm';

export interface VerificationSubmission {
  id: string;
  sellerUsername: string;
  status: string;
  docId: string;
  docType: string;
  docTitle: string;
  docSize: number;
  description: string;
  createdAt: string;
  reviewedAt: string;
}
interface VerificationStatusContentProps {
  status: VerificationStatus;
  submissions: VerificationSubmission[];
  onBack: () => void;
}

export function VerificationStatusContent({
  status,
  submissions,
  onBack,
}: VerificationStatusContentProps) {
  const [currentView, setCurrentView] = useState<'status' | 'files' | 'issues'>(
    'status',
  );

  const handleViewClick = () => {
    setCurrentView(status === VerificationStatus.REJECTED ? 'issues' : 'files');
  };

  const handleBackToStatus = () => {
    setCurrentView('status');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {currentView === 'status' && (
          <StatusNotice
            key="status"
            status={status}
            onViewClick={handleViewClick}
            onBack={onBack}
          />
        )}

        {currentView === 'files' && (
          <SubmittedFilesList
            key="files"
            files={submissions}
            onBack={handleBackToStatus}
          />
        )}

        {currentView === 'issues' && (
          <IssuesList
            key="issues"
            issues={submissions}
            onBack={handleBackToStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
