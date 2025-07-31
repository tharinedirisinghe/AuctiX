import type React from 'react';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModalButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ModalButton({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  loading = false,
  className,
}: ModalButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={onClick}
        variant={variant}
        disabled={disabled || loading}
        className={cn('min-w-[100px]', className)}
      >
        {loading ? 'Processing...' : children}
      </Button>
    </motion.div>
  );
}
