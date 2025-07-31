import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VerificationHeader } from '@/components/molecules/VerificationHeader';
import { AxiosInstance } from 'axios';
import AxiosRequest from '@/services/axiosInspector';
import { uploadVerificationDocs } from '@/services/userService';
import UploadAreaBody from '../molecules/UploadAreaBody';
import {
  VerificationStatusContent,
  VerificationSubmission,
} from '../molecules/VerificationStatusContent';
import { VerificationFormSkeleton } from './VerificationFormSkeleton';
import {
  getSellerVerificationStatus,
  submitSellerVerificationDocuments,
} from '@/services/sellerVerificationService';
import { toast } from 'react-toastify';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export enum VerificationStatus {
  NO_VERIFICATION_REQUESTED = 'NO_VERIFICATION_REQUESTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export function VerificationForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(VerificationStatus.NO_VERIFICATION_REQUESTED);
  const [verificationSubmissions, setVerificationSubmissions] = useState<
    VerificationSubmission[]
  >([]);
  const { toast } = useToast();

  const handleFileSelect = (newFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    setIsSubmitting(true);
    submitSellerVerificationDocuments(selectedFiles, axiosInstance)
      .then((response) => {
        console.log('Files uploaded successfully:', response);
        toast({
          variant: 'default',
          title: 'Files Uploaded',
          description:
            'Your verification documents have been successfully uploaded.',
        });
      })
      .catch((error) => {
        console.error('Error uploading files:', error);
      })
      .finally(() => {
        setTimeout(() => setIsSubmitting(false), 1000);
      });
    // Reset form
    setSelectedFiles([]);
  };

  const handleBack = () => {
    if (
      verificationStatus === VerificationStatus.APPROVED ||
      verificationStatus === VerificationStatus.PENDING
    ) {
      navigate('/dashboard');
    } else if (verificationStatus === VerificationStatus.REJECTED) {
      setVerificationStatus(VerificationStatus.NO_VERIFICATION_REQUESTED);
      setVerificationSubmissions([]);
      setSelectedFiles([]);
    }
  };

  useEffect(() => {
    if (isSubmitting) {
      return;
    }
    // fetch initial verification status
    getSellerVerificationStatus(axiosInstance)
      .then((status) => {
        if (status) {
          setVerificationStatus(status.status);
          setVerificationSubmissions(status.submissions);
        } else {
          throw new Error('No verification status received');
        }
      })
      .catch((error) => {
        console.error('Error fetching verification status:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getSellerVerificationStatus, isSubmitting]);

  if (isLoading) {
    return <VerificationFormSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md space-y-8"
      >
        <VerificationHeader />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          className="space-y-6"
        >
          {verificationStatus ===
          VerificationStatus.NO_VERIFICATION_REQUESTED ? (
            <UploadAreaBody
              handleFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              handleRemoveFile={handleRemoveFile}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              handleBack={handleBack}
            />
          ) : (
            <VerificationStatusContent
              status={verificationStatus}
              submissions={verificationSubmissions}
              onBack={handleBack}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
