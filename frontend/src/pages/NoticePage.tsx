import { motion } from 'framer-motion';
import { NoticeHeader } from '@/components/molecules/NoticeHeader';
import { NoticeContent } from '@/components/molecules/NoticeContent';
import { MoreInformation } from '@/components/molecules/MoreInformation';
import { NoticeActions } from '@/components/molecules/NoticeActions';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/hooks';
import { IPendingAction } from '@/types/IPendingAction';

interface INoticeData {
  title: string;
  content: string;
  severityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  canResolve: boolean;
  triggerUrl?: string | null;
  continueUrl?: string | null;
  [key: string]: any;
}

export function NoticePage() {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [severityLevel, setSeverityLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>(
    'LOW',
  );
  const [canResolve, setCanResolve] = useState<boolean>(false);
  const [triggerUrl, setTriggerUrl] = useState<string | null>(null);
  const [continueUrl, setContinueUrl] = useState<string | null>(null);
  const pendingActions = useAppSelector((state) => state.pendingActions);

  useEffect(() => {
    if (pendingActions.loading) return;

    const pendingActionsData: IPendingAction | undefined =
      pendingActions.pendingActions.find(
        (r) => r.actionType === 'ANNOUNCEMENT_READ',
      );
    const NoticeData = pendingActionsData?.context as INoticeData;

    if (NoticeData) {
      console.log('Notice data found:', NoticeData);
      setTitle(NoticeData.title || 'Notice');
      setContent(NoticeData.content || 'No content available.');
      setSeverityLevel(NoticeData.severityLevel || 'LOW');
      setCanResolve(NoticeData.canResolve || false);
      setTriggerUrl(NoticeData.triggerUrl || null);
      setContinueUrl(NoticeData.continueUrl || null);
    } else {
      console.error('No notice data found or invalid format.');
    }
  }, [pendingActions.loading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-8">
          <NoticeHeader title={title} severity={severityLevel} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="px-0 pt-4 pb-6 space-y-4"
          >
            <NoticeContent content={content} severity={severityLevel} />

            <MoreInformation
              data={{
                triggerUrl,
                continueUrl,
              }}
            />

            <NoticeActions
              canResolve={canResolve}
              continueUrl={continueUrl}
              severity={severityLevel}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
