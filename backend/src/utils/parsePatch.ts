import type { DiffLine } from '../types/review';

const HUNK_HEADER_PATTERN = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parsePatchLines(patch: string, filePath: string): DiffLine[] {
  const result: DiffLine[] = [];
  let oldLineNumber = 0;
  let newLineNumber = 0;
  let hunkIndex = 0;

  for (const rawContent of patch.replace(/\r\n?/g, '\n').split('\n')) {
    const hunk = HUNK_HEADER_PATTERN.exec(rawContent);
    if (hunk) {
      oldLineNumber = Number(hunk[1]);
      newLineNumber = Number(hunk[2]);
      hunkIndex += 1;
      continue;
    }
    if (!hunkIndex || rawContent === '\\ No newline at end of file') continue;

    const marker = rawContent[0];
    const content = rawContent.slice(1);
    if (marker === ' ') {
      result.push({ lineId: `${filePath}:${hunkIndex}:${result.length}`, type: 'context', oldLineNumber, newLineNumber, content, rawContent });
      oldLineNumber += 1;
      newLineNumber += 1;
    } else if (marker === '-') {
      result.push({ lineId: `${filePath}:${hunkIndex}:${result.length}`, type: 'removed', oldLineNumber, newLineNumber: null, content, rawContent });
      oldLineNumber += 1;
    } else if (marker === '+') {
      result.push({ lineId: `${filePath}:${hunkIndex}:${result.length}`, type: 'added', oldLineNumber: null, newLineNumber, content, rawContent });
      newLineNumber += 1;
    }
  }
  return result;
}
