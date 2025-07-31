import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RemoveButtonProps {
  onClick: () => void;
  className?: string;
}

export function RemoveButton({ onClick, className }: RemoveButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors',
        className,
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <X className="h-3 w-3" />
    </motion.button>
  );
}
