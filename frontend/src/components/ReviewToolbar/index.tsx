import { useState } from 'react';
import { CloseOutlined, GithubOutlined, PlayCircleOutlined, SwapOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Segmented, Space, Tag } from 'antd';
import type { GithubPullRequestCoordinates, PullRequest, ReviewInputMode } from '../../types/review';
import { parseGithubPrUrl } from '../../utils/parseGithubPrUrl';
import './style.css';

interface ReviewToolbarProps {
  pullRequest: PullRequest | null;
  hasFiles: boolean;
  isLoadingPullRequest: boolean;
  isReviewing: boolean;
  onLoadGithub: (coordinates: GithubPullRequestCoordinates) => void;
  onLoadDiff: (diff: string) => void;
  onReview: () => void;
  onCancelReview: () => void;
}

export function ReviewToolbar(props: ReviewToolbarProps) {
  const { pullRequest, hasFiles, isLoadingPullRequest, isReviewing, onLoadGithub, onLoadDiff, onReview, onCancelReview } = props;
  const [mode, setMode] = useState<ReviewInputMode>('github');
  const [prUrl, setPrUrl] = useState('');
  const [diffText, setDiffText] = useState('');
  const [inputOpen, setInputOpen] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);

  const submit = () => {
    setInputError(null);
    if (mode === 'github') {
      const coordinates = parseGithubPrUrl(prUrl);
      if (!coordinates) {
        setInputError('请输入公开 GitHub Pull Request 链接，例如 https://github.com/owner/repo/pull/1');
        return;
      }
      setInputOpen(false);
      onLoadGithub(coordinates);
      return;
    }
    if (!diffText.trim()) {
      setInputError('请粘贴包含文件头与 @@ 变更块的 unified diff。');
      return;
    }
    setInputOpen(false);
    onLoadDiff(diffText);
  };

  return (
    <header className="review-toolbar">
      <div className="review-toolbar__bar">
        <div className="review-toolbar__brand">
          <span className="review-toolbar__mark">CM</span>
          <span>CodeMentor</span>
          <Tag bordered={false}>V2</Tag>
        </div>
        <div className="review-toolbar__context">
          {pullRequest ? (
            <>
              <strong title={pullRequest.title}>{pullRequest.title}</strong>
              <span>{pullRequest.sourceType === 'github'
                ? `${pullRequest.owner}/${pullRequest.repo} #${pullRequest.pullNumber}`
                : `${pullRequest.author} · 本地 Diff`}</span>
            </>
          ) : <span>AI code review workspace</span>}
        </div>
        <Space size={8}>
          <Button icon={<SwapOutlined />} onClick={() => setInputOpen((open) => !open)}>
            {inputOpen ? '收起输入' : '更换输入'}
          </Button>
          {isReviewing && <Button icon={<CloseOutlined />} onClick={onCancelReview}>取消</Button>}
          <Button type="primary" icon={<PlayCircleOutlined />} disabled={!hasFiles} onClick={onReview}>
            {isReviewing ? '重新分析' : '开始 AI Review'}
          </Button>
        </Space>
      </div>

      {inputOpen && (
        <div className="review-toolbar__input-panel">
          <div className="review-toolbar__input-row">
            <Segmented<ReviewInputMode>
              value={mode}
              onChange={(value) => { setMode(value); setInputError(null); }}
              options={[
                { label: 'GitHub PR', value: 'github', icon: <GithubOutlined /> },
                { label: '粘贴 Diff', value: 'diff' },
              ]}
            />
            {mode === 'github' ? (
              <Input value={prUrl} onChange={(event) => setPrUrl(event.target.value)} onPressEnter={submit}
                placeholder="https://github.com/owner/repository/pull/123" allowClear />
            ) : (
              <Input.TextArea value={diffText} onChange={(event) => setDiffText(event.target.value)}
                placeholder="diff --git a/src/App.tsx b/src/App.tsx ..." autoSize={{ minRows: 4, maxRows: 10 }} />
            )}
            <Button type="primary" loading={isLoadingPullRequest} onClick={submit}>
              {mode === 'github' ? '获取变更' : '解析 Diff'}
            </Button>
          </div>
          {inputError && <Alert type="error" showIcon message={inputError} closable onClose={() => setInputError(null)} />}
        </div>
      )}
    </header>
  );
}
