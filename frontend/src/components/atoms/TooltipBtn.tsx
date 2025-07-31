import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'; // Import Tooltip components

interface TooltipBtnProps {
  icon: LucideIcon;
  text: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  tooltipClassName?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function TooltipBtn({
  icon: Icon,
  text,
  onClick,
  className,
  iconClassName,
  tooltipClassName,
  side = 'top',
  align = 'center',
}: TooltipBtnProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-all',
              className,
            )}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            whileHover={{
              scale: 1.05,
            }}
            animate={{
              boxShadow: isHovered
                ? '0 0 0 2px rgba(255, 255, 255, 0.7)'
                : '0 0 0 0px rgba(255, 255, 255, 0)',
            }}
            transition={{
              duration: 0.2,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              className={cn(
                'flex h-10 w-10 items-center justify-center',
                iconClassName,
              )}
              animate={{
                rotate: isHovered ? [0, -10, 10, -5, 5, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut',
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent
          className={cn('py-1 px-2 text-xs font-medium', tooltipClassName)}
          side={side}
          align={align}
          sideOffset={5}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
