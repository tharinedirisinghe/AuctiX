import { motion } from 'framer-motion';
import { StatusIcon } from '@/components/atoms/StatusIcon';
import { ActionButton } from '@/components/atoms/ActionButton';

interface StatusMessageProps {
  status: 'success' | 'error' | 'email';
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
}

export function StatusMessage({
  status,
  title,
  message,
  buttonText,
  onButtonClick,
  showButton = true,
}: StatusMessageProps) {
  const statusColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    email: 'text-yellow-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center space-y-6"
    >
      <StatusIcon status={status} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className={`text-2xl font-bold ${statusColors[status]}`}>
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
      </motion.div>

      {showButton && buttonText && onButtonClick && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <ActionButton
            onClick={onButtonClick}
            className={
              status === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : status === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }
          >
            {buttonText}
          </ActionButton>
        </motion.div>
      )}
    </motion.div>
  );
}
