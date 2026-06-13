import { Router } from 'express';
import { body } from 'express-validator';

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { TASK_STATUS } from '../models/Task.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTask);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(TASK_STATUS).withMessage('Invalid status'),
  ],
  validate,
  createTask
);

router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(TASK_STATUS).withMessage('Invalid status'),
  ],
  validate,
  updateTask
);

router.delete('/:id', deleteTask);

export default router;
