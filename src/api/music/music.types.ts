export type MusicTrack = {
  provider: 'jamendo';
  providerTrackId: string;
  title: string;
  artistName: string;
  albumName: string | null;
  coverImageUrl: string | null;
  audioPreviewUrl: string;
  durationSeconds: number;
  shareUrl: string | null;
  licenseUrl: string | null;
  downloadAllowed: boolean;
  downloadUrl: string | null;
};

export type MusicSearchResponse = {
  tracks: MusicTrack[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
};
