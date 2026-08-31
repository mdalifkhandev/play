import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { closeSupportRequest, getSupportRequest, replyToSupportRequest, type SupportMessage, type SupportRequest } from '../../../../api/support/support.api';
import { handleApiError } from '../../../../api/client';
import { Header } from '../../../../components/ui/Header';
import { CustomButton } from '../../../../components/ui/CustomButton';

export default function SupportRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const detail = await getSupportRequest(id);
      setRequest(detail.request);
      setMessages(detail.messages);
    } catch (error) {
      toast.error(handleApiError(error, 'Could not load support request.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const sendReply = async () => {
    const message = reply.trim();
    if (!id || !message || isSending) return;

    setIsSending(true);
    try {
      const detail = await replyToSupportRequest(id, message);
      setRequest(detail.request);
      setMessages(detail.messages);
      setReply('');
      toast.success('Reply sent.');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not send reply.'));
    } finally {
      setIsSending(false);
    }
  };

  const closeTicket = async () => {
    if (!id || isClosing) return;

    setIsClosing(true);
    try {
      const nextRequest = await closeSupportRequest(id);
      setRequest(nextRequest);
      toast.success('Support request closed.');
    } catch (error) {
      toast.error(handleApiError(error, 'Could not close support request.'));
    } finally {
      setIsClosing(false);
    }
  };

  const isClosed = request?.status === 'closed';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0A]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-5" style={{ paddingTop: insets.top + 18 }}>
        <Header showBackButton title="Support Detail" containerStyle="px-0 mb-5" />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#98D83A" />
            <Text className="mt-3 text-gray-400">Loading ticket...</Text>
          </View>
        ) : request ? (
          <>
            <View className="mb-4 rounded-2xl border border-[#333] bg-[#1C1C1E] p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-white text-lg font-inter-bold">{request.subject}</Text>
                  <Text className="mt-1 text-xs text-gray-400">{request.ticketNumber}</Text>
                </View>
                <View className="rounded-full bg-[#98D83A]/15 px-3 py-1">
                  <Text className="text-xs font-inter-bold text-[#98D83A]">{formatStatus(request.status)}</Text>
                </View>
              </View>
              <Text className="mt-3 text-sm text-gray-300">{statusText(request.status)}</Text>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 18 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => {
                const isStaff = message.senderType === 'staff';
                return (
                  <View key={message.id} className={`mb-3 ${isStaff ? 'items-start' : 'items-end'}`}>
                    <View className={`max-w-[86%] rounded-2xl px-4 py-3 ${isStaff ? 'bg-[#1C1C1E]' : 'bg-[#98D83A]'}`}>
                      <Text className={`mb-1 text-xs font-inter-semibold ${isStaff ? 'text-[#98D83A]' : 'text-black/70'}`}>
                        {isStaff ? 'Support team' : 'You'}
                      </Text>
                      <Text className={`${isStaff ? 'text-white' : 'text-black'} text-sm`}>{message.message}</Text>
                      <Text className={`mt-2 text-[10px] ${isStaff ? 'text-gray-500' : 'text-black/50'}`}>
                        {new Date(message.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {!isClosed ? (
              <View className="border-t border-white/10 bg-[#0A0A0A] pt-3" style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
                <TextInput
                  value={reply}
                  onChangeText={setReply}
                  placeholder="Write a reply..."
                  placeholderTextColor="#777"
                  multiline
                  className="mb-3 max-h-28 rounded-2xl border border-[#333] bg-[#1C1C1E] px-4 py-3 text-white"
                  textAlignVertical="top"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <CustomButton title="Send Reply" disabled={!reply.trim() || isSending} isLoading={isSending} onPress={sendReply} />
                  </View>
                  <Pressable
                    className="items-center justify-center rounded-xl border border-red-500/40 px-4"
                    disabled={isClosing}
                    onPress={closeTicket}
                  >
                    {isClosing ? <ActivityIndicator color="#F87171" /> : <Text className="font-inter-bold text-red-400">Close</Text>}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="py-4" style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
                <Text className="text-center text-gray-400">This support request is closed.</Text>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400">Support request not found.</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function formatStatus(status: SupportRequest['status']) {
  if (status === 'in_progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusText(status: SupportRequest['status']) {
  if (status === 'open') return 'Admin team will review this request.';
  if (status === 'in_progress') return 'Your request is being reviewed.';
  if (status === 'resolved') return 'This request has been resolved.';
  return 'This request is closed.';
}
