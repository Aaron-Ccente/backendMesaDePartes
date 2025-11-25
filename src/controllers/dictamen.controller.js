import { DictamenService } from '../services/DictamenService.js';

class DictamenController {
  async generarDictamen(req, res) {
    const { id_oficio } = req.params;
    const { body: datosFormulario, user: usuario } = req;

    try {
      if (!id_oficio || !datosFormulario || !usuario) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos para generar el dictamen.' });
      }

      const filePath = await DictamenService.generarYGuardarDictamen(id_oficio, datosFormulario, usuario);

      res.status(201).json({
        success: true,
        message: 'Dictamen Pericial Consolidado generado y guardado exitosamente.',
        filePath: filePath,
      });

    } catch (error) {
      console.error(`[DictamenController] Error al generar dictamen para el oficio ${id_oficio}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ocurrió un error inesperado en el servidor al generar el dictamen.',
      });
    }
  }

  async generarPreview(req, res) {
    const { id_oficio } = req.params;
    const { body: datosFormulario, user: usuario } = req;

    try {
      if (!id_oficio || !datosFormulario || !usuario) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos para la vista previa.' });
      }

      const { pdfBuffer } = await DictamenService.generarPreviewInformeConsolidado(id_oficio, datosFormulario, usuario);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=preview_informe_${id_oficio}.pdf`);
      res.end(pdfBuffer);

    } catch (error) {
      console.error(`[DictamenController] Error al generar vista previa para el oficio ${id_oficio}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ocurrió un error inesperado en el servidor al generar la vista previa.',
      });
    }
  }
}

export default new DictamenController();
