const whitespaceRegex = /\s+/g;
const questionPrefixRegex = /^\s*(?:q(?:uestion|ues|ue)?|ques)\s*[:.\-]?\s*(\d+)\s*/i;
const numberedPrefixRegex = /^\s*(\d+)\s*[\).\-\:]\s*/;
const subpartPrefixRegex = /^\s*\(?([a-z])\)\s*/i;

const removeDuplicateLines = (lines) => {
  const seen = new Set();

  return lines.filter((line) => {
    const normalized = line.toLowerCase();

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

const removeRepeatedEdges = (lines) => {
  const edgeCounts = new Map();

  lines.forEach((line, index) => {
    if (index < 2 || index >= lines.length - 2) {
      edgeCounts.set(line, (edgeCounts.get(line) ?? 0) + 1);
    }
  });

  return lines.filter((line) => (edgeCounts.get(line) ?? 0) < 3);
};

const normalizeQuestionPrefix = (line) => {
  if (questionPrefixRegex.test(line)) {
    return line.replace(questionPrefixRegex, (_, questionNumber) => `Q${questionNumber}. `).trim();
  }

  if (numberedPrefixRegex.test(line)) {
    return line.replace(numberedPrefixRegex, (_, questionNumber) => `${questionNumber}. `).trim();
  }

  if (subpartPrefixRegex.test(line)) {
    return line.replace(subpartPrefixRegex, (_, label) => `(${label.toLowerCase()}) `).trim();
  }

  return line;
};

export const cleanAssignmentText = (input) => {
  const normalized = input.replace(/\r/g, '\n');
  const collapsedPages = normalized.replace(/\f/g, '\n');
  const lines = collapsedPages
    .split('\n')
    .map((line) => normalizeQuestionPrefix(line.replace(whitespaceRegex, ' ').trim()))
    .filter(Boolean);

  const deduped = removeDuplicateLines(removeRepeatedEdges(lines));
  return deduped.join('\n').trim();
};

export const splitQuestions = (content) => {
  const questionBlocks = content
    .split(/(?=^\s*(?:(?:q(?:uestion|ues|ue)?|ques)\s*[:.\-]?\s*\d+|\d+\s*[).\-\:]))/gim)
    .map((block) => block.trim())
    .filter(Boolean);

  if (questionBlocks.length <= 1) {
    return [content.trim()];
  }

  return questionBlocks;
};

export const buildAssignmentTitle = (content) => {
  const firstLine = content.split('\n')[0]?.trim() || 'Untitled Assignment';
  return firstLine.slice(0, 80);
};
