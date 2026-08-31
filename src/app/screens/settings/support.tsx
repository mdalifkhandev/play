import React, { useState } from 'react';
import { ActivityIndicator, View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { createSupportRequest, listSupportRequests, type SupportRequest } from '../../../api/support/support.api';
import { handleApiError } from '../../../api/client';
import { toast } from 'sonner-native';
import { useKeyboardBottomInset } from '../../../hooks/common/useKeyboardBottomInset';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const keyboardHeight = useKeyboardBottomInset();
  const [problemText, setProblemText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await listSupportRequests({ limit: 20 });
      setTickets(result.items.filter((ticket) => ticket.status !== 'closed'));
    } catch (error) {
      toast.error(handleApiError(error, 'Could not load support requests.'));
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    void loadTickets();
  }, []);

  const handleSubmit = async () => {
    const message = problemText.trim();

    if (message.length < 10) {
      toast.error('Please write at least 10 characters.');
      return;
    }

    setIsSending(true);

    try {
      const request = await createSupportRequest({
        category: 'other',
        subject: message.split('\n')[0]?.slice(0, 120) || 'Support request',
        message,
      });
      setProblemText('');
      setTickets((current) => [request, ...current]);
      toast.success(`Support request sent. Ticket ${request.ticketNumber}`);
    } catch (error) {
      toast.error(handleApiError(error, 'Could not send support request.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A]"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Math.max(insets.bottom + keyboardHeight + 80, 120),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title="Support Requests" containerStyle="mt-0 px-0 mb-12" />

        <View className="flex-row justify-center items-center mb-8">
          <Image
            source={require('../../../../assets/images/icon.png')}
            style={{ width: 60, height: 60, resizeMode: 'contain' }}
          />
          <Text className='text-[#DFFD53] text-4xl font-inter-bold ml-3'>Play</Text>
        </View>

        <Text className="text-white text-center text-lg font-inter-medium mb-8 px-4">
          If you face any kind of problem with our service feel free to contact us.
        </Text>

        <Pressable className="flex-row items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-4 mb-4 border border-[#333]">
          <Text className="text-gray-400 text-base font-inter-regular">Admin</Text>
          {/* <Ionicons name="chevron-down" size={20} color="#0056D2" /> */}
        </Pressable>

        <View className="bg-[#1C1C1E] rounded-xl px-4 py-4 mb-6 border border-[#333] h-40">
          <TextInput
            placeholder="Write your problem here"
            placeholderTextColor="#888"
            value={problemText}
            onChangeText={setProblemText}
            multiline
            textAlignVertical="top"
            className="flex-1 text-white text-base font-inter-regular"
          />
        </View>

        <CustomButton
          title="Send to admin"
          variant="primary"
          disabled={isSending}
          isLoading={isSending}
          onPress={handleSubmit}
        />

        <View className="mt-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-white text-lg font-inter-bold">Your tickets</Text>
            <Pressable onPress={loadTickets} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#98D83A" />
              ) : (
                <Text className="text-[#98D83A] font-inter-semibold">Refresh</Text>
              )}
            </Pressable>
          </View>

          {!isLoading && tickets.length === 0 && (
            <Text className="text-gray-400 text-sm">No support tickets yet.</Text>
          )}

          {tickets.map((ticket) => (
            <Pressable
              key={ticket.id}
              className="mb-3 rounded-xl border border-[#333] bg-[#1C1C1E] px-4 py-4"
              onPress={() =>
                router.push({
                  pathname: '/screens/settings/support/[id]',
                  params: { id: ticket.id },
                })
              }
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-white font-inter-semibold" numberOfLines={1}>{ticket.subject}</Text>
                  <Text className="mt-1 text-xs text-gray-400">{ticket.ticketNumber}</Text>
                  <Text className="mt-2 text-sm text-gray-300">{statusText(ticket.status)}</Text>
                </View>
                <View className="rounded-full bg-[#98D83A]/15 px-3 py-1">
                  <Text className="text-xs font-inter-bold text-[#98D83A]">{formatStatus(ticket.status)}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>
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
