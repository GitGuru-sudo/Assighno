import { Assignment } from '../models/Assignment.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

const formatAssignments = (assignments) => {
  if (!assignments.length) {
    return 'No assignments found.';
  }

  return assignments
    .map((assignment, index) => {
      const deadlineText = assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline';
      return `${index + 1}. ${assignment.title}\nStatus: ${assignment.status}\nDeadline: ${deadlineText}`;
    })
    .join('\n\n');
};

export const buildAssignmentLink = (assignmentId, appBaseUrl) => `${appBaseUrl}/assignments/${assignmentId}`;

export const getUpcomingAssignmentsMessage = async (telegramId) => {
  const user = await User.findOne({ telegram_id: String(telegramId) });

  if (!user) {
    return 'Your Telegram account is not linked yet. Open the dashboard and send your /start CODE command first.';
  }

  const assignments = await Assignment.find({
    user_id: user._id,
    status: { $in: ['queued', 'processing'] },
  })
    .sort({ created_at: -1 })
    .limit(5);

  return formatAssignments(assignments);
};

export const getPastAssignmentsMessage = async (telegramId) => {
  const user = await User.findOne({ telegram_id: String(telegramId) });

  if (!user) {
    return 'Your Telegram account is not linked yet. Open the dashboard and send your /start CODE command first.';
  }

  const assignments = await Assignment.find({
    user_id: user._id,
    status: 'completed',
  })
    .sort({ created_at: -1 })
    .limit(5);

  return formatAssignments(assignments);
};

export const buildCompletionMessage = async (assignmentId, appBaseUrl) => {
  const assignment = await Assignment.findById(assignmentId);
  const questions = await Question.find({ assignment_id: assignmentId }).sort({ created_at: 1 });
  const user = assignment ? await User.findById(assignment.user_id) : null;
  const displayName = user?.display_name || user?.telegram_username || user?.email?.split('@')[0];

  return [
    displayName ? `Hey ${displayName}, your solution is ready!` : 'Your solution is ready!',
    assignment ? `Assignment: ${assignment.title}` : null,
    assignment?.deadline ? `Deadline: ${new Date(assignment.deadline).toLocaleDateString()}` : null,
    `Questions solved: ${questions.length}`,
    'Use the dashboard to mark it submitted or extend the deadline if needed.',
    buildAssignmentLink(assignmentId, appBaseUrl),
  ]
    .filter(Boolean)
    .join('\n');
};
