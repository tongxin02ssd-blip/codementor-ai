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

  return `You are a senior software engineer performing a precise code review for any programming language.

Review source: ${source}
Review title: ${values.pullRequest.title}

Return only one valid JSON object. Do not use Markdown fences and do not add fields outside this schema:
{
  "summary": "short review summary",
  "issues": [
    {
      "id": "stable unique issue id",
      "filePath": "exact FILE path from the input",
      "lineNumber": 1,
      "severity": "high | medium | low",
      "title": "concise issue title",
      "description": "why this is a problem",
      "suggestion": "specific fix"
    }
  ]
}

Severity rules:
- high: functional or data errors, security problems, build failures, serious async races, or merge blockers.
- medium: missing error/boundary handling, clear maintainability or type-design problems, performance risks, missing loading/error states, or unreasonable responsibilities.
- low: naming, readability, comments, or local non-blocking structure improvements.

Only report concrete issues supported by the supplied diff. Use the exact filePath. lineNumber should refer to the modified file line whenever possible; for deleted code, use the original line. Do not invent a numeric score or a category field. An empty issues array is valid.

DIFF INPUT
${files}`;
}
