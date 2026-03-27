import { Router } from 'express';

import { asyncHandler } from '../utils/http.js';
import { createLinkingCode } from '../services/linkingService.js';

const router = Router();

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({
      user: {
        id: req.user._id,
        display_name: req.user.display_name,
        email: req.user.email,
        telegram_id: req.user.telegram_id,
        telegram_username: req.user.telegram_username,
        telegram_linked_at: req.user.telegram_linked_at,
      },
    });
  }),
);

router.post(
  '/linking-code',
  asyncHandler(async (req, res) => {
    const linkingCode = await createLinkingCode(req.user._id);

    res.json({
      code: linkingCode.code,
      expires_at: linkingCode.expires_at,
    });
  }),
);

export default router;
