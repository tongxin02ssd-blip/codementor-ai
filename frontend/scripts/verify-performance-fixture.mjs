import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fixture = JSON.parse(readFileSync(resolve('tests/fixtures/performance.fixture.json'), 'utf8'));
const sourceLines = fixture.diffText.split('\n');
const fileCount = sourceLines.filter((line) => line.startsWith('diff --git ')).length;
const diffLineCount = sourceLines.filter((line) =>
  (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-')) &&
  !line.startsWith('+++ ') && !line.startsWith('--- '),
).length;
const issueCount = fixture.reviewResult.issues.length;
const actual = { fileCount, diffLineCount, issueCount };
if (JSON.stringify(actual) !== JSON.stringify(fixture.metadata)) {
  throw new Error(`Fixture mismatch: expected ${JSON.stringify(fixture.metadata)}, received ${JSON.stringify(actual)}`);
}
console.log(JSON.stringify(actual));
