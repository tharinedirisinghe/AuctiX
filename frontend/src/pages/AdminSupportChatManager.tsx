import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SupportChatList from '@/components/molecules/SupportChatList';
import LiveChat from '@/components/organisms/live-chat';

interface OpenChatMetaData {
  id: string;
  name: string;
}

export default function AdminSupportChatManager() {
  const [openChats, setOpenChats] = useState<OpenChatMetaData[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const openChat = (id: string, name: string) => {
    const alreadyOpen = openChats.some((chat) => chat.id === id);

    if (!alreadyOpen) {
      setOpenChats([...openChats, { id, name }]);
    }

    setSelectedChatId(id);
  };

  return (
    <div className="flex h-screen max-h-screen bg-white text-gray-900">
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
          <SupportChatList onSelectChat={openChat} />
        </div>
      </div>

      <div className="flex-1 relative">
        {openChats.map((chat) => (
          <div
            key={chat.id}
            className={chat.id === selectedChatId ? 'block' : 'hidden'}
            style={{ height: '100%' }}
          >
            <LiveChat
              chatRoomId={chat.id}
              type="SUPPORT"
              title={chat.name}
              limitUIHeight={false}
            />
          </div>
        ))}
        {!selectedChatId && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a chat from the left to start
          </div>
        )}
      </div>
    </div>
  );
}
