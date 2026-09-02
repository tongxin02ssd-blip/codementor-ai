import { Alert, Button, Empty, Skeleton, Tag } from 'antd';
import type { ReviewIssue, ReviewResult, ReviewSeverity } from '../../types/review';
import { splitReviewText } from '../../utils/reviewText';
import './style.css';

interface ReviewPanelProps {
  result: ReviewResult | null;
  isLoading: boolean;
  error: string | null;
  activeIssueId: string | null;
  onIssueSelect: (issue: ReviewIssue) => void;
  onRetry: () => void;
}

const severityConfig: Record<ReviewSeverity, { label: string; color: string }> = {
  high: { label: 'High', color: 'red' },
  medium: { label: 'Medium', color: 'orange' },
  low: { label: 'Low', color: 'default' },
};

function ReviewText({ value }: { value: string }) {
  return splitReviewText(value).map((segment, index) => segment.type === 'code'
    ? <code className="review-inline-code" key={`${segment.type}-${index}`}>{segment.value}</code>
    : segment.value);
}

export function ReviewPanel({ result, isLoading, error, activeIssueId, onIssueSelect, onRetry }: ReviewPanelProps) {
  return (
    <aside className="review-panel" aria-label="Review Issues">
      <div className="panel-heading">
        <div><strong>Review issues</strong><span>{result ? `${result.issues.length} 个问题` : '等待分析'}</span></div>
      </div>
      <div className="review-panel__body">
        {isLoading && (
          <div className="review-panel__loading">
            <span className="status-dot status-dot--running" />
            <strong>AI 正在分析变更</strong>
            <span>你仍然可以浏览和切换 Diff 文件。</span>
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          </div>
        )}
        {!isLoading && error && (
          <Alert type="error" showIcon message="AI Review 失败" description={error}
            action={<Button size="small" onClick={onRetry}>重试</Button>} />
        )}
        {!isLoading && !error && !result && (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Diff 已就绪，点击顶部“开始 AI Review”" />
        )}
        {!isLoading && result && (
          <>
            <section className="review-panel__summary">
              <strong>Review summary</strong>
              <p><ReviewText value={result.summary} /></p>
            </section>
            {result.issues.length === 0 ? (
              <Alert type="success" showIcon message="未发现明确问题" description="AI 没有在本次变更中识别出可定位的 Review Issue。" />
            ) : (
              <div className="review-panel__issues">
                {result.issues.map((issue) => {
                  const severity = severityConfig[issue.severity];
                  return (
                    <button key={issue.id} type="button"
                      className={`issue-card issue-card--${issue.severity}${activeIssueId === issue.id ? ' issue-card--active' : ''}`}
                      aria-pressed={activeIssueId === issue.id}
                      onClick={() => onIssueSelect(issue)}>
                      <div className="issue-card__header"><Tag color={severity.color}>{severity.label}</Tag><strong><ReviewText value={issue.title} /></strong></div>
                      <code className="issue-card__location" title={`${issue.filePath}:${issue.lineNumber}`}>{issue.filePath}:{issue.lineNumber}</code>
                      <p className="issue-card__description"><ReviewText value={issue.description} /></p>
                      <div className="issue-card__suggestion"><strong>建议</strong><p><ReviewText value={issue.suggestion} /></p></div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
