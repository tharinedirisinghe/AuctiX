import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { RemoveButton } from '@/components/atoms/RemoveButton';
import { Text } from '@/components/atoms/text';

interface FileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

export function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      <Text variant="body" className="font-medium text-yellow-700">
        Uploaded Documents ({files.length})
      </Text>
      <div className="space-y-2">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <Text
                    variant="body"
                    className="font-medium text-yellow-800 truncate block"
                  >
                    {file.name}
                  </Text>
                  <Text variant="caption" className="text-yellow-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </div>
              </div>
              <RemoveButton onClick={() => onRemoveFile(index)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
