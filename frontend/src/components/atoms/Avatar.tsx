import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  alt = 'User avatar',
  size = 'md',
  className,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200',
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <img
          src={src || '/placeholder.svg'}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <User
          className={cn('text-gray-400', size === 'xl' ? 'w-8 h-8' : 'w-6 h-6')}
        />
      )}
    </motion.div>
  );
}
