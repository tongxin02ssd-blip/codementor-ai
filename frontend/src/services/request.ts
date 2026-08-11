import axios from 'axios';
import type { ApiErrorPayload, ErrorStage } from '../types/review';

export class RequestError extends Error {
  readonly code: string;
  readonly stage: ErrorStage;
  readonly status?: number;

  constructor(message: string, stage: ErrorStage, code = 'REQUEST_FAILED', status?: number) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.stage = stage;
    this.status = status;
  }
}

export class RequestCancelledError extends RequestError {
  constructor(stage: ErrorStage) {
    super('请求已取消。', stage, 'REQUEST_CANCELLED');
    this.name = 'RequestCancelledError';
  }
}

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 90_000,
});

export function toRequestError(error: unknown, fallbackStage: ErrorStage) {
  if (error instanceof RequestError) return error;
  if (axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')) {
    return new RequestCancelledError(fallbackStage);
  }
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data;
    const isTimeout = error.code === 'ECONNABORTED';
    return new RequestError(
      payload?.error?.message ?? payload?.message ??
        (isTimeout ? '请求超时，请稍后重试。' : '网络请求失败，请检查后端服务和网络连接。'),
      isTimeout ? 'network' : (payload?.error?.stage ?? fallbackStage),
      payload?.error?.code ?? (isTimeout ? 'REQUEST_TIMEOUT' : error.code),
      error.response?.status,
    );
  }
  if (error instanceof Error) return new RequestError(error.message, fallbackStage);
  return new RequestError('请求失败，请稍后重试。', fallbackStage);
}
