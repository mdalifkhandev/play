export const defaultUserAvatar = require('../../assets/images/user.jpg');

export function avatarSource(uri?: string | null) {
  return uri ? { uri } : defaultUserAvatar;
}
