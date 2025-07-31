import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchLatestNotifications,
  fetchUnreadCount,
} from '@/store/slices/notificationSlice';
import { useAppDispatch } from '@/hooks/hooks';

export const FCMHandlerEventListener = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handler = (event: CustomEvent) => {
      console.log('event', event);
      const payload = event.detail;

      const title = payload?.notification?.title || 'New Notification';
      const body = payload?.notification?.body || '';

      toast({
        title,
        description: body,
      });

      // desktop notification (only if permission granted)
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          //   icon: '/favicon.ico',
        });
      }

      dispatch(fetchLatestNotifications());
      dispatch(fetchUnreadCount());
    };

    window.addEventListener('fcm-notification', handler as EventListener);

    return () => {
      window.removeEventListener('fcm-notification', handler as EventListener);
    };
  }, [toast]);

  return null;
};
