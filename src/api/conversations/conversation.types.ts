export interface ConversationParticipant {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  type?: string;
  participant?: ConversationParticipant;
  participants?: ConversationParticipant[];
  lastMessage?: {
    id?: string;
    text?: string;
    mediaUrl?: string;
    senderId: string;
    createdAt: string;
  };
  lastMessageTime?: string;
  unreadCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
  text?: string;
  mediaUrl?: string;
  deliveredAt?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  username?: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  conversationId: string;
  userId?: string;
  readBy?: string;
  messageIds: string[];
  readAt?: string;
}

export interface CreateConversationResponse {
  id: string;
  type?: string;
  participant?: ConversationParticipant;
  participants?: ConversationParticipant[];
  unreadCount?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface PaginatedMessages {
  items: Message[];
  messages?: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
  page: number;
  hasMore: boolean;
}

export type SocketErrorPayload = {
  event?: string;
  code: string;
  message: string;
};

export type ChatSocketAck<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: SocketErrorPayload };
