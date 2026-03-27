import { Router } from 'express';

import { asyncHandler, HttpError } from '../utils/http.js';
import {
  extendAssignmentDeadlineForUser,
  getAssignmentForUser,
  getAssignmentsForUser,
  markAssignmentSubmittedForUser,
} from '../services/assignmentService.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const assignments = await getAssignmentsForUser(req.user._id);
    res.json({ assignments });
  }),
);

router.get(
  '/:assignmentId',
  asyncHandler(async (req, res) => {
    const assignment = await getAssignmentForUser(req.params.assignmentId, req.user._id);
    res.json({ assignment });
  }),
);

router.patch(
  '/:assignmentId',
  asyncHandler(async (req, res) => {
    const { action, deadline_input: deadlineInput } = req.body ?? {};

    if (action === 'mark_submitted') {
      const assignment = await markAssignmentSubmittedForUser(req.params.assignmentId, req.user._id);
      res.json({ assignment });
      return;
    }

    if (action === 'extend_deadline') {
      const assignment = await extendAssignmentDeadlineForUser(req.params.assignmentId, req.user._id, deadlineInput);
      res.json({ assignment });
      return;
    }

    throw new HttpError(400, 'Unsupported assignment action.');
  }),
);

export default router;
