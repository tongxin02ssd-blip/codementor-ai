import { describe, expect, it } from 'vitest';
import { DiffParseError, parseUnifiedDiff } from './parseUnifiedDiff';

const MULTI_FILE_DIFF = `diff --git a/src/old.ts b/src/old.ts
index 111..222 100644
--- a/src/old.ts
+++ b/src/old.ts
@@ -10,2 +10,2 @@
-const value = 1;
+const value = 2;
 export default value;
diff --git a/src/new.py b/src/new.py
new file mode 100644
--- /dev/null
+++ b/src/new.py
@@ -0,0 +1,2 @@
+def greet():
+    return "hello"`;

describe('parseUnifiedDiff', () => {
  it('creates stable models for multiple changed files', () => {
    const files = parseUnifiedDiff(MULTI_FILE_DIFF);
    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({ filePath: 'src/old.ts', changeType: 'modified', additions: 1, deletions: 1 });
    expect(files[0].lines[0]).toMatchObject({ type: 'removed', oldLineNumber: 10, newLineNumber: null });
    expect(files[0].lines[1]).toMatchObject({ type: 'added', oldLineNumber: null, newLineNumber: 10 });
    expect(files[0].newContent.split('\n')[9]).toBe('const value = 2;');
    expect(files[1]).toMatchObject({ filePath: 'src/new.py', changeType: 'added', language: 'python' });
  });

  it('rejects text that is not a unified diff', () => {
    expect(() => parseUnifiedDiff('const value = 1;')).toThrow(DiffParseError);
  });
});
