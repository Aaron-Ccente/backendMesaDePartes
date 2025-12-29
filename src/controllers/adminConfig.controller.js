import { ConfiguracionService } from '../services/ConfiguracionService.js';

export const getConfigs = async (req, res) => {
  try {
    const configs = await ConfiguracionService.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateConfigs = async (req, res) => {
  try {
    const { configs } = req.body; // Espera array [{ clave, valor }]
    if (!Array.isArray(configs)) {
      return res.status(400).json({ success: false, message: 'Formato inválido' });
    }
    
    const result = await ConfiguracionService.updateConfigs(configs);
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
