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

export interface SupportMessage {
  id: string;
  senderUserId: string;
  senderType: 'user' | 'staff';
  message: string;
  createdAt: string;
}

export interface SupportRequestDetail {
  request: SupportRequest;
  messages: SupportMessage[];
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

export async function listSupportRequests(params: { page?: number; limit?: number; status?: SupportRequestStatus } = {}) {
  const response = await apiClient.get<{
    data: {
      items: SupportRequest[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  }>('/support-requests', { params });
  return response.data.data;
}

export async function getSupportRequest(id: string): Promise<SupportRequestDetail> {
  const response = await apiClient.get<{ data: SupportRequestDetail }>(`/support-requests/${id}`);
  return response.data.data;
}

export async function replyToSupportRequest(id: string, message: string): Promise<SupportRequestDetail> {
  const response = await apiClient.post<{ data: SupportRequestDetail }>(`/support-requests/${id}/messages`, { message });
  return response.data.data;
}

export async function closeSupportRequest(id: string): Promise<SupportRequest> {
  const response = await apiClient.post<{ data: { request: SupportRequest } }>(`/support-requests/${id}/close`);
  return response.data.data.request;
}
