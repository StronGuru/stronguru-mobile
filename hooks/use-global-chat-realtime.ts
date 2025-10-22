import { useAuthStore } from "@/src/store/authStore";
import { useChatBadgeStore } from "@/src/store/chatBadgeStore";
import { useChatRoomsRefreshStore } from "@/src/store/chatRoomsRefreshStore";
import { useEffect, useRef, useState } from "react";
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Solo se abbiamo un userId
    if (!userId) {
      setUnreadCount(0);
      setMaxUnread(0);
      return () => {
        isMounted = false;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        DeviceEventEmitter.removeAllListeners("unread-messages-updated");
      };
    }

    const fetchUnread = async () => {
      // Evita fetch multipli simultanei
      if (isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        
        // Usa il nuovo endpoint ottimizzato
        const { fetchUnreadCount } = await import("@/src/services/chatService.native");
        const { total } = await fetchUnreadCount();
        
        if (isMounted) {
          setUnreadCount(total);
          setMaxUnread(total);
          triggerRefresh();
        }
      } catch (err) {
        console.error("❌ Error fetching unread count", err);
        if (isMounted) {
          setUnreadCount(0);
          setMaxUnread(0);
        }
      } finally {
        isLoadingRef.current = false;
      }
    };

    // Versione con debouncing per evitare troppe chiamate ravvicinate
    const debouncedFetchUnread = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchUnread();
      }, 300); // 300ms di debounce
    };
    
    // Listener per aggiornamenti manuali (quando si marca come letto)
    const unreadListener = DeviceEventEmitter.addListener("unread-messages-updated", () => {
      debouncedFetchUnread();
    });
    
    // Setup Pusher subscription per ascoltare nuovi messaggi in tempo reale
    let userChannel: any = null;
    let pusherClient: any = null;
    let isSubscribing = false;
    
    const setupPusherSubscription = async () => {
      if (isSubscribing) {
        return;
      }

      try {
        isSubscribing = true;
        pusherClient = (await import("@/api/pusherChannelsService")).default;
        
        // Sottoscrivi al canale privato dell'utente per notifiche globali
        const channelName = `private-user-${userId}`;
        
        // Verifica se il canale è già sottoscritto
        const existingChannel = pusherClient.channel(channelName);
        if (existingChannel && existingChannel.subscribed) {
          userChannel = existingChannel;
        } else {
          userChannel = pusherClient.subscribe(channelName);
        }
        
        if (userChannel) {
          // Rimuovi eventuali listener esistenti per evitare duplicati
          userChannel.unbind_all();
          
          userChannel.bind("pusher:subscription_succeeded", () => {
            // Successfully subscribed
          });
          
          userChannel.bind("pusher:subscription_error", (error: any) => {
            console.error("❌ Global channel subscription error:", error);
          });
          
          // Ascolta eventi di nuovi messaggi
          userChannel.bind("new-message", (data: any) => {
            // Invalida cache per forzare refetch con dati freschi
            import("@/src/services/chatService.native").then(({ invalidateUnreadCache }) => {
              invalidateUnreadCache();
            });
            // Usa debounce per evitare troppi refetch se arrivano più messaggi
            debouncedFetchUnread();
          });
          
          // Ascolta eventi di messaggi letti (opzionale, se backend lo implementa)
          userChannel.bind("messages-read", (data: any) => {
            // Invalida cache per forzare refetch con dati freschi
            import("@/src/services/chatService.native").then(({ invalidateUnreadCache }) => {
              invalidateUnreadCache();
            });
            debouncedFetchUnread();
          });
        }
        
      } catch (error) {
        console.error("❌ Error setting up Pusher subscription:", error);
      } finally {
        isSubscribing = false;
      }
    };
    
    // Gestione riconnessione automatica quando Pusher perde/recupera connessione
    const handleConnectionStateChange = async (states: any) => {
      if (states.current === 'connected') {
        // Ricarica i dati quando torna online
        await fetchUnread();
        // Ri-sottoscrivi ai canali
        await setupPusherSubscription();
      }
    };
    
    // Setup listener per cambio stato connessione
    const setupConnectionListener = async () => {
      try {
        const client = (await import("@/api/pusherChannelsService")).default;
        if (client && client.connection) {
          client.connection.bind('state_change', handleConnectionStateChange);
        }
      } catch (error) {
        console.error("❌ Error setting up connection listener:", error);
      }
    };
    
    // Fetch iniziale immediato (senza debounce)
    fetchUnread();
    // Setup Pusher dopo il fetch iniziale
    setupPusherSubscription();
    // Setup listener per riconnessione
    setupConnectionListener();

    return () => {
      isMounted = false;
      
      // Cleanup debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // Cleanup listener
      unreadListener.remove();
      
      // Cleanup connection state listener
      if (pusherClient && pusherClient.connection) {
        pusherClient.connection.unbind('state_change', handleConnectionStateChange);
        console.log("🔌 Connection state listener removed");
      }
      
      // Unsubscribe da Pusher
      if (userChannel) {
        const channelName = `private-user-${userId}`;
        console.log("🔌 Unsubscribing from global channel:", channelName);
        userChannel.unbind_all();
        userChannel.unsubscribe();
        userChannel = null;
      }
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
