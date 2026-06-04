import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'codementor-ai-backend',
    message: 'Backend service is running',
    timestamp: new Date().toISOString(),
  });
});