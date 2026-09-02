import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ReviewRequestBody } from '../types/review';
import { buildReviewPrompt } from './buildReviewPrompt';

describe('buildReviewPrompt', () => {
  it('requires Simplified Chinese while preserving identifiers and internal enums', () => {
    const request: ReviewRequestBody = {
      pullRequest: {
        id: 'manual-test', sourceType: 'manual', url: null, owner: null, repo: null,
        pullNumber: null, title: 'Add ReviewForm validation', author: 'Test', createdAt: new Date(0).toISOString(),
      },
      files: [{
        filePath: 'src/ReviewForm.tsx', oldPath: null, changeType: 'modified', language: 'typescript',
        additions: 1, deletions: 1, oldContent: 'const valid = true;', newContent: 'const valid = false;',
        patch: '@@ -1 +1 @@\n-const valid = true;\n+const valid = false;', lines: [],
      }],
    };

    const prompt = buildReviewPrompt(request);
    assert.match(prompt, /summary、每个 issue 的 title、description 和 suggestion 都必须包含简体中文/);
    assert.match(prompt, /severity 必须保持 high、medium、low/);
    assert.match(prompt, /不要添加 category 字段/);
    assert.match(prompt, /React、TypeScript、AbortController/);
    assert.match(prompt, /必须使用一对反引号包裹技术片段/);
    assert.match(prompt, /FILE: src\/ReviewForm\.tsx/);
    assert.match(prompt, /const valid = false/);
  });
});
