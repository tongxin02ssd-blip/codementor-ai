export type ReviewInputType = 'prUrl' | 'diffText';

export interface GithubPrInfo {
  owner: string;
  repo: string;
  pullNumber: number;
  url: string;
}

export interface ReviewFormValues {
  inputType: ReviewInputType;
  prUrl?: string;
  diffText?: string;
  shouldMockError?: boolean;
  prInfo?: GithubPrInfo;
}

export type ReviewRiskLevel = 'low' | 'medium' | 'high';

export interface ReviewRisk {
  id: string;
  level: ReviewRiskLevel;
  title: string;
  description: string;
}

export interface ReviewResult {
  summary: string;
  risks: ReviewRisk[];
  suggestions: string[];
  mergeAdvice: string;
  generatedAt: string;
}