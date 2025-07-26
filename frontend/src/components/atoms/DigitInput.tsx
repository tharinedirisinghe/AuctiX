import type React from 'react';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DigitInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  index: number;
}

export const DigitInput = forwardRef<HTMLInputElement, DigitInputProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      onPaste,
      disabled = false,
      error = false,
      index,
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 1);
      onChange(newValue);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileFocus={{ scale: 1.05 }}
        className="relative"
      >
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          disabled={disabled}
          className={cn(
            'w-12 h-12 text-center text-lg font-mono font-bold border-2 transition-all duration-200',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-300 focus:border-yellow-500',
            disabled && 'opacity-50 cursor-not-allowed',
            'focus:ring-2 focus:ring-yellow-200',
          )}
          maxLength={1}
          autoComplete="off"
        />
        {/* Dash separator after 3rd digit */}
        {index === 2 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-xl font-bold text-muted-foreground"
          >
            -
          </motion.span>
        )}
      </motion.div>
    );
  },
);

DigitInput.displayName = 'DigitInput';
