import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

  if (!clientId || !clientSecret) {
    throw new Error('Faltan GOOGLE_OAUTH_CLIENT_ID o GOOGLE_OAUTH_CLIENT_SECRET en .env');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const prompt = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const obtainRefreshToken = async (oAuth2Client) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('1) Abre esta URL en el navegador y concede acceso:\n', authUrl);
  const code = await prompt('2) Pega aquí el código que obtuviste y presiona Enter: ');

  const { tokens } = await oAuth2Client.getToken(code.trim());
  if (!tokens.refresh_token) {
    console.warn('No se obtuvo refresh_token. Repite con "prompt: consent" y asegúrate de usar una cuenta de usuario.');
  }
  console.log('Tokens obtenidos:\n', tokens);
  console.log('\nCopia el valor refresh_token en tu .env como GOOGLE_OAUTH_REFRESH_TOKEN y reinicia el script.');
  return tokens.refresh_token || tokens;
};

const uploadFileToDrive = async ({ auth, filePath, name, mimeType, folderId }) => {
  const drive = google.drive({ version: 'v3', auth });
  const parents = folderId ? [folderId] : undefined;

  const mediaBody = fs.createReadStream(filePath);

  try {
    const res = await drive.files.create({
      requestBody: { name, parents },
      media: { mimeType, body: mediaBody },
      supportsAllDrives: true,
      fields: 'id,name,mimeType,parents,webViewLink'
    });
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, message: err?.errors || err?.message || err, error: err };
  }
};

const main = async () => {
  try {
    const filePath = path.join(__dirname, 'test.txt');
    if (!fs.existsSync(filePath)) {
      console.error('Archivo test.txt no encontrado en', filePath);
      process.exit(1);
    }

    const oAuth2Client = getOAuthClient();

    let refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    if (!refreshToken) {
      refreshToken = await obtainRefreshToken(oAuth2Client);
      process.exit(0);
    }

    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    await oAuth2Client.getAccessToken();

    const name = 'test.txt';
    const mimeType = 'text/plain';
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || undefined;

    console.log('Subiendo', filePath, 'a Google Drive (folderId:', folderId, ')');

    const result = await uploadFileToDrive({
      auth: oAuth2Client,
      filePath,
      name,
      mimeType,
      folderId
    });

    if (result.success) {
      console.log('Archivo subido correctamente:', result.data);
      process.exit(0);
    } else {
      console.error('Error al subir archivo:', result.message || result.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('Excepción en testingCreateDocument:', err);
    process.exit(1);
  }
};

main();