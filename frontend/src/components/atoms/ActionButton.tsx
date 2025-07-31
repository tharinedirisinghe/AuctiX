import type React from 'react';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  disabled = false,
  loading = false,
  className,
}: ActionButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button
        type={type}
        onClick={onClick}
        variant={variant}
        disabled={disabled || loading}
        className={cn('w-full h-12 font-medium', className)}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          children
        )}
      </Button>
    </motion.div>
  );
}
