import axios from 'axios';

import { env } from '../config/env.js';

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    Authorization: `Bearer ${env.openRouterApiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

const buildOpenRouterError = (error) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  const status = error.response?.status;
  const providerMessage =
    error.response?.data?.error?.message ??
    error.response?.data?.message ??
    error.message;

  return new Error(
    `OpenRouter request failed for model "${env.openRouterModel}"` +
      `${status ? ` (${status})` : ''}: ${providerMessage}`,
  );
};

export const solveQuestion = async (questionText) => {
  try {
    const response = await openRouterClient.post('/chat/completions', {
      model: env.openRouterModel,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Solve clearly and concisely.\n\nAssignment:\n${questionText}`,
        },
      ],
    });

    return response.data?.choices?.[0]?.message?.content?.trim() ?? 'No response generated.';
  } catch (error) {
    throw buildOpenRouterError(error);
  }
};

export const repairExtractedAssignmentText = async (rawText) => {
  try {
    const response = await openRouterClient.post('/chat/completions', {
      model: env.openRouterModel,
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: [
            'You are cleaning OCR text from a handwritten assignment.',
            'Fix only obvious OCR mistakes when you are confident.',
            'Preserve question order, numbering, subparts, set notation, and references to diagrams.',
            'Do not solve the assignment.',
            'Do not invent missing content.',
            '',
            'OCR text:',
            rawText,
          ].join('\n'),
        },
      ],
    });

    return response.data?.choices?.[0]?.message?.content?.trim() ?? rawText;
  } catch (error) {
    throw buildOpenRouterError(error);
  }
};
