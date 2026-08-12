type ExportEditedMediaInput = {
  uri: string;
  mediaType?: 'photo' | 'video';
  soundUrl?: string;
  overlayText?: string;
  originalVolume?: string;
  addedVolume?: string;
  trimLeft?: string;
  trimRight?: string;
  audioDurationSec?: number;
  videoTrimStartSec?: number;
  videoTrimEndSec?: number;
  activeFilter?: string;
  activeEffect?: string;
  textOffsetX?: number;
  textOffsetY?: number;
  onProgress?: (progress: number) => void;
};

export type VideoEditSpec = {
  trim: { startSec: number; endSec: number } | null;
  filter: string | null;
  effect: string | null;
  textOverlay: { text: string; xPercent: number; yPercent: number; fontSize: number } | null;
  audio: {
    soundUri: string;
    trimStartSec: number;
    trimEndSec: number;
    originalVolume: number;
    addedVolume: number;
  } | null;
};

function clampPercent(val: any): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function buildVideoEditSpec(input: ExportEditedMediaInput): VideoEditSpec | null {
  if (input.mediaType !== 'video') {
    return null;
  }

  const vTrimStart = Math.max(0, input.videoTrimStartSec || 0);
  const vTrimEnd = Math.max(vTrimStart, input.videoTrimEndSec || 0);

  const trim = (vTrimEnd > vTrimStart) ? { startSec: vTrimStart, endSec: vTrimEnd } : null;
  const filter = (input.activeFilter && input.activeFilter !== 'Normal') ? input.activeFilter : null;
  const effect = (input.activeEffect && input.activeEffect !== 'None') ? input.activeEffect : null;

  let textOverlay = null;
  if (input.overlayText && input.overlayText.trim().length > 0) {
    // Basic conversion from offset to percent (assuming standard width, ideally passed in)
    // For now we just send the text, as backend will handle positioning or we send defaults
    textOverlay = {
      text: input.overlayText.trim(),
      xPercent: 50,
      yPercent: 50,
      fontSize: 42,
    };
  }

  let audio = null;
  if (input.soundUrl) {
    const audioDuration = Math.max(1, input.audioDurationSec || 15);
    const trimLeftPercent = clampPercent(input.trimLeft);
    const trimRightPercent = input.trimRight ? clampPercent(input.trimRight) : 100;
    
    const trimStartSec = (trimLeftPercent / 100) * audioDuration;
    const trimEndSec = (trimRightPercent / 100) * audioDuration;

    audio = {
      soundUri: input.soundUrl,
      trimStartSec: Math.max(0, trimStartSec),
      trimEndSec: Math.max(trimStartSec, trimEndSec),
      originalVolume: clampPercent(input.originalVolume ?? 100),
      addedVolume: clampPercent(input.addedVolume ?? 100),
    };
  }

  return {
    trim,
    filter,
    effect,
    textOverlay,
    audio
  };
}
