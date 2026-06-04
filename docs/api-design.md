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