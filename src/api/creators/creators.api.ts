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
  enabled?: boolean;
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
  occupationId?: string;
  occupation?: string;
  contentCategoryId?: string;
  contentCategory: string;
  contentLanguageCode?: string;
  contentLanguage: string;
  countryCode?: string;
  country: string;
  reason: string;
  idFrontUrl?: string;
  idBackUrl?: string;
};

export type Occupation = {
  id: string;
  name: string;
};

export type CreatorCategory = {
  id: string;
  name: string;
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

export async function getOccupations(query?: string): Promise<{ items: Occupation[] }> {
  const response = await apiClient.get<{ data: { items: Occupation[] } }>('/occupations', {
    params: {
      ...(query?.trim() ? { q: query.trim() } : {}),
      limit: 20,
    },
  });
  return dataOf<{ items: Occupation[] }>(response);
}

export async function createOccupation(name: string): Promise<Occupation> {
  const response = await apiClient.post<{ data: Occupation }>('/occupations', { name });
  return dataOf<Occupation>(response);
}

export async function getCreatorCategories(query?: string): Promise<{ items: CreatorCategory[] }> {
  const response = await apiClient.get<{ data: { items: CreatorCategory[] } }>('/creator-categories', {
    params: {
      ...(query?.trim() ? { q: query.trim() } : {}),
      limit: 20,
    },
  });
  return dataOf<{ items: CreatorCategory[] }>(response);
}

export async function createCreatorCategory(name: string): Promise<CreatorCategory> {
  const response = await apiClient.post<{ data: CreatorCategory }>('/creator-categories', { name });
  return dataOf<CreatorCategory>(response);
}
