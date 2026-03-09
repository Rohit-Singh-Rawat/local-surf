import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import { env } from './config/env';
import { configurePassport } from './config/passport';
import { error as errorResponse } from './lib/api-response';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authRoutes } from './modules/auth/auth.routes';
import { healthRoutes } from './modules/health/health.routes';
import { userRoutes } from './modules/user/user.routes';

const app = express();

configurePassport();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(requestLogger);

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((_req, res) => {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
});

app.use(errorHandler);

export { app };
