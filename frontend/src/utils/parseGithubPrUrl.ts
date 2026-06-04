import type { GithubPrInfo } from '../types/review';

const GITHUB_PR_URL_PATTERN = /^https:\/\/github\.com\/([^/\s]+)\/([^/\s]+)\/pull\/(\d+)\/?$/;

export function parseGithubPrUrl(url?: string): GithubPrInfo | null {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  const match = GITHUB_PR_URL_PATTERN.exec(trimmedUrl);

  if (!match) {
    return null;
  }

  const [, owner, repo, pullNumber] = match;

  return {
    owner,
    repo,
    pullNumber: Number(pullNumber),
    url: trimmedUrl,
  };
}