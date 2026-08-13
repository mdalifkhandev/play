import { useCallback, useEffect, useRef } from 'react';

import {
  CHAT_SOCKET_EVENTS,
  disconnectChatSocket,
  emitChatEvent,
  ensureChatSocket,
  getChatSocket,
  subscribeChatSocket,
  type ChatSocketCallbacks,
} from '../../api/conversations/chatSocket';
import type { Message } from '../../api/conversations/conversation.types';
import { useAppStore } from '../../store';

export function useChatSocket(callbacks: ChatSocketCallbacks = {}) {
  const token = useAppStore((state) => state.token);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const unsubscribe = subscribeChatSocket({
      onNewMessage: (message) => callbacksRef.current.onNewMessage?.(message),
      onMessageDelivered: (data) => callbacksRef.current.onMessageDelivered?.(data),
      onTyping: (event) => callbacksRef.current.onTyping?.(event),
      onReadReceipt: (event) => callbacksRef.current.onReadReceipt?.(event),
      onBlockStatusChanged: (event) => callbacksRef.current.onBlockStatusChanged?.(event),
      onUserOnline: (data) => callbacksRef.current.onUserOnline?.(data),
      onUserOffline: (data) => callbacksRef.current.onUserOffline?.(data),
      onError: (error) => callbacksRef.current.onError?.(error),
      onConnectionChange: (connected) => callbacksRef.current.onConnectionChange?.(connected),
    });

    return unsubscribe;
  }, []);

  const connect = useCallback(() => {
    if (!token) return null;
    return ensureChatSocket(token);
  }, [token]);

  useEffect(() => {
    if (token) {
      ensureChatSocket(token);
    } else {
      disconnectChatSocket();
    }
  }, [token]);

  return {
    socket: getChatSocket,
    connect,
    disconnect: disconnectChatSocket,
  };
}

export function socketJoinConversation(conversationId: string) {
  return emitChatEvent<{ conversationId: string }>(CHAT_SOCKET_EVENTS.JOIN, { conversationId });
}

export function socketLeaveConversation(conversationId: string) {
  return emitChatEvent<{ conversationId: string }>(CHAT_SOCKET_EVENTS.LEAVE, { conversationId });
}

export function socketSendMessage(
  conversationId: string,
  text?: string,
  mediaUrl?: string,
  attachmentType?: 'image' | 'video' | 'audio' | 'file',
) {
  return emitChatEvent<Message>(CHAT_SOCKET_EVENTS.SEND_MESSAGE, {
    conversationId,
    ...(text ? { text } : {}),
    ...(mediaUrl ? { mediaUrl } : {}),
    ...(attachmentType ? { attachmentType } : {}),
  });
}

export function socketTyping(conversationId: string, isTyping: boolean) {
  return emitChatEvent(
    isTyping ? CHAT_SOCKET_EVENTS.TYPING_START : CHAT_SOCKET_EVENTS.TYPING_STOP,
    { conversationId },
    3000,
  );
}

export function socketMarkRead(conversationId: string) {
  return emitChatEvent(CHAT_SOCKET_EVENTS.READ, { conversationId }, 5000);
}

export function socketBlockUser(targetUserId: string, conversationId?: string) {
  return emitChatEvent<{
    conversationId?: string;
    userId: string;
    blockedByMe: boolean;
    blockedMe: boolean;
    canUnblock: boolean;
  }>(CHAT_SOCKET_EVENTS.BLOCK_USER, {
    targetUserId,
    ...(conversationId ? { conversationId } : {}),
  }, 5000);
}

export function socketUnblockUser(targetUserId: string, conversationId?: string) {
  return emitChatEvent<{
    conversationId?: string;
    userId: string;
    blockedByMe: boolean;
    blockedMe: boolean;
    canUnblock: boolean;
  }>(CHAT_SOCKET_EVENTS.UNBLOCK_USER, {
    targetUserId,
    ...(conversationId ? { conversationId } : {}),
  }, 5000);
}
