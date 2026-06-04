import { createBackendMockReviewResult } from './mockReview.service';
import { buildReviewPrompt } from '../utils/buildReviewPrompt';
import type { ReviewRequestBody, ReviewResult, ReviewRiskLevel } from '../types/review';

interface AiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEFAULT_TIMEOUT_MS = 120000;

function getMockFallbackEnabled() {
  return process.env.AI_ENABLE_MOCK_FALLBACK !== 'false';
}

function hasAiConfig() {
  return Boolean(process.env.AI_API_KEY && process.env.AI_API_BASE_URL && process.env.AI_MODEL);
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, '');
}

function createFallbackReviewResult(values: ReviewRequestBody, reason: string): ReviewResult {
  const fallbackResult = createBackendMockReviewResult(values);

  return {
    ...fallbackResult,
    summary: `${fallbackResult.summary}\n\n说明：当前使用 Mock Review 降级结果。原因：${reason}`,
  };
}

function isRiskLevel(level: unknown): level is ReviewRiskLevel {
  return level === 'low' || level === 'medium' || level === 'high';
}

function isReviewResult(value: unknown): value is ReviewResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const currentValue = value as ReviewResult;

  return (
    typeof currentValue.summary === 'string' &&
    Array.isArray(currentValue.risks) &&
    currentValue.risks.every(
      (risk) =>
        typeof risk.id === 'string' &&
        isRiskLevel(risk.level) &&
        typeof risk.title === 'string' &&
        typeof risk.description === 'string',
    ) &&
    Array.isArray(currentValue.suggestions) &&
    currentValue.suggestions.every((suggestion) => typeof suggestion === 'string') &&
    typeof currentValue.mergeAdvice === 'string'
  );
}

function extractJsonText(content: string) {
  const cleanedContent = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('AI 返回内容中没有找到 JSON 对象');
  }

  return jsonMatch[0];
}

function parseAiReviewResult(content: string): ReviewResult {
  const jsonText = extractJsonText(content);
  const parsedValue = JSON.parse(jsonText) as unknown;

  if (!isReviewResult(parsedValue)) {
    throw new Error('AI 返回的 Review 结果结构不符合前端展示要求');
  }

  return {
    ...parsedValue,
    generatedAt: new Date().toISOString(),
  };
}

async function requestAiReview(values: ReviewRequestBody): Promise<ReviewResult> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    throw new Error('未配置 AI_API_KEY、AI_API_BASE_URL 或 AI_MODEL');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              '你是一名严格、专业、表达清晰的高级前端代码审查专家。你必须只返回 JSON。',
          },
          {
            role: 'user',
            content: buildReviewPrompt(values),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 接口请求失败，状态码：${response.status}`);
    }

    const data = (await response.json()) as AiChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI 接口没有返回有效内容');
    }

    return parseAiReviewResult(content);
  } finally {
    clearTimeout(timer);
  }
}

export async function analyzeReviewWithAi(values: ReviewRequestBody): Promise<ReviewResult> {
  if (!hasAiConfig()) {
    return createFallbackReviewResult(values, '未配置 AI 环境变量');
  }

  try {
    return await requestAiReview(values);
  } catch (error) {
    if (getMockFallbackEnabled()) {
      const reason = error instanceof Error ? error.message : 'AI 接口调用失败';
      return createFallbackReviewResult(values, reason);
    }

    throw error;
  }
}