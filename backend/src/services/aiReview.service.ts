import { randomUUID } from 'node:crypto';
import type { ReviewIssue, ReviewRequestBody, ReviewResult, ReviewSeverity } from '../types/review';
import { AppError } from '../utils/AppError';
import { buildReviewPrompt } from '../utils/buildReviewPrompt';

interface AiChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

interface AiReviewPayload {
  summary: string;
  issues: ReviewIssue[];
}

const DEFAULT_TIMEOUT_MS = 90_000;
const MAX_PROMPT_CHARACTERS = 240_000;
const HAN_CHARACTER_PATTERN = /\p{Script=Han}/u;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSeverity(value: unknown): value is ReviewSeverity {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isReviewIssue(value: unknown, files: Map<string, number>): value is ReviewIssue {
  if (!value || typeof value !== 'object') return false;
  const issue = value as Record<string, unknown>;
  const maxLineNumber = typeof issue.filePath === 'string' ? files.get(issue.filePath) : undefined;
  return !('category' in issue) &&
    isNonEmptyString(issue.id) &&
    isNonEmptyString(issue.filePath) &&
    typeof maxLineNumber === 'number' &&
    Number.isInteger(issue.lineNumber) &&
    Number(issue.lineNumber) > 0 &&
    Number(issue.lineNumber) <= maxLineNumber &&
    isSeverity(issue.severity) &&
    isNonEmptyString(issue.title) &&
    isNonEmptyString(issue.description) &&
    isNonEmptyString(issue.suggestion);
}

function hasInvalidUnicode(value: string) {
  if (value.includes('\uFFFD')) return true;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) return true;
      index += 1;
    } else if (code >= 0xDC00 && code <= 0xDFFF) {
      return true;
    }
  }
  return false;
}

function validateReviewText(payload: AiReviewPayload) {
  const textFields = [
    payload.summary,
    ...payload.issues.flatMap((issue) => [issue.title, issue.description, issue.suggestion]),
  ];
  if (textFields.some(hasInvalidUnicode)) {
    throw new AppError(502, 'AI_RESPONSE_ENCODING_INVALID', 'AI 返回的 Review 包含无效或损坏的 Unicode 文本，请重新分析。', 'review');
  }
  if (textFields.some((value) => !HAN_CHARACTER_PATTERN.test(value))) {
    throw new AppError(502, 'AI_RESPONSE_LANGUAGE_INVALID', 'AI 返回的 Review 未按要求使用简体中文，请重新分析。', 'review');
  }
}

function extractJson(content: string) {
  const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'AI 返回内容中没有有效 JSON 对象。', 'review');
  }
  return cleaned.slice(start, end + 1);
}

function parseAiResult(content: string, request: ReviewRequestBody): ReviewResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'AI 返回的 JSON 无法解析。', 'review');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'AI 返回的 Review 结构无效。', 'review');
  }
  const payload = parsed as Partial<AiReviewPayload>;
  const files = new Map(request.files.map((file) => [
    file.filePath,
    Math.max(file.oldContent.split('\n').length, file.newContent.split('\n').length),
  ]));
  if (!isNonEmptyString(payload.summary) || !Array.isArray(payload.issues) ||
      !payload.issues.every((issue) => isReviewIssue(issue, files))) {
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'AI 返回字段缺失、类型错误或引用了未知文件。', 'review');
  }
  const ids = new Set(payload.issues.map((issue) => issue.id));
  if (ids.size !== payload.issues.length) {
    throw new AppError(502, 'AI_RESPONSE_INVALID', 'AI 返回了重复的 Review Issue id。', 'review');
  }
  validateReviewText(payload as AiReviewPayload);
  return {
    reviewId: randomUUID(),
    summary: payload.summary,
    issues: payload.issues,
    generatedAt: new Date().toISOString(),
    status: 'completed',
  };
}

export async function analyzeReviewWithAi(values: ReviewRequestBody, requestSignal: AbortSignal) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL;
  const model = process.env.AI_MODEL;
  if (!apiKey || !baseUrl || !model) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'AI Review 服务未配置，请设置 AI_API_KEY、AI_API_BASE_URL 和 AI_MODEL。', 'review');
  }

  const prompt = buildReviewPrompt(values);
  if (prompt.length > MAX_PROMPT_CHARACTERS) {
    throw new AppError(413, 'REVIEW_INPUT_TOO_LARGE', '本次 Diff 超出 AI Review 输入上限，请缩小变更范围后重试。', 'review');
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromClient = () => controller.abort();
  requestSignal.addEventListener('abort', abortFromClient, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: '你是一名严谨的代码审查专家。除代码标识符、路径和技术专有名词外，所有审查说明必须使用简体中文。只返回符合用户指定结构的有效 JSON。' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      throw new AppError(502, 'AI_API_FAILED', `AI Review 服务请求失败（${response.status}）。`, 'review');
    }
    const data = await response.json() as AiChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new AppError(502, 'AI_EMPTY_RESPONSE', 'AI Review 服务没有返回有效内容。', 'review');
    return parseAiResult(content, values);
  } catch (error) {
    if (controller.signal.aborted) {
      if (timedOut) throw new AppError(504, 'AI_TIMEOUT', 'AI Review 请求超时，请稍后重试。', 'review');
      throw new AppError(499, 'REQUEST_CANCELLED', 'AI Review 请求已取消。', 'review');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    requestSignal.removeEventListener('abort', abortFromClient);
  }
}
