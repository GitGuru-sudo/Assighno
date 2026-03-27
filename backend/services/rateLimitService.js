import { Assignment } from '../models/Assignment.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export const enforceAssignmentRateLimit = async (userId) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [hourCount, dayCount] = await Promise.all([
    Assignment.countDocuments({ user_id: userId, created_at: { $gte: oneHourAgo } }),
    Assignment.countDocuments({ user_id: userId, created_at: { $gte: oneDayAgo } }),
  ]);

  if (hourCount >= env.maxAssignmentsPerHour) {
    throw new HttpError(429, `Hourly limit reached. Maximum ${env.maxAssignmentsPerHour} assignments per hour.`);
  }

  if (dayCount >= env.maxAssignmentsPerDay) {
    throw new HttpError(429, `Daily limit reached. Maximum ${env.maxAssignmentsPerDay} assignments per day.`);
  }
};
