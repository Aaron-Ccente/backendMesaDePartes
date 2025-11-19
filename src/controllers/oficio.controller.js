import { Oficio } from '../models/Oficio.js';
import { Validators } from '../utils/validators.js';
import { WorkflowService } from '../services/workflowService.js';
import { DocumentBuilderService } from '../services/DocumentBuilderService.js';

export class OficioController {

  static async getAllOficios(_, res) {
    try {
      const result = await Oficio.findAll();
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  static async getOficioById(req, res) {
    try {
      const { id } = req.params;
      const result = await Oficio.findById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  static async createOficio(req, res) {
    try {
      const { mesadepartesData, ...oficioData } = req.body;

      if (!mesadepartesData?.id_usuario) {
        return res.status(400).json({
          success: false,
          message: "Datos del usuario de mesa de partes incompletos"
        });
      }

      // --- MAPEO DE CAMPOS FRONTEND -> BACKEND ---
      const oficioMapeado = {
        numero_oficio: oficioData.numeroOficio,
        unidad_solicitante: oficioData.fiscalia,
        unidad_remitente: oficioData.fiscal_remitente,
        region_fiscalia: oficioData.regionSolicitante,
        tipo_de_muestra: oficioData.tipo_de_muestra,
        asunto: oficioData.asunto,
        examinado_incriminado: oficioData.implicado,
        dni_examinado_incriminado: oficioData.dniImplicado,
        delito: oficioData.delito,
        direccion_implicado: oficioData.direccionImplicado,
        celular_implicado: oficioData.celular,
        fecha_hora_incidente: `${oficioData.fechaIncidente} ${oficioData.horaIncidente}`,
        especialidad_requerida: oficioData.especialidad_requerida,
        id_especialidad_requerida: oficioData.id_especialidad_requerida,
        muestra: oficioData.muestra,
        perito_asignado: oficioData.perito_asignado,
        cip_perito_asignado: oficioData.cip_perito_asignado,
        id_usuario_perito_asignado: oficioData.id_usuario_perito_asignado,
        id_prioridad: oficioData.id_prioridad,
        id_tipos_examen: oficioData.id_tipos_examen, // Pasar para la tabla pivote
        creado_por: mesadepartesData.id_usuario,
        actualizado_por: mesadepartesData.id_usuario
      };
      // --- FIN DEL MAPEO ---

      const validation = Validators.validateOficioData(oficioMapeado);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Datos del oficio inválidos",
          errors: validation.errors
        });
      }

      const result = await Oficio.create(oficioMapeado);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || "Error al crear el oficio",
          errors: result.errors
        });
      }

