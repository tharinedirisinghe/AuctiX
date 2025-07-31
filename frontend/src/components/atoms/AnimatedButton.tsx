import type React from 'react';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

export function AnimatedButton({
  children,
  variant = 'default',
  size = 'default',
  className,
  onClick,
  disabled,
  type = 'button',
  loading = false,
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Button
        variant={variant}
        size={size}
        className={cn('w-full h-11', className)}
        onClick={onClick}
        disabled={disabled || loading}
        type={type}
      >
        {loading ? 'Updating...' : children}
      </Button>
    </motion.div>
  );
}
