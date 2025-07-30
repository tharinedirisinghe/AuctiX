import { useEffect, useState } from 'react';
import axiosInstance from '@/services/axiosInstance';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface UserChatDTO {
  chatRoomId: string;
  chatRoomType: string;
  auctionId?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  notificationCount: number;
  auctionTitle?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export default function UserChatList({
  onSelectChat,
}: {
  onSelectChat: (id: string, label: string, type: string) => void;
}) {
  const [chats, setChats] = useState<UserChatDTO[]>([]);
  const [search, setSearch] = useState('');
  const [chatRoomType, setChatRoomType] = useState('ALL');
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const fetchChats = async (query = '', type = 'ALL', page = 0) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get('/chat/search', {
        params: {
          searchTerm: query.trim(),
          chatRoomType: type === 'ALL' ? null : type,
          limit: pageSize,
          offset: page * pageSize,
        },
      });
      setChats(res.data || []);
    } catch (err) {
      console.error('Failed to fetch user chats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchChats(search, chatRoomType, page);
    }, 300); // debounce
    return () => clearTimeout(timeout);
  }, [search, chatRoomType, page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleChatTypeChange = (value: string) => {
    setChatRoomType(value);
    setPage(0);
  };

  const formatLabel = (chat: UserChatDTO): string => {
    switch (chat.chatRoomType) {
      case 'AUCTION':
        return `Auction: ${chat.auctionTitle ?? 'Untitled'}`;
      case 'PRIVATE':
        if (chat.auctionTitle) {
          return `Auction: ${chat.auctionTitle ?? 'Untitled'} seller ${chat.firstName ?? ''} ${chat.lastName ?? ''} (@${chat.username})`;
        } else {
          return `${chat.firstName ?? ''} ${chat.lastName ?? ''} (@${chat.username})`;
        }
      case 'SUPPORT':
        return `AuctiX support team`;
      default:
        return chat.chatRoomType;
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-2">
      <div className="flex items-center gap-2 mb-3">
        <Input
          placeholder="Search chats..."
          value={search}
          onChange={handleSearchChange}
          className="flex-1"
        />
        <Select value={chatRoomType} onValueChange={handleChatTypeChange}>
          <SelectTrigger className="w-40">Filter</SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="AUCTION">Auction</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
            <SelectItem value="SUPPORT">Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {isLoading ? (
          <p className="text-center text-gray-400 mt-6">Loading chats...</p>
        ) : chats.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">No chats found.</p>
        ) : (
          chats.map((chat) => (
            <Card
              key={chat.chatRoomId}
              className="p-3 cursor-pointer hover:bg-gray-100 transition rounded-md shadow-sm"
              onClick={() => {
                let selectId;
                if (chat.chatRoomType === 'AUCTION' && chat.auctionId) {
                  selectId = chat.auctionId;
                } else {
                  selectId = chat.chatRoomId;
                }

                onSelectChat(
                  selectId,
                  formatLabel(chat),
                  chat.chatRoomType as
                    | 'SUPPORT'
                    | 'PRIVATE'
                    | 'AUCTION'
                    | 'GROUP',
                );
              }}
            >
              <p className="font-semibold truncate">
                {formatLabel(chat)}{' '}
                <span className="text-xs text-gray-400">
                  ({chat.chatRoomType})
                </span>
              </p>
              {chat.username && (
                <p className="text-sm text-gray-600 truncate">
                  @{chat.username}
                </p>
              )}
              {chat.unreadCount > 0 && (
                <p className="text-xs text-red-500">
                  {chat.unreadCount} unread
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Prev
        </Button>
        <span className="text-sm">Page {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={chats.length < pageSize}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
