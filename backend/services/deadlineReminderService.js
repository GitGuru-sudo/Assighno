import { env } from '../config/env.js';
import { Assignment } from '../models/Assignment.js';
import { User } from '../models/User.js';
import { buildAssignmentLink } from './telegramService.js';
import { logError, logInfo } from '../utils/logger.js';

let reminderTimer = null;
let reminderStarted = false;
let reminderRunInProgress = false;

const getTodayStart = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const formatDeadline = (deadline) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(deadline);

const shouldSendReminderToday = (assignment, todayStart) => {
  if (!assignment.deadline || assignment.status === 'submitted') {
    return false;
  }

  if (assignment.deadline < new Date()) {
    return false;
  }

  if (assignment.created_at >= todayStart) {
    return false;
  }

  if (assignment.reminder_last_sent_at && assignment.reminder_last_sent_at >= todayStart) {
    return false;
  }

  return true;
};

const buildReminderMessage = (assignment, user) => {
  const displayName = user.display_name || user.telegram_username || user.email.split('@')[0];

  return [
    `Hey ${displayName}, reminder for your assignment.`,
    `Assignment: ${assignment.title}`,
    `Status: ${assignment.status}`,
    `Deadline: ${formatDeadline(assignment.deadline)}`,
    'Mark it submitted or extend the deadline from the dashboard if needed.',
    buildAssignmentLink(assignment._id, env.appBaseUrl),
  ].join('\n');
};

const runReminderCycle = async () => {
  if (reminderRunInProgress) {
    return;
  }

  reminderRunInProgress = true;

  try {
    const { sendTelegramMessage } = await import('../bot/telegramBot.js');
    const todayStart = getTodayStart();
    const assignments = await Assignment.find({
      deadline: { $ne: null, $gte: new Date() },
      status: { $in: ['queued', 'processing', 'completed', 'failed'] },
    }).sort({ deadline: 1 });

    for (const assignment of assignments) {
      if (!shouldSendReminderToday(assignment, todayStart)) {
        continue;
      }

      const user = await User.findById(assignment.user_id);

      if (!user?.telegram_id) {
        continue;
      }

      const sent = await sendTelegramMessage(user.telegram_id, buildReminderMessage(assignment, user));

      if (!sent) {
        continue;
      }

      assignment.reminder_last_sent_at = new Date();
      await assignment.save();
      logInfo('Deadline reminder sent', { assignmentId: assignment._id });
    }
  } catch (error) {
    logError('Failed to run deadline reminders', error);
  } finally {
    reminderRunInProgress = false;
  }
};

export const startDeadlineReminders = () => {
  if (reminderStarted) {
    return;
  }

  reminderStarted = true;
  logInfo('Deadline reminder service started', { intervalMs: env.deadlineReminderIntervalMs });

  runReminderCycle().catch((error) => {
    logError('Initial deadline reminder cycle failed', error);
  });

  reminderTimer = setInterval(() => {
    runReminderCycle().catch((error) => {
      logError('Scheduled deadline reminder cycle failed', error);
    });
  }, env.deadlineReminderIntervalMs);
};
