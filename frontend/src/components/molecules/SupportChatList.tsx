import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/services/axiosInstance';
import { Button } from '@/components/ui/button';

interface SupportChatDTO {
  chatId: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export default function SupportChatList({
  onSelectChat,
}: {
  onSelectChat: (id: string) => void;
}) {
  const [supportChats, setSupportChats] = useState<SupportChatDTO[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const fetchSupportChats = async (query = '', page = 0) => {
    const res = await axiosInstance.get('/chat/support/all', {
      params: {
        search: query,
        page,
        size: pageSize,
      },
    });
    setSupportChats(res.data.content || []);
    setTotalPages(res.data.page.totalPages || 0);
  };

  useEffect(() => {
    fetchSupportChats(search, page);
  }, [page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setPage(0);
    fetchSupportChats(value, 0);
  };

  return (
    <div className="flex flex-col h-full px-4 py-2">
      <Input
        placeholder="Search by name or username..."
        value={search}
        onChange={handleSearchChange}
        className="mb-3"
      />

      {supportChats.length === 0 ? (
        <p className="text-center text-gray-500 mt-6">
          No support chats found.
        </p>
      ) : (
        <>
          <div className="flex flex-col space-y-2 overflow-auto pr-2 mb-4">
            {supportChats.map((chat) => (
              <Card
                key={chat.chatId}
                className="p-3 cursor-pointer hover:bg-gray-100 transition rounded-md shadow-sm"
                onClick={() => onSelectChat(chat.chatId)}
              >
                <p className="font-semibold truncate" title={chat.fullName}>
                  {chat.fullName}{' '}
                  <span className="text-xs text-gray-400">({chat.role})</span>
                </p>
                <p
                  className="text-sm text-gray-600 truncate"
                  title={chat.username}
                >
                  @{chat.username}
                </p>
                <p
                  className="text-xs text-gray-500 truncate"
                  title={chat.email}
                >
                  {chat.email}
                </p>
              </Card>
            ))}
          </div>

          <div className="flex justify-center items-center gap-2 mt-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Prev
            </Button>
            <span className="text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
