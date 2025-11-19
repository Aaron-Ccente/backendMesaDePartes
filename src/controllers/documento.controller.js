import { DocumentBuilderService } from '../services/DocumentBuilderService.js';

export class DocumentoController {
  /**
   * Maneja la solicitud de vista previa de un documento.
   */
  static async getPreview(req, res) {
    try {
      const { id_oficio } = req.params;
      const { template } = req.query;

      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'El parámetro "template" es requerido en la consulta.',
        });
      }

      const extraData = req.body || {};

      const result = await DocumentBuilderService.build(template, Number(id_oficio), extraData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=preview_${template.replace('/', '_')}_${id_oficio}.pdf`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.end(result.pdfBuffer);

    } catch (error) {
      console.error('Error en DocumentoController.getPreview:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error interno al generar la vista previa del documento.',
      });
    }
  }
}
