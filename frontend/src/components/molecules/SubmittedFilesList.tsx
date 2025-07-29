import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { ActionButton } from '@/components/atoms/ActionButton';
import { VerificationSubmission } from './VerificationStatusContent';
import { VerificationStatus } from '../organisms/VerificationForm';
import AxiosRequest from '@/services/axiosInspector';
import { downloadAndOpenFile } from '@/services/sellerVerificationService';

interface SubmittedFilesListProps {
  files: VerificationSubmission[];
  onBack: () => void;
}

export function SubmittedFilesList({ files, onBack }: SubmittedFilesListProps) {
  const axiosInstance = AxiosRequest().axiosInstance;

  const getStatusColor = (status: string) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return 'text-green-600 bg-green-50 border-green-200';
      case VerificationStatus.REJECTED:
        return 'text-red-600 bg-red-50 border-red-200';
      case VerificationStatus.PENDING:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const openDocument = async (docId: string) => {
    try {
      await downloadAndOpenFile(docId, axiosInstance);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case VerificationStatus.APPROVED:
        return 'Approved';
      case VerificationStatus.REJECTED:
        return 'Rejected';
      case VerificationStatus.PENDING:
        return 'Pending';
      default:
        return 'Under Review';
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">
          Submitted Files
        </h2>
      </motion.div>

      <div className="space-y-3">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="border rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate px-2">
                      {file.docTitle}
                    </p>
                    <p className="text-sm text-muted-foreground truncate px-2">
                      {(file.docSize / 1024 / 1024).toFixed(2)} MB Uploaded
                    </p>
                    <p className="text-xs text-white bg-gray-700 rounded px-2 py-1 mt-1 w-fit">
                      {new Date(file.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="View file"
                    onClick={() => openDocument(file.docId)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(file.status)}`}
                  >
                    {getStatusText(file.status)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ActionButton
          onClick={onBack}
          variant="outline"
          className="border-gray-300 hover:bg-gray-50"
        >
          Back to Status
        </ActionButton>
      </motion.div>
    </motion.div>
  );
}
