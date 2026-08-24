import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { handleApiError } from '../../api/client';
import {
  moderationReportReasons,
  reportContent,
  type ModerationReportReason,
  type ModerationTargetType,
} from '../../api/moderation/moderation.api';

export function ReportSheet({
  visible,
  targetType,
  targetId,
  title = 'Report',
  onClose,
}: {
  visible: boolean;
  targetType: ModerationTargetType;
  targetId?: string;
  title?: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ModerationReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    if (isSubmitting) return;
    setReason(null);
    setDetails('');
    onClose();
  };

  const submit = async () => {
    if (!targetId || !reason || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await reportContent(targetType, targetId, reason, details);
      toast.success(result.reported ? 'Report submitted.' : 'You already reported this.');
      setReason(null);
      setDetails('');
      onClose();
    } catch (error) {
      toast.error(handleApiError(error, 'Report could not be submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 justify-end bg-black/60" onPress={close}>
        <Pressable
          className="rounded-t-3xl bg-[#151515] px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom + 12, 24), maxHeight: '82%' }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-5 h-1 w-12 self-center rounded-full bg-white/25" />
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-inter-bold">{title}</Text>
              <Text className="mt-1 text-gray-400 text-sm">Tell us what is wrong.</Text>
            </View>
            <Pressable onPress={close} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="close" size={20} color="#FFF" />
            </Pressable>
          </View>

          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              {moderationReportReasons.map(item => {
                const isSelected = reason === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setReason(item.value)}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                      isSelected ? 'border-[#98FF2F] bg-[#98FF2F]/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <Text className="text-white text-sm font-inter-semibold">{item.label}</Text>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={isSelected ? '#98FF2F' : '#777'}
                    />
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Add details (optional)"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
              className="mt-4 min-h-24 rounded-2xl bg-white/10 px-4 py-3 text-white"
            />
          </ScrollView>

          <Pressable
            disabled={!reason || isSubmitting}
            onPress={submit}
            className={`mt-4 h-12 items-center justify-center rounded-2xl ${reason && !isSubmitting ? 'bg-[#98FF2F]' : 'bg-white/10'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className={`font-inter-bold ${reason ? 'text-black' : 'text-[#777]'}`}>Submit report</Text>
            )}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
