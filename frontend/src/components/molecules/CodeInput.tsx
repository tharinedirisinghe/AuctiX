import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  delay?: number;
}

export function CodeInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  delay = 0,
}: CodeInputProps) {
  const [part1, setPart1] = useState('');
  const [part2, setPart2] = useState('');
  const part1Ref = useRef<HTMLInputElement>(null);
  const part2Ref = useRef<HTMLInputElement>(null);

  // Parse existing value into parts
  useEffect(() => {
    if (value.includes('-')) {
      const [p1, p2] = value.split('-');
      setPart1(p1 || '');
      setPart2(p2 || '');
    }
  }, [value]);

  const handlePart1Change = (newValue: string) => {
    const cleaned = newValue.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
    setPart1(cleaned);

    // Auto-focus next input when 4 characters entered
    if (cleaned.length === 4) {
      part2Ref.current?.focus();
    }

    // Update parent value
    const fullValue = cleaned + (part2 ? `-${part2}` : '');
    onChange(fullValue);
  };

  const handlePart2Change = (newValue: string) => {
    const cleaned = newValue.replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
    setPart2(cleaned);

    // Update parent value
    const fullValue = part1 + (cleaned ? `-${cleaned}` : '');
    onChange(fullValue);
  };

  const handlePart1KeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && part1.length === 0) {
      // Allow backspace to work normally
    }
  };

  const handlePart2KeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && part2.length === 0) {
      part1Ref.current?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-3"
    >
      <Label className="text-sm font-medium text-foreground">{label}</Label>

      <div className="flex items-center gap-3">
        <motion.div
          whileFocus={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex-1"
        >
          <Input
            ref={part1Ref}
            type="text"
            placeholder="2o3Y"
            value={part1}
            onChange={(e) => handlePart1Change(e.target.value)}
            onKeyDown={handlePart1KeyDown}
            disabled={disabled}
            className={cn(
              'text-center text-lg font-mono tracking-wider h-12',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'focus:border-yellow-500',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            maxLength={4}
          />
        </motion.div>

        <span className="text-2xl font-bold text-muted-foreground">-</span>

        <motion.div
          whileFocus={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex-1"
        >
          <Input
            ref={part2Ref}
            type="text"
            placeholder="Sn32"
            value={part2}
            onChange={(e) => handlePart2Change(e.target.value)}
            onKeyDown={handlePart2KeyDown}
            disabled={disabled}
            className={cn(
              'text-center text-lg font-mono tracking-wider h-12',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'focus:border-yellow-500',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            maxLength={4}
          />
        </motion.div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
