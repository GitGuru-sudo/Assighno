const monthMap = new Map([
  ['jan', 0],
  ['january', 0],
  ['feb', 1],
  ['february', 1],
  ['mar', 2],
  ['march', 2],
  ['apr', 3],
  ['april', 3],
  ['may', 4],
  ['jun', 5],
  ['june', 5],
  ['jul', 6],
  ['july', 6],
  ['aug', 7],
  ['august', 7],
  ['sep', 8],
  ['sept', 8],
  ['september', 8],
  ['oct', 9],
  ['october', 9],
  ['nov', 10],
  ['november', 10],
  ['dec', 11],
  ['december', 11],
]);

const deadlineKeywordRegex = /\b(?:deadline|due(?:\s+date)?|submit\s+by|last\s+date|submission\s+date)\b/i;

const setEndOfDay = (date) => {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

const buildDate = (year, monthIndex, day) => {
  const candidate = new Date(year, monthIndex, day);

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== monthIndex ||
    candidate.getDate() !== day
  ) {
    return null;
  }

  return setEndOfDay(candidate);
};

const resolveYear = (rawYear, monthIndex, day) => {
  if (rawYear) {
    const fullYear = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
    return buildDate(fullYear, monthIndex, day);
  }

  const today = new Date();
  const thisYearCandidate = buildDate(today.getFullYear(), monthIndex, day);

  if (thisYearCandidate && thisYearCandidate >= today) {
    return thisYearCandidate;
  }

  return buildDate(today.getFullYear() + 1, monthIndex, day);
};

const parseRelativeDeadline = (text) => {
  const normalized = text.toLowerCase();
  const today = new Date();

  if (normalized.includes('day after tomorrow')) {
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 2);
    return setEndOfDay(deadline);
  }

  if (normalized.includes('tomorrow')) {
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + 1);
    return setEndOfDay(deadline);
  }

  if (normalized.includes('today')) {
    return setEndOfDay(today);
  }

  return null;
};

const parseIsoDate = (text) => {
  const match = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);

  if (!match) {
    return null;
  }

  return buildDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

const parseNumericDate = (text) => {
  const match = text.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return resolveYear(match[3], monthIndex, day);
};

const parseMonthNameDate = (text) => {
  const dayFirstMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:,?\s+(20\d{2}|\d{2}))?\b/,
  );

  if (dayFirstMatch) {
    const monthIndex = monthMap.get(dayFirstMatch[2].toLowerCase());

    if (monthIndex !== undefined) {
      return resolveYear(dayFirstMatch[3], monthIndex, Number(dayFirstMatch[1]));
    }
  }

  const monthFirstMatch = text.match(
    /\b([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}|\d{2}))?\b/,
  );

  if (!monthFirstMatch) {
    return null;
  }

  const monthIndex = monthMap.get(monthFirstMatch[1].toLowerCase());

  if (monthIndex === undefined) {
    return null;
  }

  return resolveYear(monthFirstMatch[3], monthIndex, Number(monthFirstMatch[2]));
};

const parseFromText = (text) => {
  return parseRelativeDeadline(text) ?? parseIsoDate(text) ?? parseNumericDate(text) ?? parseMonthNameDate(text);
};

export const extractDeadlineFromText = (text, { requireKeyword = false } = {}) => {
  if (!text?.trim()) {
    return null;
  }

  if (requireKeyword && !deadlineKeywordRegex.test(text)) {
    return null;
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!requireKeyword || deadlineKeywordRegex.test(line)) {
      const parsed = parseFromText(line);

      if (parsed) {
        return parsed;
      }
    }
  }

  return requireKeyword ? null : parseFromText(text);
};

export const isNoDeadlineResponse = (text) => {
  const normalized = text.trim().toLowerCase();
  return ['no deadline', 'none', 'na', 'n/a', 'not given', 'not mentioned'].includes(normalized);
};

export const removeDeadlineMetadata = (text) => {
  if (!text?.trim()) {
    return text;
  }

  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return false;
      }

      return !(deadlineKeywordRegex.test(trimmed) && parseFromText(trimmed));
    })
    .join('\n')
    .trim();
};
