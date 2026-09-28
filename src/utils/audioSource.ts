import type { AudioPlayerOptions, AudioSource } from 'expo-audio';

export const REMOTE_AUDIO_PLAYER_OPTIONS: AudioPlayerOptions = {
  downloadFirst: false,
  preferredForwardBufferDuration: 10,
  updateInterval: 250,
};

export function normalizeRemoteAudioUrl(url: string | null | undefined) {
  const candidate = String(url || '').trim();
  if (!candidate) return '';

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    return parsed.toString();
  } catch {
    return candidate;
  }
}

export function createRemoteAudioSource(url: string | null | undefined): AudioSource {
  const uri = normalizeRemoteAudioUrl(url);
  return uri ? { uri } : null;
}
