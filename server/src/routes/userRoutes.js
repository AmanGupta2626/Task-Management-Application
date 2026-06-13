import { Router } from 'express';

import { getUsers, getAssignable } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/assignable', getAssignable);

export default router;
