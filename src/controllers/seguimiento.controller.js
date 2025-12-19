import { Oficio } from '../models/Oficio.js';

export const getCasosSeguimiento = async (req, res) => {
  try {
    // El rol y el ID del usuario se obtendrán del token de autenticación (req.user)
    const { role, id_usuario } = req.user; // Corregido de 'rol' a 'role'
    const { estado } = req.query; // Para el filtro ?estado=pendiente o ?estado=todos

    let casos;

    // Lógica para determinar qué casos buscar según el rol
    if (role === 'admin') { // Estandarizar a minúsculas
      // El admin ve todos los casos
      casos = await Oficio.getTodosLosCasos({ estado });
    } else if (role === 'mesadepartes') { // Corregido de 'CENTRAL' a 'mesadepartes'
      // Mesa de Partes ve los casos que ha creado
      casos = await Oficio.getCasosPorCreador({ estado });
    } else {
      // Otros peritos no deberían acceder a esta vista general
      return res.status(403).json({ message: 'Acceso no autorizado para este rol.' });
    }

    if (!casos.success) {
      // Si la consulta al modelo falla, enviar un error
      return res.status(500).json({ message: casos.message || 'Error al consultar los casos.' });
    }

    res.status(200).json({ data: casos.data });

  } catch (error) {
    console.error('Error al obtener casos para seguimiento:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener casos.' });
  }
};

export const getDetalleCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const casoDetalle = await Oficio.findDetalleById(id);

    if (!casoDetalle.success) {
      return res.status(404).json({ message: casoDetalle.message });
    }

    res.status(200).json({ data: casoDetalle.data });

  } catch (error) {
    console.error('Error al obtener el detalle del caso:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener el detalle.' });
  }
};

export const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    const { id_usuario } = req.user; // El perito que realiza la acción

    if (!nuevo_estado) {
      return res.status(400).json({ message: 'El campo "nuevo_estado" es requerido.' });
    }

    // Aquí se podría añadir una validación para asegurar que el estado es uno de los permitidos
    // (ej. 'OFICIO VISTO', 'OFICIO EN PROCESO')

    const result = await Oficio.addSeguimiento({
      id_oficio: id,
      id_usuario: id_usuario,
      estado_nuevo: nuevo_estado,
    });

    if (!result.success) {
      return res.status(500).json({ message: result.message });
    }

    res.status(200).json({ message: `Estado del oficio actualizado a: ${nuevo_estado}` });

  } catch (error) {
    console.error('Error al actualizar el estado del caso:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el estado.' });
  }
};

export const getPeritosParaDerivacion = async (req, res) => {
  try {
    const { casoId } = req.query;
    if (!casoId) {
      return res.status(400).json({ message: 'El "casoId" es requerido.' });
    }

    const result = await Oficio.findPeritosParaDerivacion(casoId);

    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }

    res.status(200).json({ data: result.data });

  } catch (error) {
    console.error('Error al obtener peritos para derivación:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
