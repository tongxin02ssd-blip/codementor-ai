# API 设计文档

## 接口规划

后续项目将设计一个 Review 分析接口。

## POST /api/review

### 功能说明

接收用户输入的 GitHub PR 链接或 diff 文本，返回结构化的 Review 分析结果。

### 请求参数

```json
{
  "inputType": "prUrl",
  "prUrl": "https://github.com/owner/repo/pull/1",
  "prInfo": {
    "owner": "owner",
    "repo": "repo",
    "pullNumber": 1,
    "url": "https://github.com/owner/repo/pull/1"
  },
  "shouldMockError": false
}

## AI Review 说明

后端 `/api/review` 接口会优先尝试读取以下环境变量：

- `AI_API_KEY`
- `AI_API_BASE_URL`
- `AI_MODEL`
- `AI_ENABLE_MOCK_FALLBACK`

如果未配置 AI 相关环境变量，或 AI 接口调用失败，后端会自动降级返回 Mock Review 结果，保证项目仍然可以正常演示。

当前接口返回结构仍保持：

- `summary`
- `risks`
- `suggestions`
- `mergeAdvice`
- `generatedAt`