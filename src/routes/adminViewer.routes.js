// backend-mesa-de-partes/src/routes/adminViewer.routes.js
import { Router } from 'express';
import AdminViewerController from '../controllers/adminViewer.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this file are for admins
router.use(authenticateToken);
router.use(requireAdmin);

// @desc    Get all cases for the admin viewer list
// @route   GET /api/admin-viewer/casos
// @access  Private (Admin)
router.get(
  '/casos',
  AdminViewerController.getAllCasesForViewer
);

// @desc    Get complete case details for admin viewer
// @route   GET /api/admin-viewer/casos/:id
// @access  Private (Admin)
router.get(
  '/casos/:id',
  AdminViewerController.getCompleteCaseById
);

export default router;
