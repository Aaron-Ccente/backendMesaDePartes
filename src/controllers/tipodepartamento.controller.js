import { TipoDepartamento } from "../models/TipoDepartamento.js";

export class TipodepartamentoController{
    static async getAllTiposDepartamento(_,res){
        try {
            const tipodepartamentos = await TipoDepartamento.findAll();
            res.status(200).json({
            success: true,
            data: tipodepartamentos
             });
            } catch (error) {
            res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
            });
        }
    }
}