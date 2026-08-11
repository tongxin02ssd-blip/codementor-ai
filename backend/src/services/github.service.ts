import type { ChangeType, DiffFile, GithubPullRequestResponse } from '../types/review';
import { AppError } from '../utils/AppError';
import { parsePatchLines } from '../utils/parsePatch';

const GITHUB_API_BASE_URL = 'https://api.github.com';
const MAX_FILES = 100;
const CONTENT_CONCURRENCY = 6;

interface GithubPullResponse {
  id: number;
  html_url: string;
  title: string;
  created_at: string;
  user: { login: string };
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
}

interface GithubFileResponse {
  filename: string;
  previous_filename?: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

function githubHeaders(accept = 'application/vnd.github+json') {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'CodeMentor-AI-V2',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, {
    headers: githubHeaders(),
    signal,
  });
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json() as { message?: string };
      detail = payload.message ? ` ${payload.message}` : '';
    } catch {
      // GitHub may return a non-JSON gateway response.
    }
    if (response.status === 404) {
      throw new AppError(404, 'GITHUB_PR_NOT_FOUND', `未找到公开仓库或 Pull Request。${detail}`.trim(), 'github');
    }
    if (response.status === 403 || response.status === 429) {
      throw new AppError(429, 'GITHUB_RATE_LIMITED', `GitHub API 请求受限，请稍后重试或配置 GITHUB_TOKEN。${detail}`.trim(), 'github');
    }
    throw new AppError(502, 'GITHUB_API_FAILED', `GitHub API 请求失败（${response.status}）。${detail}`.trim(), 'github');
  }
  return response.json() as Promise<T>;
}

function encodeGithubPath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

async function githubFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string,
  signal: AbortSignal,
) {
  const response = await fetch(
    `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeGithubPath(path)}?ref=${encodeURIComponent(ref)}`,
    { headers: githubHeaders('application/vnd.github.raw+json'), signal },
  );
  if (!response.ok) {
    throw new AppError(
      response.status === 404 ? 404 : 502,
      'GITHUB_CONTENT_FAILED',
      `无法读取 ${path} 在 ${ref.slice(0, 8)} 版本的内容（GitHub ${response.status}）。`,
      'github',
    );
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const binarySample = bytes.subarray(0, Math.min(bytes.length, 8_192));
  if (binarySample.includes(0)) return 'Binary file cannot be displayed.';
  return new TextDecoder().decode(bytes);
}

function toChangeType(status: string): ChangeType {
  if (status === 'added') return 'added';
  if (status === 'removed') return 'deleted';
  if (status === 'renamed') return 'renamed';
  return 'modified';
}

function detectLanguage(filePath: string) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    c: 'c', cc: 'cpp', cpp: 'cpp', cs: 'csharp', css: 'css', go: 'go', html: 'html',
    java: 'java', js: 'javascript', json: 'json', jsx: 'javascript', kt: 'kotlin', md: 'markdown',
    php: 'php', py: 'python', rb: 'ruby', rs: 'rust', scss: 'scss', sh: 'shell', sql: 'sql',
    ts: 'typescript', tsx: 'typescript', vue: 'html', xml: 'xml', yaml: 'yaml', yml: 'yaml',
  };
  return (extension && languages[extension]) || 'plaintext';
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function fetchFiles(owner: string, repo: string, pullNumber: number, signal: AbortSignal) {
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}/files?per_page=${MAX_FILES}`;
  const files = await githubJson<GithubFileResponse[]>(path, signal);
  if (files.length === MAX_FILES) {
    const overflow = await githubJson<GithubFileResponse[]>(`${path}&page=2`, signal);
    if (overflow.length > 0) {
      throw new AppError(413, 'GITHUB_PR_TOO_LARGE', `当前版本最多处理 ${MAX_FILES} 个变更文件。`, 'github');
    }
  }
  return files;
}

export async function fetchGithubPullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  signal: AbortSignal,
): Promise<GithubPullRequestResponse> {
  const pullPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls/${pullNumber}`;
  const pull = await githubJson<GithubPullResponse>(pullPath, signal);
  const githubFiles = await fetchFiles(owner, repo, pullNumber, signal);

  const files = await mapWithConcurrency(githubFiles, CONTENT_CONCURRENCY, async (file): Promise<DiffFile> => {
    const changeType = toChangeType(file.status);
    const oldPath = file.previous_filename ?? file.filename;
    const [oldContent, newContent] = await Promise.all([
      changeType === 'added' ? Promise.resolve('') : githubFileContent(owner, repo, oldPath, pull.base.sha, signal),
      changeType === 'deleted' ? Promise.resolve('') : githubFileContent(owner, repo, file.filename, pull.head.sha, signal),
    ]);
    const patch = file.patch ?? '';
    return {
      filePath: file.filename,
      oldPath: oldPath === file.filename ? null : oldPath,
      changeType,
      language: detectLanguage(file.filename),
      additions: file.additions,
      deletions: file.deletions,
      oldContent,
      newContent,
      patch,
      lines: parsePatchLines(patch, file.filename),
    };
  });

  return {
    pullRequest: {
      id: String(pull.id),
      sourceType: 'github',
      url: pull.html_url,
      owner,
      repo,
      pullNumber,
      title: pull.title,
      author: pull.user.login,
      createdAt: pull.created_at,
      baseRef: pull.base.ref,
      headRef: pull.head.ref,
    },
    files,
  };
}
