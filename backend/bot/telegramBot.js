import TelegramBot from 'node-telegram-bot-api';

import { env } from '../config/env.js';
import { consumeLinkingCode } from '../services/linkingService.js';
import { getPastAssignmentsMessage, getUpcomingAssignmentsMessage, buildAssignmentLink, buildCompletionMessage } from '../services/telegramService.js';
import { ensureTelegramUserLinked, createAssignmentFromContent } from '../services/assignmentService.js';
import { fetchFileBuffer, extractTextFromImage, extractTextFromPdf } from '../services/fileExtractionService.js';
import { enqueueAssignment } from '../services/assignmentProcessor.js';
import { logError, logInfo } from '../utils/logger.js';
import { extractDeadlineFromText, isNoDeadlineResponse } from '../utils/deadline.js';

let telegramBotInstance = null;
const pendingDeadlineRequests = new Map();

const formatDeadline = (deadline) =>
  deadline
    ? new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(deadline)
    : 'No deadline';

const buildDisplayName = (user, telegramUser) => {
  const telegramDisplayName = [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(' ').trim();
  const fallbackName =
    user.display_name ||
    telegramDisplayName ||
    telegramUser?.username ||
    user.telegram_username ||
    user.email.split('@')[0];

  return fallbackName?.trim() || 'there';
};

const getMessageTypeAndText = async (bot, message) => {
  if (message.text && !message.text.startsWith('/')) {
    return {
      sourceType: 'text',
      content: message.text,
      caption: message.text,
    };
  }

  if (message.document?.mime_type === 'application/pdf') {
    // Telegram only gives us a file id, so we download the file and extract readable text server-side.
    const fileLink = await bot.getFileLink(message.document.file_id);
    const buffer = await fetchFileBuffer(fileLink);
    const text = await extractTextFromPdf(buffer);

    return {
      sourceType: 'pdf',
      content: text,
      fileName: message.document.file_name,
      caption: message.caption,
    };
  }

  if (message.photo?.length) {
    const largestPhoto = message.photo[message.photo.length - 1];
    const fileLink = await bot.getFileLink(largestPhoto.file_id);
    const buffer = await fetchFileBuffer(fileLink);
    const text = await extractTextFromImage(buffer);

    return {
      sourceType: 'image',
      content: text,
      fileName: `${largestPhoto.file_unique_id}.jpg`,
      caption: message.caption,
    };
  }

  return null;
};

const handleStartCommand = async (bot, message) => {
  const chatId = message.chat.id;
  const code = message.text?.split(' ')[1];

  if (!code) {
    await bot.sendMessage(chatId, 'Send `/start ABC123` with the 6-character code from your dashboard.', {
      parse_mode: 'Markdown',
    });
    return;
  }

  const user = await consumeLinkingCode(code, message.from);
  const displayName = buildDisplayName(user, message.from);
  await bot.sendMessage(
    chatId,
    `Linked successfully, ${displayName}.\nEmail: ${user.email}\nYou can now send assignment text, PDFs, or images.`,
  );
};

const handleAssignmentsCommand = async (bot, message) => {
  const response = await getUpcomingAssignmentsMessage(message.from.id);
  await bot.sendMessage(message.chat.id, response);
};

const handlePastCommand = async (bot, message) => {
  const response = await getPastAssignmentsMessage(message.from.id);
  await bot.sendMessage(message.chat.id, response);
};

const finalizeAssignmentSubmission = async (bot, message, draft, deadline) => {
  const assignment = await createAssignmentFromContent({
    userId: draft.userId,
    sourceType: draft.sourceType,
    rawContent: draft.rawContent,
    sourceFileName: draft.sourceFileName,
    deadline,
  });

  await enqueueAssignment(assignment._id);

  await bot.sendMessage(
    message.chat.id,
    `Hey ${draft.greetingName}, your assignment is queued.\nDeadline: ${formatDeadline(deadline)}\n${buildAssignmentLink(assignment._id, env.appBaseUrl)}`,
  );
};

const handlePendingDeadlineResponse = async (bot, message, draft) => {
  const replyText = message.text?.trim();

  if (!replyText) {
    await bot.sendMessage(
      message.chat.id,
      `Hey ${draft.greetingName}, send the deadline as text like 26/04/2026, 26 April 2026, or tomorrow. You can also reply with "no deadline".`,
    );
    return;
  }

  if (isNoDeadlineResponse(replyText)) {
    pendingDeadlineRequests.delete(String(message.from.id));
    await finalizeAssignmentSubmission(bot, message, draft, null);
    return;
  }

  const parsedDeadline = extractDeadlineFromText(replyText, { requireKeyword: false });

  if (!parsedDeadline) {
    await bot.sendMessage(
      message.chat.id,
      `Hey ${draft.greetingName}, I couldn't read that deadline. Reply like 26/04/2026, 26 April 2026, tomorrow, or "no deadline".`,
    );
    return;
  }

  pendingDeadlineRequests.delete(String(message.from.id));
  await finalizeAssignmentSubmission(bot, message, draft, parsedDeadline);
};

const handleAssignmentSubmission = async (bot, message) => {
  const user = await ensureTelegramUserLinked(message.from.id);
  const parsed = await getMessageTypeAndText(bot, message);

  if (!parsed) {
    await bot.sendMessage(message.chat.id, 'Unsupported content. Send plain text, a PDF, or an image.');
    return;
  }

  const greetingName = buildDisplayName(user, message.from);
  const deadlineHint = [parsed.caption, parsed.content].filter(Boolean).join('\n');
  const deadline = extractDeadlineFromText(deadlineHint, { requireKeyword: true });

  if (!deadline) {
    pendingDeadlineRequests.set(String(message.from.id), {
      userId: user._id,
      sourceType: parsed.sourceType,
      rawContent: parsed.content,
      sourceFileName: parsed.fileName,
      greetingName,
    });

    await bot.sendMessage(
      message.chat.id,
      `Hey ${greetingName}, I got your assignment.\nBefore I add it to the dashboard, send me the deadline in a format like 26/04/2026, 26 April 2026, or tomorrow. If your teacher did not give one, reply with "no deadline".`,
    );
    return;
  }

  await finalizeAssignmentSubmission(
    bot,
    message,
    {
      userId: user._id,
      sourceType: parsed.sourceType,
      rawContent: parsed.content,
      sourceFileName: parsed.fileName,
      greetingName,
    },
    deadline,
  );
};

export const notifyAssignmentCompleted = async (assignmentId) => {
  if (!telegramBotInstance) {
    return;
  }

  const { Assignment } = await import('../models/Assignment.js');
  const { User } = await import('../models/User.js');

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    return;
  }

  const user = await User.findById(assignment.user_id);

  if (!user?.telegram_id) {
    return;
  }

  const completionMessage = await buildCompletionMessage(assignmentId, env.appBaseUrl);
  await telegramBotInstance.sendMessage(user.telegram_id, completionMessage);
};

