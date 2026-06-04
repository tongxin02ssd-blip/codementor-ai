import type { Request, Response } from 'express';
import { createBackendMockReviewResult } from '../services/mockReview.service';
import type { ErrorResponse, ReviewRequestBody, ReviewResult } from '../types/review';

function validateReviewRequest(body: ReviewRequestBody) {
  if (!body.inputType) {
    return '缺少 inputType 字段';
  }

  if (body.inputType !== 'prUrl' && body.inputType !== 'diffText') {
    return 'inputType 只能是 prUrl 或 diffText';
  }

  if (body.inputType === 'prUrl' && !body.prUrl) {
    return '请输入 GitHub PR 链接';
  }

  if (body.inputType === 'diffText' && !body.diffText) {
    return '请粘贴 diff 文本';
  }

  return null;
}

export function handleReviewAnalyze(
  req: Request<unknown, ReviewResult | ErrorResponse, ReviewRequestBody>,
  res: Response<ReviewResult | ErrorResponse>,
) {
  const errorMessage = validateReviewRequest(req.body);

  if (errorMessage) {
    res.status(400).json({
      message: errorMessage,
    });
    return;
  }

  if (req.body.shouldMockError) {
    res.status(500).json({
      message: '后端模拟分析失败：当前请求没有成功生成 Review 结果。',
    });
    return;
  }

  const result = createBackendMockReviewResult(req.body);

  res.json(result);
}