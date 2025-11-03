// backend/src/controllers/OficioCierre.controller.js
import { OficioArchivos } from '../models/OficioArchivos.js';
import { Oficio } from '../models/Oficio.js';
import db from '../database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
/**
 * Controlador para gestionar el cierre de oficios y la subida de archivos locales.
 */
export class OficioCierreController {

  /**
   * Cierra un oficio subiendo el archivo final firmado al servidor local.
   * Se ejecuta como una transacción.
   */
  static async cerrarOficioLocal(req, res) {
    const { id_oficio } = req.params;
    const id_usuario_cierre = req.user.id_usuario; // Usuario de Mesa de Partes (del token)
    const { datos_receptor_json } = req.body; // ej: '{"nombre":"Juan Pekuchoxde","dni":"12345678"}'

    // 1. Validar que el archivo se subió (Multer debe estar configurado en la ruta)
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se subió ningún archivo PDF. Asegúrate de adjuntar el documento.' 
      });
    }

    // 2. Obtener la ruta del archivo (Multer nos la da)
    // Guardamos la ruta relativa que multer genera (ej: 'uploads/oficios/informe_123.pdf')
    const ruta_archivo_local = req.file.path; 

    const connection = await db.promise().getConnection();
    try {
      await connection.beginTransaction();

      // 3. Guardar el registro del archivo en la tabla 'oficio_archivos'
      await OficioArchivos.create({
        id_oficio: Number(id_oficio),
        ruta_archivo_local: ruta_archivo_local,
        nombre_archivo: req.file.originalname,
        tipo_archivo: 'DOCUMENTO_FINAL_FIRMADO',
        subido_por: id_usuario_cierre,
        datos_receptor: datos_receptor_json || null // Guardamos los datos del receptor
      }, connection); // Pasamos la conexión de la transacción

      // 4. Actualizar el estado del oficio a "CERRADO"
      // Asumimos que el estado previo era 'PENDIENTE DE ENTREGA'
      await Oficio.addSeguimiento({
        id_oficio: Number(id_oficio),
        id_usuario: id_usuario_cierre,
        estado_nuevo: 'CERRADO',
        estado_anterior: 'PENDIENTE DE ENTREGA' 
      }, connection); // Pasamos la conexión de la transacción

      // 5. Confirmar transacción
      await connection.commit();
      
      res.status(200).json({
        success: true,
        message: 'Oficio cerrado y archivo guardado exitosamente.',
        data: { ruta: ruta_archivo_local }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error en cerrarOficioLocal:', error);
      
      // Opcional: Si la BD falla, deberíamos borrar el archivo físico que se subió
      // try {
      //   const fs = await import('fs');
      //   fs.unlinkSync(ruta_archivo_local);
      // } catch (fsError) {
      //   console.error('Error borrando archivo huérfano:', fsError);
      // }

      return res.status(500).json({ 
        success: false, 
        message: 'Error de servidor al cerrar el oficio. La operación fue revertida.', 
        error: error.message 
      });
    } finally {
      connection.release();
    }
  }
/**
   * Permite a un usuario autenticado descargar un archivo local
   */
  static async descargarArchivoLocal(req, res) {
    try {
      const { id_archivo } = req.params;

      // 1. Buscar el registro del archivo en la BD
      const result = await OficioArchivos.findById(Number(id_archivo));

      if (!result.success) {
        return res.status(404).json({ success: false, message: result.message });
      }

      const archivo = result.data;

      // 2. Verificar que la ruta sea local (y no de Google Drive)
      if (!archivo.ruta_archivo_local) {
        return res.status(404).json({ 
          success: false, 
          message: 'Este archivo no está disponible para descarga local (puede estar en Google Drive).' 
        });
      }

      // 3. Construir la ruta absoluta y segura al archivo
      // Asumimos que la ruta guardada (ej: 'uploads/oficios_finales/...') 
      // es relativa a la raíz del proyecto backend.
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      // __dirname = .../backend/src/controllers
      // ../.. = .../backend/
      const absolutePath = path.resolve(__dirname, '..', '..', archivo.ruta_archivo_local);

      // 4. Verificar que el archivo existe físicamente
      if (!fs.existsSync(absolutePath)) {
        console.error(`Error: Archivo no encontrado en el servidor: ${absolutePath}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Archivo no encontrado en el servidor.' 
        });
      }

      // 5. Enviar el archivo para descarga
      // res.download() establece automáticamente los headers 'Content-Disposition'
      // para que el navegador lo descargue en lugar de mostrarlo.
      res.download(absolutePath, archivo.nombre_archivo, (err) => {
        if (err) {
          // Esto maneja errores si el stream se interrumpe por x motivos (ej. el usuario desconecta)
          console.error('Error al enviar el archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error al descargar el archivo.' });
          }
        }
      });

    } catch (error) {
      console.error('Error en descargarArchivoLocal:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: 'Error interno del servidor al descargar el archivo', 
          error: error.message 
        });
      }
    }
  }
}
