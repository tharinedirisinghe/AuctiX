import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  className?: string;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  steps,
  className,
}: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn('w-full max-w-md mx-auto mb-8', className)}
    >
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 relative z-10',
                  isCompleted && 'bg-yellow-500 text-white',
                  isCurrent && 'bg-gray-200 text-gray-500 ring-4 ring-gray-400',
                  isUpcoming && 'bg-gray-200 text-gray-500',
                )}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.div>
                ) : (
                  stepNumber
                )}
              </motion.div>

              {/* Step Label */}
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={cn(
                  'text-xs mt-2 text-center font-medium transition-colors duration-300',
                  isCompleted && 'text-yellow-600',
                  isCurrent && 'text-yellow-600',
                  isUpcoming && 'text-gray-400',
                )}
              >
                {step}
              </motion.p>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 z-0">
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gray-200" />
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{
                        width: stepNumber < currentStep ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="absolute inset-0 bg-yellow-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: '0%' }}
            animate={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full"
          />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-2 text-sm text-muted-foreground"
        >
          Step {currentStep} of {totalSteps}
        </motion.div>
      </div>
    </motion.div>
  );
}
