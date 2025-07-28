import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface MoreInformationProps {
  data: Record<string, any>;
  excludeFields?: string[];
}

export function MoreInformation({
  data,
  excludeFields = [],
}: MoreInformationProps) {
  const standardFields = [
    'title',
    'content',
    'severityLevel',
    'canResolve',
    'triggerUrl',
    'continueUrl',
  ];

  const additionalFields = Object.entries(data).filter(
    ([key, value]) =>
      !standardFields.includes(key) &&
      !excludeFields.includes(key) &&
      value !== null &&
      value !== undefined,
  );

  const formatKey = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

  const formatValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (
      typeof value === 'string' &&
      value.includes('T') &&
      value.includes('Z')
    ) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="px-6 pt-6 space-y-4 border-t border-gray-200"
    >
      <div className="flex items-center gap-2 text-base font-medium text-gray-700">
        <Info className="h-4 w-4 text-gray-500" />
        More Information
      </div>

      <div className="space-y-4">
        {additionalFields.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="text-gray-500"
          >
            No additional information provided.
          </motion.div>
        ) : (
          additionalFields.map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex flex-col sm:flex-row sm:items-start gap-2"
            >
              <div className="font-medium text-gray-700 min-w-[150px]">
                {formatKey(key)}:
              </div>
              <div className="text-gray-500 whitespace-pre-wrap break-words">
                {formatValue(value)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
