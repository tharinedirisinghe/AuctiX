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

const PREVIEW_INNER_HEIGHT = 'h-[calc(60vh-150px)]';

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
        className={`flex items-center justify-center text-gray-500 ${PREVIEW_INNER_HEIGHT}`}
      >
        <p>Loading preview...</p>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div
        className={`flex items-center justify-center text-gray-500 ${PREVIEW_INNER_HEIGHT}`}
      >
        <p>{error || 'Preview not available'}</p>
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
    <div className="flex items-center justify-center text-gray-500 h-64">
      <p>Preview not available for this file type ({contentType})</p>
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
      <Card className="border-l-2 border-yellow-500 bg-gray-50 h-[calc(100vh-80px)]">
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 h-[calc(100%-140px)]">
          {/* Skeleton Preview Section */}
          <div className="border rounded-lg p-4 bg-white">
            <div
              className={`bg-gray-200 animate-pulse rounded ${PREVIEW_INNER_HEIGHT}`}
            ></div>
          </div>

          {/* Skeleton Document Details */}
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-l-4 border-l-gray-300">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className="border-l-2 border-yellow-500 bg-gray-50 h-[calc(100vh-80px)]">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">
            Document Preview
          </CardTitle>
          <CardDescription>
            Select a document from the submission list to preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 h-[calc(100%-140px)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">No document selected</p>
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
    <Card className="border-l-2 border-yellow-500 bg-gray-50 h-[calc(100vh-80px)]">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">
          Document Preview
        </CardTitle>
        <CardDescription>
          {document.docTitle} • {formatFileSize(document.docSize)} •{' '}
          {document.docType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 h-[calc(100%-140px)]">
        {/* Preview Section */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-white">
            <div
              className={`bg-gray-100 flex items-center justify-center ${PREVIEW_INNER_HEIGHT}`}
            >
              <DocumentPreviewViewer document={document} />
            </div>
          </div>
        </div>

        {/* Document Details Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
            <p className="text-xs text-gray-600">File Type</p>
            <p className="text-sm font-medium text-gray-900">
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
          <div className="text-xs text-gray-800 max-h-16 overflow-y-auto">
            {document.description === 'no review notes'
              ? 'No review notes available'
              : document.description}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-l-4 border-l-yellow-500">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-yellow-500 text-gray-800 bg-brandGoldYellow hover:bg-yellow-300"
            onClick={() => downloadAndOpenFile(document.docId, axiosInstance)}
          >
            <Download className="h-3 w-3" />
            Download
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-yellow-500 text-gray-800 bg-brandGoldYellow hover:bg-yellow-300"
            onClick={() => setIsAddNoteModalOpen(true)}
          >
            <MessageSquare className="h-3 w-3" />
            Edit Note
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-1"
            onClick={() => setIsApproveModalOpen(true)}
          >
            <Check className="h-3 w-3" />
            Approve
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => setIsRejectModalOpen(true)}
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
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
