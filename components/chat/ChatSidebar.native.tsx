import { deleteConversation } from "@/src/services/chatService.native";
import { useAuthStore } from "@/src/store/authStore";
import type { ChatRoomPreview } from "@/src/types/chatTypes";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import SwipeableChatRow from "./SwipeableChatRow.native";

type ChatRoomPreviewWithUnread = ChatRoomPreview & { unreadCount?: number };


type Props = {
  rooms: ChatRoomPreviewWithUnread[];
  onDelete?: () => void; // Callback quando una chat viene eliminata
};


function formatTimestamp(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Oggi - mostra solo l'ora
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    // Ieri
    return "Ieri";
  } else if (diffDays < 7) {
    // Questa settimana - mostra il giorno
    return d.toLocaleDateString([], { weekday: "short" });
  } else {
    // Più di una settimana - mostra la data
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
  }
}

export default function ChatSidebarNative({ rooms, onDelete }: Props) {
  const router = useRouter();
  // selector sicuro: supporta più formati del user id nello store
  const currentUserId = useAuthStore((s: any) => s.user?._id ?? s.user?.id ?? s.userId ?? s.authData?.user?.id ?? "");
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  console.log("🔍 [ChatSidebar] Current user ID:", currentUserId);

  const data = useMemo(() => rooms || [], [rooms]);

  const handleDeleteConversation = useCallback(
    async (roomId: string | number, displayName: string) => {
      Alert.alert(
        "Elimina conversazione",
        `Sei sicuro di voler eliminare la conversazione con ${displayName}? Questa azione non può essere annullata.`,
        [
          {
            text: "Annulla",
            style: "cancel"
          },
          {
            text: "Elimina",
            style: "destructive",
            onPress: async () => {
              try {
                setDeletingId(roomId);
                await deleteConversation(roomId);
                console.log("✅ Conversation deleted:", roomId);
                onDelete?.(); // Notifica il parent per refreshare la lista
              } catch (error) {
                console.error("❌ Error deleting conversation:", error);
                Alert.alert("Errore", "Impossibile eliminare la conversazione. Riprova.");
              } finally {
                setDeletingId(null);
              }
            }
          }
        ]
      );
    },
    [onDelete]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatRoomPreviewWithUnread }) => {
      console.log(`[ChatSidebar] roomId=${item.roomId} participants=`, item.participants);
      // mostra solo gli altri partecipanti (esclude current user se presente)
      const otherParticipants = item.participants.filter((p) => String(p.userId) !== String(currentUserId));
      const mainParticipant = otherParticipants[0] || item.participants[0];
      
      const displayName = mainParticipant 
        ? (mainParticipant.firstName && mainParticipant.lastName 
            ? `${mainParticipant.firstName} ${mainParticipant.lastName}` 
            : mainParticipant.name || mainParticipant.userId)
        : "Chat";
        
      const lastText = item.lastMessage?.content ?? "Nessun messaggio";
      const lastAt = item.lastMessage?.createdAt ?? null;

      const isDeleting = deletingId === item.roomId;

      return (
        <SwipeableChatRow
          onDelete={() => handleDeleteConversation(item.roomId, displayName)}
          disabled={isDeleting}
        >
          <TouchableOpacity
            onPress={() => {
              // Passa i dati dell'utente tramite params
              const chatUserData = mainParticipant ? {
                id: mainParticipant.userId,
                name: mainParticipant.firstName && mainParticipant.lastName 
                  ? `${mainParticipant.firstName} ${mainParticipant.lastName}` 
                  : mainParticipant.name || mainParticipant.userId,
                avatar: mainParticipant.avatar
              } : null;
              
              router.push({
                pathname: `/(tabs)/chat/[room]` as any,
                params: { 
                  room: item.roomId.toString(),
                  chatUser: chatUserData ? JSON.stringify(chatUserData) : undefined 
                }
              });
            }}
            disabled={isDeleting}
            accessibilityRole="button"
            className="px-4 py-4 bg-background active:bg-surface/50"
            style={{ opacity: isDeleting ? 0.5 : 1 }}
          >
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="mr-3">
                {mainParticipant?.avatar ? (
                  <Image 
                    source={{ uri: mainParticipant.avatar }} 
                    className="w-12 h-12 rounded-full"
                    defaultSource={require('@/assets/images/icon.png')}
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-accent items-center justify-center">
                    <Text className="text-accent-foreground font-semibold text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Content */}
              <View className="flex-1 min-w-0">
                <View className="flex-row justify-between items-start mb-1">
                  <Text className="font-semibold text-foreground text-base flex-1" numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text className="text-xs text-muted-foreground ml-2">
                    {formatTimestamp(lastAt)}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted-foreground flex-1" numberOfLines={1}>
                    {lastText}
                  </Text>
                  {item.unreadCount && item.unreadCount > 0 ? (
                    <View className="ml-2 min-w-[20px] h-5 rounded-full bg-primary items-center justify-center px-2">
                      <Text className="text-primary-foreground text-xs font-semibold">
                        {item.unreadCount > 99 ? '99+' : item.unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </SwipeableChatRow>
      );
    },
    [router, currentUserId, deletingId, handleDeleteConversation]
  );

  if (!data.length) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-background">
        <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-4">
          <Text className="text-accent text-3xl">💬</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground mb-2">Nessuna chat</Text>
        <Text className="text-sm text-muted-foreground text-center">
          Le tue conversazioni appariranno qui quando riceverai o invierai il primo messaggio.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList 
        data={data} 
        keyExtractor={(r) => String(r.roomId)} 
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View className="h-px bg-border/50 ml-16" />}
      />
    </View>
  );
}
