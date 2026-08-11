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

const issues = Array.from({ length: 50 }, (_, index) => ({
  id: `fixture-issue-${String(index + 1).padStart(2, '0')}`,
  filePath: `src/performance/module-${String((index % 20) + 1).padStart(2, '0')}.ts`,
  lineNumber: 51 + (index % 50),
  severity: index % 7 === 0 ? 'high' : index % 3 === 0 ? 'medium' : 'low',
  title: `Fixture review issue ${index + 1}`,
  description: 'Deterministic review issue used only by the performance measurement harness.',
  suggestion: 'Update the selected changed line and verify the Monaco file switch and highlight.',
}));

const fixture = {
  metadata: { fileCount: 20, diffLineCount: 3000, issueCount: 50 },
  diffText: diffParts.join('\n'),
  reviewResult: {
    reviewId: 'performance-fixture-review',
    summary: 'Fixed performance fixture for repeatable file switching and issue navigation measurements.',
    issues,
    generatedAt: '2026-01-01T00:00:00.000Z',
    status: 'completed',
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
console.log(`Generated ${outputPath}`);
