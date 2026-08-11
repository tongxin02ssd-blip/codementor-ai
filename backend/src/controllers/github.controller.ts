import type { Request, Response } from 'express';
import { fetchGithubPullRequest } from '../services/github.service';
import type { ErrorResponse, GithubPullRequestResponse } from '../types/review';
import { AppError, toAppError } from '../utils/AppError';

export async function handleGetGithubPullRequest(
  req: Request<{ owner: string; repo: string; pullNumber: string }, GithubPullRequestResponse | ErrorResponse>,
  res: Response<GithubPullRequestResponse | ErrorResponse>,
) {
  const pullNumber = Number(req.params.pullNumber);
  if (!req.params.owner || !req.params.repo || !Number.isInteger(pullNumber) || pullNumber <= 0) {
    res.status(400).json({ error: { code: 'INVALID_PR', message: 'GitHub Pull Request 参数不正确。', stage: 'github' } });
    return;
  }

  const controller = new AbortController();
  req.once('aborted', () => controller.abort());
  res.once('close', () => { if (!res.writableEnded) controller.abort(); });

  try {
    const result = await fetchGithubPullRequest(req.params.owner, req.params.repo, pullNumber, controller.signal);
    if (!res.headersSent) res.json(result);
  } catch (error) {
    if (res.headersSent) return;
    const appError = toAppError(error, 'github');
    const status = appError instanceof AppError ? appError.status : 500;
    res.status(status === 499 ? 400 : status).json({
      error: { code: appError.code, message: appError.message, stage: appError.stage },
    });
  }
}
