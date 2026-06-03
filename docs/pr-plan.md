# PR 开发计划

## PR 1：初始化项目与工程配置

分支名：chore/init-project

主要内容：

- 创建项目仓库
- 初始化 React + TypeScript + Vite 前端项目
- 安装基础依赖
- 创建 README 初稿
- 创建 docs 文档目录
- 添加 .gitignore

## PR 2：搭建基础页面布局

分支名：feat/base-layout

主要内容：

- 创建首页结构
- 创建页面头部组件
- 使用 Ant Design 搭建基础布局

## PR 3：实现核心输入模块

分支名：feat/pr-input-form

主要内容：

- 实现 PR 链接输入
- 实现 diff 文本输入
- 添加表单校验
- 添加分析按钮

## PR 4：实现 Mock Review 分析流程

分支名：feat/mock-review

主要内容：

- 点击按钮后生成模拟 Review 结果
- 添加 loading 状态
- 定义 Review 数据结构

## PR 5：实现 Review 结果展示模块

分支名：feat/review-result

主要内容：

- 展示变更摘要
- 展示风险点
- 展示优化建议
- 展示合并建议

## PR 6：封装 API 请求逻辑

分支名：feat/frontend-api-service

主要内容：

- 封装 Axios 请求
- 封装 Review Service
- 为后续后端接口做准备

## PR 7：添加状态处理

分支名：feat/status-handling

主要内容：

- loading 状态
- error 状态
- empty 状态
- 按钮禁用逻辑

## PR 8：优化页面样式和交互体验

分支名：style/ui-polish

主要内容：

- 优化页面样式
- 添加风险等级标签
- 添加复制按钮
- 优化响应式展示

## PR 9：初始化后端服务

分支名：chore/init-backend

主要内容：

- 初始化 Express 后端
- 添加 TypeScript 配置
- 添加健康检查接口

## PR 10：实现后端 Review 接口

分支名：feat/backend-review-api

主要内容：

- 创建 /api/review 接口
- 返回 Mock Review 数据
- 统一前后端数据结构

## PR 11：前后端联调

分支名：feat/frontend-backend-integration

主要内容：

- 前端调用后端 Review API
- 替换前端 Mock 请求
- 处理接口错误

## PR 12：支持 GitHub PR 链接解析

分支名：feat/github-pr-parser

主要内容：

- 解析 GitHub PR URL
- 获取 owner、repo、pullNumber
- 展示 PR 基本信息

## PR 13：接入 AI Review 能力

分支名：feat/ai-review

主要内容：

- 构造 Review Prompt
- 调用大模型 API
- 返回结构化 Review 建议
- 添加失败降级逻辑

## PR 14：补充 README 文档

分支名：docs/readme

主要内容：

- 补充项目介绍
- 补充技术栈说明
- 补充启动方式
- 补充 AI 使用说明
- 补充 PR 开发记录

## PR 15：添加 demo 视频链接和最终说明

分支名：docs/demo-video

主要内容：

- 添加 demo 视频链接
- 添加项目截图
- 添加最终提交说明