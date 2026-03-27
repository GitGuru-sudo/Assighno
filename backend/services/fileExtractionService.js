import axios from 'axios';
import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';

export const fetchFileBuffer = async (fileUrl) => {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};

export const extractTextFromPdf = async (buffer) => {
  const parsed = await pdf(buffer);
  return parsed.text ?? '';
};

export const extractTextFromImage = async (buffer) => {
  const result = await Tesseract.recognize(buffer, 'eng');
  return result.data.text ?? '';
};

