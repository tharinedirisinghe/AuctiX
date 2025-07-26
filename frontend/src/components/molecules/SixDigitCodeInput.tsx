import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { DigitInput } from '@/components/atoms/DigitInput';

interface SixDigitCodeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  delay?: number;
}

export const isValidCodeFormat = (code: string): boolean => {
  // Remove any dashes or spaces and check if it's 6 alphanumeric characters
  const cleaned = code.replace(/[-\s]/g, '');
  return /^[A-Za-z0-9]{6}$/.test(cleaned);
};

export function SixDigitCodeInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  delay = 0,
}: SixDigitCodeInputProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Parse existing value into digits
  useEffect(() => {
    const cleaned = value.replace(/[-\s]/g, '');
    const newDigits = Array(6).fill('');
    for (let i = 0; i < Math.min(cleaned.length, 6); i++) {
      newDigits[i] = cleaned[i] || '';
    }
    setDigits(newDigits);
  }, [value]);

  const updateParentValue = (newDigits: string[]) => {
    const code = newDigits.join('');
    onChange(code);
  };

  const handleDigitChange = (index: number, newValue: string) => {
    const newDigits = [...digits];
    newDigits[index] = newValue;

    setDigits(newDigits);
    updateParentValue(newDigits);

    // Auto-focus next input if value entered
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current field is empty, move to previous field
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Delete') {
      // Clear current field
      handleDigitChange(index, '');
    }
  };

  const handlePaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Check if pasted text is a valid verification code format
    if (isValidCodeFormat(pastedText)) {
      const cleaned = pastedText.replace(/[-\s]/g, '');
      const newDigits = Array(6).fill('');

      // Distribute characters to appropriate fields
      for (let i = 0; i < Math.min(cleaned.length, 6); i++) {
        newDigits[i] = cleaned[i] || '';
      }

      setDigits(newDigits);
      updateParentValue(newDigits);

      // Focus the last filled input or the next empty one
      const lastFilledIndex = newDigits.findLastIndex((digit) => digit !== '');
      const nextEmptyIndex = newDigits.findIndex((digit) => digit === '');

      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else if (lastFilledIndex !== -1) {
        inputRefs.current[Math.min(lastFilledIndex + 1, 5)]?.focus();
      }
    } else {
      // If not a valid format, just paste the first character in current field
      const firstChar = pastedText.replace(/[^A-Za-z0-9]/g, '').slice(0, 1);
      if (firstChar) {
        handleDigitChange(index, firstChar);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-4"
    >
      <Label className="text-sm font-medium text-foreground">{label}</Label>

      <div className="flex items-center justify-center gap-2">
        {digits.map((digit, index) => (
          <DigitInput
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            value={digit}
            onChange={(value) => handleDigitChange(index, value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            disabled={disabled}
            error={!!error}
            index={index}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-red-500 text-center"
        >
          {error}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
        className="text-center text-xs text-muted-foreground space-y-1"
      >
        <p>Enter the 6-digit code sent to your email</p>
        <p className="text-yellow-600">
          Tip: You can paste the entire code in any field
        </p>
      </motion.div>
    </motion.div>
  );
}
