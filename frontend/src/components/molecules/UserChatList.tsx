import React, { useCallback, useEffect, useState } from 'react';
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
import { useSearchParams } from 'react-router-dom';

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
  const [hasSupportChat, setHasSupportChat] = useState(false);
  const pageSize = 10;
  const [searchParams] = useSearchParams();

  const getOrCreateSupportChat = async () => {
    const res = await axiosInstance.get('/chat/support');
    return res.data;
  };

  useEffect(() => {
    setHasSupportChat(chats.some((chat) => chat.chatRoomType === 'SUPPORT'));
  }, [chats]);

  const fetchChats = useCallback(
    async (query = '', type = 'ALL', page = 0) => {
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

        const allChats: UserChatDTO[] = res.data || [];

        const sortedChats = allChats.sort((a, b) => {
          if (a.chatRoomType === 'SUPPORT' && b.chatRoomType !== 'SUPPORT')
            return -1;
          if (a.chatRoomType !== 'SUPPORT' && b.chatRoomType === 'SUPPORT')
            return 1;
          return 0;
        });

        setChats(sortedChats);
      } catch (err) {
        console.error('Failed to fetch user chats', err);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(search, chatRoomType, page);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchChats, search, chatRoomType, page]);

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

  function handleSelectChat(
    chat: UserChatDTO,
    onSelectChat: (id: string, label: string, type: string) => void,
  ) {
    const chatRoomType = chat.chatRoomType as
      | 'SUPPORT'
      | 'PRIVATE'
      | 'AUCTION'
      | 'GROUP';

    const selectId =
      chatRoomType === 'AUCTION' && chat.auctionId
        ? chat.auctionId
        : chat.chatRoomId;

    const label = formatLabel(chat);

    onSelectChat(selectId, label, chatRoomType);
  }

  useEffect(() => {
    const urlChatId = searchParams.get('id');
    const urlChatType = searchParams.get('type');

    if (!urlChatId || !urlChatType) return;

    const matchedChat = chats.find((chat) => {
      const chatRoomType = chat.chatRoomType;
      if (urlChatType === 'AUCTION' && chat.auctionId === urlChatId) {
        return true;
      }
      return chat.chatRoomId === urlChatId && chatRoomType === urlChatType;
    });

    if (matchedChat) {
      handleSelectChat(matchedChat, onSelectChat);
    }
  }, [searchParams, chats]);

  type ChatCardProps = {
    chat: UserChatDTO;
    onSelectChat: (id: string, label: string, type: string) => void;
    formatLabel: (chat: UserChatDTO) => string;
    handleSelectChat: (
      chat: UserChatDTO,
      onSelectChat: (id: string, label: string, type: string) => void,
    ) => void;
  };

  const ChatCardComponent: React.FC<ChatCardProps> = ({
    chat,
    onSelectChat,
    formatLabel,
    handleSelectChat,
  }) => {
    return (
      <Card
        className={`relative p-4 mt-2 cursor-pointer transition-shadow rounded-lg shadow-sm border ${
          chat.chatRoomType === 'SUPPORT'
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-100 hover:bg-gray-50 hover:border-gray-300'
        }`}
        onClick={() => handleSelectChat(chat, onSelectChat)}
      >
        {/* Floating unread count badge */}
        {chat.unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full select-none"
            title={`${chat.unreadCount} unread messages`}
          >
            {chat.unreadCount} unread
          </span>
        )}

        <div className="flex justify-between items-center mb-1">
          <p
            className={`text-gray-900 text-sm truncate font-medium`}
            title={formatLabel(chat)}
          >
            {formatLabel(chat)}
          </p>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide select-none">
            {chat.chatRoomType}
          </span>
        </div>

        {chat.username && chat.chatRoomType === 'PRIVATE' && (
          <p className="text-sm truncate" title={`Username: @${chat.username}`}>
            @{chat.username}
          </p>
        )}
      </Card>
    );
  };

  const ChatCard = React.memo(ChatCardComponent);

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
        {chats.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">No chats found.</p>
        ) : (
          chats.map((chat) => (
            <ChatCard
              key={chat.chatRoomId}
              chat={chat}
              onSelectChat={onSelectChat}
              formatLabel={formatLabel}
              handleSelectChat={handleSelectChat}
            />
          ))
        )}
      </div>

      {!isLoading && !hasSupportChat && (
        <div className="mt-4 text-center">
          <Button
            onClick={async () => {
              const created = await getOrCreateSupportChat();
              await fetchChats(search, chatRoomType, page);
              handleSelectChat(created, onSelectChat);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            Create Support Chat
          </Button>
        </div>
      )}

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
