import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import UserChatList from '@/components/molecules/UserChatList';
import LiveChat from '@/components/organisms/live-chat';
import { useSearchParams } from 'react-router-dom';

export interface OpenChatMetaData {
  id: string;
  name: string;
  type: 'SUPPORT' | 'PRIVATE' | 'AUCTION' | 'GROUP';
}

export default function UserChatManager() {
  const [openChats, setOpenChats] = useState<OpenChatMetaData[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSelectedChatId = searchParams.get('chatId');

  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    urlSelectedChatId,
  );

  // Keep selectedChatId in sync with URL
  useEffect(() => {
    if (selectedChatId) {
      setSearchParams({ chatId: selectedChatId });
    } else {
      setSearchParams({});
    }
  }, [selectedChatId, setSearchParams]);

  const openChat = (
    id: string,
    name: string,
    type: OpenChatMetaData['type'],
  ) => {
    const alreadyOpen = openChats.some((chat) => chat.id === id);
    if (!alreadyOpen) {
      setOpenChats((prev) => [...prev, { id, name, type }]);
    }
    setSelectedChatId(id);
  };

  useEffect(() => {
    if (urlSelectedChatId && urlSelectedChatId !== selectedChatId) {
      setSelectedChatId(urlSelectedChatId);
    }
  }, [urlSelectedChatId]);

  return (
    <div className="flex h-screen max-h-screen bg-white text-gray-900">
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Chats</h2>
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
          <UserChatList
            onSelectChat={(id, name, type) =>
              openChat(
                id,
                name,
                type as 'SUPPORT' | 'PRIVATE' | 'AUCTION' | 'GROUP',
              )
            }
          />
        </div>
      </div>

      <div className="flex-1 relative">
        {openChats.map((chat) => (
          <div
            key={chat.id}
            className={chat.id === selectedChatId ? 'block' : 'hidden'}
            style={{ height: '100%' }}
          >
            {chat.type === 'AUCTION' ? (
              <LiveChat
                type="AUCTION"
                auctionId={chat.id} // auctionId
                title={chat.name}
                limitUIHeight={false}
              />
            ) : (
              <LiveChat
                type={chat.type}
                chatRoomId={chat.id} // chatRoomId
                title={chat.name}
                limitUIHeight={false}
              />
            )}
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
