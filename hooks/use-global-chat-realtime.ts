// TODO: Integrate Pusher for global unread messages count
import { useAuthStore } from "@/src/store/authStore";
import { useChatBadgeStore } from "@/src/store/chatBadgeStore";
import { useChatRoomsRefreshStore } from "@/src/store/chatRoomsRefreshStore";
import { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";

/**
 * Hook globale per il conteggio dei messaggi ricevuti non letti.
 * 
 * - Va usato in un componente sempre montato (es: layout principale o provider globale).
 * - Resta in ascolto in tempo reale tramite Pusher, anche se l'utente è su altre pagine.
 * - Aggiorna il conteggio sia quando arrivano nuovi messaggi sia quando vengono letti (apertura chat).
 * - Non dipende dal montaggio della pagina chat: il badge è sempre aggiornato ovunque nell'app.
 *
 * Restituisce il numero totale di messaggi ricevuti non letti per l'utente loggato.
 */
export function useGlobalChatRealtime() {
  const userId = useAuthStore((s) => s.userId || "");
  const setMaxUnread = useChatBadgeStore((s) => s.setMaxUnread);
  const triggerRefresh = useChatRoomsRefreshStore((s) => s.triggerRefresh);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Solo se abbiamo un userId
    if (!userId) {
      setUnreadCount(0);
      setMaxUnread(0);
      return () => {
        isMounted = false;
        DeviceEventEmitter.removeAllListeners("unread-messages-updated");
      };
    }

    const fetchUnread = async () => {
      try {
        // TODO: Fetch unread count from your backend API
        // Example:
        // const response = await apiClient.get(`/chat/unread-count`);
        // const count = response.data.count;
        // if (isMounted) {
        //   setUnreadCount(count);
        //   setMaxUnread(count);
        //   triggerRefresh();
        // }
        
        console.log("📥 TODO: Fetch unread count from backend API");
        
        if (isMounted) {
          setUnreadCount(0);
          setMaxUnread(0);
        }
      } catch (err) {
        console.error("Error fetching unread count", err);
        setUnreadCount(0);
        setMaxUnread(0);
      }
    };

    // TODO: Setup Pusher subscription for global unread count updates
    // Example:
    // const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    // const channel = pusher.subscribe(`private-user-${userId}`);
    // channel.bind('unread-count-updated', (data: { count: number }) => {
    //   if (isMounted) {
    //     setUnreadCount(data.count);
    //     setMaxUnread(data.count);
    //     triggerRefresh();
    //   }
    // });

    console.log("🔄 TODO: Subscribe to Pusher for global unread count updates");
    
    fetchUnread();

    // Listener per eventi custom tramite DeviceEventEmitter
    const handleCustomUpdate = () => { 
      fetchUnread(); 
    };
    DeviceEventEmitter.addListener("unread-messages-updated", handleCustomUpdate);

    return () => {
      isMounted = false;
      // TODO: Unsubscribe from Pusher channel
      // channel.unbind_all();
      // channel.unsubscribe();
      // pusher.disconnect();
      DeviceEventEmitter.removeAllListeners("unread-messages-updated");
    };
  }, [userId, setMaxUnread, triggerRefresh]);

  return unreadCount;
}

/**
 * Helper per triggerare manualmente l'aggiornamento del conteggio messaggi non letti.
 * Da usare quando si marca una chat come letta, per aggiornare immediatamente il badge.
 */
export function triggerUnreadMessagesUpdate() {
  DeviceEventEmitter.emit("unread-messages-updated");
}
