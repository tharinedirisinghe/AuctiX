'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useState, useRef } from 'react';

export const AlertBox = ({
  title,
  message,
  alertOpen,
  onAlertOpenChange,
  continueAction,
  cancelAction,
  IconElement,
  continueBtn = 'Continue',
  cancelBtn = 'Cancel',
  timeoutSeconds,
}: {
  title: string;
  message: string;
  alertOpen: boolean;
  onAlertOpenChange: (open: boolean) => void;
  continueAction?: () => void;
  cancelAction?: () => void;
  IconElement?: ReactNode | null;
  continueBtn?: string | null;
  cancelBtn?: string | null;
  timeoutSeconds?: number;
}) => {
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(timeoutSeconds || 0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval helper function
  const clearCurrentInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Reset all states
  const resetStates = () => {
    setProgress(0);
    setCountdown(timeoutSeconds || 0);
    setIsActive(false);
    clearCurrentInterval();
  };

  useEffect(() => {
    // Reset states when dialog opens or closes
    if (!alertOpen) {
      resetStates();
      return;
    }

    // If no timeout, just reset and return
    if (!timeoutSeconds) {
      resetStates();
      return;
    }

    // Clear any existing interval before starting new one
    clearCurrentInterval();

    // Start new timeout
    setIsActive(true);
    setCountdown(timeoutSeconds);
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        const newCountdown = prevCountdown - 1;

        // Update progress based on remaining time
        const progressValue =
          ((timeoutSeconds - newCountdown) / timeoutSeconds) * 100;
        setProgress(progressValue);

        if (newCountdown <= 0) {
          clearCurrentInterval();
          setIsActive(false);
          if (alertOpen) {
            continueAction ? continueAction() : onAlertOpenChange(false);
          }
          return 0;
        }

        return newCountdown;
      });
    }, 1000);

    // Cleanup function
    return () => {
      clearCurrentInterval();
    };
  }, [alertOpen, timeoutSeconds]);

  const handleContinue = () => {
    clearCurrentInterval();
    setIsActive(false);
    continueAction ? continueAction() : onAlertOpenChange(false);
  };

  const handleCancel = () => {
    clearCurrentInterval();
    setIsActive(false);
    cancelAction ? cancelAction() : onAlertOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetStates();
    }
    onAlertOpenChange(open);
  };

  return (
    <AlertDialog open={alertOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 relative overflow-hidden max-w-[95vw] sm:max-w-md bg-white shadow-2xl rounded-lg fixed">
        {/* Progress bar - only show when timeout is active */}
        {timeoutSeconds && isActive && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="w-full bg-gray-200 h-2 rounded-t-lg">
              <motion.div
                className="h-full bg-yellow-500 transition-all duration-1000 ease-linear rounded-tl-lg"
                style={{ width: `${progress}%` }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className={`${timeoutSeconds ? 'pt-8' : 'pt-6'} px-6 pb-6`}>
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center gap-4">
              {IconElement && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 250,
                    damping: 15,
                  }}
                  className="text-yellow-500 flex items-center justify-center"
                >
                  {IconElement}
                </motion.div>
              )}
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold text-gray-900">
                  {title}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 leading-relaxed">
                  {message}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-3 sm:justify-center">
            {cancelBtn && (
              <AlertDialogCancel
                onClick={handleCancel}
                className="mt-0 bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300 order-2 sm:order-1"
                disabled={isActive && countdown <= 0}
              >
                {cancelBtn}
              </AlertDialogCancel>
            )}
            {continueBtn && (
              <AlertDialogAction
                onClick={handleContinue}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium order-1 sm:order-2"
                disabled={isActive && countdown <= 0}
              >
                <span className="flex items-center gap-2">
                  {continueBtn}
                  {timeoutSeconds && isActive && countdown > 0 && (
                    <motion.span
                      key={countdown}
                      initial={{ scale: 1.2, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-gray-700 font-mono text-sm bg-yellow-200 px-2 py-1 rounded"
                    >
                      {countdown}s
                    </motion.span>
                  )}
                </span>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>

          {/* Additional timeout info */}
          {timeoutSeconds && isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-gray-500">
                This dialog will automatically continue in {countdown} seconds
              </p>
            </motion.div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
