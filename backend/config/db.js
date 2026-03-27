import mongoose from 'mongoose';

import { env } from './env.js';
import { logInfo } from '../utils/logger.js';

export const connectToDatabase = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  logInfo('Connected to MongoDB Atlas');
};

