import { DocumentBuilderService } from '../services/DocumentBuilderService.js';
import { Perito } from '../models/Perito.js';

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

  /**
   * Genera el Acta de Apertura de Muestra en PDF.
   */
  static async generarActaApertura(req, res) {
    try {
      const { id_oficio } = req.params;
      const { aperturaData, muestras } = req.body;
      const { id_usuario } = req.user;

      if (!aperturaData || !muestras) {
        return res.status(400).json({
          success: false,
          message: 'Los datos del formulario (aperturaData y muestras) son requeridos.',
        });
      }

      // Obtener detalles completos del perito desde el modelo para asegurar todos los datos
      const peritoResult = await Perito.findByIdUsuario(id_usuario);
      if (!peritoResult.success) {
        return res.status(404).json({ success: false, message: 'Perito no encontrado.' });
      }

      const extraData = {
        aperturaData,
        oficio: {
          muestras_registradas: muestras.map((m, index) => ({ ...m, index: index + 1 })),
          fecha_actual: new Date(), // Usado por los helpers de fecha y hora
        },
        perito: peritoResult.data,
      };

      const result = await DocumentBuilderService.build('lab/acta_apertura_lab', Number(id_oficio), extraData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=Acta_Apertura_${id_oficio}.pdf`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.end(result.pdfBuffer);

    } catch (error) {
      console.error('Error en DocumentoController.generarActaApertura:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error interno al generar el acta.',
      });
    }
  }
}
