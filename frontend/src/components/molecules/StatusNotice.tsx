import { motion } from 'framer-motion';
import { StatusIcon } from '@/components/atoms/StatusIcon';
import { ActionButton } from '@/components/atoms/ActionButton';
import { VerificationStatus } from '../organisms/VerificationForm';

interface StatusNoticeProps {
  status: VerificationStatus;
  onViewClick: () => void;
  onBack: () => void;
}

export function StatusNotice({
  status,
  onViewClick,
  onBack,
}: StatusNoticeProps) {
  const statusConfig = {
    [VerificationStatus.NO_VERIFICATION_REQUESTED]: {
      title: 'No Verification Requested',
      message:
        'You have not submitted any verification documents yet. Please upload your documents to start the verification process.',
      buttonText: 'Upload Documents',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      icon: 'email',
    },
    [VerificationStatus.APPROVED]: {
      title: 'Verification Approved',
      message:
        'Congratulations! Your documents have been successfully verified. Your account is now verified.',
      buttonText: 'View Submitted Files',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      icon: 'success',
    },
    [VerificationStatus.REJECTED]: {
      title: 'Verification Rejected',
      message:
        'Unfortunately, your submitted documents could not be verified. Please review the issues below and resubmit.',
      buttonText: 'View Issues',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      icon: 'error',
    },
    [VerificationStatus.PENDING]: {
      title: 'Documents Under Review',
      message:
        "Your documents have been successfully submitted and are currently being reviewed. We'll notify you once the verification is complete.",
      buttonText: 'View Submitted Files',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'email',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center space-y-6"
    >
      <StatusIcon status={config.icon as 'email' | 'success' | 'error'} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {config.message}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="space-y-4"
      >
        <ActionButton
          onClick={onViewClick}
          className={`text-white ${config.buttonColor}`}
        >
          {config.buttonText}
        </ActionButton>

        <ActionButton
          onClick={onBack}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          Back
        </ActionButton>
      </motion.div>
    </motion.div>
  );
}
