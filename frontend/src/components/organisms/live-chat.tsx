import { useEffect, useState, useRef, useCallback } from 'react';
import { Client, StompHeaders } from '@stomp/stompjs';
import { useInView } from 'react-intersection-observer';
import SockJS from 'sockjs-client';
import { ChatMessageDTO } from '@/types/IChatMessageDTO';
import { IAuthUser } from '@/types/IAuthUser';
import { useAppSelector } from '@/hooks/hooks';
import AxiosRequest from '@/services/axiosInspector';
import { AxiosInstance } from 'axios';
import { ChatMessageProps } from '@/types/IChatMessageProps';
import { ChatMessage } from '../atoms/chatMessage';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type ChatRoomProps =
  | {
      type: 'AUCTION';
      auctionId: string;
      title?: string;
      limitUIHeight?: boolean;
    }
  | {
      type: 'SUPPORT' | 'PRIVATE' | 'GROUP';
      chatRoomId: string;
      title?: string;
      limitUIHeight?: boolean;
    };

const LiveChat = (props: ChatRoomProps) => {
  const { type, title, limitUIHeight } = props;

  const { ref, inView } = useInView({
    threshold: 0.4,
    triggerOnce: false,
  });

  const chatRoomId = type !== 'AUCTION' ? props.chatRoomId : undefined;
  const auctionId = type === 'AUCTION' ? props.auctionId : undefined;

  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);
  const lastNewMessageSource = useRef<'self' | 'other' | null>(null); // null if no last message

  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

  const user = useAppSelector((state) => state.user);
  const userAuth: IAuthUser = useAppSelector(
    (state) => state.auth as IAuthUser,
  );

  const isAuthenticated = !!userAuth && !!userAuth.token;
  const displayName = user?.username || 'Guest';
  const axiosInstance: AxiosInstance = AxiosRequest().axiosInstance;
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  let topicPath = '';
  const sendMessageDestination = `/app/chat.sendMessage/${type}/${type === 'AUCTION' ? auctionId : chatRoomId}`;

  const getMessageFetchEndpoint = (
    chatType: string,
    auctionId?: string,
    chatRoomId?: string,
  ): string => {
    const id = chatType === 'AUCTION' ? auctionId : chatRoomId;
    if (!id) throw new Error(`Missing ID for chatType: ${chatType}`);
    return `/chat/${chatType}/${id}/messages`;
  };

  const setTopicPath = () => {
    switch (type) {
      case 'AUCTION':
        topicPath = `/topic/chat/auction/${auctionId}`;
        break;
      case 'SUPPORT':
        topicPath = `/topic/chat/support/${chatRoomId}`;
        break;
      case 'PRIVATE':
        topicPath = `/topic/chat/direct/${chatRoomId}`;
        break;
      case 'GROUP':
        topicPath = `/topic/chat/group/${chatRoomId}`;
        break;
      default:
        console.error('Invalid chat type');
        return;
    }
  };

  // Flag to control scroll behavior
  const isLoadingOlderMessages = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionRef = useRef<any>(null);

  const webSocketURL =
    import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8080/ws';

  const fetchMessages = useCallback(
    async (pageNum: number) => {
      if (isLoading) return;

      setIsLoading(true);
      // Set flag when loading older messages (not the initial load)
      if (pageNum > 0) {
        isLoadingOlderMessages.current = true;

        const container = scrollContainerRef.current;
        if (container) {
          previousScrollHeightRef.current = container.scrollHeight;
          previousScrollTopRef.current = container.scrollTop;
        }
      }

      try {
        const msgFetchPath = getMessageFetchEndpoint(
          type,
          auctionId,
          chatRoomId,
        );

        const response = await axiosInstance.get(msgFetchPath, {
          params: { page: pageNum, size: limitUIHeight ? 5 : 3 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newMessages: any[] = response.data;
        const reversedNewMessages = [...newMessages].reverse(); // display order is reversed

        if (reversedNewMessages && reversedNewMessages.length > 0) {
          const formattedMessages = reversedNewMessages.map(
            (msg: ChatMessageDTO) => {
              return {
                id: msg.id || Date.now().toString() + Math.random(),
                userId: msg.senderId || '',
                message: msg.content || '',
                displayName: msg.senderName || 'Unknown',
                userRole: msg.senderRole || 'User',
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
                isSentByCurrentUser: msg.senderUsername == user.username,
              };
            },
          );
          setMessages((prevMessages) => [
            ...formattedMessages,
            ...prevMessages,
          ]); // prepend new messages
        } else {
          setHasMore(false); // No more messages to load
        }
      } catch (error) {
        console.error('Error fetching messages', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, axiosInstance, auctionId, user],
  );

  // Handle scrolling after messages are updated
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    if (isLoadingOlderMessages.current) {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDiff = newScrollHeight - previousScrollHeightRef.current;

        container.scrollTop = previousScrollTopRef.current + scrollDiff;

        // we need to check again or the new message indicator is shown when scrolling up
        requestAnimationFrame(() => {
          isLoadingOlderMessages.current = false;
        });
      });
    } else if (lastNewMessageSource.current == 'self') {
      // If user just sent a message, scroll to bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
      lastNewMessageSource.current = null;
    } else {
      //  Scroll to bottom if user is near the bottom already
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (nearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      } else if (
        isLoadingOlderMessages.current == false &&
        lastNewMessageSource.current == 'other' &&
        nearBottom == false
      ) {
        setShowNewMessageIndicator(true);
        lastNewMessageSource.current = null;
      }
    }
  }, [messages]);

  // Auto hide the new message indicator when scrolled to near the bottom.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      if (distanceFromBottom < 100) {
        setShowNewMessageIndicator(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    setTopicPath();

    if (topicPath == null) {
      return;
    }

    let connectHeaders: StompHeaders | undefined;

    if (
      isAuthenticated &&
      userAuth.token &&
      (type === 'AUCTION' ? auctionId : chatRoomId)
    ) {
      connectHeaders = {
        Authorization: `Bearer ${userAuth.token}`,
        chatType: type,
        chatId: type === 'AUCTION' ? auctionId! : chatRoomId!,
      };
    } else if (!isAuthenticated && type === 'AUCTION' && auctionId) {
      // Allow anonymous read for auction chats
      connectHeaders = {
        chatType: 'AUCTION',
        chatId: auctionId,
      };
    } else {
      connectHeaders = undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(webSocketURL),
      debug: function (str) {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: connectHeaders,
      onConnect: (frame) => {
        console.log('Connected to WebSocket');
        const serverUserName = frame.headers['user-name'];
        if (serverUserName?.startsWith('guest')) {
          console.log('Connected as guest user:', serverUserName);
          setIsGuest(true);
        } else {
          setIsGuest(false);
          console.log('Authenticated user:', serverUserName);
        }
        setConnected(true);

        // Subscribe to the auction chat topic only if not already subscribed
        if (!subscriptionRef.current) {
          subscriptionRef.current = client.subscribe(
            topicPath,
            (messageOutput) => {
              try {
                const receivedMessage: ChatMessageDTO = JSON.parse(
                  messageOutput.body,
                );
                console.log('Received message:', receivedMessage);

                if (!receivedMessage.content) {
                  console.error('Received message with no content');
                  return;
                }

                const newChatMessage: ChatMessageProps = {
                  id: receivedMessage.id || Date.now().toString(),
                  userId: receivedMessage.senderId || '',
                  message: receivedMessage.content || '[Empty message]',
                  displayName: receivedMessage.senderName || 'Unknown',
                  userRole: receivedMessage.senderRole || 'User',
                  timestamp: receivedMessage.timestamp
                    ? new Date(receivedMessage.timestamp)
                    : new Date(),
                  isSentByCurrentUser:
                    isAuthenticated &&
                    receivedMessage.senderUsername === user.username,
                };

                // Adding new message - this is NOT loading older messages
                isLoadingOlderMessages.current = false;
                setMessages((prevMessages) => [
                  ...prevMessages,
                  newChatMessage,
                ]);

                updateLastReadTimestamp();

                if (newChatMessage.isSentByCurrentUser) {
                  lastNewMessageSource.current = 'self';
                } else {
                  lastNewMessageSource.current = 'other';
                }
              } catch (error) {
                console.error('Error parsing message:', error);
              }
            },
            isAuthenticated
              ? { Authorization: `Bearer ${userAuth.token}` }
              : {},
          );
        }
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        setConnected(false);
        // Cleanup subscription when disconnecting
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
        setConnected(false);
      },
      onWebSocketError: (error) => {
        console.error('WebSocket Error:', error);
        setConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [
    auctionId,
    chatRoomId,
    topicPath,
    webSocketURL,
    user,
    isAuthenticated,
    displayName,
    userAuth.token,
  ]);

  const sendMessage = () => {
    if (!isAuthenticated || isGuest) {
      console.error('Cannot send messages in guest mode');
      return;
    }

    if (stompClient && stompClient.active && newMessage.trim() !== '') {
      console.log('Sending message:', newMessage);

      const chatMessage: ChatMessageDTO = {
        // userid isnt there in user slice, so remove this later
        senderId: displayName,
        senderName: displayName,
        content: newMessage,
        auctionId: auctionId,
      };

      // Send to server
      stompClient.publish({
        destination: sendMessageDestination,
        body: JSON.stringify(chatMessage),
        headers: {
          Authorization: `Bearer ${userAuth.token}`,
        },
      });

      setNewMessage('');

      // This is a new message, not loading older messages
      isLoadingOlderMessages.current = false;
    } else if (!stompClient || !stompClient.active) {
      console.error('WebSocket is not connected');
    }
  };

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || isLoading || !hasMore) return;

      if (container.scrollTop <= 5) {
        // Use a small threshold instead of exactly 0
        console.log('Reached top, loading more messages');
        isLoadingOlderMessages.current = true;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMessages(nextPage);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);

      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [hasMore, fetchMessages, page, isLoading]);

  // Load initial messages only once when component mounts
  useEffect(() => {
    // Only run fetchMessages once loading is done
    if (!user.loading) {
      // Initial load should scroll to bottom
      isLoadingOlderMessages.current = false;
      fetchMessages(0).then(() => {
        updateLastReadTimestamp();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAuth, user.loading]);

  const isChatScrolledToBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const threshold = 100; // px from bottom
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  const isTabVisible = () => document.visibilityState === 'visible';
  const isChatVisible = () => inView;

  const shouldUpdateLastRead = () => {
    console.log(
      'should update last read' +
        isChatScrolledToBottom() +
        isTabVisible() +
        isChatVisible(),
    );
    return isChatScrolledToBottom() && isTabVisible() && isChatVisible();
  };

  const updateLastReadTimestamp = async () => {
    if (shouldUpdateLastRead()) {
      try {
        const chatId = type === 'AUCTION' ? auctionId : chatRoomId;
        if (!chatId) return;

        await axiosInstance.put(`/chat/${type}/${chatId}/last-read`);
      } catch (error) {
        console.error('Failed to update last read timestamp', error);
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isChatVisible()) {
        setTimeout(() => {
          updateLastReadTimestamp();
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Trigger when inView changes
  useEffect(() => {
    if (inView) {
      updateLastReadTimestamp();
    }
  }, [inView]);

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex items-center justify-between p-2 border-b" ref={ref}>
        <h2 className="font-medium">{title ? title : 'Chat'}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {connected
              ? isGuest
                ? 'Connected in Guest Mode (Read Only)'
                : 'Connected to chat'
              : 'Disconnected'}
          </span>
          <div
            className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            title={connected ? 'Connected' : 'Disconnected'}
          ></div>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          limitUIHeight ? 'max-h-[500px]' : 'max-h-svh'
        }`}
        ref={scrollContainerRef}
      >
        {hasMore ? (
          <button
            onClick={() => {
              isLoadingOlderMessages.current = true;
              const nextPage = page + 1;
              setPage(nextPage);
              fetchMessages(nextPage);
            }}
            className="w-full py-2 mb-4 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load Previous Messages'}
          </button>
        ) : (
          <div className="text-center">Start of chat history</div>
        )}

        {isLoading && page === 0 && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}
        {/* {isLoading && page > 0 && (
          <div className="text-center text-gray-500">
            Loading more messages...
          </div>
        )} */}
        {messages.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              id={msg.id}
              userId={msg.userId}
              message={msg.message || '[Empty message]'}
              displayName={msg.displayName || 'Unknown'}
              userRole={msg.userRole || 'User'}
              timestamp={msg.timestamp || new Date()}
              isSentByCurrentUser={msg.isSentByCurrentUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {showNewMessageIndicator && (
        <div className="relative bottom-4 w-full z-10">
          <div className="mx-auto w-fit">
            <button
              className="bg-yellow-500 text-black px-4 py-2 rounded shadow"
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth',
                  });
                  setShowNewMessageIndicator(false);
                }
              }}
            >
              New messages - Click to view
            </button>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <div className="flex flex-row items-center space-x-2">
            <Label className="sr-only">Message</Label>
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isAuthenticated ? 'Type a message...' : 'Login to chat'
              }
              id="message"
              autoComplete="off"
              required
              className="flex-1"
              disabled={!connected || isGuest}
            />
            <Button type="submit" disabled={!connected || isGuest}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveChat;
