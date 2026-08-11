import type { ErrorStage } from '../types/review';

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly stage: ErrorStage;

  constructor(status: number, code: string, message: string, stage: ErrorStage) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.stage = stage;
  }
}

export function toAppError(error: unknown, stage: ErrorStage) {
  if (error instanceof AppError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError(499, 'REQUEST_CANCELLED', '请求已取消。', stage);
  }
  return new AppError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : '服务端处理失败。', stage);
}
