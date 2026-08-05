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
