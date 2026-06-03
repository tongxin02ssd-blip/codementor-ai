# codementor-ai
AI-powered Pull Request review assistant for frontend beginners

# CodeMentor AI

## 项目简介

CodeMentor AI 是一个面向前端新人和小团队开发者的 AI PR Review 助手。

用户可以输入 GitHub Pull Request 链接或粘贴代码 diff 文本，系统会对代码变更进行分析，并生成结构化的 Review 建议，包括变更摘要、潜在风险、优化建议和合并建议。

## 赛题方向

AI PR Review 助手。

## 目标用户

- 前端实习生
- 刚开始参与 GitHub 协作的新手开发者
- 小团队开发者
- 课程项目或比赛项目成员

## 核心功能规划

- 输入 GitHub PR 链接
- 支持手动粘贴 diff 文本
- 生成 PR 变更摘要
- 生成代码风险提示
- 生成优化建议
- 给出是否建议合并的判断
- 支持 loading、error 和 empty 状态
- 支持 README 和 demo 视频展示

## 技术栈

### 前端

- React
- TypeScript
- Vite
- Ant Design
- Zustand
- Axios

### 后端规划

- Node.js
- Express
- TypeScript

### AI 能力规划

- 大模型 API
- Mock Review 降级方案
