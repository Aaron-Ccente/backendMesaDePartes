import { DocumentBuilderService } from './DocumentBuilderService.js';
import { Oficio } from '../models/Oficio.js';
import db from '../database/db.js';

class DictamenService {

  static async generarYGuardarDictamen(id_oficio, datosFormulario, usuario) {
    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();
      
      const extraData = { informe: datosFormulario.informe, perito: usuario };
      const { pdfBuffer } = await DocumentBuilderService.build('lab/informe_pericial_consolidado_v2', id_oficio, extraData);
      
      const nroOficioForFilename = (await Oficio.findById(id_oficio)).data.nro_oficio.replace(/[^a-zA-Z0-9-]/g, '_');
      const filename = `INFORME_CONSOLIDADO_${nroOficioForFilename}_${new Date().getFullYear()}.pdf`;
      
      const uploadsDir = require('path').join(__dirname, '..', '..', 'uploads', 'oficios_finales');
      await require('fs/promises').mkdir(uploadsDir, { recursive: true });
      const filePath = require('path').join(uploadsDir, filename);
      await require('fs/promises').writeFile(filePath, pdfBuffer);

      await connection.query(
        `INSERT INTO oficio_archivos (id_oficio, nombre_archivo, ruta_archivo, tipo_archivo, id_usuario_creador)
         VALUES (?, ?, ?, ?, ?)`,
        [id_oficio, filename, `/uploads/oficios_finales/${filename}`, 'INFORME_CONSOLIDADO', usuario.id_usuario]
      );
      
      await Oficio.addSeguimiento({
        id_oficio,
        id_usuario: usuario.id_usuario,
        estado_nuevo: 'DICTAMEN EMITIDO',
        observaciones: 'Informe Pericial Consolidado generado y caso cerrado.',
        connection
      });
      
      await connection.commit();
      return { filePath };
    } catch (error) {
      await connection.rollback();
      console.error('Error en generarYGuardarDictamen:', error);
      throw new Error('No se pudo generar el informe consolidado.');
    } finally {
      if (connection) connection.release();
    }
  }

  static async generarPreviewInformeConsolidado(id_oficio, datosFormulario, usuario) {
    try {
      const extraData = { informe: datosFormulario.informe, perito: usuario };
      const { pdfBuffer } = await DocumentBuilderService.build('lab/informe_pericial_consolidado_v2', id_oficio, extraData);
      return { pdfBuffer };
    } catch (error) {
      console.error('Error detallado en generarPreviewInformeConsolidado:', error);
      throw new Error('No se pudo generar la vista previa del informe. Revise la consola del servidor para más detalles.');
    }
  }
}

export { DictamenService };