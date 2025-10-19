import { RealtimeChatNative } from "@/components/chat/RealtimeChat.native";
import { triggerUnreadMessagesUpdate } from "@/hooks/use-global-chat-realtime";
// TODO: Remove supabase import when migrating to backend API
// import { supabase } from "@/lib/supabase/client";
import { markMessagesAsRead } from "@/src/services/chatService.native";
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
          // TODO: Replace with backend API call to fetch unread messages
          // Example:
          // const response = await apiClient.get(`/chat/rooms/${room}/unread-messages`);
          // if (response.data) setInitialMessages(response.data);
          
          console.log("📥 TODO: Load unread messages from backend API", { room, userId: user._id });
          
          // Marca come letti e aggiorna badge
          await markMessagesAsRead(Number(room), String(user._id));
          triggerUnreadMessagesUpdate();
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
