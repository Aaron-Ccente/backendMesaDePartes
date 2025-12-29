import { Router } from 'express';
import { getConfigs, updateConfigs } from '../controllers/adminConfig.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', getConfigs);
router.put('/', updateConfigs);

export default router;
