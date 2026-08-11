# CodeMentor V2 API

错误统一返回：

```json
{
  "error": {
    "code": "GITHUB_PR_NOT_FOUND",
    "message": "未找到公开仓库或 Pull Request。",
    "stage": "github"
  }
}
```

## `GET /health`

返回后端健康状态。

## `GET /api/github/pulls/:owner/:repo/:pullNumber`

通过 GitHub API 获取公开 PR 元数据、最多 100 个变更文件、base/head 完整文本和 patch 行映射。可选 `GITHUB_TOKEN` 仅保存在后端。

成功响应：

```json
{
  "pullRequest": {
    "id": "1",
    "sourceType": "github",
    "url": "https://github.com/owner/repo/pull/1",
    "owner": "owner",
    "repo": "repo",
    "pullNumber": 1,
    "title": "PR title",
    "author": "developer",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "baseRef": "main",
    "headRef": "feature"
  },
  "files": ["DiffFile"]
}
```

## `POST /api/reviews`

接收真实 `PullRequest` 与 `DiffFile[]`，构造包含代码变更的 AI Prompt。服务端校验 AI JSON、严重程度、必填字段、Issue id 唯一性和 `filePath` 是否存在。

请求：

```json
{
  "pullRequest": "PullRequest",
  "files": ["DiffFile"]
}
```

成功响应：

```json
{
  "reviewId": "uuid",
  "summary": "Review summary",
  "issues": [
    {
      "id": "issue-1",
      "filePath": "src/App.tsx",
      "lineNumber": 42,
      "severity": "high",
      "title": "Issue title",
      "description": "Why it matters",
      "suggestion": "Concrete fix"
    }
  ],
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "status": "completed"
}
```

没有 AI 配置、上游失败、超时、返回格式错误或请求取消都会返回真实错误；不存在 Mock fallback。
