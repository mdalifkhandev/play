import * as FileSystem from 'expo-file-system/legacy';

import { apiClient } from '../client';
import type {
  Conversation,
  Message,
  PaginatedMessages,
  CreateConversationResponse,
  ChatAttachmentUploadResult,
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
  attachmentType: 'image' | 'video' | 'audio' | 'file' = 'file',
): Promise<Message> {
  const response = await apiClient.post<{ data: Message }>(
    `/conversations/${conversationId}/messages`,
    { mediaUrl, attachmentType },
  );
  return response.data.data;
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await apiClient.delete(`/conversations/${conversationId}`);
}

export async function blockConversationUser(targetUserId: string): Promise<void> {
  await apiClient.post(`/conversations/block/${targetUserId}`);
}

export async function unblockConversationUser(targetUserId: string): Promise<void> {
  await apiClient.delete(`/conversations/block/${targetUserId}`);
}

export async function fetchConversationBlockStatus(targetUserId: string): Promise<{
  blockedByMe: boolean;
  blockedMe: boolean;
  canUnblock: boolean;
}> {
  const response = await apiClient.get<{
    data: {
      blockedByMe: boolean;
      blockedMe: boolean;
      canUnblock: boolean;
    };
  }>(`/conversations/block/${targetUserId}`);
  return response.data.data;
}

export async function uploadChatAttachment(input: {
  uri: string;
  name: string;
  mimeType: string;
  attachmentType: 'image' | 'video' | 'audio' | 'file';
}): Promise<ChatAttachmentUploadResult> {
  const prepareResponse = await apiClient.post<{
    data: {
      uploadUrl: string;
      apiKey: string;
      timestamp: number;
      signature: string;
      publicId: string;
      resourceType: 'image' | 'video' | 'raw';
      attachmentType: 'image' | 'video' | 'audio' | 'file';
    };
  }>('/conversations/attachments/prepare', {
    fileName: input.name,
    mimeType: input.mimeType,
    attachmentType: input.attachmentType,
  });
  const uploadData = prepareResponse.data.data;
  const params = {
    api_key: uploadData.apiKey,
    timestamp: String(uploadData.timestamp),
    signature: uploadData.signature,
    public_id: uploadData.publicId,
    overwrite: 'false',
  };

  const uploadResult = await FileSystem.uploadAsync(uploadData.uploadUrl, input.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: input.mimeType,
    parameters: params,
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Attachment upload failed with status ${uploadResult.status}`);
  }

  const body = JSON.parse(uploadResult.body || '{}') as {
    secure_url?: string;
    original_filename?: string;
    bytes?: number;
  };

  if (!body.secure_url) {
    throw new Error('Attachment upload completed without a URL.');
  }

  return {
    url: body.secure_url,
    attachmentType: uploadData.attachmentType,
    mimeType: input.mimeType,
    fileName: body.original_filename || input.name,
    size: body.bytes || 0,
  };
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
