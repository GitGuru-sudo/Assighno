import { Router } from 'express';

import { asyncHandler } from '../utils/http.js';

const router = Router();

router.post(
  '/sync',
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

export default router;
