import crypto from 'crypto';

import { LinkingCode } from '../models/LinkingCode.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/http.js';

const generateCode = () => crypto.randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();

export const createLinkingCode = async (userId) => {
  const user = await User.findById(userId);

  if (user?.telegram_id) {
    throw new HttpError(409, 'Telegram account is already linked for this user.');
  }

  await LinkingCode.deleteMany({ user_id: userId, used_at: null });

  let code = generateCode();
  let exists = await LinkingCode.exists({ code });

  while (exists) {
    code = generateCode();
    exists = await LinkingCode.exists({ code });
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return LinkingCode.create({
    code,
    user_id: userId,
    expires_at: expiresAt,
  });
};

export const consumeLinkingCode = async (code, telegramUser) => {
  const normalizedCode = code.trim().toUpperCase();
  const linkingCode = await LinkingCode.findOne({
    code: normalizedCode,
    used_at: null,
    expires_at: { $gt: new Date() },
  });

  if (!linkingCode) {
    throw new HttpError(400, 'Invalid or expired linking code.');
  }

  const userBeforeLink = await User.findById(linkingCode.user_id);

  if (userBeforeLink?.telegram_id && userBeforeLink.telegram_id !== String(telegramUser.id)) {
    throw new HttpError(409, 'This user already has a linked Telegram account.');
  }

  const existingLink = await User.findOne({
    telegram_id: String(telegramUser.id),
    _id: { $ne: linkingCode.user_id },
  });

  if (existingLink) {
    throw new HttpError(409, 'This Telegram account is already linked to another user.');
  }

  const telegramDisplayName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim();

  const user = await User.findByIdAndUpdate(
    linkingCode.user_id,
    {
      display_name: userBeforeLink?.display_name || telegramDisplayName || undefined,
      telegram_id: String(telegramUser.id),
      telegram_username: telegramUser.username ?? null,
      telegram_linked_at: new Date(),
    },
    { new: true },
  );

  linkingCode.used_at = new Date();
  await linkingCode.save();

  return user;
};
