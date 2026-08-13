import { apiClient } from '../client';
import type {
  Conversation,
  Message,
  PaginatedMessages,
  CreateConversationResponse,
} from './conversation.types';

export async function createConversation(targetUserId: string): Promise<CreateConversationResponse> {
  const response = await apiClient.post<{ data: CreateConversationResponse }>(
    '/conversations',
    { targetUserId },
  );
  return response.data.data;
}

export async function fetchConversations(): Promise<{ items: Conversation[]; pagination: any }> {
  const response = await apiClient.get<{ data: { items: Conversation[]; pagination: any } }>('/conversations');
  return response.data.data;
}

export async function fetchMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 30,
): Promise<PaginatedMessages> {
  const response = await apiClient.get<{ data: PaginatedMessages }>(
    `/conversations/${conversationId}/messages`,
    { params: { page, limit } },
  );
  const data = response.data.data;
  const items = data.items || data.messages || [];
  const total = data.pagination?.total ?? data.total ?? items.length;
  const totalPages = data.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  return {
    ...data,
    items,
    messages: items,
    pagination: data.pagination || { page, limit, total, totalPages },
    total,
    page,
    hasMore: page < totalPages,
  };
}

export async function sendTextMessage(
  conversationId: string,
  text: string,
): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(
    `/conversations/${conversationId}/messages`,
    { text },
  );
  return response.data.data;
}

export async function sendMessageWithMedia(
  conversationId: string,
  mediaUrl: string,
): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(
    `/conversations/${conversationId}/messages`,
    { mediaUrl },
  );
  return response.data.data;
}

interface RecommendedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  reason: string;
  isFollowing: boolean;
}

export async function fetchRecommendedUsers(): Promise<RecommendedUser[]> {
  const response = await apiClient.get<{ data: RecommendedUser[] }>('/conversations/recommended');
  return response.data.data;
}

export async function searchConversationUsers(query: string): Promise<RecommendedUser[]> {
  const params = { q: query.trim(), limit: 20 };

  try {
    const response = await apiClient.get<{ data: RecommendedUser[] }>('/users/search', {
      params,
    });

    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const response = await apiClient.get<{ data: RecommendedUser[] }>('/conversations/users/search', {
      params,
    });

    return response.data.data;
  }
}
