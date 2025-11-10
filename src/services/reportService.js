import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer-core';
import { Oficio } from '../models/Oficio.js';
import { fileURLToPath } from 'url';

// Helper para encontrar el ejecutable de Chrome
async function findChromeExecutable() {
    // Rutas comunes para Windows
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];

    for (const p of paths) {
        try {
            await fs.access(p);
            return p;
        } catch (e) {
            // No encontrado, continuar
        }
    }
    throw new Error('No se pudo encontrar el ejecutable de Google Chrome. Asegúrate de que esté instalado.');
}


export class ReportService {

  /**
   * Genera un reporte en PDF para un oficio específico.
   * @param {number} id_oficio - El ID del oficio.
   * @returns {Promise<Buffer>} - Un buffer con el contenido del PDF.
   */
  static async generateReport(id_oficio) {
    let browser = null;
    try {
      // 1. Obtener todos los datos necesarios en paralelo
      const [oficioResult, resultadosResult, seguimientoResult] = await Promise.all([
        Oficio.findById(id_oficio),
        Oficio.getResultados(id_oficio),
        Oficio.getSeguimiento(id_oficio)
      ]);

      if (!oficioResult.success) {
        throw new Error('Oficio no encontrado.');
      }

      const data = {
        oficio: oficioResult.data,
        resultados: resultadosResult.success ? resultadosResult.data : [],
        seguimiento: seguimientoResult.success ? seguimientoResult.data : [],
      };

      // 2. Cargar y compilar el template de Handlebars
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const templatePath = path.join(__dirname, '..', 'templates', 'reporte.hbs');
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Registrar un helper para formatear JSON
      handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context, null, 2);
      });

      const template = handlebars.compile(templateContent);
      const html = template(data);

      // 3. Usar Puppeteer para generar el PDF
      const executablePath = await findChromeExecutable();
      browser = await puppeteer.launch({
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      return pdfBuffer;

    } catch (error) {
      console.error("Error generando el reporte en PDF:", error);
      throw error; // Propagar el error al controlador
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
