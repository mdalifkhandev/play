import { io, Socket } from 'socket.io-client';

import type {
  ChatSocketAck,
  Message,
  ReadReceiptEvent,
  SocketErrorPayload,
  TypingEvent,
} from './conversation.types';

export const CHAT_SOCKET_EVENTS = {
  JOIN: 'chat:join',
  JOINED: 'chat:joined',
  LEAVE: 'chat:leave',
  SEND_MESSAGE: 'chat:send_message',
  NEW_MESSAGE: 'chat:new_message',
  MESSAGE_DELIVERED: 'chat:message_delivered',
  TYPING: 'chat:typing',
  TYPING_START: 'chat:typing_start',
  TYPING_STOP: 'chat:typing_stop',
  USER_TYPING: 'chat:user_typing',
  READ: 'chat:read',
  READ_RECEIPT: 'chat:read_receipt',
  ERROR: 'chat:error',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
} as const;

export type ChatSocketCallbacks = {
  onNewMessage?: (message: Message) => void;
  onMessageDelivered?: (data: { conversationId: string; messageIds: string[]; deliveredAt?: string; deliveredBy?: string }) => void;
  onTyping?: (event: TypingEvent) => void;
  onReadReceipt?: (event: ReadReceiptEvent) => void;
  onUserOnline?: (data: { userId: string; username?: string; online?: boolean }) => void;
  onUserOffline?: (data: { userId: string; username?: string; online?: boolean }) => void;
  onError?: (error: SocketErrorPayload) => void;
  onConnectionChange?: (connected: boolean) => void;
};

let socketInstance: Socket | null = null;
let activeToken: string | null = null;
const callbackSets = new Set<ChatSocketCallbacks>();

export function ensureChatSocket(token: string): Socket | null {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

  if (!baseUrl) {
    notifyError({ code: 'SOCKET_URL_MISSING', message: 'EXPO_PUBLIC_API_URL is not configured.' });
    return null;
  }

  if (socketInstance && activeToken === token) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  disconnectChatSocket();
  activeToken = token;

  const socket = io(baseUrl, {
    auth: { token },
    extraHeaders: { Authorization: `Bearer ${token}` },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => notifyConnection(true));
  socket.on('disconnect', () => notifyConnection(false));
  socket.on('connect_error', (error: any) => {
    notifyConnection(false);
    notifyError({
      code: error?.data?.code || 'SOCKET_CONNECT_ERROR',
      message: error?.message || 'Socket connection failed.',
    });
  });

  socket.on(CHAT_SOCKET_EVENTS.NEW_MESSAGE, (message: Message) => {
    callbackSets.forEach((callbacks) => callbacks.onNewMessage?.(message));
  });

  socket.on(CHAT_SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
    callbackSets.forEach((callbacks) => callbacks.onMessageDelivered?.(data));
  });

  socket.on(CHAT_SOCKET_EVENTS.USER_TYPING, (event: TypingEvent) => {
    callbackSets.forEach((callbacks) => callbacks.onTyping?.(event));
  });

  socket.on(CHAT_SOCKET_EVENTS.READ_RECEIPT, (event: ReadReceiptEvent) => {
    callbackSets.forEach((callbacks) => callbacks.onReadReceipt?.(event));
  });

  socket.on(CHAT_SOCKET_EVENTS.USER_ONLINE, (data) => {
    callbackSets.forEach((callbacks) => callbacks.onUserOnline?.(data));
  });

  socket.on(CHAT_SOCKET_EVENTS.USER_OFFLINE, (data) => {
    callbackSets.forEach((callbacks) => callbacks.onUserOffline?.(data));
  });

  socket.on(CHAT_SOCKET_EVENTS.ERROR, (error: SocketErrorPayload | string) => {
    notifyError(normalizeSocketError(error));
  });

  socketInstance = socket;
  return socket;
}

export function subscribeChatSocket(callbacks: ChatSocketCallbacks): () => void {
  callbackSets.add(callbacks);
  callbacks.onConnectionChange?.(socketInstance?.connected ?? false);

  return () => {
    callbackSets.delete(callbacks);
  };
}

export function getChatSocket(): Socket | null {
  return socketInstance;
}

export function disconnectChatSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
  }
  socketInstance = null;
  activeToken = null;
  notifyConnection(false);
}

export function emitChatEvent<TResponse>(
  event: string,
  payload: Record<string, unknown>,
  timeoutMs = 8000,
): Promise<ChatSocketAck<TResponse>> {
  const socket = socketInstance;

  if (!socket?.connected) {
    return Promise.resolve({
      success: false,
      error: { code: 'SOCKET_NOT_CONNECTED', message: 'Socket is not connected.' },
    });
  }

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        error: { code: 'SOCKET_ACK_TIMEOUT', message: 'Socket request timed out.' },
      });
    }, timeoutMs);

    socket.emit(event, payload, (ack: ChatSocketAck<TResponse>) => {
      clearTimeout(timer);
      resolve(ack?.success === false ? { success: false, error: normalizeSocketError(ack.error) } : ack);
    });
  });
}

function notifyConnection(connected: boolean): void {
  callbackSets.forEach((callbacks) => callbacks.onConnectionChange?.(connected));
}

function notifyError(error: SocketErrorPayload): void {
  callbackSets.forEach((callbacks) => callbacks.onError?.(error));
}

function normalizeSocketError(error: unknown): SocketErrorPayload {
  if (typeof error === 'string') {
    return { code: 'SOCKET_ERROR', message: error };
  }

  if (error && typeof error === 'object') {
    const payload = error as Partial<SocketErrorPayload>;
    return {
      ...(payload.event ? { event: payload.event } : {}),
      code: payload.code || 'SOCKET_ERROR',
      message: payload.message || 'Socket error.',
    };
  }

  return { code: 'SOCKET_ERROR', message: 'Socket error.' };
}
