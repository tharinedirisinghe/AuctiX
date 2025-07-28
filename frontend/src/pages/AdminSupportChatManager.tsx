import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SupportChatList from '@/components/molecules/SupportChatList';
import SupportChatView from '@/components/organisms/SupportChatView';

export default function AdminSupportChatManager() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {!selectedChatId ? (
        <SupportChatList onSelectChat={setSelectedChatId} />
      ) : (
        <div>
          <Button onClick={() => setSelectedChatId(null)}>
            ← Back to list
          </Button>
          <SupportChatView chatRoomId={selectedChatId} />
        </div>
      )}
    </div>
  );
}
