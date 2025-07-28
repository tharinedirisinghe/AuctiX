import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import axiosInstance from '@/services/axiosInstance';

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

  const fetchSupportChats = async (query = '') => {
    const res = await axiosInstance.get('/chat/support/all', {
      params: { search: query },
    });
    setSupportChats(res.data.content || []);
  };

  useEffect(() => {
    fetchSupportChats();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    fetchSupportChats(value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ongoing Support Chats</h2>
      <Input
        placeholder="Search by name or username..."
        value={search}
        onChange={handleSearchChange}
      />
      {supportChats.length === 0 ? (
        <p>No support chats found.</p>
      ) : (
        supportChats.map((chat) => (
          <Card
            key={chat.chatId}
            className="p-4 cursor-pointer hover:bg-muted transition"
            onClick={() => onSelectChat(chat.chatId)}
          >
            <p className="font-medium">Chat ID: {chat.chatId}</p>
            <p className="text-sm text-muted-foreground">
              User: {chat.fullName} ({chat.username}) - {chat.role}
            </p>
            <p className="text-sm text-muted-foreground">Email: {chat.email}</p>
          </Card>
        ))
      )}
    </div>
  );
}
