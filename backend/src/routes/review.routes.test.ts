import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { createServer, type Server } from 'node:http';
import { app } from '../app';

let server: Server;
let baseUrl: string;

async function startAiServer(content: string) {
  const aiServer = createServer((_request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
  aiServer.listen(0);
  await new Promise<void>((resolve) => aiServer.once('listening', resolve));
  const address = aiServer.address() as AddressInfo;
  return { aiServer, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function closeServer(target: Server) {
  await new Promise<void>((resolve, reject) => target.close((error) => error ? reject(error) : resolve()));
}

before(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe('POST /api/reviews', () => {
  const validRequest = {
    pullRequest: { id: 'manual-test', sourceType: 'manual', url: null, owner: null, repo: null,
      pullNumber: null, title: 'Test', author: 'Test', createdAt: new Date(0).toISOString() },
    files: [{ filePath: 'src/test.ts', oldPath: null, changeType: 'modified', language: 'typescript',
      additions: 1, deletions: 1, oldContent: 'const a = 1;', newContent: 'const a = 2;',
      patch: '@@ -1 +1 @@\n-const a = 1;\n+const a = 2;', lines: [] }],
  };

  it('rejects malformed input with a review-stage error', async () => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    const payload = await response.json() as { error: { code: string; stage: string } };
    assert.equal(response.status, 400);
    assert.match(response.headers.get('content-type') ?? '', /application\/json; charset=utf-8/i);
    assert.deepEqual(payload.error, {
      code: 'INVALID_REVIEW_INPUT',
      message: 'Review 请求必须包含有效的 PullRequest 和 DiffFile[]。',
      stage: 'review',
    });
  });

  it('returns an explicit configuration error instead of a Mock result', async () => {
    const previous = [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL];
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_BASE_URL;
    delete process.env.AI_MODEL;
    try {
      const response = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });
      const payload = await response.json() as { error: { code: string } };
      assert.equal(response.status, 503);
      assert.equal(payload.error.code, 'AI_NOT_CONFIGURED');
      assert.equal('issues' in payload, false);
    } finally {
      [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL] = previous;
    }
  });

  it('sends the real Diff to an AI endpoint and validates the structured response', async () => {
    const { aiServer, baseUrl: aiBaseUrl } = await startAiServer(JSON.stringify({
      summary: '发现一个具体问题。',
      issues: [{ id: 'issue-1', filePath: 'src/test.ts', lineNumber: 1, severity: 'medium',
        title: '常量值发生变化', description: '该变更会改变现有行为。', suggestion: '请确认新值符合预期。' }],
    }));
    const previous = [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL];
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_API_BASE_URL = aiBaseUrl;
    process.env.AI_MODEL = 'test-model';
    try {
      const response = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validRequest),
      });
      const payload = await response.json() as { status: string; issues: Array<{ filePath: string; lineNumber: number }> };
      assert.equal(response.status, 200);
      assert.equal(payload.status, 'completed');
      assert.deepEqual(payload.issues[0], {
        id: 'issue-1', filePath: 'src/test.ts', lineNumber: 1, severity: 'medium',
        title: '常量值发生变化', description: '该变更会改变现有行为。', suggestion: '请确认新值符合预期。',
      });
    } finally {
      [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL] = previous;
      await closeServer(aiServer);
    }
  });

  it('rejects an AI review whose user-facing fields are entirely English', async () => {
    const { aiServer, baseUrl: aiBaseUrl } = await startAiServer(JSON.stringify({
      summary: 'One concrete issue found.',
      issues: [{ id: 'issue-1', filePath: 'src/test.ts', lineNumber: 1, severity: 'medium',
        title: 'Changed constant', description: 'The behavior changed.', suggestion: 'Confirm the new value.' }],
    }));
    const previous = [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL];
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_API_BASE_URL = aiBaseUrl;
    process.env.AI_MODEL = 'test-model';
    try {
      const response = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validRequest),
      });
      const payload = await response.json() as { error: { code: string; message: string } };
      assert.equal(response.status, 502);
      assert.equal(payload.error.code, 'AI_RESPONSE_LANGUAGE_INVALID');
      assert.match(payload.error.message, /简体中文/);
    } finally {
      [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL] = previous;
      await closeServer(aiServer);
    }
  });

  it('rejects replacement characters instead of returning corrupted review text', async () => {
    const { aiServer, baseUrl: aiBaseUrl } = await startAiServer(JSON.stringify({
      summary: '审查内容包含损坏字符\uFFFD。',
      issues: [],
    }));
    const previous = [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL];
    process.env.AI_API_KEY = 'test-key';
    process.env.AI_API_BASE_URL = aiBaseUrl;
    process.env.AI_MODEL = 'test-model';
    try {
      const response = await fetch(`${baseUrl}/api/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validRequest),
      });
      const payload = await response.json() as { error: { code: string } };
      assert.equal(response.status, 502);
      assert.equal(payload.error.code, 'AI_RESPONSE_ENCODING_INVALID');
    } finally {
      [process.env.AI_API_KEY, process.env.AI_API_BASE_URL, process.env.AI_MODEL] = previous;
      await closeServer(aiServer);
    }
  });
});
