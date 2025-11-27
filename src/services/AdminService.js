// backend-mesa-de-partes/src/services/AdminService.js
import db from '../database/db.js';

class AdminService {
  async getCompleteCaseById(oficioId) {
    const connection = await db.promise().getConnection();
    try {
        const caseDetails = {};

        // 1. Get Oficio Base
        const [oficioRows] = await connection.query('SELECT * FROM oficio WHERE id_oficio = ?', [oficioId]);
        if (oficioRows.length === 0) {
            throw new Error('Oficio not found');
        }
        const oficio = oficioRows[0];
        caseDetails.oficio = oficio;

        // 2. Get Assigned Perito
        if (oficio.id_usuario_perito_asignado) {
            const [peritoRows] = await connection.query('SELECT * FROM usuario WHERE id_usuario = ?', [oficio.id_usuario_perito_asignado]);
            caseDetails.perito_asignado = peritoRows[0] || null;
        }

        // 3. Get Exam Types
        const [examenesRows] = await connection.query(
            `SELECT te.nombre as nombre_examen
             FROM oficio_examen oe 
             JOIN tipo_de_examen te ON oe.id_tipo_de_examen = te.id_tipo_de_examen 
             WHERE oe.id_oficio = ?`,
            [oficioId]
        );
        caseDetails.examenes = examenesRows;

        // 4. Get Muestras (Samples)
        const [muestrasRows] = await connection.query('SELECT * FROM muestras WHERE id_oficio = ?', [oficioId]);
        caseDetails.muestras = muestrasRows;

        // 5. Get Seguimiento (History/Tracking)
        const [seguimientoRows] = await connection.query(
            `SELECT s.*, u.nombre_completo as nombre_usuario 
             FROM seguimiento_oficio s 
             LEFT JOIN usuario u ON s.id_usuario = u.id_usuario 
             WHERE s.id_oficio = ? 
             ORDER BY s.fecha_seguimiento ASC`,
            [oficioId]
        );
        caseDetails.seguimiento = seguimientoRows;

        // 6. Get Results from Peritos
        const [resultadosRows] = await connection.query(
            `SELECT u.nombre_completo as perito_nombres, r.resultados, r.fecha_creacion as fecha_resultado 
             FROM oficio_resultados_perito r 
             JOIN usuario u ON r.id_perito_responsable = u.id_usuario 
             WHERE r.id_oficio = ?`,
            [oficioId]
        );
        caseDetails.resultados_peritos = resultadosRows;

        // 7. Get All Documents
        const [genericDocsRows] = await connection.query('SELECT nombre_archivo, ruta_archivo_local, tipo_archivo FROM oficio_archivos WHERE id_oficio = ?', [oficioId]);
        const allDocs = [...genericDocsRows];

        const [finalDocsRows] = await connection.query('SELECT * FROM oficio_resultados_metadata WHERE id_oficio = ?', [oficioId]);
        const finalDocsMetadata = finalDocsRows[0];
        
        if (finalDocsMetadata) {
            if (finalDocsMetadata.informe_pericial_firmado_path) {
                allDocs.push({
                    nombre_archivo: 'Informe Pericial Firmado',
                    ruta_archivo_local: finalDocsMetadata.informe_pericial_firmado_path,
                    tipo_archivo: 'INFORME_FIRMADO'
                });
            }
            if (finalDocsMetadata.documentos_finales_escaneados_path) {
                try {
                    const scannedDocsPaths = JSON.parse(finalDocsMetadata.documentos_finales_escaneados_path);
                    if (Array.isArray(scannedDocsPaths)) {
                        scannedDocsPaths.forEach((path, index) => {
                            allDocs.push({
                                nombre_archivo: `Documento Final Escaneado ${index + 1}`,
                                ruta_archivo_local: path,
                                tipo_archivo: 'PAQUETE_FINAL_ESCANEADO'
                            });
                        });
                    }
                } catch (e) {
                    console.error('Error parsing documentos_finales_escaneados_path JSON:', e);
                    // Optionally handle as a plain string if parsing fails
                    allDocs.push({
                        nombre_archivo: 'Documentos Finales Escaneados (Error de formato)',
                        ruta_archivo_local: finalDocsMetadata.documentos_finales_escaneados_path,
                        tipo_archivo: 'PAQUETE_FINAL_ESCANEADO_ERROR'
                    });
                }
            }
        }
        caseDetails.documentos = allDocs;

        return caseDetails;
    } finally {
        if (connection) connection.release();
    }
  }
}

export default new AdminService();
