import { apiClient } from '../client';
import type { MusicSearchResponse } from './music.types';

type SearchMusicParams = {
  search?: string;
  page?: number;
  limit?: number;
  order?: 'popularity_total' | 'popularity_month' | 'popularity_week' | 'releasedate' | 'name' | 'duration' | 'artist_name' | 'album_name';
};

export async function searchMusicTracks(params: SearchMusicParams = {}) {
  const response = await apiClient.get<{ data: MusicSearchResponse }>('/music/tracks', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      order: params.order ?? 'popularity_total',
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  return response.data.data;
}

export async function toggleSavedTrack(trackData: {
  providerTrackId: string;
  title: string;
  artistName: string;
  coverImageUrl?: string | null;
  audioPreviewUrl: string;
  durationSeconds: number;
}) {
  const response = await apiClient.post<{ data: { saved: boolean, trackId: string } }>('/music/saved/toggle', trackData);
  return response.data.data;
}

export async function getSavedTracks(params: { page?: number; limit?: number } = {}) {
  const response = await apiClient.get<{ data: MusicSearchResponse }>('/music/saved', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });
  return response.data.data;
}
