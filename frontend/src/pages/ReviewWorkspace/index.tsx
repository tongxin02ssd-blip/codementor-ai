import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Empty, Spin } from 'antd';
import { FileExplorer } from '../../components/FileExplorer';
import { ReviewPanel } from '../../components/ReviewPanel';
import { ReviewToolbar } from '../../components/ReviewToolbar';
import { analyzeReview, fetchGithubPullRequest } from '../../services/reviewService';
import { RequestCancelledError, RequestError } from '../../services/request';
import type {
  GithubPullRequestCoordinates,
  ReviewIssue,
  ReviewRequest,
  ReviewResult,
  ReviewWorkspace,
} from '../../types/review';
import { DiffParseError, parseUnifiedDiff } from '../../utils/parseUnifiedDiff';
import './style.css';

const DiffViewer = lazy(() => import('../../components/DiffViewer').then((module) => ({ default: module.DiffViewer })));

interface ReviewMutationVariables {
  requestId: number;
  request: ReviewRequest;
  signal: AbortSignal;
}

interface ReviewMutationValue {
  requestId: number;
  result: ReviewResult;
}

function sameCoordinates(a: GithubPullRequestCoordinates | null, b: GithubPullRequestCoordinates) {
  return a?.owner === b.owner && a.repo === b.repo && a.pullNumber === b.pullNumber;
}

