import type { ReviewRequestBody } from '../types/review';

function getInputSource(values: ReviewRequestBody) {
  if (values.inputType === 'prUrl' && values.prInfo) {
    return `GitHub PR：${values.prInfo.owner}/${values.prInfo.repo}#${values.prInfo.pullNumber}`;
  }

  if (values.inputType === 'prUrl') {
    return `GitHub PR：${values.prUrl}`;
  }

  return `Diff 文本：${values.diffText}`;
}

export function buildReviewPrompt(values: ReviewRequestBody) {
  const inputSource = getInputSource(values);

  return `
你是一名有 10 年经验的高级前端工程师，请你对下面的 Pull Request 或 diff 内容进行代码 Review。

请重点从以下角度分析：
1. 本次改动的主要内容
2. 潜在风险
3. 前端工程质量
4. React 组件职责
5. TypeScript 类型清晰度
6. loading、error、empty 等状态处理
7. 是否建议合并

输入内容：
${inputSource}

请严格返回 JSON，不要返回 Markdown，不要返回多余解释。

JSON 格式必须如下：

{
  "summary": "用中文总结本次 PR 的主要改动",
  "risks": [
    {
      "id": "risk-1",
      "level": "low | medium | high",
      "title": "风险标题",
      "description": "风险说明"
    }
  ],
  "suggestions": [
    "优化建议 1",
    "优化建议 2"
  ],
  "mergeAdvice": "是否建议合并，以及原因",
  "generatedAt": "由后端生成，不需要你填写"
}
`;
}