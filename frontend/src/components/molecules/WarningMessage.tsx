import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface WarningMessageProps {
  title: string;
  message: string;
}

export function WarningMessage({ title, message }: WarningMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <motion.div
        initial={{ rotate: -10 }}
        animate={{ rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
      >
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      </motion.div>
      <div className="space-y-1">
        <h4 className="font-medium text-yellow-800">{title}</h4>
        <p className="text-sm text-yellow-700">{message}</p>
      </div>
    </motion.div>
  );
}
