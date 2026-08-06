import { useMemo } from 'react';

export function useTrimState({
  videoTrimLeft,
  videoTrimRight,
  videoTrimStart,
  videoTrimEnd,
  videoDurationSec,
}: {
  videoTrimLeft?: string;
  videoTrimRight?: string;
  videoTrimStart?: string;
  videoTrimEnd?: string;
  videoDurationSec: number;
}) {
  const getVideoTrimPercent = (percentStr: string | undefined, fallbackPercent: number) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : fallbackPercent;
  };

  const videoTrimStartPercent = getVideoTrimPercent(videoTrimLeft, 0);
  const videoTrimEndPercent = getVideoTrimPercent(videoTrimRight, 100);
  
  const savedVideoTrimStartSec = videoTrimStart !== undefined && videoTrimStart !== '' ? Number(videoTrimStart) : null;
  const savedVideoTrimEndSec = videoTrimEnd !== undefined && videoTrimEnd !== '' ? Number(videoTrimEnd) : null;
  
  const videoTrimStartSec = savedVideoTrimStartSec !== null && Number.isFinite(savedVideoTrimStartSec)
    ? savedVideoTrimStartSec
    : videoDurationSec > 0 ? (videoTrimStartPercent / 100) * videoDurationSec : 0;
    
  const videoTrimEndSec = savedVideoTrimEndSec !== null && Number.isFinite(savedVideoTrimEndSec)
    ? savedVideoTrimEndSec
    : videoDurationSec > 0 ? (videoTrimEndPercent / 100) * videoDurationSec : 0;
    
  const selectedVideoDurationSec = videoDurationSec > 0
    ? Math.max(1, videoTrimEndSec - videoTrimStartSec)
    : 1;

  return {
    videoTrimStartPercent,
    videoTrimEndPercent,
    videoTrimStartSec,
    videoTrimEndSec,
    selectedVideoDurationSec
  };
}
