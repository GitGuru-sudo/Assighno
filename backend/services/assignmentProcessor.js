import { env } from '../config/env.js';
import { Assignment } from '../models/Assignment.js';
import { Question } from '../models/Question.js';
import { solveQuestion } from './aiService.js';
import { logError, logInfo } from '../utils/logger.js';

const queuedJobs = [];
const queuedAssignmentIds = new Set();
const MAX_RETRIES = 2;

let activeJob = null;
let processorTimer = null;
let processorStarted = false;

const scheduleNextRun = (delayMs = env.processingIntervalMs) => {
  if (processorTimer || activeJob) {
    return;
  }

  processorTimer = setTimeout(async () => {
    processorTimer = null;
    await processNextJob();
  }, delayMs);
};

const requeueJob = (job) => {
  queuedJobs.push(job);
  queuedAssignmentIds.add(job.assignmentId);
};

const processAssignment = async (assignmentId) => {
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    return false;
  }

  if (assignment.status === 'submitted') {
    return false;
  }

  assignment.status = 'processing';
  assignment.error_message = null;
  await assignment.save();

  const questions = await Question.find({ assignment_id: assignmentId }).sort({ created_at: 1 });

  for (const question of questions) {
    // Reuse prior answers for identical prompts so repeated assignments stay cheap.
    const cachedQuestion = await Question.findOne({
      hash: question.hash,
      ai_solution: { $ne: '' },
      _id: { $ne: question._id },
    })
      .sort({ updated_at: -1 })
      .lean();

    if (cachedQuestion?.ai_solution) {
      question.ai_solution = cachedQuestion.ai_solution;
      question.status = 'completed';
      await question.save();
      continue;
    }

    const solution = await solveQuestion(question.question_text);
    question.ai_solution = solution;
    question.status = 'completed';
    await question.save();
  }

  const latestAssignment = await Assignment.findById(assignmentId);

  if (!latestAssignment) {
    return false;
  }

  if (latestAssignment.status !== 'submitted') {
    latestAssignment.status = 'completed';
    await latestAssignment.save();
  }

  const { notifyAssignmentCompleted } = await import('../bot/telegramBot.js');
  await notifyAssignmentCompleted(assignmentId);

  return true;
};

const handleProcessingFailure = async (job, error) => {
  const assignment = await Assignment.findById(job.assignmentId);

  if (assignment) {
    if (assignment.status === 'submitted') {
      return;
    }

    assignment.error_message = error.message;

    if (job.retries >= MAX_RETRIES) {
      assignment.status = 'failed';
    } else {
      assignment.status = 'queued';
    }

    await assignment.save();
  }

  if (job.retries < MAX_RETRIES) {
    job.retries += 1;
    requeueJob(job);
    logError('Assignment processing failed, retrying', error);
    return;
  }

  logError('Assignment processing failed', error);
};

const processNextJob = async () => {
  if (activeJob || queuedJobs.length === 0) {
    return;
  }

  const job = queuedJobs.shift();

  if (!job) {
    return;
  }

  queuedAssignmentIds.delete(job.assignmentId);
  activeJob = job;

  try {
    const processed = await processAssignment(job.assignmentId);

    if (processed) {
      logInfo('Assignment processed', { assignmentId: job.assignmentId });
    }
  } catch (error) {
    await handleProcessingFailure(job, error);
  } finally {
    activeJob = null;

    if (queuedJobs.length > 0) {
      scheduleNextRun();
    }
  }
};

export const enqueueAssignment = async (assignmentId) => {
  const normalizedId = String(assignmentId);

  if (queuedAssignmentIds.has(normalizedId) || activeJob?.assignmentId === normalizedId) {
    return;
  }

  requeueJob({
    assignmentId: normalizedId,
    retries: 0,
  });

  if (processorStarted) {
    scheduleNextRun(0);
  }
};

export const startProcessor = () => {
  if (processorStarted) {
    return;
  }

  processorStarted = true;
  logInfo('In-memory assignment processor started');

  if (queuedJobs.length > 0) {
    scheduleNextRun(0);
  }
};
