import { Router } from 'express';
import { handleGetGithubPullRequest } from '../controllers/github.controller';

export const githubRouter = Router();
githubRouter.get('/api/github/pulls/:owner/:repo/:pullNumber', handleGetGithubPullRequest);
