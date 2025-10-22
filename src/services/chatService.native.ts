import apiClient from "@/api/apiClient";
import type { ChatRoomPreview } from "../types/chatTypes";

// Cache per ridurre chiamate API
let unreadCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5000; // 5 secondi cache validity

/**
 * Ottieni conteggio messaggi non letti globale (NUOVO ENDPOINT OTTIMIZZATO)
 */
export const fetchUnreadCount = async (): Promise<{
  total: number;
  byConversation: {
    conversationId: string;
    unreadCount: number;
    lastUnreadMessage?: string;
  }[];
}> => {
  try {
    // Usa cache se valida
    if (unreadCache && Date.now() - unreadCache.timestamp < CACHE_TTL) {
      return unreadCache.data;
    }

    const response = await apiClient.get("/messages/unread");
    
    const data = {
      total: response.data?.data?.total || 0,
      byConversation: response.data?.data?.byConversation || []
    };
    
    // Aggiorna cache
    unreadCache = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (err) {
    console.error("❌ Error fetching unread count:", err);
    return { total: 0, byConversation: [] };
  }
};

/**
 * Ottieni conteggio messaggi non letti per una conversazione specifica
 */
export const fetchUnreadCountForConversation = async (conversationId: string): Promise<number> => {
  try {
    const response = await apiClient.get(`/messages/unread/${conversationId}`);
    const count = response.data?.data?.unreadCount || 0;
    return count;
  } catch (err) {
    console.error("❌ Error fetching conversation unread count:", err);
    return 0;
  }
};

/**
 * Invalida la cache (chiamare dopo aver letto messaggi o ricevuto nuovi)
 */
export const invalidateUnreadCache = () => {
  unreadCache = null;
};

/**
 * Marca un messaggio specifico come letto
 */
export const markMessageAsRead = async (messageId: string | number): Promise<void> => {
  try {
    await apiClient.patch(`/messages/${messageId}/read`);
    invalidateUnreadCache(); // Invalida cache dopo aver marcato come letto
  } catch (err) {
    console.error("❌ Error marking message as read:", err);
    throw err;
  }
};

/**
 * Marca tutti i messaggi di una conversazione come letti
 */
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  try {
    // Fetch all unread messages for this conversation
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    const messages = response.data?.messages || response.data || [];
    
    // Mark each unread message that's not from current user
    const markPromises = messages
      .filter((msg: any) => {
        // Estrai senderId (può essere un oggetto o una stringa)
        let senderId: string;
        if (typeof msg.senderId === 'object' && msg.senderId !== null) {
          senderId = msg.senderId._id || msg.senderId.id;
        } else {
          senderId = msg.senderId || msg.sender?._id || msg.from?._id;
        }
        
        const isRead = msg.status === 'read' || msg.read || msg.isRead;
        const isNotFromMe = senderId !== userId;
        
        return isNotFromMe && !isRead;
      })
      .map((msg: any) => {
        const messageId = msg._id || msg.id || msg.messageId;
        if (!messageId) {
          return Promise.resolve();
        }
        return markMessageAsRead(messageId);
      });
    
    await Promise.all(markPromises);
    invalidateUnreadCache(); // Invalida cache dopo aver marcato messaggi
  } catch (err) {
    console.error("❌ Error marking messages as read:", err);
  }
};

/**
 * Recupera tutte le conversazioni dell'utente con preview (OTTIMIZZATO)
 */
export const fetchRoomsForUser = async (userId: string): Promise<(ChatRoomPreview & { unreadCount: number })[]> => {
  try {
    // Fetch parallelo: conversazioni + unread count
    const [conversationsResponse, unreadData] = await Promise.all([
      apiClient.get("/conversations"),
      fetchUnreadCount() // Usa il nuovo endpoint ottimizzato
    ]);
    
    const conversations = conversationsResponse.data?.conversations || [];
    
    // Crea mappa conversationId -> unreadCount per lookup veloce
    const unreadMap = new Map<string, number>();
    unreadData.byConversation.forEach(item => {
      unreadMap.set(item.conversationId, item.unreadCount);
    });
    
    // Map to ChatRoomPreview format
    const previews: (ChatRoomPreview & { unreadCount: number })[] = conversations.map((conv: any) => {
      const conversationId = conv._id;
      
      if (!conversationId) {
        console.error("❌ Conversation without ID:", conv);
        return {
          roomId: 0,
          participants: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      
      // Mappiamo i partecipanti
      const participants = (conv.members || []).map((member: any) => ({
        userId: member._id || member.id || member.userId,
        firstName: member.firstName || null,
        lastName: member.lastName || null,
        name: member.name || null,
        avatar: member.profileImg || member.avatar || null,
        lastSeen: member.lastSeen || null
      }));
      
      // Usa lastMessage dal backend
      const lastMessageFromApi = conv.lastMessage;
      
      // Ottieni unreadCount dalla mappa (molto più veloce che fetchare messaggi)
      const unreadCount = unreadMap.get(conversationId.toString()) || 0;
      
      // Prepara il contenuto del lastMessage con prefisso "Tu: " se è dell'utente corrente
      let lastMessageContent = lastMessageFromApi?.body || lastMessageFromApi?.content || "";
      const lastMessageSenderId = lastMessageFromApi?.from?._id || lastMessageFromApi?.senderId;
      
      // Se il messaggio è dell'utente corrente, aggiungi prefisso "Tu: "
      if (lastMessageSenderId && String(lastMessageSenderId) === String(userId) && lastMessageContent) {
        lastMessageContent = `Tu: ${lastMessageContent}`;
      }
      
      return {
        roomId: conversationId,
        participants,
        lastMessage: lastMessageFromApi ? {
          id: lastMessageFromApi._id || lastMessageFromApi.id,
          content: lastMessageContent,
          createdAt: lastMessageFromApi.timestamp || lastMessageFromApi.createdAt,
          senderId: lastMessageSenderId
        } : null,
        unreadCount
      };
    });
    
    // Sort by last message timestamp
    previews.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    
    return previews;
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    return [];
  }
};

/**
 * Crea o recupera una conversazione 1:1 tra due utenti
 */
export const getOrCreateRoom = async (otherUserId: string, userId: string): Promise<any> => {
  try {
    // Create or get conversation
    const response = await apiClient.post("/conversations", {
      members: [userId, otherUserId]
    });
    
    // Il backend restituisce { success: true, conversation: { _id, members, ... } }
    const conversation = response.data?.conversation;
    
    if (!conversation || !conversation._id) {
      console.error("❌ Invalid conversation response:", response.data);
      throw new Error("Risposta del server non valida");
    }
    
    return {
      id: conversation._id,
      created_at: conversation.createdAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.error("❌ Error creating/getting conversation:", error);
    console.error("📦 Error response:", error.response?.data);
    
    // If conversation already exists, backend might return it in error response
    if (error.response?.status === 409 || error.response?.data?.conversation) {
      const conversation = error.response.data.conversation;
      if (conversation?._id) {
        return {
          id: conversation._id,
          created_at: conversation.createdAt || new Date().toISOString()
        };
      }
    }
    
    throw new Error("Errore nella creazione/recupero della conversazione");
  }
};

/**
 * Ottiene i dettagli di una conversazione specifica
 */
export const getConversationById = async (conversationId: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    throw error;
  }
};

/**
 * Elimina una conversazione
 */
export const deleteConversation = async (conversationId: string | number): Promise<void> => {
  try {
    await apiClient.delete(`/conversations/${conversationId}`);
    
    // Invalida cache per aggiornare conteggi
    invalidateUnreadCache();
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    throw error;
  }
};