      return res.status(201).json({
        success: true,
        message: "Oficio creado exitosamente",
        data: {
          id_oficio: result.data.id_oficio,
          numero_oficio: oficioMapeado.numero_oficio
        }
      });

    } catch (error) {
      console.error('Error al crear oficio:', error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear el oficio"
      });
    }
  }

  static async checkNumero(req, res) {
    try {
      const { numero } = req.params;
      if (!numero || String(numero).trim() === "") {
        return res.status(400).json({ success: false, message: "Número de oficio requerido" });
      }

      const result = await Oficio.existsByNumero(numero);
      if (!result.success) {
        return res.status(500).json({ success: false, message: result.message || "Error verificando número" });
      }

      return res.json({ success: true, exists: !!result.exists });
    } catch (error) {
      console.error('Error en checkNumero:', error);
      return res.status(500).json({ success: false, message: "Error interno al verificar número de oficio" });
    }
  }

  static async getSeguimientoOficio(req, res) {
    try {
      const { id } = req.params;
      const result = await Oficio.getSeguimiento(id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }

  static async getAssignedToUser(req, res) {
    try {
      const userId = req.user?.id_usuario ?? null;
      const userCIP = req.user?.CIP ?? null;

      const result = await Oficio.findAssignedToUser({ id_usuario: userId, CIP: userCIP, excludeCompleted: true });
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error en getAssignedToUser:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener oficios asignados' });
    }
  }

  static async getCasosAsignadosPorFuncion(req, res) {
    try {
      const { funcion } = req.query;
      const perito = req.user;

      if (!funcion) {
        return res.status(400).json({ success: false, message: 'El parámetro "funcion" es requerido' });
      }

      const result = await Oficio.findCasosPorFuncion({ perito, funcion });

      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.json({ success: true, data: result.data });

    } catch (error) {
      console.error('Error en getCasosAsignadosPorFuncion:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener casos por función' });
    }
  }

  static async getAlertas(req, res) {
    try {
      const userId = req.user?.id_usuario ?? null;
      const userCIP = req.user?.CIP ?? null;

      const result = await Oficio.getCountNewOficios({ id_usuario: userId, CIP: userCIP });
      if (!result.success) {
        return res.status(500).json(result);
      }
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error en getAlertas:', error);
      return res.status(500).json({ success: false, message: 'Error interno al obtener alertas' });
    }
  }

  static async respondToOficio(req, res) {
    try {
      const { id } = req.params;
      const { estado_nuevo, estado_anterior = null } = req.body;

      if (!id || !estado_nuevo) {
        return res.status(400).json({ success: false, message: 'ID de oficio y estado nuevo son requeridos' });
      }

      const id_usuario = req.user?.id_usuario;
      if (!id_usuario) {
        return res.status(400).json({ success: false, message: 'Usuario no identificado' });
      }

      const seguimientoResult = await Oficio.addSeguimiento({
        id_oficio: Number(id),
        id_usuario,
        estado_anterior,
        estado_nuevo
      });

      if (!seguimientoResult.success) {
        return res.status(500).json({ success: false, message: 'Error al guardar seguimiento' });
      }

      return res.status(201).json({ success: true, message: 'Seguimiento creado correctamente' });
    } catch (error) {
      console.error('Error en respondToOficio:', error);
      return res.status(500).json({ success: false, message: 'Error interno al responder oficio' });
    }
  }

  static async derivarOficio(req, res) {
    try {
      const { id } = req.params;
      const id_perito_actual = req.user.id_usuario;
      const { id_nuevo_perito, nombre_seccion_destino } = req.body;

      if (!id_nuevo_perito || !nombre_seccion_destino) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren "id_nuevo_perito" y "nombre_seccion_destino".',
        });
      }

      const result = await Oficio.reasignarPerito(Number(id), Number(id_nuevo_perito), id_perito_actual, nombre_seccion_destino);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error en OficioController.derivarOficio:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al derivar el oficio',
      });
    }
  }

  static async addResultadoOficio(req, res) {
    try {
      const { id } = req.params;
      const id_perito_responsable = req.user.id_usuario;
      const { tipo_resultado, resultados } = req.body;

      if (!tipo_resultado || !resultados) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren "tipo_resultado" y "resultados".',
        });
      }

      await Oficio.addResultado({
        id_oficio: Number(id),
        id_perito_responsable,
        tipo_resultado,
        resultados,
      });

      const nextStep = await WorkflowService.getNextStep(Number(id));

      return res.status(201).json({
        success: true,
        message: 'Resultado agregado exitosamente.',
        next_step_info: nextStep
      });
    } catch (error) {
      console.error('Error en addResultadoOficio:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno al agregar el resultado.',
      });
    }
  }

  static async generarReporte(req, res) {
    try {
      const { id } = req.params;
      // Por defecto generamos el informe pericial si no se especifica otro
      // TODO: Recibir el tipo de reporte por query param o body si hay varios
      const pdfResult = await DocumentBuilderService.build('lab/informe_pericial_lab', Number(id));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_oficio_${id}.pdf`);
      res.send(pdfResult.pdfBuffer);
    } catch (error) {
      console.error('Error en generarReporte:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno al generar el reporte.',
      });
    }
  }
}
