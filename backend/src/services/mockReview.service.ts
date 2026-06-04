import type { ReviewRequestBody, ReviewResult } from '../types/review';

function getReviewSourceText(values: ReviewRequestBody) {
  if (values.inputType === 'prUrl' && values.prInfo) {
    return `GitHub PR：${values.prInfo.owner}/${values.prInfo.repo}#${values.prInfo.pullNumber}`;
  }

  if (values.inputType === 'prUrl') {
    return `GitHub PR：${values.prUrl}`;
  }

  return '用户手动粘贴的 diff 文本';
}

export function createBackendMockReviewResult(values: ReviewRequestBody): ReviewResult {
  const sourceText = getReviewSourceText(values);

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
          '当前接口已经具备后端返回能力，但 Review 内容仍来自 Mock 数据，后续需要接入真实 GitHub API 或大模型 API。',
      },
    ],
    suggestions: [
      '建议后续在后端根据 owner、repo 和 pullNumber 调用 GitHub API 获取真实 PR 变更。',
      '建议后续在后端统一处理 GitHub API 和大模型 API 调用，避免密钥暴露在前端。',
      '建议继续保持请求参数和响应结果的 TypeScript 类型清晰。',
    ],
    mergeAdvice: '当前已支持 PR 链接解析，可作为后续 GitHub API 接入的基础。',
    generatedAt: new Date().toISOString(),
  };
}