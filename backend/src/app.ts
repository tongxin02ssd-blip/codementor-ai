import cors from 'cors';
import express from 'express';
import { healthRouter } from './routes/health.routes';
import { githubRouter } from './routes/github.routes';
import { reviewRouter } from './routes/review.routes';

export const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);

app.use(express.json({ limit: '5mb' }));

app.use(healthRouter);
app.use(githubRouter);
app.use(reviewRouter);
