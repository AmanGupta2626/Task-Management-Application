import { Router } from 'express';
import { body } from 'express-validator';

import {
  register,
  login,
  me,
  listManagers,
  listTeamLeads,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage(
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character'
      ),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', authenticate, me);
router.get('/managers', listManagers);
router.get('/team-leads', listTeamLeads);

export default router;
