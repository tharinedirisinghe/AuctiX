import { motion } from 'framer-motion';
import { SeverityIcon } from '@/components/atoms/SeverityIcon';
import { SeverityBadge } from '@/components/atoms/SeverityBadge';

interface NoticeHeaderProps {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const severityCaptions: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'Immediate attention required.',
  MEDIUM: 'Please review this notice soon.',
  LOW: 'Informational update.',
};

export function NoticeHeader({ title, severity }: NoticeHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="px-6 pt-6 pb-4 border-b border-gray-200"
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <SeverityIcon severity={severity} />
          <SeverityBadge severity={severity} />
        </div>

        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{severityCaptions[severity]}</p>
        </div>
      </div>
    </motion.div>
  );
}
