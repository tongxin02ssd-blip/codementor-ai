import type { ReviewFormValues, ReviewResult } from '../types/review';

export function createMockReviewResult(values: ReviewFormValues): ReviewResult {
  const sourceText =
    values.inputType === 'prUrl'
      ? `GitHub PR：${values.prUrl}`
      : '用户手动粘贴的 diff 文本';

  return {
    summary: `本次分析基于${sourceText}生成。当前 Mock Review 认为，本次代码变更主要涉及前端页面或交互逻辑调整，需要重点关注组件职责、状态处理和异常提示。`,
    risks: [
      {
        id: 'risk-1',
        level: 'medium',
        title: '需要关注 loading 和 error 状态',
        description:
          '如果接口请求或异步分析过程失败，页面需要给用户明确反馈，避免用户误以为系统无响应。',
      },
      {
        id: 'risk-2',
        level: 'low',
        title: '建议保持组件职责单一',
        description:
          '输入表单、结果展示和请求逻辑建议拆分到不同文件中，避免 Home 页面承担过多职责。',
      },
    ],
    suggestions: [
      '建议后续将 Review 请求逻辑封装到 services 目录中。',
      '建议为分析按钮添加 loading 和 disabled 状态。',
      '建议将 Review 结果拆分成摘要、风险点、优化建议和合并建议几个模块展示。',
    ],
    mergeAdvice: '当前 Mock 结果建议：可以继续开发，但在接入真实接口前不建议作为最终版本合并发布。',
    generatedAt: new Date().toISOString(),
  };
}