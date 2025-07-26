import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const severityConfig = {
    HIGH: {
      label: 'High Priority',
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    },
    MEDIUM: {
      label: 'Medium Priority',
      className:
        'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    },
    LOW: {
      label: 'Low Priority',
      className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    },
  };

  const config = severityConfig[severity];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Badge
        variant="outline"
        className={cn('font-medium', config.className, className)}
      >
        {config.label}
      </Badge>
    </motion.div>
  );
}
