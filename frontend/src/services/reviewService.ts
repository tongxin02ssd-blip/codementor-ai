import type { GithubPullRequestCoordinates, GithubPullRequestResponse, ReviewRequest, ReviewResult } from '../types/review';
import { request, toRequestError } from './request';

export async function fetchGithubPullRequest(
  coordinates: GithubPullRequestCoordinates,
  signal?: AbortSignal,
): Promise<GithubPullRequestResponse> {
  try {
    const response = await request.get<GithubPullRequestResponse>(
      `/api/github/pulls/${encodeURIComponent(coordinates.owner)}/${encodeURIComponent(coordinates.repo)}/${coordinates.pullNumber}`,
      { signal },
    );
    return response.data;
  } catch (error) {
    throw toRequestError(error, 'github');
  }
}

export async function analyzeReview(values: ReviewRequest, signal?: AbortSignal): Promise<ReviewResult> {
  try {
    const response = await request.post<ReviewResult>('/api/reviews', values, { signal });
    return response.data;
  } catch (error) {
    throw toRequestError(error, 'review');
  }
}