export const sendTelegramMessage = async (chatId, text) => {
  if (!telegramBotInstance) {
    return false;
  }

  await telegramBotInstance.sendMessage(chatId, text);
  return true;
};

export const startTelegramBot = () => {
  if (!env.botPolling) {
    logInfo('Telegram polling disabled by configuration');
    return null;
  }

  const bot = new TelegramBot(env.telegramBotToken, { polling: true });
  telegramBotInstance = bot;

  bot.onText(/^\/start(?:\s+(.+))?$/, async (message) => {
    try {
      await handleStartCommand(bot, message);
    } catch (error) {
      logError('Failed to handle /start', error);
      await bot.sendMessage(message.chat.id, error.message ?? 'Could not link Telegram account.');
    }
  });

  bot.onText(/^\/assignments$/, async (message) => {
    try {
      await handleAssignmentsCommand(bot, message);
    } catch (error) {
      logError('Failed to handle /assignments', error);
      await bot.sendMessage(message.chat.id, error.message ?? 'Could not fetch assignments.');
    }
  });

  bot.onText(/^\/past$/, async (message) => {
    try {
      await handlePastCommand(bot, message);
    } catch (error) {
      logError('Failed to handle /past', error);
      await bot.sendMessage(message.chat.id, error.message ?? 'Could not fetch completed assignments.');
    }
  });

  bot.onText(/^\/cancel$/, async (message) => {
    pendingDeadlineRequests.delete(String(message.from.id));
    await bot.sendMessage(message.chat.id, 'Pending assignment cleared. Send a fresh assignment whenever you are ready.');
  });

  bot.on('message', async (message) => {
    try {
      if (message.text?.startsWith('/')) {
        return;
      }

      const pendingDraft = pendingDeadlineRequests.get(String(message.from.id));

      if (pendingDraft) {
        await handlePendingDeadlineResponse(bot, message, pendingDraft);
        return;
      }

      await handleAssignmentSubmission(bot, message);
    } catch (error) {
      logError('Failed to handle assignment submission', error);
      await bot.sendMessage(message.chat.id, error.message ?? 'Could not process the assignment.');
    }
  });

  logInfo('Telegram bot polling started');
  return bot;
};
