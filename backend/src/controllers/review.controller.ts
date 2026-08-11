import type { Request, Response } from 'express';
import { analyzeReviewWithAi } from '../services/aiReview.service';
import type { ErrorResponse, ReviewRequestBody, ReviewResult } from '../types/review';
import { AppError, toAppError } from '../utils/AppError';

function validateReviewRequest(body: unknown): body is ReviewRequestBody {
  if (!body || typeof body !== 'object') return false;
  const value = body as Partial<ReviewRequestBody>;
  if (!value.pullRequest || !Array.isArray(value.files) || value.files.length === 0 || value.files.length > 100) return false;
  return value.files.every((file) =>
    file && typeof file.filePath === 'string' && typeof file.oldContent === 'string' &&
    typeof file.newContent === 'string' && typeof file.patch === 'string',
  );
}

export async function handleReviewAnalyze(
  req: Request<unknown, ReviewResult | ErrorResponse, unknown>,
  res: Response<ReviewResult | ErrorResponse>,
) {
  if (!validateReviewRequest(req.body)) {
    res.status(400).json({ error: { code: 'INVALID_REVIEW_INPUT', message: 'Review 请求必须包含有效的 PullRequest 和 DiffFile[]。', stage: 'review' } });
    return;
  }

  const controller = new AbortController();
  req.once('aborted', () => controller.abort());
  res.once('close', () => { if (!res.writableEnded) controller.abort(); });
  try {
    const result = await analyzeReviewWithAi(req.body, controller.signal);
    if (!res.headersSent) res.json(result);
  } catch (error) {
    if (res.headersSent) return;
    const appError = toAppError(error, 'review');
    const status = appError instanceof AppError ? appError.status : 500;
    res.status(status === 499 ? 400 : status).json({
      error: { code: appError.code, message: appError.message, stage: appError.stage },
    });
  }
}
