import express from 'express';
import multer from 'multer';
import { GoogleController } from '../controllers/google.controller.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limite

// Public listing/download
// List files (opcional folderId query)
router.get('/files', authenticateToken, GoogleController.listFiles);

// Get metadata
router.get('/files/:id', authenticateToken, GoogleController.getMetadata);

// Download
router.get('/download/:id', authenticateToken, GoogleController.download);

// Upload (multipart/form-data, campo "file")
router.post('/upload', authenticateToken, upload.single('file'), GoogleController.upload);

// Delete
router.delete('/files/:id', authenticateToken, GoogleController.delete);

// Create folder
router.post('/folders', authenticateToken, GoogleController.createFolder);

export default router;