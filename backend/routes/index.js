import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const registerRoutes = (app) => {
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', requireAuth, authRoutes);
  app.use('/api/users', requireAuth, userRoutes);
  app.use('/api/assignments', requireAuth, assignmentRoutes);
};
