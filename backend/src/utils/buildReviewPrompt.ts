import type { DiffFile, ReviewRequestBody } from '../types/review';

function serializeFile(file: DiffFile) {
  const diff = file.patch.trim() || [
    '--- ORIGINAL',
    file.oldContent,
    '+++ MODIFIED',
    file.newContent,
  ].join('\n');
  return [
    `FILE: ${file.filePath}`,
    `CHANGE: ${file.changeType} (+${file.additions} -${file.deletions})`,
    diff,
  ].join('\n');
}

export function buildReviewPrompt(values: ReviewRequestBody) {
  const source = values.pullRequest.sourceType === 'github'
    ? `${values.pullRequest.owner}/${values.pullRequest.repo}#${values.pullRequest.pullNumber}`
    : 'manual unified diff';
  const files = values.files.map(serializeFile).join('\n\n===== NEXT FILE =====\n\n');

  return `你是一名资深软件工程师，正在对任意编程语言进行严谨、可定位的代码审查。

审查来源：${source}
审查标题：${values.pullRequest.title}

语言要求（最高优先级）：
- 除源代码、文件路径、函数名、类名、变量名、API 名称、技术专有名词和必须保留的英文代码标识符外，所有面向用户的审查说明必须使用自然、清晰的简体中文。
- summary、每个 issue 的 title、description 和 suggestion 都必须包含简体中文表达，禁止整句或整段仅使用英文。
- React、TypeScript、AbortController、TanStack Query、Monaco Editor、URL、API 等技术名称可以保留英文，不要强行翻译。
- severity 必须保持 high、medium、low；filePath 必须保持输入中的原始路径；lineNumber 必须保持数字。
- 即使源代码、注释、提交标题或 Diff 内容使用英文，审查结论仍必须使用简体中文。
- 输出必须是有效 Unicode 文本，不得包含乱码或 Unicode replacement character。
- description 优先解释问题和影响，不要把长代码或长正则表达式直接混在中文句子中。
- suggestion 如需给出正则表达式、代码片段或命令，必须使用一对反引号包裹技术片段，例如 \`/^example\\.com$/\`；反引号外继续使用自然的简体中文，并在中英文之间保留合理空格。

只返回一个有效 JSON 对象，不要使用 Markdown 代码围栏，也不要添加此结构以外的字段：
{
  "summary": "简短的中文审查摘要",
  "issues": [
    {
      "id": "stable-unique-issue-id",
      "filePath": "输入中完全一致的 FILE 路径",
      "lineNumber": 1,
      "severity": "high | medium | low",
      "title": "简洁的中文问题标题",
      "description": "用中文说明问题及其影响",
      "suggestion": "用中文给出具体修复建议"
    }
  ]
}

severity 规则：
- high：可能导致功能错误、数据错误、安全问题、构建失败、严重异步竞态或阻塞合并的问题。
- medium：缺少异常处理、边界处理不足、明显可维护性或类型设计问题、明显性能隐患、状态处理遗漏等。
- low：命名、可读性、轻量代码结构优化、注释或其他非阻塞代码质量问题。

只报告由所给 Diff 明确支持的具体问题。filePath 必须完全匹配输入。lineNumber 应尽量指向修改后文件的行；对于已删除代码，使用原文件行号。不要虚构数字评分，不要添加 category 字段。没有明确问题时可以返回空 issues 数组。

语言示例：title 应写成“PR URL 正则校验过于严格”，不要写成“PR URL regex is too restrictive”。description 应写成“当前正则仅接受严格格式的 GitHub PR URL，可能会拒绝包含查询参数的合法链接。”，不要返回整段英文说明。

DIFF INPUT
${files}`;
}
