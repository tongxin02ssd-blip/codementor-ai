import { useState } from 'react';
import { DiffViewer } from '../components/DiffViewer';
import { FileExplorer } from '../components/FileExplorer';
import { ReviewPanel } from '../components/ReviewPanel';
import type { ReviewIssue, ReviewResult } from '../types/review';
import { parseUnifiedDiff } from '../utils/parseUnifiedDiff';
import fixture from '../../tests/fixtures/performance.fixture.json';

const files = parseUnifiedDiff(fixture.diffText);
const result = fixture.reviewResult as ReviewResult;

export function PerformanceHarness() {
  const [selectedFilePath, setSelectedFilePath] = useState(files[0].filePath);
  const [selectedIssue, setSelectedIssue] = useState<ReviewIssue | null>(result.issues[0]);
  const selectedFile = files.find((file) => file.filePath === selectedFilePath) ?? files[0];

  const selectIssue = (issue: ReviewIssue) => {
    performance.mark('issue-navigation-start');
    setSelectedIssue(issue);
    setSelectedFilePath(issue.filePath);
    requestAnimationFrame(() => {
      performance.mark('issue-navigation-paint');
      performance.measure('issue-navigation-to-next-paint', 'issue-navigation-start', 'issue-navigation-paint');
    });
  };

  return (
    <div className="performance-harness">
      <div className="performance-harness__notice">
        Performance fixture · 20 files · 3000 Diff lines · 50 Review Issues
      </div>
      <div className="performance-harness__grid">
        <FileExplorer files={files} selectedFilePath={selectedFile.filePath}
          onSelect={(path) => { setSelectedFilePath(path); setSelectedIssue(null); }} />
        <DiffViewer workspaceId="performance-fixture" file={selectedFile} activeIssue={selectedIssue} />
        <ReviewPanel result={result} isLoading={false} error={null} activeIssueId={selectedIssue?.id ?? null}
          onIssueSelect={selectIssue} onRetry={() => undefined} />
      </div>
    </div>
  );
}
