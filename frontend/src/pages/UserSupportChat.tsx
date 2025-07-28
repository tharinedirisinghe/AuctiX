import { useEffect, useState } from 'react';
import LiveChat from '@/components/organisms/live-chat';

import { useAppSelector } from '@/hooks/hooks';
import axiosInstance from '@/services/axiosInstance';

export default function UserSupportChat() {
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const { isUserLoggedIn } = useAppSelector((store) => store.auth); // Get logged-in user

  const getOrCreateSupportChat = async () => {
    const res = await axiosInstance.get('/chat/support');
    return res.data;
  };

  useEffect(() => {
    if (isUserLoggedIn) {
      getOrCreateSupportChat()
        .then((chatRoom) => {
          setChatRoomId(chatRoom.id);
        })
        .catch((err) => {
          console.error('Failed to get/create support chat', err);
        });
    }
  }, [isUserLoggedIn]);

  if (!chatRoomId) {
    return <p>Loading your support chat...</p>;
  }

  return (
    <LiveChat chatRoomId={chatRoomId} type="SUPPORT" title="Support Chat" />
  );
}
