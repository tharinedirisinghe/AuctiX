import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface NoticeActionsProps {
  canResolve: boolean;
  continueUrl?: string | null;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function NoticeActions({
  canResolve,
  continueUrl,
  severity,
}: NoticeActionsProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (continueUrl) {
      navigate(continueUrl);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="flex justify-end gap-2 mt-4"
    >
      {canResolve && (
        <div className="flex flex-col sm:flex-row justify-between gap-2 w-full pt-6 border-t border-gray-200 min-w-[200px]">
          {severity !== 'HIGH' && (
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto order-2 sm:order-1"
              variant="secondary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}

          {continueUrl && (
            <Button
              onClick={handleContinue}
              className="w-full sm:w-auto order-1 sm:order-2 min-w-[200px]"
              variant="default"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}
