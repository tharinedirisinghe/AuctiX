import { Check, Download, MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { VerificationDocument } from './VerificationSubmissionList';
import { useEffect, useState } from 'react';
import {
  downloadAndOpenFile,
  downloadForPreview,
} from '@/services/sellerVerificationService';
import AxiosRequest from '@/services/axiosInspector';
import { ApproveDocumentModal } from '../molecules/ApproveDocumentModal';
import { RejectDocumentModal } from '../molecules/RejectDocumentModal';
import { AddNoteModal } from '../molecules/AddNoteModal';

const PREVIEW_INNER_HEIGHT = 'h-48 sm:h-64 lg:h-[calc(60vh-150px)]';

const DocumentPreviewViewer = ({
  document,
}: {
  document: VerificationDocument;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axiosInstance = AxiosRequest().axiosInstance;

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const loadPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await downloadForPreview(document.docId, axiosInstance);
        if (result) {
          setPreviewUrl(result.url);
          setContentType(result.contentType);
          cleanup = result.cleanup;
        }
      } catch (err) {
        setError('Failed to load preview');
        console.error('Preview load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (cleanup) cleanup();
    };
  }, [document.docId]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 ${PREVIEW_INNER_HEIGHT} px-4`}
      >
        <p className="text-sm sm:text-base">Loading preview...</p>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 ${PREVIEW_INNER_HEIGHT} px-4`}
      >
        <p className="text-center text-sm sm:text-base">
          {error || 'Preview not available'}
        </p>
      </div>
    );
  }

  // For PDF files
  if (contentType === 'application/pdf') {
    return (
      <iframe
        src={previewUrl}
        title={document.docTitle}
        className={`w-full ${PREVIEW_INNER_HEIGHT} border-0`}
      />
    );
  }

  // For image files
  if (contentType.startsWith('image/')) {
    return (
      <img
        src={previewUrl}
        alt={document.docTitle}
        className={`max-h-full ${PREVIEW_INNER_HEIGHT} max-w-full object-contain`}
        onError={() => setError('Failed to display image')}
      />
    );
  }

  // For other file types
  return (
    <div className="flex items-center justify-center text-gray-500 h-32 sm:h-48 lg:h-64 px-4">
      <p className="text-center text-sm sm:text-base">
        Preview not available for this file type ({contentType})
      </p>
    </div>
  );
};

export function DocumentPreviewCard({
  document,
  sellerUserName,
  onRefresh,
}: {
  document: VerificationDocument | null;
  sellerUserName: string | null;
  onRefresh?: () => void;
}) {
  const axiosInstance = AxiosRequest().axiosInstance;
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  // Show skeleton loading when sellerUserName is null
  if (sellerUserName === null) {
    return (
      <Card className="border-l-2 border-yellow-500 bg-gray-50 min-h-[500px] sm:min-h-[600px] lg:h-[calc(100vh-80px)]">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="space-y-2">
            <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Skeleton Preview Section */}
          <div className="border rounded-lg p-2 sm:p-4 bg-white">
            <div
              className={`bg-gray-200 animate-pulse rounded ${PREVIEW_INNER_HEIGHT}`}
            ></div>
          </div>

          {/* Skeleton Document Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 bg-white rounded-lg border border-l-4 border-l-gray-300">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-l-4 border-l-gray-300">
              <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>

          {/* Skeleton Notes Section */}
          <div className="p-3 bg-white rounded-lg border border-l-4 border-l-gray-300">
            <div className="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/3"></div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
            </div>
          </div>

          {/* Skeleton Action Buttons */}
          <div className="p-3 bg-white rounded-lg border border-l-4 border-l-gray-300">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
              <div className="h-9 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-9 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className="border-l-2 border-yellow-500 bg-gray-50 min-h-[400px] sm:min-h-[500px] lg:h-[calc(100vh-5px)]">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg font-medium text-gray-900">
            Document Preview
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Select a document from the submission list to preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 flex items-center justify-center min-h-[200px] px-4 sm:px-6">
          <div className="text-center">
            <p className="text-gray-500 text-sm sm:text-base">
              No document selected
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSuccess = () => {
    console.log('Document operation completed successfully');
    // Trigger parent component to refresh verification data
    onRefresh?.();
  };

  return (
    <Card className="border-0 border-l-2 border-yellow-500 bg-gray-50 min-h-[500px] sm:min-h-[600px] lg:h-[calc(100vh-5px)]">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg font-medium text-gray-900">
          Document Preview
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm break-words">
          {document.docTitle} • {formatFileSize(document.docSize)} •{' '}
          {document.docType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Preview Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="border rounded-lg p-2 sm:p-4 bg-white">
            <div
              className={`bg-gray-100 flex items-center justify-center ${PREVIEW_INNER_HEIGHT} rounded`}
            >
              <DocumentPreviewViewer document={document} />
            </div>
          </div>
        </div>

        {/* Document Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
            <p className="text-xs text-gray-600">File Type</p>
            <p className="text-sm font-medium text-gray-900 break-words">
              {document.docType}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
            <p className="text-xs text-gray-600">File Size</p>
            <p className="text-sm font-medium text-gray-900">
              {formatFileSize(document.docSize)}
            </p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
          <p className="text-xs text-gray-600 mb-2">Review Notes</p>
          <div className="text-xs text-gray-800 max-h-12 sm:max-h-16 overflow-y-auto break-words">
            {document.description === 'no review notes'
              ? 'No review notes available'
              : document.description}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 border-yellow-500 text-gray-800 bg-brandGoldYellow hover:bg-yellow-300 h-9 sm:h-8"
              onClick={() => downloadAndOpenFile(document.docId, axiosInstance)}
            >
              <Download className="h-3 w-3" />
              Download
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 border-yellow-500 text-gray-800 bg-brandGoldYellow hover:bg-yellow-300 h-9 sm:h-8"
              onClick={() => setIsAddNoteModalOpen(true)}
            >
              <MessageSquare className="h-3 w-3" />
              Edit Note
            </Button>

            <Button
              variant="default"
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 gap-1 h-9 sm:h-8"
              onClick={() => setIsApproveModalOpen(true)}
            >
              <Check className="h-3 w-3" />
              Approve
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-1 h-9 sm:h-8"
              onClick={() => setIsRejectModalOpen(true)}
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals - only render when sellerUserName is available */}
      {sellerUserName && (
        <>
          <ApproveDocumentModal
            isOpen={isApproveModalOpen}
            onClose={() => setIsApproveModalOpen(false)}
            onSuccess={handleSuccess}
            document={document}
            axiosInstance={axiosInstance}
            sellerUserName={sellerUserName}
          />

          <RejectDocumentModal
            isOpen={isRejectModalOpen}
            onClose={() => setIsRejectModalOpen(false)}
            onSuccess={handleSuccess}
            document={document}
            axiosInstance={axiosInstance}
            sellerUserName={sellerUserName}
          />

          <AddNoteModal
            isOpen={isAddNoteModalOpen}
            onClose={() => setIsAddNoteModalOpen(false)}
            onSuccess={handleSuccess}
            document={document}
            axiosInstance={axiosInstance}
            sellerUserName={sellerUserName}
          />
        </>
      )}
    </Card>
  );
}
