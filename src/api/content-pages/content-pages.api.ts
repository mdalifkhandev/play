import { apiClient } from '../client';

export type ContentPageType = 'about-us' | 'privacy-policy' | 'terms-conditions';
export type ContentPageStatus = 'draft' | 'published' | 'archived';

export interface ContentSection {
  heading: string;
  content: string;
  order: number;
}

export interface ContentPage {
  id: string;
  pageType: ContentPageType;
  title: string;
  sections: ContentSection[];
  version: number;
  status: ContentPageStatus;
  changeSummary?: string;
  effectiveAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
}

async function getContentPage(path: string): Promise<ContentPage> {
  const response = await apiClient.get<{ data: { page: ContentPage } }>(path);
  return response.data.data.page;
}

export function getAboutUsPage(): Promise<ContentPage> {
  return getContentPage('/content-pages/about-us');
}

export function getPrivacyPolicyPage(): Promise<ContentPage> {
  return getContentPage('/content-pages/privacy-policy');
}

export function getTermsConditionsPage(): Promise<ContentPage> {
  return getContentPage('/content-pages/terms-conditions');
}
