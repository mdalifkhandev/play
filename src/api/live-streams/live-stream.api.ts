import { apiClient } from '../client';

export interface CreateLiveStreamDTO {
  title: string;
  description?: string;
  category?: string;
  coverImage?: string;
}

export interface LiveStreamResponseDTO {
  id: string;
  hostId: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  title: string;
  description?: string;
  category: string;
  coverImage?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  channelName: string;
  streamKey: string;
  viewerCount: number;
  startedAt?: string;
}

export interface StreamTokenResponseDTO {
  streamId: string;
  channelName: string;
  token: string;
  uid: number;
  role: 'host' | 'viewer';
}

export interface LiveStreamCommentResponseDTO {
  id: string;
  streamId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  text: string;
  createdAt: string;
}

export const liveStreamApi = {
  createStream: async (data: CreateLiveStreamDTO): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamResponseDTO }>('/live-streams', data);
    return res.data.data;
  },
  
  startStream: async (streamId: string): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamResponseDTO }>(`/live-streams/${streamId}/start`);
    return res.data.data;
  },

  endStream: async (streamId: string): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamResponseDTO }>(`/live-streams/${streamId}/end`);
    return res.data.data;
  },

  getStreamToken: async (streamId: string): Promise<StreamTokenResponseDTO> => {
    const res = await apiClient.post<{ data: StreamTokenResponseDTO }>(`/live-streams/${streamId}/token`);
    return res.data.data;
  },

  getActiveStreams: async (page = 1, limit = 20, tab?: string): Promise<{ items: LiveStreamResponseDTO[], hasNextPage: boolean }> => {
    const res = await apiClient.get<{ data: { items: LiveStreamResponseDTO[], hasNextPage: boolean } }>('/live-streams', {
      params: { page, limit, tab }
    });
    return res.data.data;
  },
  
  getStreamById: async (streamId: string): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.get<{ data: LiveStreamResponseDTO }>(`/live-streams/${streamId}`);
    return res.data.data;
  },

  joinStream: async (streamId: string): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamResponseDTO }>(`/live-streams/${streamId}/join`);
    return res.data.data;
  },

  leaveStream: async (streamId: string): Promise<LiveStreamResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamResponseDTO }>(`/live-streams/${streamId}/leave`);
    return res.data.data;
  },

  getComments: async (streamId: string): Promise<LiveStreamCommentResponseDTO[]> => {
    const res = await apiClient.get<{ data: LiveStreamCommentResponseDTO[] }>(`/live-streams/${streamId}/comments`);
    return res.data.data;
  },

  postComment: async (streamId: string, text: string): Promise<LiveStreamCommentResponseDTO> => {
    const res = await apiClient.post<{ data: LiveStreamCommentResponseDTO }>(`/live-streams/${streamId}/comments`, { text });
    return res.data.data;
  }
};
