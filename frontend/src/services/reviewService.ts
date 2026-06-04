import axios from 'axios';
import { request } from './request';
import type { ReviewFormValues, ReviewResult } from '../types/review';

interface BackendErrorResponse {
  message?: string;
}

function getServiceErrorMessage(error: unknown) {
  if (axios.isAxiosError<BackendErrorResponse>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Review 分析请求失败，请稍后重试。'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Review 分析请求失败，请稍后重试。';
}

export async function analyzeReview(values: ReviewFormValues): Promise<ReviewResult> {
  try {
    const response = await request.post<ReviewResult>('/api/review', values);

    return response.data;
  } catch (error) {
    throw new Error(getServiceErrorMessage(error));
  }
}