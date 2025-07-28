import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeverityIconProps {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  className?: string;
}

export function SeverityIcon({ severity, className }: SeverityIconProps) {
  const severityConfig = {
    HIGH: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
    },
    MEDIUM: {
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
    },
    LOW: {
      icon: Info,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
    },
  };

  const config = severityConfig[severity];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      }}
      className={cn(
        'rounded-full p-2 inline-flex items-center justify-center border-2',
        config.bgColor,
        config.borderColor,
        className,
      )}
    >
      <IconComponent className={cn('h-8 w-8', config.color)} />
    </motion.div>
  );
}
