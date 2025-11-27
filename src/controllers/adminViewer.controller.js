// backend-mesa-de-partes/src/controllers/adminViewer.controller.js
import { Oficio } from '../models/Oficio.js';
import AdminService from '../services/AdminService.js';

class AdminViewerController {
  async getAllCasesForViewer(req, res, next) {
    try {
      const result = await Oficio.findAllForAdminViewer();
      if (!result.success) {
        return res.status(500).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error('Error in getAllCasesForViewer:', error);
      next(error);
    }
  }

  async getCompleteCaseById(req, res, next) {
    try {
      const { id } = req.params;
      const caseDetails = await AdminService.getCompleteCaseById(id);
      res.json({ success: true, data: caseDetails });
    } catch (error) {
      console.error('Error in getCompleteCaseById:', error);
      res.status(500).json({ success: false, message: error.message });
      next(error);
    }
  }
}

export default new AdminViewerController();
