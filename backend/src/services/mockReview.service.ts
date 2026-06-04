import type { ReviewRequestBody, ReviewResult } from '../types/review';

export function createBackendMockReviewResult(values: ReviewRequestBody): ReviewResult {
  const sourceText =
    values.inputType === 'prUrl'
      ? `GitHub PR：${values.prUrl}`
      : '用户手动粘贴的 diff 文本';

  return {
    summary: `后端 Mock Review 已基于${sourceText}生成。本次代码变更需要重点关注组件职责、状态处理、异常提示和后续接口联调稳定性。`,
    risks: [
      {
        id: 'backend-risk-1',
        level: 'medium',
        title: '需要保证前后端数据结构一致',
        description:
          '前端 ReviewResult 组件依赖 summary、risks、suggestions、mergeAdvice 等字段，后端返回结构需要与前端类型保持一致。',
      },
      {
        id: 'backend-risk-2',
        level: 'low',
        title: '当前仍为 Mock Review 结果',
        description:
          '当前接口已经具备后端返回能力，但 Review 内容仍来自 Mock 数据，后续需要接入真实大模型 API。',
      },
    ],
    suggestions: [
      '建议 PR 11 中将前端 reviewService 从本地 Mock 切换为请求后端 /api/review。',
      '建议后续在后端统一处理 GitHub API 和大模型 API 调用，避免密钥暴露在前端。',
      '建议继续保持请求参数和响应结果的 TypeScript 类型清晰。',
    ],
    mergeAdvice: '当前后端 Mock 接口可以作为联调基础，建议完成前后端联调后再进入真实 AI 能力接入。',
    generatedAt: new Date().toISOString(),
  };
}