import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import type { DiffFile, ReviewIssue } from '../../types/review';
import './style.css';

type MonacoModelPair = {
  original: monaco.editor.ITextModel;
  modified: monaco.editor.ITextModel;
};

type MonacoEnvironment = {
  getWorker: (moduleId: string, label: string) => Worker;
};

(self as unknown as { MonacoEnvironment: MonacoEnvironment }).MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  },
};

interface DiffViewerProps {
  workspaceId: string;
  file: DiffFile;
  activeIssue: ReviewIssue | null;
}

export function DiffViewer({ workspaceId, file, activeIssue }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const modelsRef = useRef(new Map<string, MonacoModelPair>());
  const decorationsRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const models = modelsRef.current;
    editorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
      automaticLayout: true,
      fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, monospace',
      fontSize: 13,
      lineHeight: 20,
      minimap: { enabled: false },
      renderSideBySide: true,
      renderOverviewRuler: true,
      readOnly: true,
      originalEditable: false,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      ignoreTrimWhitespace: false,
      glyphMargin: true,
      padding: { top: 8, bottom: 8 },
    });
    return () => {
      decorationsRef.current?.clear();
      editorRef.current?.dispose();
      models.forEach(({ original, modified }) => {
        original.dispose();
        modified.dispose();
      });
      models.clear();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    let models = modelsRef.current.get(file.filePath);
    if (!models) {
      const encodedPath = encodeURIComponent(file.filePath);
      const originalUri = monaco.Uri.parse(`codementor://workspace/${workspaceId}/original/${encodedPath}`);
      const modifiedUri = monaco.Uri.parse(`codementor://workspace/${workspaceId}/modified/${encodedPath}`);
      models = {
        original: monaco.editor.createModel(file.oldContent, file.language, originalUri),
        modified: monaco.editor.createModel(file.newContent, file.language, modifiedUri),
      };
      modelsRef.current.set(file.filePath, models);
    } else {
      if (models.original.getValue() !== file.oldContent) models.original.setValue(file.oldContent);
      if (models.modified.getValue() !== file.newContent) models.modified.setValue(file.newContent);
      monaco.editor.setModelLanguage(models.original, file.language);
      monaco.editor.setModelLanguage(models.modified, file.language);
    }
    decorationsRef.current?.clear();
    editor.setModel(models);
  }, [file, workspaceId]);

  useEffect(() => {
    const diffEditor = editorRef.current;
    if (!diffEditor) return;
    decorationsRef.current?.clear();
    decorationsRef.current = null;
    if (!activeIssue || activeIssue.filePath !== file.filePath) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    const originalEditor = diffEditor.getOriginalEditor();
    const modifiedModel = modifiedEditor.getModel();
    const originalModel = originalEditor.getModel();
    const useModified = Boolean(file.newContent) && activeIssue.lineNumber <= (modifiedModel?.getLineCount() ?? 0);
    const targetEditor = useModified ? modifiedEditor : originalEditor;
    const targetModel = useModified ? modifiedModel : originalModel;
    if (!targetModel) return;
    const lineNumber = Math.min(Math.max(activeIssue.lineNumber, 1), targetModel.getLineCount());

    decorationsRef.current = targetEditor.createDecorationsCollection([{
      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'review-line-highlight',
        glyphMarginClassName: `review-line-glyph review-line-glyph--${activeIssue.severity}`,
        hoverMessage: { value: `**${activeIssue.title}**\n\n${activeIssue.description}` },
      },
    }]);
    targetEditor.setPosition({ lineNumber, column: 1 });
    targetEditor.revealLineInCenter(lineNumber, monaco.editor.ScrollType.Smooth);
    targetEditor.focus();
  }, [activeIssue, file.filePath, file.newContent]);

  return (
    <section className="diff-viewer">
      <div className="diff-viewer__heading">
        <div><strong>{file.filePath}</strong>{file.oldPath && <span>renamed from {file.oldPath}</span>}</div>
        <div className="diff-viewer__stats"><b>+{file.additions}</b><i>-{file.deletions}</i><span>{file.language}</span></div>
      </div>
      <div className="diff-viewer__editor" ref={containerRef} />
    </section>
  );
}
