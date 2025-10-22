
import ChatSidebarNative from "@/components/chat/ChatSidebar.native";
import { fetchRoomsForUser } from "@/src/services/chatService.native";
import { useAuthStore } from "@/src/store/authStore";

import { useChatRoomsRefreshStore } from "@/src/store/chatRoomsRefreshStore";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { View } from "react-native";

export default function ChatIndex() {
  const userId = useAuthStore((s: any) => s.user?._id ?? s.user?.id ?? s.userId ?? s.authData?.user?.id ?? "");
  const [rooms, setRooms] = useState<any[]>([]);


  // Il badge viene aggiornato dal global hook, non serve più calcolarlo qui

  // Aggiorna rooms sia su focus che quando arriva un nuovo messaggio
  const refreshKey = useChatRoomsRefreshStore((s) => s.refreshKey);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      if (!userId) return () => {};

      (async () => {
        try {
          const result = await fetchRoomsForUser(userId);
          if (active) setRooms(result);
        } catch (e) {
          console.warn("Failed to fetch rooms:", e);
        }
      })();

      return () => {
        active = false;
      };
    }, [userId])
  );

  // Aggiorna rooms anche quando refreshKey cambia (nuovo messaggio realtime)
  React.useEffect(() => {
    let active = true;
    if (!userId) return;
    (async () => {
      try {
        const result = await fetchRoomsForUser(userId);
        if (active) setRooms(result);
      } catch (e) {
        console.warn("Failed to fetch rooms:", e);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey, userId]);

  // Callback per refreshare dopo eliminazione
  const handleDelete = React.useCallback(async () => {
    if (!userId) return;
    try {
      const result = await fetchRoomsForUser(userId);
      setRooms(result);
    } catch (e) {
      console.warn("Failed to refresh rooms after delete:", e);
    }
  }, [userId]);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ChatSidebarNative rooms={rooms} onDelete={handleDelete} />
    </View>
  );
}
