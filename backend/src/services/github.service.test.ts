import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../utils/AppError';
import { fetchGithubPullRequest } from './github.service';

describe('fetchGithubPullRequest', () => {
  it('maps public PR metadata, file contents, and patch lines', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith('/pulls/7')) {
        return Response.json({ id: 7, html_url: 'https://github.com/acme/repo/pull/7', title: 'Fix value',
          created_at: '2026-01-01T00:00:00.000Z', user: { login: 'dev' },
          base: { ref: 'main', sha: 'base-sha' }, head: { ref: 'fix', sha: 'head-sha' } });
      }
      if (url.includes('/pulls/7/files?')) {
        return Response.json([{ filename: 'src/value.ts', status: 'modified', additions: 1, deletions: 1,
          patch: '@@ -1 +1 @@\n-const value = 1;\n+const value = 2;' }]);
      }
      if (url.includes('/contents/src/value.ts?ref=base-sha')) return new Response('const value = 1;');
      if (url.includes('/contents/src/value.ts?ref=head-sha')) return new Response('const value = 2;');
      throw new Error(`Unexpected GitHub request: ${url}`);
    };
    try {
      const result = await fetchGithubPullRequest('acme', 'repo', 7, new AbortController().signal);
      assert.equal(result.pullRequest.title, 'Fix value');
      assert.equal(result.files.length, 1);
      assert.equal(result.files[0].oldContent, 'const value = 1;');
      assert.equal(result.files[0].newContent, 'const value = 2;');
      assert.equal(result.files[0].lines[1].newLineNumber, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('preserves a specific GitHub not-found error', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json({ message: 'Not Found' }, { status: 404 });
    try {
      await assert.rejects(
        fetchGithubPullRequest('missing', 'repo', 404, new AbortController().signal),
        (error: unknown) => error instanceof AppError && error.code === 'GITHUB_PR_NOT_FOUND' && error.status === 404,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
