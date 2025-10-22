import { RealtimeChatNative } from "@/components/chat/RealtimeChat.native";
import { triggerUnreadMessagesUpdate } from "@/hooks/use-global-chat-realtime";
import { invalidateUnreadCache, markMessagesAsRead } from "@/src/services/chatService.native";
import { useUserDataStore } from "@/src/store/userDataStore";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

type Params = { 
  room: string;
  chatUser?: string; // JSON stringified chatUser data
};

type ChatUser = {
  id: string;
  name: string;
  avatar?: string;
};

export const screenOptions = ({ params }: any) => ({
  headerShown: false // Nascondi l'header della navigazione per usare quello personalizzato
});

export default function ChatRoomScreen() {
  const { room, chatUser: chatUserParam } = useLocalSearchParams<Params>();
  const { user } = useUserDataStore();

  const [initialMessages] = useState<any[]>([]); // TODO: Implement with Pusher
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);

  // Parse chatUser from params if available
  useEffect(() => {
    if (chatUserParam) {
      try {
        const parsedChatUser = JSON.parse(chatUserParam);
        setChatUser(parsedChatUser);
        return; // Se abbiamo i dati dai params, non fare la query
      } catch (error) {
        console.warn('Failed to parse chatUser param:', error);
      }
    }
    
    // Fallback: carica da database se non abbiamo i dati
    const loadChatUserFromDatabase = async () => {
      if (!room || !user?._id) return;

      try {
        // TODO: Replace with backend API call
        // Example:
        // const response = await apiClient.get(`/chat/rooms/${room}/participants`);
        // const otherUser = response.data.participants.find(p => p.id !== user._id);
        // if (otherUser) {
        //   setChatUser({
        //     id: otherUser.id,
        //     name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'Utente',
        //     avatar: otherUser.avatar || undefined
        //   });
        // }
        
        console.log("📥 TODO: Load chat user from backend API", { room, userId: user._id });
        
        // Fallback temporaneo
        setChatUser({
          id: room,
          name: `Chat ${room}`,
        });
      } catch (error) {
        console.error('Error loading chat user:', error);
        // Fallback - usa l'ID della stanza come nome
        setChatUser({
          id: room,
          name: `Chat ${room}`,
        });
      }
    };

    loadChatUserFromDatabase();
  }, [room, chatUserParam, user?._id]);

  useFocusEffect(
    React.useCallback(() => {
      async function loadAndMarkRead() {
        if (room && user?._id) {
          console.log("🔄 Marking messages as read for room:", room);
          
          // Marca messaggi come letti
          await markMessagesAsRead(room as string, String(user._id));
          console.log("✅ Messages marked as read");
          
          // Invalida cache per forzare refetch al prossimo check
          invalidateUnreadCache();
          
          // Piccolo delay per dare tempo al backend di processare
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Triggerano aggiornamento badge
          triggerUnreadMessagesUpdate();
          console.log("📢 Badge update triggered");
        }
      }
      loadAndMarkRead();
    }, [room, user?._id])
  );

  if (!room) return null;

  return (
    <View style={{ flex: 1 }}>
      <RealtimeChatNative
        roomName={room}
        username={user?.firstName ?? "Utente"}
        initialMessages={initialMessages}
        chatUser={chatUser || undefined}
        onMessage={() => {}}
      />
    </View>
  );
}
