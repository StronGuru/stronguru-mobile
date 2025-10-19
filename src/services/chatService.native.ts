// TODO: Import apiClient when implementing backend API calls for chat
// import apiClient from "@/api/apiClient";
import type { ChatRoomPreview } from "../types/chatTypes";

/**
 * Marca tutti i messaggi non letti come letti per una room.
 * TODO: Migrate to backend API instead of Supabase direct calls
 */
export const markMessagesAsRead = async (roomId: number, userId: string) => {
  try {
    // TODO: Replace with API call to your backend
    // Example: await apiClient.post(`/chat/rooms/${roomId}/mark-read`, { userId });
    console.log("✅ TODO: Mark messages as read via backend API", { roomId, userId });
  } catch (err) {
    console.error("Errore markMessagesAsRead:", err);
  }
};


/**
 * Recupera le stanze (preview) per un determinato utente.
 * TODO: Migrate to backend API instead of Supabase direct calls
 */
export const fetchRoomsForUser = async (userId: string): Promise<(ChatRoomPreview & { unreadCount: number })[]> => {
  try {
    // TODO: Replace with API call to your backend
    // Example:
    // const response = await apiClient.get(`/chat/rooms`);
    // return response.data.rooms;
    
    console.log("📥 TODO: Fetch rooms from backend API for user", userId);
    return [];
  } catch (err) {
    console.error("fetchRoomsForUser unexpected error", err);
    return [];
  }
};

/**
 * Crea o recupera una room 1:1 tra due utenti.
 * TODO: Migrate to backend API instead of Supabase direct calls
 */
export const getOrCreateRoom = async (otherUserId: string, userId: string): Promise<any> => {
  try {
    // TODO: Replace with API call to your backend
    // Example:
    // const response = await apiClient.post(`/chat/rooms/get-or-create`, {
    //   userId,
    //   otherUserId
    // });
    // return response.data.room;
    
    console.log("🔄 TODO: Get or create room via backend API", { userId, otherUserId });
    return { id: 0, created_at: new Date().toISOString() };
  } catch (error) {
    console.error('Errore in getOrCreateRoom:', error);
    throw new Error("Errore nella creazione/recupero della room");
  }
};
