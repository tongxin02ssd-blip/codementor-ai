import { createMockReviewResult } from '../mocks/mockReview';
import type { ReviewFormValues, ReviewResult } from '../types/review';

const MOCK_REQUEST_DELAY = 1000;

export function analyzeReview(values: ReviewFormValues): Promise<ReviewResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const result = createMockReviewResult(values);

      resolve(result);
    }, MOCK_REQUEST_DELAY);
  });
}