import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { error as errorResponse } from './lib/api-response';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { healthRoutes } from './modules/health/health.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.use('/api/health', healthRoutes);

app.use((_req, res) => {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
});

app.use(errorHandler);

export { app };
