import { apiClient } from '../client';

export type CreatorRequirementKey =
  | 'profile'
  | 'followers'
  | 'views'
  | 'watch_time'
  | 'likes'
  | 'account_age'
  | 'reels'
  | 'guidelines';

export type CreatorRequirement = {
  key: CreatorRequirementKey;
  title: string;
  current: number;
  target: number;
  complete: boolean;
  locked?: boolean;
};

export type CreatorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'held';

export type CreatorEligibility = {
  status: 'not_started' | 'eligible' | CreatorApplicationStatus;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  canApply: boolean;
  isCreator: boolean;
  application?: {
    id: string;
    status: CreatorApplicationStatus;
    adminReason?: string;
    reviewedAt?: string;
    createdAt: string;
  };
  requirements: CreatorRequirement[];
};

export type CreateCreatorApplicationRequest = {
  fullName: string;
  email: string;
  dateOfBirth?: string;
  occupation?: string;
  contentCategory: string;
  contentLanguage: string;
  country: string;
  reason: string;
  idFrontUrl?: string;
  idBackUrl?: string;
};

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export async function getCreatorEligibility(): Promise<CreatorEligibility> {
  const response = await apiClient.get<{ data: CreatorEligibility }>('/creators/me/eligibility');
  return dataOf<CreatorEligibility>(response);
}

export async function submitCreatorApplication(input: CreateCreatorApplicationRequest) {
  const response = await apiClient.post<{ data: CreatorEligibility['application'] }>(
    '/creators/applications',
    input,
  );
  return dataOf<CreatorEligibility['application']>(response);
}
