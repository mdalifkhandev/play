import { apiClient } from '../client';

export type SupportCategory = 'account' | 'billing' | 'content' | 'safety' | 'technical' | 'other';
export type SupportRequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportRequest {
  id: string;
  ticketNumber: string;
  requesterUserId: string;
  category: SupportCategory;
  subject: string;
  status: SupportRequestStatus;
  priority: SupportPriority;
  assignedTo: string | null;
  messageCount: number;
  lastMessageAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportRequestInput {
  category: SupportCategory;
  subject: string;
  message: string;
}

export async function createSupportRequest(input: CreateSupportRequestInput): Promise<SupportRequest> {
  const response = await apiClient.post<{ data: { request: SupportRequest } }>('/support-requests', input);
  return response.data.data.request;
}
