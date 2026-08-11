# CodeMentor V2 性能报告

本报告只记录在相同代码、数据和命令下实际得到的结果。浏览器交互指标尚未在当前无图形化 DevTools 的执行环境中测量，因此不填写推测值。

## 测试环境

- 日期：2026-08-11
- 系统：Windows（Codex 工作区）
- Node.js：v25.9.0
- npm：11.12.1
- Vite：8.0.16，production build
- 数据：固定 fixture，20 个文件、3000 个 DiffLine、50 个 ReviewIssue
- 基础版本：`fd2b362`（Monaco 同步进入主入口）

fixture 位于 `frontend/tests/fixtures/performance.fixture.json`。运行 `npm run fixture:verify` 会自动校验三项数据规模，不能被生产失败流程用作 fallback。开发环境访问 `http://localhost:5173/performance.html` 可进入独立测量页。

## 测量方法

Bundle 使用以下命令；脚本从 `dist/index.html` 定位真实入口，并对相同产物计算原始字节、gzip 字节、全部 JS 字节和 chunk 数量。

```bash
cd frontend
npm run perf:bundle
```

核心交互使用 React DevTools Profiler 和 Chrome Performance：

1. `npm run dev` 后打开 `/performance.html`。
2. 等待 Monaco 初始化完成，清空 Performance entries。
3. React Profiler 开始录制，依次点击第 1、21、41 条 Issue，重复三轮。
4. Chrome Performance 中使用同样步骤；控制台读取 `performance.getEntriesByName('issue-navigation-to-next-paint')`。
5. 每项取三轮中位数，并分别保留 Before 与 After profile。

## Before

`fd2b362` 上执行 `npm run perf:bundle` 的真实结果：

| 指标 | Before |
| --- | ---: |
| 首屏入口 JS（原始） | 4,284,289 bytes |
| 首屏入口 JS（gzip） | 1,127,355 bytes |
| production JS 总量 | 14,095,329 bytes |
| JS chunk 数量 | 92 |

Vite 同时报告主入口 chunk 超过 500 kB。这里的直接原因是 `ReviewWorkspace` 同步导入 `DiffViewer`，后者又同步导入 Monaco、语言能力和 worker 配置；即使用户仍处于 Empty 状态，首屏也承担了编辑器代码。

核心交互渲染耗时：待在带有 React DevTools 的浏览器中手动测量。本环境不编造数值。

## After

优化只针对基线暴露的问题：产品入口通过 `React.lazy` 延迟加载 `DiffViewer`；Monaco 改用只读 Diff 所需的 editor API、editor worker 和有限语言 tokenizer，不再加载 TypeScript/JSON/CSS/HTML 智能提示 worker。性能测量页仍直接复用相同的 `DiffViewer`，不会成为生产业务 fallback。

在相同环境、相同 fixture 和相同 `npm run perf:bundle` 命令下复测：

| 指标 | Before | After | 变化 |
| --- | ---: | ---: | ---: |
| 首屏入口 JS（原始） | 4,284,289 bytes | 591,414 bytes | -86.20% |
| 首屏入口 JS（gzip） | 1,127,355 bytes | 192,600 bytes | -82.92% |
| production JS 总量 | 14,095,329 bytes | 4,587,211 bytes | -67.46% |
| JS chunk 数量 | 92 | 23 | -69 |

Monaco 的编辑器核心现在位于独立异步 chunk，只在用户成功取得或解析 Diff 后下载。Vite 仍会提示大型 chunk：异步 Monaco editor core 以及当前 UI vendor 入口仍超过默认 500 kB；这是真实的剩余限制，没有通过人为调高 warning 阈值隐藏。

核心交互渲染耗时仍需浏览器手动测量；由于没有对应 Before profile，本次不根据 bundle 结果推断交互耗时改善。

## 仍需手动测量

- React DevTools Profiler：文件切换 commit duration、Issue 点击后相关组件的 commit duration。
- Chrome Performance：Issue 点击至下一帧，以及 Monaco reveal/highlight 完成后的主线程活动。
- Lighthouse：本地 production preview 的首屏加载表现。

这些指标必须在同一台机器、同一浏览器版本和相同 profile 步骤下记录后才能写入报告或简历。
