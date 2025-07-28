import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SupportChatList from '@/components/molecules/SupportChatList';
import SupportChatView from '@/components/organisms/SupportChatView';

export default function AdminSupportChatManager() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <div className="flex h-screen max-h-screen bg-white text-gray-900">
      {/* Left Sidebar: Chat list */}
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Support Chats</h2>
          {selectedChatId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedChatId(null)}
            >
              ← Back
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-auto">
          <SupportChatList onSelectChat={setSelectedChatId} />
        </div>
      </div>

      {/* Right Content: Chat View */}
      <main className="flex-grow bg-gray-50 flex flex-col">
        {selectedChatId ? (
          <SupportChatView chatRoomId={selectedChatId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>Select a chat from the list to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}
