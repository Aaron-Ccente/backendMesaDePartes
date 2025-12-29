import { Configuracion } from '../models/Configuracion.js';

let configCache = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

export class ConfiguracionService {
  
  static async getAllConfigs() {
    const result = await Configuracion.findAll();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }

  // Retorna objeto { CLAVE: VALOR } para uso fácil
  static async getPublicConfig() {
    const now = Date.now();
    
    if (configCache && (now - lastFetch < CACHE_TTL)) {
      return configCache;
    }

    const configs = await this.getAllConfigs();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.clave] = c.valor;
    });

    configCache = configMap;
    lastFetch = now;
    return configMap;
  }

  static async updateConfigs(configsArray) {
    const result = await Configuracion.updateBatch(configsArray);
    if (result.success) {
      // Invalidar cache
      configCache = null; 
    }
    return result;
  }
}
