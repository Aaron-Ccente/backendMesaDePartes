import { MesaDePartes } from "../models/MesaDePartes.js";
import { Validators } from "../utils/validators.js";

export class MesaDePartesController {
  static async login(req, res) {
    try {
      const { CIP, password_hash } = req.body;
      const validation = Validators.validateLoginCredentials({
        CIP,
        password_hash,
      });
      if (!validation.isValid) {
        return res
          .status(400)
          .json({ success: false, message: validation.message });
      }

      // Buscar perito por CIP
      const mesadepartes = await MesaDePartes.findByCIP(CIP);

      if (!mesadepartes) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(
        password_hash,
        mesadepartes.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        });
      }

      // Remover contraseña de la respuesta
      const { Contrasena, ...mesadepartesSinPassword } = mesadepartes;

      // Generar JWT token para peritos
      res.status(200).json({
        success: true,
        message: "Login exitoso",
        data: mesadepartesSinPassword,
      });
    } catch (error) {
      if (error.message === "Credenciales inválidas") {
        return res
          .status(401)
          .json({ success: false, message: "Credenciales inválidas" });
      }
      return res
        .status(500)
        .json({
          success: false,
          message: "Error interno del servidor",
          error: error.message,
        });
    }
  }

  static async createMesaDePartes(req, res){
    try {
          const mesaDePartes = req.body;
          
          // Validar datos del perito
          const validation = Validators.validateAdminData(mesaDePartes);
          if (!validation.isValid) {
            return res.status(400).json({
              success: false,
              message: validation.message
            });
          }
    
          // Crear el perito
          const result = await Perito.create(peritoData);
          
          res.status(201).json(result);
        } catch (error) {
          console.error('Error creando perito:', error);
          
          if (error.message.includes('ya está registrado') || error.message.includes('ya está en uso')) {
            return res.status(409).json({
              success: false,
              message: error.message
            });
          }
          
          res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
          });
        }
  }

  static async getAllMesaDePartes(){

  }

  static async updateMesaDePartes(req, res){

  }

  static async deleteMesaDePartes(req, res){

  }

}
