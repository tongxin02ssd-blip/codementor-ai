import { createMockReviewResult } from '../mocks/mockReview';
import type { ReviewFormValues, ReviewResult } from '../types/review';

const MOCK_REQUEST_DELAY = 1000;

export function analyzeReview(values: ReviewFormValues): Promise<ReviewResult> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (values.shouldMockError) {
        reject(new Error('模拟分析失败：当前请求没有成功返回 Review 结果，请稍后重试。'));
        return;
      }

      const result = createMockReviewResult(values);
      resolve(result);
    }, MOCK_REQUEST_DELAY);
  });
}