import express from 'express';
import cors from 'cors';

import { connectToDatabase } from './config/db.js';
import { env } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './utils/http.js';
import { startProcessor } from './services/assignmentProcessor.js';
import { startDeadlineReminders } from './services/deadlineReminderService.js';
import { startTelegramBot } from './bot/telegramBot.js';
import { logInfo } from './utils/logger.js';

const bootstrap = async () => {
  await connectToDatabase();

  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));

  registerRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  startProcessor();
  const bot = startTelegramBot();
  startDeadlineReminders();

  app.listen(env.port, () => {
    logInfo(`API server listening on port ${env.port}`);
  });

  process.on('SIGTERM', async () => {
    logInfo('Received SIGTERM. Closing services.');
    await Promise.allSettled([bot?.stopPolling?.()]);
    process.exit(0);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});