export function ReviewWorkspacePage() {
  const queryClient = useQueryClient();
  const [githubCoordinates, setGithubCoordinates] = useState<GithubPullRequestCoordinates | null>(null);
  const [manualWorkspace, setManualWorkspace] = useState<ReviewWorkspace | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [activeReviewRequestId, setActiveReviewRequestId] = useState(0);
  const reviewControllerRef = useRef<AbortController | null>(null);
  const latestReviewRequestIdRef = useRef(0);

  const pullRequestQuery = useQuery({
    queryKey: githubCoordinates
      ? ['github-pull', githubCoordinates.owner, githubCoordinates.repo, githubCoordinates.pullNumber]
      : ['github-pull', 'idle'],
    queryFn: ({ signal }) => {
      if (!githubCoordinates) throw new Error('GitHub PR 请求参数为空。');
      return fetchGithubPullRequest(githubCoordinates, signal);
    },
    enabled: Boolean(githubCoordinates),
  });

  const reviewMutation = useMutation<ReviewMutationValue, RequestError, ReviewMutationVariables>({
    mutationFn: async ({ requestId, request, signal }) => ({
      requestId,
      result: await analyzeReview(request, signal),
    }),
    onSettled: (_data, _error, variables) => {
      if (latestReviewRequestIdRef.current === variables.requestId) reviewControllerRef.current = null;
    },
  });

  useEffect(() => () => reviewControllerRef.current?.abort(), []);

  const workspace = manualWorkspace ?? pullRequestQuery.data ?? null;

  const clearReview = () => {
    reviewControllerRef.current?.abort();
    reviewControllerRef.current = null;
    latestReviewRequestIdRef.current += 1;
    setActiveReviewRequestId(latestReviewRequestIdRef.current);
    reviewMutation.reset();
    setSelectedIssueId(null);
  };

  const loadGithub = (coordinates: GithubPullRequestCoordinates) => {
    clearReview();
    setManualError(null);
    setManualWorkspace(null);
    void queryClient.cancelQueries({ queryKey: ['github-pull'] });
    if (sameCoordinates(githubCoordinates, coordinates)) {
      void pullRequestQuery.refetch();
    } else {
      setGithubCoordinates(coordinates);
    }
  };

  const loadDiff = (diffText: string) => {
    clearReview();
    void queryClient.cancelQueries({ queryKey: ['github-pull'] });
    setGithubCoordinates(null);
    setManualError(null);
    try {
      const files = parseUnifiedDiff(diffText);
      const now = new Date().toISOString();
      const nextWorkspace: ReviewWorkspace = {
        pullRequest: {
          id: `manual-${crypto.randomUUID()}`,
          sourceType: 'manual',
          url: null,
          owner: null,
          repo: null,
          pullNumber: null,
          title: `Manual diff · ${files.length} changed files`,
          author: 'Local input',
          createdAt: now,
        },
        files,
      };
      setManualWorkspace(nextWorkspace);
      setSelectedFilePath(files[0]?.filePath ?? '');
    } catch (error) {
      setManualWorkspace(null);
      setManualError(error instanceof DiffParseError ? error.message : 'Diff 解析失败，请检查输入格式。');
    }
  };

  const startReview = () => {
    if (!workspace) return;
    reviewControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = latestReviewRequestIdRef.current + 1;
    latestReviewRequestIdRef.current = requestId;
    reviewControllerRef.current = controller;
    setActiveReviewRequestId(requestId);
    setSelectedIssueId(null);
    reviewMutation.mutate({ requestId, request: workspace, signal: controller.signal });
  };

  const cancelReview = () => {
    reviewControllerRef.current?.abort();
    reviewControllerRef.current = null;
    latestReviewRequestIdRef.current += 1;
    setActiveReviewRequestId(latestReviewRequestIdRef.current);
    reviewMutation.reset();
  };

  const currentReview = reviewMutation.data?.requestId === activeReviewRequestId
    ? reviewMutation.data.result
    : null;
  const isCurrentReviewRequest = reviewMutation.variables?.requestId === activeReviewRequestId;
  const isReviewing = reviewMutation.isPending && isCurrentReviewRequest;
  const reviewError = reviewMutation.isError && isCurrentReviewRequest &&
    !(reviewMutation.error instanceof RequestCancelledError)
    ? reviewMutation.error.message
    : null;
  const activeIssue = currentReview?.issues.find((issue) => issue.id === selectedIssueId) ?? null;
  const selectedFile = workspace?.files.find((file) => file.filePath === selectedFilePath) ?? workspace?.files[0] ?? null;
  const githubError = pullRequestQuery.error instanceof RequestError ? pullRequestQuery.error.message : null;

  const selectIssue = (issue: ReviewIssue) => {
    if (!workspace?.files.some((file) => file.filePath === issue.filePath)) return;
    setSelectedFilePath(issue.filePath);
    setSelectedIssueId(issue.id);
  };

  return (
    <div className="review-workspace-page">
      <ReviewToolbar
        pullRequest={workspace?.pullRequest ?? null}
        hasFiles={Boolean(workspace?.files.length)}
        isLoadingPullRequest={pullRequestQuery.isFetching}
        isReviewing={isReviewing}
        onLoadGithub={loadGithub}
        onLoadDiff={loadDiff}
        onReview={startReview}
        onCancelReview={cancelReview}
      />

      <main className="review-workspace__content">
        {pullRequestQuery.isFetching && !workspace && (
          <div className="workspace-state"><Spin size="large" /><strong>正在获取 GitHub Pull Request</strong><span>读取 PR 信息与多文件变更内容…</span></div>
        )}
        {!pullRequestQuery.isFetching && !workspace && (githubError || manualError) && (
          <div className="workspace-state workspace-state--error">
            <Alert type="error" showIcon message={githubError ? 'GitHub PR 获取失败' : 'Diff 解析失败'}
              description={githubError ?? manualError}
              action={githubError ? <Button size="small" onClick={() => pullRequestQuery.refetch()}>重试</Button> : undefined} />
          </div>
        )}
        {!pullRequestQuery.isFetching && !workspace && !githubError && !manualError && (
          <div className="workspace-state workspace-state--empty">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="输入公开 GitHub PR，或粘贴代码 Diff 开始审查" />
            <p>变更就绪后，你可以逐文件浏览 Diff，并让 AI Issue 直接定位到代码行。</p>
          </div>
        )}
        {workspace && selectedFile && (
          <div className="workspace-grid">
            <FileExplorer files={workspace.files} selectedFilePath={selectedFile.filePath}
              onSelect={(filePath) => { setSelectedFilePath(filePath); setSelectedIssueId(null); }} />
            <Suspense fallback={<div className="editor-loading"><Spin /><span>正在加载 Monaco Diff Editor…</span></div>}>
              <DiffViewer key={workspace.pullRequest.id} workspaceId={workspace.pullRequest.id}
                file={selectedFile} activeIssue={activeIssue} />
            </Suspense>
            <ReviewPanel result={currentReview} isLoading={isReviewing} error={reviewError}
              activeIssueId={selectedIssueId} onIssueSelect={selectIssue} onRetry={startReview} />
          </div>
        )}
      </main>
    </div>
  );
}
