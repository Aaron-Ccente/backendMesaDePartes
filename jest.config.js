/** @type {import('jest').Config} */
const config = {
  // Indica a Jest que use el entorno de Node.js para las pruebas
  testEnvironment: 'node',
  
  // Habilita el soporte para módulos ES6 (import/export)
  transform: {},
  
  // Patrones que Jest usa para detectar archivos de prueba
  testMatch: [
    '**/__tests__/**/*.js?(x)',
    '**/?(*.)+(spec|test).js?(x)'
  ],

  // Resuelve las extensiones de los módulos
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  
  // Verbose output
  verbose: true,
};

export default config;
