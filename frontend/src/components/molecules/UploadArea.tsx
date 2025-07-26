import type React from 'react';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadIcon } from '@/components/atoms/UploadIcon';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/utils';

interface UploadAreaProps {
  onFileSelect?: (files: File[]) => void;
  className?: string;
  hasFiles?: boolean;
}

export function UploadArea({
  onFileSelect,
  className,
  hasFiles,
}: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFileSelect?.(files);
      }
    },
    [onFileSelect],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect?.(Array.from(files));
      }
    },
    [onFileSelect],
  );

  return (
    <motion.div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-12 text-center transition-colors',
        isDragOver
          ? 'border-yellow-500 bg-yellow-50'
          : hasFiles
            ? 'border-yellow-300 bg-yellow-25'
            : 'border-muted-foreground/25 bg-muted/20',
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <motion.div
        className="space-y-4"
        animate={{
          y: isDragOver ? -5 : 0,
          scale: isDragOver ? 1.05 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <UploadIcon
          className={cn(
            'mx-auto h-12 w-12',
            isDragOver
              ? 'text-yellow-600'
              : hasFiles
                ? 'text-yellow-500'
                : 'text-muted-foreground',
          )}
        />
        <div className="space-y-1">
          <Text
            variant="body"
            className={cn(
              isDragOver
                ? 'text-yellow-700'
                : hasFiles
                  ? 'text-yellow-600'
                  : 'text-muted-foreground',
            )}
          >
            {hasFiles ? 'Add more files' : 'Choose files or drag here'}
          </Text>
          <Text variant="caption" className="text-muted-foreground">
            PDF, JPG, JPEG, PNG files supported
          </Text>
        </div>
      </motion.div>
    </motion.div>
  );
}
