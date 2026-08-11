import type { ChangeType, DiffFile, DiffLine } from '../types/review';
import { detectLanguage } from './language';

const HUNK_HEADER_PATTERN = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export class DiffParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiffParseError';
  }
}

function decodeGitPath(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function normalizePath(value: string | undefined) {
  if (!value) return null;
  const decoded = decodeGitPath(value.split('\t')[0]);
  if (decoded === '/dev/null') return null;
  return decoded.replace(/^[ab]\//, '');
}

function getHeaderPaths(header: string) {
  const match = /^diff --git (.+) (.+)$/.exec(header);
  return match
    ? { oldPath: normalizePath(match[1]), newPath: normalizePath(match[2]) }
    : { oldPath: null, newPath: null };
}

function setContentLine(content: string[], lineNumber: number, value: string) {
  while (content.length < lineNumber - 1) content.push('');
  content[lineNumber - 1] = value;
}

function getChangeType(segment: string[], oldPath: string | null, newPath: string | null): ChangeType {
  if (segment.some((line) => line.startsWith('new file mode')) || !oldPath) return 'added';
  if (segment.some((line) => line.startsWith('deleted file mode')) || !newPath) return 'deleted';
  if (segment.some((line) => line.startsWith('rename from '))) return 'renamed';
  return 'modified';
}

function parseSegment(segment: string[], index: number): DiffFile {
  const headerPaths = getHeaderPaths(segment[0] ?? '');
  const oldMarker = segment.find((line) => line.startsWith('--- '));
  const newMarker = segment.find((line) => line.startsWith('+++ '));
  const renamedFrom = segment.find((line) => line.startsWith('rename from '));
  const renamedTo = segment.find((line) => line.startsWith('rename to '));
  const oldPath = normalizePath(
    renamedFrom?.slice('rename from '.length) ?? oldMarker?.slice(4) ?? headerPaths.oldPath ?? undefined,
  );
  const newPath = normalizePath(
    renamedTo?.slice('rename to '.length) ?? newMarker?.slice(4) ?? headerPaths.newPath ?? undefined,
  );
  const filePath = newPath ?? oldPath ?? `manual-change-${index + 1}.diff`;
  const changeType = getChangeType(segment, oldPath, newPath);
  const oldContent: string[] = [];
  const newContent: string[] = [];
  const lines: DiffLine[] = [];
  let oldLineNumber = 0;
  let newLineNumber = 0;
  let hunkIndex = 0;

  for (const rawLine of segment) {
    const hunkMatch = HUNK_HEADER_PATTERN.exec(rawLine);
    if (hunkMatch) {
      oldLineNumber = Number(hunkMatch[1]);
      newLineNumber = Number(hunkMatch[3]);
      hunkIndex += 1;
      continue;
    }
    if (hunkIndex === 0 || rawLine === '\\ No newline at end of file') continue;

    const prefix = rawLine[0];
    const content = rawLine.slice(1);
    if (prefix === ' ') {
      setContentLine(oldContent, oldLineNumber, content);
      setContentLine(newContent, newLineNumber, content);
      lines.push({ lineId: `${filePath}:${hunkIndex}:${lines.length}`, type: 'context', oldLineNumber, newLineNumber, content, rawContent: rawLine });
      oldLineNumber += 1;
      newLineNumber += 1;
    } else if (prefix === '-') {
      setContentLine(oldContent, oldLineNumber, content);
      lines.push({ lineId: `${filePath}:${hunkIndex}:${lines.length}`, type: 'removed', oldLineNumber, newLineNumber: null, content, rawContent: rawLine });
      oldLineNumber += 1;
    } else if (prefix === '+') {
      setContentLine(newContent, newLineNumber, content);
      lines.push({ lineId: `${filePath}:${hunkIndex}:${lines.length}`, type: 'added', oldLineNumber: null, newLineNumber, content, rawContent: rawLine });
      newLineNumber += 1;
    }
  }

  const isBinary = segment.some((line) => line.startsWith('Binary files '));
  return {
    filePath,
    oldPath: oldPath === filePath ? null : oldPath,
    changeType,
    language: detectLanguage(filePath),
    additions: lines.filter((line) => line.type === 'added').length,
    deletions: lines.filter((line) => line.type === 'removed').length,
    oldContent: isBinary ? 'Binary file cannot be displayed.' : oldContent.join('\n'),
    newContent: isBinary ? 'Binary file cannot be displayed.' : newContent.join('\n'),
    patch: segment.join('\n'),
    lines,
  };
}

export function parseUnifiedDiff(diffText: string): DiffFile[] {
  const normalizedText = diffText.replace(/\r\n?/g, '\n').trim();
  if (!normalizedText) throw new DiffParseError('Diff 内容为空，请粘贴标准 unified diff。');

  const sourceLines = normalizedText.split('\n');
  const segmentStarts = sourceLines.reduce<number[]>((starts, line, index) => {
    if (line.startsWith('diff --git ')) starts.push(index);
    return starts;
  }, []);
  const hasUnifiedMarkers = sourceLines.some((line) => line.startsWith('--- ')) && sourceLines.some((line) => line.startsWith('+++ '));
  const hasHunk = sourceLines.some((line) => HUNK_HEADER_PATTERN.test(line));

  if (segmentStarts.length === 0) {
    if (!hasUnifiedMarkers || !hasHunk) {
      throw new DiffParseError('无法识别 Diff 格式，请确认内容包含文件头和 @@ 变更块。');
    }
    segmentStarts.push(0);
  }

  const files = segmentStarts.map((start, index) => parseSegment(
    sourceLines.slice(start, segmentStarts[index + 1] ?? sourceLines.length),
    index,
  ));
  if (files.every((file) => file.lines.length === 0 && file.changeType !== 'renamed')) {
    throw new DiffParseError('Diff 中没有可展示的代码变更行。');
  }
  return files;
}
