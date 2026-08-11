export type ReviewSourceType = 'github' | 'manual';
export type ReviewInputMode = 'github' | 'diff';
export type ChangeType = 'added' | 'modified' | 'deleted' | 'renamed';
export type DiffLineType = 'context' | 'added' | 'removed';
export type ReviewSeverity = 'high' | 'medium' | 'low';

export interface GithubPullRequestCoordinates {
  owner: string;
  repo: string;
  pullNumber: number;
  url: string;
}

export interface PullRequest {
  id: string;
  sourceType: ReviewSourceType;
  url: string | null;
  owner: string | null;
  repo: string | null;
  pullNumber: number | null;
  title: string;
  author: string;
  createdAt: string;
  baseRef?: string;
  headRef?: string;
}

export interface DiffLine {
  lineId: string;
  type: DiffLineType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
  rawContent: string;
}

export interface DiffFile {
  filePath: string;
  oldPath: string | null;
  changeType: ChangeType;
  language: string;
  additions: number;
  deletions: number;
  oldContent: string;
  newContent: string;
  patch: string;
  lines: DiffLine[];
}

export interface ReviewIssue {
  id: string;
  filePath: string;
  lineNumber: number;
  severity: ReviewSeverity;
  title: string;
  description: string;
  suggestion: string;
}

export interface ReviewResult {
  reviewId: string;
  summary: string;
  issues: ReviewIssue[];
  generatedAt: string;
  status: 'completed';
}

export interface ReviewWorkspace {
  pullRequest: PullRequest;
  files: DiffFile[];
}

export type GithubPullRequestResponse = ReviewWorkspace;

export interface ReviewRequest {
  pullRequest: PullRequest;
  files: DiffFile[];
}

export type ErrorStage = 'github' | 'diff' | 'review' | 'network';

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    stage?: ErrorStage;
  };
  message?: string;
}
