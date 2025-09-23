export class MesaDePartes{
    static async findByCIP(cip){
      try {
      const [rows] = await db.promise().query(
        'SELECT * FROM usuario AS us INNER JOIN usuario_rol AS ur ON us.id_usuario = ur.id_usuario INNER JOIN rol AS r ON ur.id_rol = r.id_rol WHERE CIP = ? AND r.nombre_rol = "MESADEPARTES"',
        [cip]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error buscando perito por CIP:', error);
      throw error;
    }
    }
}