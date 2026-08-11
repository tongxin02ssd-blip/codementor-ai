import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parsePatchLines } from './parsePatch';

describe('parsePatchLines', () => {
  it('maps context, removed, and added lines to original and modified line numbers', () => {
    const lines = parsePatchLines('@@ -10,2 +10,2 @@\n-old\n+new\n context', 'src/value.ts');
    assert.deepEqual(lines.map(({ type, oldLineNumber, newLineNumber }) => ({ type, oldLineNumber, newLineNumber })), [
      { type: 'removed', oldLineNumber: 10, newLineNumber: null },
      { type: 'added', oldLineNumber: null, newLineNumber: 10 },
      { type: 'context', oldLineNumber: 11, newLineNumber: 11 },
    ]);
  });
});
