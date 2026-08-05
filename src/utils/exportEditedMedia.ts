type ExportEditedMediaInput = {
  uri: string;
  mediaType?: 'photo' | 'video';
  [key: string]: unknown;
};

export async function exportEditedMedia(input: ExportEditedMediaInput) {
  return input.uri;
}
