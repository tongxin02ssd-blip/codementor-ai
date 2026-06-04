import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { healthRouter } from './routes/health.routes';

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);

app.use(express.json());

app.use(healthRouter);

app.listen(PORT, () => {
  console.log(`CodeMentor AI backend is running at http://localhost:${PORT}`);
});