import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('tests/fixtures/performance.fixture.json');
const diffParts = [];

for (let fileIndex = 1; fileIndex <= 20; fileIndex += 1) {
  const filePath = `src/performance/module-${String(fileIndex).padStart(2, '0')}.ts`;
  const lines = [
    `diff --git a/${filePath} b/${filePath}`,
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    '@@ -1,100 +1,100 @@',
  ];
  for (let line = 1; line <= 50; line += 1) lines.push(` export const stable${line} = ${line};`);
  for (let line = 51; line <= 100; line += 1) lines.push(`-export const changed${line} = "before-${fileIndex}-${line}";`);
  for (let line = 51; line <= 100; line += 1) lines.push(`+export const changed${line} = "after-${fileIndex}-${line}";`);
  diffParts.push(lines.join('\n'));
}

const issues = Array.from({ length: 50 }, (_, index) => {
  const common = {
    id: `fixture-issue-${String(index + 1).padStart(2, '0')}`,
    filePath: `src/performance/module-${String((index % 20) + 1).padStart(2, '0')}.ts`,
    lineNumber: 51 + (index % 50),
    severity: index % 7 === 0 ? 'high' : index % 3 === 0 ? 'medium' : 'low',
  };
  if (index === 0) {
    return {
      ...common,
      title: 'PR URL 正则校验过于严格',
      description: '当前正则 /^https:\\/\\/github\\.com\\/[^/]+\\/[^/]+\\/pull\\/\\d+\\/?$/ 无法匹配带查询参数或锚点的合法 GitHub PR URL。',
      suggestion: '建议优先使用 `new URL(value)` 解析并校验 pathname；如必须使用正则，请将查询参数和锚点声明为可选部分。',
    };
  }
  return {
    ...common,
    title: `性能回归检查问题 ${index + 1}`,
    description: '这是仅用于稳定测量文件切换和问题定位性能的固定审查内容。',
    suggestion: '更新选中的变更行，并验证 Monaco 文件切换和高亮定位是否正常。',
  };
});

const fixture = {
  metadata: { fileCount: 20, diffLineCount: 3000, issueCount: 50 },
  diffText: diffParts.join('\n'),
  reviewResult: {
    reviewId: 'performance-fixture-review',
    summary: '固定性能夹具，用于重复测量文件切换和问题定位，并验证中文与长技术片段的排版。',
    issues,
    generatedAt: '2026-01-01T00:00:00.000Z',
    status: 'completed',
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
