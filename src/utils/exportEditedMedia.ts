type ExportEditedMediaInput = {
  uri: string;
  mediaType?: 'photo' | 'video';
  [key: string]: unknown;
};

export async function exportEditedMedia(input: ExportEditedMediaInput) {
  if (input.mediaType !== 'video') {
    return input.uri;
  }

  throw new Error(
    'Edited video export needs a native video compositor. The previous FFmpeg package cannot build because its Android Maven artifact is unavailable.'
  );
}
