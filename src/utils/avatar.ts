export const defaultUserAvatar = require('../../assets/images/user.jpg');

export function avatarSource(uri?: string | null) {
  if (!uri || uri === 'null' || uri === 'undefined') {
    return defaultUserAvatar;
  }

  let finalUri = uri;
  if (finalUri.startsWith('//')) {
    finalUri = `https:${finalUri}`;
  } else if (finalUri.startsWith('/')) {
    const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
    if (baseUrl) {
      finalUri = `${baseUrl}${finalUri}`;
    }
  }

  return { uri: finalUri };
}
