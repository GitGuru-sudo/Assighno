import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const requiredKeys = [
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'OPENROUTER_API_KEY',
];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
}

const parseOrigins = (origins) => {
  if (!origins) {
    return true;
  }

  return origins.split(',').map((origin) => origin.trim());
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8080),
  mongodbUri: process.env.MONGODB_URI,
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat',
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:8080',
  processingIntervalMs: Number(process.env.PROCESSING_INTERVAL_MS ?? 5500),
  deadlineReminderIntervalMs: Number(process.env.DEADLINE_REMINDER_INTERVAL_MS ?? 60 * 60 * 1000),
  maxAssignmentsPerHour: Number(process.env.MAX_ASSIGNMENTS_PER_HOUR ?? 5),
  maxAssignmentsPerDay: Number(process.env.MAX_ASSIGNMENTS_PER_DAY ?? 10),
  botPolling: process.env.BOT_POLLING !== 'false',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
