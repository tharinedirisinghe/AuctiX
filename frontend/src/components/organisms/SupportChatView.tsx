import LiveChat from '@/components/organisms/live-chat';

export default function SupportChatView({
  chatRoomId,
}: {
  chatRoomId: string;
}) {
  return (
    <LiveChat
      chatRoomId={chatRoomId}
      type="SUPPORT"
      title="Support Chat"
      limitUIHeight={false}
    />
  );
}
