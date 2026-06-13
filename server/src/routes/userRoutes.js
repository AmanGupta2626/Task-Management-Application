import { Router } from 'express';

import { getUsers, getAssignable, assignMembers } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/assignable', getAssignable);
router.put('/team', authorize('Manager'), assignMembers);

export default router;
