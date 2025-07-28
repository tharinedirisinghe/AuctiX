import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlobalNotificationSettingsSection from '@/components/organisms/GlobalNotificationSettingsSection';
import NotificationSettingsCategorySection from '@/components/organisms/NotificationSettingsCategorySection';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  extractEditableSettings,
} from '@/services/notificationService';
import {
  type NotificationSettingsResponse,
  type NotificationSettingsUpdateRequest,
  type NotificationGroupCategoryLabel,
  NOTIFICATION_CATEGORY_GROUP_LABELS,
} from '@/types/notification';
import AxiosRequest from '@/services/axiosInspector';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Bell, BellRing } from 'lucide-react';
import { PushPermissionModal } from '@/components/molecules/PushPermissionModal';

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] =
    useState<NotificationSettingsResponse | null>(null);
  const [editableSettings, setEditableSettings] =
    useState<NotificationSettingsUpdateRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPushPermissionModal, setShowPushPermissionModal] = useState(false);

  const axiosInstance = AxiosRequest().axiosInstance;
  const { toast } = useToast();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getNotificationPreferences(axiosInstance);
        setPreferences(data);
        setEditableSettings(extractEditableSettings(data));
      } catch (error: unknown) {
        console.error('Failed to fetch notification preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to fetch notification preferences!',
          description:
            error instanceof Error
              ? error.message
              : 'An error occurred when fetching notification preferences.',
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
    // No need to add axiosInstance to the dependancy array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGlobalToggle = (channelType: string, enabled: boolean) => {
    if (!preferences || !editableSettings) return;

    // Update the UI state for preferences
    setPreferences({
      ...preferences,
      global: {
        ...preferences.global,
        [channelType]: {
          ...preferences.global[channelType],
          enabled,
        },
      },
    });

    // Update the editable settings that will be sent to the API
    setEditableSettings({
      ...editableSettings,
      global: {
        ...editableSettings.global,
        [channelType]: enabled,
      },
    });
  };

  const handleEventToggle = (
    categoryGroup: string,
    eventType: string,
    channelType: string,
    enabled: boolean,
  ) => {
    if (!preferences || !editableSettings) return;

    // Update the UI state for preferences
    setPreferences({
      ...preferences,
      events: {
        ...preferences.events,
        [categoryGroup]: {
          ...preferences.events[categoryGroup],
          [eventType]: {
            ...preferences.events[categoryGroup][eventType],
            channelTypes: {
              ...preferences.events[categoryGroup][eventType].channelTypes,
              [channelType]: enabled,
            },
          },
        },
      },
    });

    // Update the editable settings that will be sent to the API
    setEditableSettings({
      ...editableSettings,
      events: {
        ...editableSettings.events,
        [eventType]: {
          ...editableSettings.events[eventType],
          [channelType]: enabled,
        },
      },
    });
  };

  const handleSave = async () => {
    if (!editableSettings) return;

    try {
      setSaving(true);
      await saveNotificationPreferences(editableSettings, axiosInstance);
      toast({
        title: 'Notification Preferences Saved!',
        description: 'Your notification preferences saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save notification preferences!',
        description:
          error instanceof Error
            ? error.message
            : 'An error occurred when saving notification preferences.',
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderEventsForCategory = (categoryGroup: string) => {
    if (!preferences || !preferences.events[categoryGroup]) {
      return;
    }

    return Object.keys(preferences.events[categoryGroup]).map((eventType) => (
      <NotificationSettingsCategorySection
        key={`${categoryGroup}-${eventType}`}
        eventData={preferences.events[categoryGroup][eventType]}
        globalData={preferences.global}
        onToggle={(channel, enabled) =>
          handleEventToggle(categoryGroup, eventType, channel, enabled)
        }
      />
    ));
  };

  // Get unique category groups for tabs
  const categoryGroups = preferences ? Object.keys(preferences.events) : [];

  const getCategoryDisplayName = (category: string) => {
    if (category in NOTIFICATION_CATEGORY_GROUP_LABELS) {
      return NOTIFICATION_CATEGORY_GROUP_LABELS[
        category as NotificationGroupCategoryLabel
      ];
    }
    return category;
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto mb-3">
      <div className="mx-auto max-w-4x">
        <div className="flex items-center justify-between border-b py-6">
          <div>
            <div className="flex items-center justify-between gap-2">
              <Bell className="h-7 w-7 text-brandGoldYellow" />
              <h1 className="text-3xl font-bold">Notification Preferences</h1>
            </div>
            <p className="text-gray-500 mt-1">
              Choose how you want to get notified
            </p>
          </div>

          <div>
            <Button
              className="mx-1"
              variant={'secondary'}
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>

            <Button
              className="bg-brandGoldYellow text-gray-800 hover:bg-brandGoldYellow/80 mx-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="py-6">
          <div className="rounded-2xl border px-6 py-5 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BellRing className="text-brandGoldYellow h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">
                    Browser Push Settings
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Control whether this browser can show push notifications
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowPushPermissionModal(true)}
                // className="bg-brandGoldYellow text-black hover:bg-brandGoldYellow/90"
              >
                Configure
              </Button>
            </div>

            {typeof Notification === 'undefined' ? (
              <p className="text-sm text-red-600">
                This browser does not support notifications.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Current browser permission:{' '}
                <span className="font-medium">{Notification.permission}</span>
              </p>
            )}
          </div>
        </div>
        <div className="py-6">
          <h2 className="mb-1 text-xl font-medium">Global Settings</h2>
          <p className="mb-3">
            This controls enabling or disabling notifications globally for all
            methods of delivery
          </p>

          {preferences ? (
            <GlobalNotificationSettingsSection
              globalSettings={preferences.global || {}}
              onToggle={handleGlobalToggle}
            />
          ) : (
            <p className="text-center text-gray-500">
              Failed to load notification preferecnes
            </p>
          )}

          <div className="mb-4 mt-8">
            <h2 className="mb-1 text-xl font-medium">
              Notification for Event Types
            </h2>
            <p className="mb-3">
              Use these settings to choose which specific event types you want
              to receive notifications from
            </p>
            <Tabs defaultValue="all" className="w-full">
              <div className="overflow-x-auto pb-3">
                <TabsList className="inline-flex min-w-max gap-1 px-2">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-brandGoldYellow data-[state=active]:text-black"
                  >
                    All
                  </TabsTrigger>

                  {categoryGroups.map((group) => (
                    <TabsTrigger
                      key={group}
                      value={group}
                      className="data-[state=active]:bg-brandGoldYellow data-[state=active]:text-black"
                    >
                      {getCategoryDisplayName(group)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {preferences ? (
                <>
                  <TabsContent value="all" className="mt-4">
                    {categoryGroups.map((categoryGroup) => (
                      <React.Fragment key={categoryGroup}>
                        <div className="mx-3 my-2 text-xl font-medium">
                          {getCategoryDisplayName(categoryGroup)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3">
                          {renderEventsForCategory(categoryGroup)}
                        </div>
                      </React.Fragment>
                    ))}
                  </TabsContent>

                  {categoryGroups.map((categoryGroup) => (
                    <TabsContent
                      key={categoryGroup}
                      value={categoryGroup}
                      className="mt-4 grid  grid-cols-1 md:grid-cols-3"
                    >
                      {renderEventsForCategory(categoryGroup)}
                    </TabsContent>
                  ))}
                </>
              ) : (
                <p className="text-center mt-3 text-gray-500">
                  Failed to load notification preferences
                </p>
              )}
            </Tabs>
          </div>
          <div className="w-full sm:w-auto flex float-end mb-10">
            <Button
              className="w-full sm:w-auto bg-brandGoldYellow text-black hover:bg-brandGoldYellow/80 text-center whitespace-normal break-words"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
      <PushPermissionModal
        open={showPushPermissionModal}
        onOpenChange={setShowPushPermissionModal}
      />
    </div>
  );
}
