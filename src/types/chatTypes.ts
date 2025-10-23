export type MessageRow = {
  id: number;
  created_at: string | null; // timestamptz
  room_id: number;
  sender_id: string;
  content: string;
  read?: boolean | null;
};

export type RoomRow = {
  id: number;
  created_at: string | null;
};

export type RoomParticipantRow = {
  room_id: number;
  created_at: string | null;
  user_id: string;
  name?: string | null;
};

// Modello usato dall'app (frontend)
export type ChatMessage = {
  id: number | string;
  createdAt: string | null;
  roomId: number | string;
  senderId: string;
  content: string;
  read?: boolean | null;
};

export type ChatRoomPreview = {
  roomId: number | string;
  lastMessage?: {
    id: number | string;
    content: string;
    createdAt: string | null;
    senderId: string;
  } | null;
  participants: {
    userId: string;
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    lastSeen?: string | null;
  }[];
};

// Mappers
export const mapMessageRowToChatMessage = (r: MessageRow): ChatMessage => ({
  id: r.id,
  createdAt: r.created_at,
  roomId: r.room_id,
  senderId: r.sender_id,
  content: r.content
});

export const buildRoomPreview = (room: RoomRow, participants: RoomParticipantRow[], lastMessage?: MessageRow | null): ChatRoomPreview => ({
  roomId: room.id,
  participants: participants.map((p) => ({ 
    userId: p.user_id, 
    name: p.name,
    // Questi campi verranno popolati dal servizio con una query separata
    firstName: null,
    lastName: null,
    avatar: null,
    lastSeen: null
  })),
  lastMessage: lastMessage
    ? {
        id: lastMessage.id,
        content: lastMessage.content,
        createdAt: lastMessage.created_at,
        senderId: lastMessage.sender_id
      }
    : null
});
