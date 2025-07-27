import LiveChat from '@/components/organisms/live-chat';

export default function SupportChat() {
  const chatRoomId = 'dsfadfasdf-adsfasdf-ad-adfasdf';

  return (
    <>
      <LiveChat chatRoomId={chatRoomId} type="SUPPORT" title="Support Chat" />;
    </>
  );
}
