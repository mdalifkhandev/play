import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '../api/client';

export async function uploadImage(uri: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const prepareResponse = await apiClient.post<{
    data: {
      uploadUrl: string;
      apiKey: string;
      timestamp: number;
      signature: string;
      publicId: string;
      uploadId: string;
    };
  }>('/media/upload-url', {
    mimeType,
    mediaType: 'IMAGE',
  });

  const uploadData = prepareResponse.data.data;

  const uploadResult = await FileSystem.uploadAsync(uploadData.uploadUrl, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    parameters: {
      api_key: uploadData.apiKey,
      timestamp: String(uploadData.timestamp),
      signature: uploadData.signature,
      public_id: uploadData.publicId,
    },
  });

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(`Upload failed with status ${uploadResult.status}`);
  }

  const completeResponse = await apiClient.post<{ data: { publicUrl: string } }>('/media/complete', {
    uploadId: uploadData.uploadId,
  });

  return completeResponse.data.data.publicUrl;
}
