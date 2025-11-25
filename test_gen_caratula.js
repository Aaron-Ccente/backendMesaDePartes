import { DocumentBuilderService } from './src/services/DocumentBuilderService.js';
import db from './src/database/db.js';

async function test() {
    try {
        console.log('Starting test...');
        const id_oficio = 6;
        const id_usuario = 7;

        const result = await DocumentBuilderService.generarCaratula(id_oficio, id_usuario, {});

        if (result && result.pdfBuffer) {
            console.log('SUCCESS: PDF Buffer generated. Size:', result.pdfBuffer.length);
        } else {
            console.error('FAILURE: No PDF buffer returned.');
        }
    } catch (error) {
        const fs = await import('fs/promises');
        await fs.writeFile('error_log.txt', `ERROR: ${error.message}\nSTACK: ${error.stack}`);
        console.error('TEST ERROR:', error.message);
    } finally {
        await db.promise().end();
        process.exit(0);
    }
}

test();
