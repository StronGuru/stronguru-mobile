// TODO: Integrate Pusher for realtime chat
import type { ChatMessage } from "@/src/types/chatTypes";
import { useEffect, useMemo, useRef, useState } from "react";

type UseRealtimeChatResult = {
  messages: ChatMessage[];
  loading: boolean;
  sendMessage: (content: string, senderId: string) => Promise<void>;
  clear: () => void;
  typingUsers: string[];
  sendTyping: (userId: string, isTyping: boolean) => void;
};

export const EVENT_MESSAGE_TYPE = "message";
export const EVENT_TYPING_TYPE = "typing";

export default function useRealtimeChat(roomId: number | null): UseRealtimeChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Set to false since we're not loading from Supabase anymore
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const pusherRef = useRef<any>(null); // Changed from channelRef to pusherRef for Pusher
  const typingTimeoutRef = useRef<{ [userId: string]: number }>({});

  // TODO: Fetch initial messages from your backend API instead of Supabase
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!roomId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // TODO: Replace with API call to your backend
      // Example: const response = await apiClient.get(`/chat/rooms/${roomId}/messages`);
      // setMessages(response.data);
      
      console.log("📥 TODO: Fetch messages from backend API for room", roomId);
      
      if (mounted) {
        setMessages([]);
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  // TODO: Subscribe to Pusher channel for realtime updates
  useEffect(() => {
    if (!roomId) return;

    // TODO: Initialize Pusher and subscribe to room channel
    // Example:
    // const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    // const channel = pusher.subscribe(`room-${roomId}`);
    // pusherRef.current = channel;
    
    // TODO: Listen for message events
    // channel.bind('new-message', (data: ChatMessage) => {
    //   setMessages((prev) => {
    //     if (prev.some((m) => m.id === data.id)) return prev;
    //     const merged = [...prev, data];
    //     merged.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    //     return merged;
    //   });
    // });

    // TODO: Listen for typing events
    // channel.bind('typing', (data: { userId: string; isTyping: boolean }) => {
    //   if (data.isTyping) {
    //     setTypingUsers((prev) => prev.includes(data.userId) ? prev : [...prev, data.userId]);
    //     if (typingTimeoutRef.current[data.userId]) {
    //       clearTimeout(typingTimeoutRef.current[data.userId]);
    //     }
    //     typingTimeoutRef.current[data.userId] = setTimeout(() => {
    //       setTypingUsers((prev) => prev.filter(id => id !== data.userId));
    //       delete typingTimeoutRef.current[data.userId];
    //     }, 5000);
    //   } else {
    //     setTypingUsers((prev) => prev.filter(id => id !== data.userId));
    //     if (typingTimeoutRef.current[data.userId]) {
    //       clearTimeout(typingTimeoutRef.current[data.userId]);
    //       delete typingTimeoutRef.current[data.userId];
    //     }
    //   }
    // });

    console.log("🔄 TODO: Subscribe to Pusher channel for room", roomId);

    return () => {
      try {
        // Clear all typing timeouts
        Object.values(typingTimeoutRef.current).forEach(clearTimeout);
        typingTimeoutRef.current = {};
        setTypingUsers([]);
        
        // TODO: Unsubscribe from Pusher channel
        // if (pusherRef.current) {
        //   pusherRef.current.unbind_all();
        //   pusherRef.current.unsubscribe();
        // }
      } catch (err) {
        console.error("Error cleaning up Pusher subscription", err);
      }
      pusherRef.current = null;
    };
  }, [roomId]);

  const sendMessage = useMemo(
    () => async (content: string, senderId: string) => {
      if (!roomId) return;
      try {
        // TODO: Send message via your backend API instead of Supabase
        // Example:
        // const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, {
        //   content,
        //   senderId
        // });
        // const newMessage = response.data;
        
        // Optimistic update (optional)
        // const tempMessage: ChatMessage = {
        //   id: Date.now().toString(),
        //   content,
        //   senderId,
        //   roomId,
        //   createdAt: new Date().toISOString(),
        // };
        // setMessages((prev) => [...prev, tempMessage]);
        
        console.log("📤 TODO: Send message to backend API", { roomId, content, senderId });
      } catch (err) {
        console.error("sendMessage unexpected error", err);
      }
    },
    [roomId]
  );

  const sendTyping = useMemo(
    () => (userId: string, isTyping: boolean) => {
      // TODO: Send typing event via Pusher
      // Example:
      // const channel = pusherRef.current;
      // if (!channel || !userId) return;
      // channel.trigger('client-typing', { userId, isTyping });
      
      console.log("⌨️ TODO: Send typing event via Pusher", { userId, isTyping });
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
