import type { Request, Response } from 'express';
import { analyzeReviewWithAi } from '../services/aiReview.service';
import type { ErrorResponse, ReviewRequestBody, ReviewResult } from '../types/review';
import { AppError, toAppError } from '../utils/AppError';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isPullRequest(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' &&
    (value.sourceType === 'github' || value.sourceType === 'manual') &&
    typeof value.title === 'string' &&
    typeof value.author === 'string' &&
    typeof value.createdAt === 'string';
}

function isDiffFile(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.filePath === 'string' && value.filePath.length > 0 &&
    (value.changeType === 'added' || value.changeType === 'modified' ||
      value.changeType === 'deleted' || value.changeType === 'renamed') &&
    typeof value.language === 'string' &&
    Number.isInteger(value.additions) && Number.isInteger(value.deletions) &&
    typeof value.oldContent === 'string' && typeof value.newContent === 'string' &&
    typeof value.patch === 'string' && Array.isArray(value.lines);
}

function validateReviewRequest(body: unknown): body is ReviewRequestBody {
  if (!isRecord(body)) return false;
  const value = body as Partial<ReviewRequestBody>;
  return isPullRequest(value.pullRequest) && Array.isArray(value.files) &&
    value.files.length > 0 && value.files.length <= 100 && value.files.every(isDiffFile);
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
