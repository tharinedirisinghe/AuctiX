import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, BellRing, ExternalLink, RefreshCw } from 'lucide-react';

export function PushPermissionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [permission, setPermission] = useState(
    Notification?.permission ?? 'default',
  );
  const [revokeInfoOpen, setRevokeInfoOpen] = useState(false);

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (open) {
      setPermission(Notification.permission);
    }
  }, [open]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <BellRing className="text-brandGoldYellow h-6 w-6" />
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Browser Push Notifications
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Your browser needs permission to send push notifications.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="text-sm text-muted-foreground mt-4">
            Current permission:{' '}
            <span className="font-medium text-black">{permission}</span>
          </div>

          <div className="space-y-3 mt-6">
            <Button
              className="w-full bg-brandGoldYellow text-black hover:bg-brandGoldYellow/90"
              disabled={permission === 'granted'}
              onClick={handleRequestPermission}
            >
              {permission === 'granted'
                ? 'Permission Granted'
                : 'Request Permission'}
            </Button>

            {permission === 'granted' && (
              <>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 text-gray-800 border-gray-400 hover:bg-gray-50"
                  onClick={handleReload}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload to Activate Notifications
                </Button>

                <div className="text-xs text-muted-foreground text-center">
                  A page reload is required to fully activate push notifications
                  and register the service worker.
                </div>

                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 text-red-600 border-red-400 hover:bg-red-50"
                  onClick={() => setRevokeInfoOpen(true)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  How to Revoke Permission
                </Button>
              </>
            )}

            {permission === 'denied' && (
              <div className="text-sm text-red-600 border border-red-300 bg-red-50 rounded-lg p-3">
                <strong>Notifications are blocked.</strong> To enable them
                again, go to your browser's site settings and allow
                notifications for this site.
                <div className="mt-2">
                  <a
                    href="chrome://settings/content/notifications"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                  >
                    Open Chrome Notification Settings{' '}
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6" />
        </DialogContent>
      </Dialog>

      {/* Mini nested revoke info dialog */}
      <Dialog open={revokeInfoOpen} onOpenChange={setRevokeInfoOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>How to Revoke Permission</DialogTitle>
            <DialogDescription>
              Browsers don’t allow revoking permission programmatically. You can
              manually revoke notification permission in your browser settings.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>
              <strong>Chrome:</strong> Go to{' '}
              <code>chrome://settings/content/notifications</code> and remove or
              block the site.
            </div>
            <div>
              <strong>Firefox:</strong> Go to{' '}
              <code>about:preferences#privacy</code> → Permissions →
              Notifications.
            </div>
            <div>
              <strong>Safari:</strong> Go to Safari Preferences → Websites →
              Notifications.
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setRevokeInfoOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
