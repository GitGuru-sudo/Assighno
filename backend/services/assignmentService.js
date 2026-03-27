import { Assignment } from '../models/Assignment.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { buildAssignmentTitle, cleanAssignmentText, splitQuestions } from '../utils/text.js';
import { createHash } from '../utils/hash.js';
import { enforceAssignmentRateLimit } from './rateLimitService.js';
import { HttpError } from '../utils/http.js';
import { repairExtractedAssignmentText } from './aiService.js';
import { extractDeadlineFromText, removeDeadlineMetadata } from '../utils/deadline.js';
import { logError } from '../utils/logger.js';

export const ensureTelegramUserLinked = async (telegramId) => {
  const user = await User.findOne({ telegram_id: String(telegramId) });

  if (!user) {
    throw new HttpError(403, 'Telegram account not linked. Use the dashboard to generate a code first.');
  }

  return user;
};

const enhanceAssignmentContent = async (rawContent, sourceType) => {
  if (sourceType !== 'image') {
    return rawContent;
  }

  try {
    return await repairExtractedAssignmentText(rawContent);
  } catch (error) {
    logError('Failed to repair extracted assignment text', error);
    return rawContent;
  }
};

export const createAssignmentFromContent = async ({
  userId,
  sourceType,
  rawContent,
  sourceFileName,
  deadline,
}) => {
  await enforceAssignmentRateLimit(userId);

  const enhancedContent = await enhanceAssignmentContent(rawContent, sourceType);
  const normalizedContent = removeDeadlineMetadata(enhancedContent);

  // Normalize noisy OCR/PDF output before we split the assignment into question-sized jobs.
  const cleanedContent = cleanAssignmentText(normalizedContent);

  if (!cleanedContent) {
    throw new HttpError(400, 'No readable assignment text found.');
  }

  const assignment = await Assignment.create({
    user_id: userId,
    title: buildAssignmentTitle(cleanedContent),
    raw_content: enhancedContent,
    cleaned_content: cleanedContent,
    source_type: sourceType,
    source_file_name: sourceFileName,
    deadline: deadline ?? null,
    reminder_last_sent_at: deadline ? new Date() : null,
    status: 'queued',
  });

  const questions = splitQuestions(cleanedContent).map((questionText) => ({
    assignment_id: assignment._id,
    question_text: questionText,
    hash: createHash(questionText),
  }));

  await Question.insertMany(questions);

  return assignment;
};

export const getAssignmentsForUser = async (userId) => {
  return Assignment.find({ user_id: userId }).sort({ created_at: -1 });
};

export const getAssignmentForUser = async (assignmentId, userId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, user_id: userId }).lean();

  if (!assignment) {
    throw new HttpError(404, 'Assignment not found');
  }

  const questions = await Question.find({ assignment_id: assignmentId }).sort({ created_at: 1 }).lean();

  return {
    ...assignment,
    questions,
  };
};

export const markAssignmentSubmittedForUser = async (assignmentId, userId) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, user_id: userId });

  if (!assignment) {
    throw new HttpError(404, 'Assignment not found');
  }

  assignment.status = 'submitted';
  assignment.submitted_at = new Date();
  await assignment.save();

  return assignment;
};

export const extendAssignmentDeadlineForUser = async (assignmentId, userId, deadlineInput) => {
  const assignment = await Assignment.findOne({ _id: assignmentId, user_id: userId });

  if (!assignment) {
    throw new HttpError(404, 'Assignment not found');
  }

  if (!deadlineInput?.trim()) {
    throw new HttpError(400, 'A new deadline is required.');
  }

  const parsedDeadline = extractDeadlineFromText(deadlineInput, { requireKeyword: false });

  if (!parsedDeadline) {
    throw new HttpError(400, 'Could not understand that deadline. Try 26/04/2026 or 26 April 2026.');
  }

  assignment.deadline = parsedDeadline;
  assignment.reminder_last_sent_at = new Date();

  if (assignment.status === 'submitted') {
    assignment.status = 'completed';
    assignment.submitted_at = null;
  }

  await assignment.save();

  return assignment;
};
