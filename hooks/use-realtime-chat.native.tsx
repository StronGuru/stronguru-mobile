import apiClient from "@/api/apiClient";
import pusherClient from "@/api/pusherChannelsService";
import type { ChatMessage } from "@/src/types/chatTypes";
import type { Channel } from "pusher-js";
import { useEffect, useMemo, useRef, useState } from "react";

type UseRealtimeChatResult = {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (content: string, senderId: string, recipientUserId?: string) => Promise<void>;
  clear: () => void;
  typingUsers: string[];
  sendTyping: (userId: string, isTyping: boolean) => void;
};

export const EVENT_MESSAGE_TYPE = "new-message";
export const EVENT_TYPING_TYPE = "typing";

export default function useRealtimeChat(
  conversationId: string | number | null,
  currentUserId?: string | null,
  isScreenFocused?: boolean
): UseRealtimeChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<Channel | null>(null);
  const typingTimeoutRef = useRef<{ [userId: string]: ReturnType<typeof setTimeout> }>({});

  // Fetch initial messages
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const response = await apiClient.get(`/conversations/${conversationId}/messages`);
        const messagesData = response.data?.messages || response.data || [];
        
        if (mounted && messagesData.length > 0) {
          // Map response to ChatMessage format
          const mappedMessages = messagesData.map((msg: any) => {
            // senderId può essere un oggetto { _id, firstName, lastName } o una stringa
            let senderId: string;
            if (typeof msg.senderId === 'object' && msg.senderId !== null) {
              senderId = msg.senderId._id || msg.senderId.id;
            } else {
              senderId = msg.senderId || msg.sender?._id || msg.from?._id || '';
            }
            
            const mapped = {
              id: msg._id || msg.id || msg.messageId,
              createdAt: msg.createdAt || msg.timestamp,
              roomId: conversationId,
              senderId: senderId,
              content: msg.message || msg.body || msg.content,
              read: msg.status === 'read' || msg.read || msg.isRead
            };
            return mapped;
          });
          setMessages(mappedMessages);
        } else if (mounted) {
          setMessages([]);
        }
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
        if (mounted) setMessages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [conversationId]);

  // Subscribe to Pusher channel for realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channelName = `private-conversation-${conversationId}`;
    let channel: any = null;
    let hasSetupChannel = false;
    
    const setupChannel = () => {
      if (hasSetupChannel) return;
      hasSetupChannel = true;
      
      channel = pusherClient.subscribe(channelName);
      channelRef.current = channel;
      
      channel.bind('pusher:subscription_succeeded', () => {
        // Subscribed successfully
      });
      
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error("❌ Subscription error:", error);
      });
      
      // Listen for new messages
      channel.bind(EVENT_MESSAGE_TYPE, async (data: any) => {
      
      const newMessage: ChatMessage = {
        id: data.messageId || data.id,
        createdAt: data.timestamp || data.createdAt,
        roomId: conversationId,
        senderId: data.senderId,
        content: data.message || data.content,
        read: data.read
      };
      
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        const merged = [...prev, newMessage];
        merged.sort((a, b) => 
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
        return merged;
      });

      // Se la chat è aperta e il messaggio non è mio, marcalo come letto automaticamente
      if (isScreenFocused && currentUserId && String(data.senderId) !== String(currentUserId)) {
        try {
          const messageId = data.messageId || data.id;
          
          const { markMessageAsRead, invalidateUnreadCache } = await import("@/src/services/chatService.native");
          await markMessageAsRead(messageId);
          
          // Invalida cache e aggiorna badge
          invalidateUnreadCache();
          const { triggerUnreadMessagesUpdate } = await import("@/hooks/use-global-chat-realtime");
          triggerUnreadMessagesUpdate();
        } catch (err) {
          console.error("❌ Error auto-marking message as read:", err);
        }
      }
    });

    // Listen for typing events
    channel.bind(EVENT_TYPING_TYPE, (data: { userId: string; isTyping: boolean; senderName?: string }) => {
      
      if (data.isTyping) {
        setTypingUsers((prev) => 
          prev.includes(data.userId) ? prev : [...prev, data.userId]
        );
        
        // Clear existing timeout
        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
        }
        
        // Auto-remove typing indicator after 5 seconds
        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter(id => id !== data.userId));
          delete typingTimeoutRef.current[data.userId];
        }, 5000);
      } else {
        setTypingUsers((prev) => prev.filter(id => id !== data.userId));
        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
          delete typingTimeoutRef.current[data.userId];
        }
      }
    });
    };
    
    // Setup iniziale del canale
    setupChannel();
    
    // Gestione riconnessione Pusher
    const handleConnectionStateChange = (states: any) => {
      if (states.current === 'connected' && states.previous !== 'connected') {
        hasSetupChannel = false; // Reset flag
        setupChannel();
      }
    };
    
    pusherClient.connection.bind('state_change', handleConnectionStateChange);

    return () => {
      try {
        // Clear all typing timeouts
        Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        typingTimeoutRef.current = {};
        setTypingUsers([]);
        
        // Remove connection listener
        pusherClient.connection.unbind('state_change', handleConnectionStateChange);
        
        // Unsubscribe from Pusher channel
        if (channelRef.current) {
          channelRef.current.unbind_all();
          channelRef.current.unsubscribe();
        }
      } catch (err) {
        console.error("❌ Error cleaning up Pusher subscription", err);
      }
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, isScreenFocused]);

  const sendMessage = useMemo(
    () => async (content: string, senderId: string, recipientUserId?: string) => {
      if (!conversationId) return;
      if (!content.trim()) return;
      
      try {
        // NO optimistic update - Pusher è abbastanza veloce (50-200ms)
        // Questo elimina completamente i duplicati visibili
        
        // Send to backend con il payload corretto
        const payload = {
          conversationId,
          message: content,
          recipientUserId: recipientUserId || "" // Required by backend
        };
        
        await apiClient.post("/messages", payload);
      } catch (err) {
        console.error("❌ Error sending message:", err);
        // Mostra errore all'utente se necessario
        throw err;
      }
    },
    [conversationId]
  );

  const sendTyping = useMemo(
    () => (userId: string, isTyping: boolean) => {
      const channel = channelRef.current;
      if (!channel || !userId) return;
      
      try {
        // Note: client events must be prefixed with 'client-' and channel must be private/presence
        channel.trigger('client-typing', { userId, isTyping });
      } catch (err) {
        console.error("❌ Error sending typing event:", err);
      }
    },
    []
  );

  const clear = () => {
    setMessages([]);
    setTypingUsers([]);
  };

  return {
    messages,
    loading,
    sendMessage,
    sendTyping,
    typingUsers,
    clear
  };
}
