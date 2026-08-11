import { Router } from 'express';
import { handleReviewAnalyze } from '../controllers/review.controller';

export const reviewRouter = Router();
reviewRouter.post('/api/reviews', handleReviewAnalyze);
