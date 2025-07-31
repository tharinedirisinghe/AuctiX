import type React from 'react';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FormSection({
  title,
  description,
  children,
  className,
  delay = 0,
}: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn('space-y-6', className)}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
        className="space-y-2"
      >
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '3rem' }}
          transition={{ duration: 0.8, delay: delay + 0.3 }}
          className="h-0.5 bg-yellow-500"
        />
      </motion.div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}
