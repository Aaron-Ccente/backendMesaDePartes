import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const OAUTH_FILE = path.join(process.cwd(), 'oauth_client.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise((resolve) => rl.question(q, (a) => resolve(a)));

const loadOauthFile = () => {
  if (!fs.existsSync(OAUTH_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(OAUTH_FILE, 'utf-8'));
  } catch (e) {
    return null;
  }
};

const getOAuthClient = () => {
  const creds = loadOauthFile();
  if (creds) {
    const cfg = creds.installed || creds.web;
    if (!cfg) throw new Error('oauth_client.json no contiene "installed" ni "web".');
    const { client_id, client_secret, redirect_uris } = cfg;
    const redirect = (redirect_uris && redirect_uris[0]) || 'urn:ietf:wg:oauth:2.0:oob';
    return new google.auth.OAuth2(client_id, client_secret, redirect);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';
  if (clientId && clientSecret) return new google.auth.OAuth2(clientId, clientSecret, redirect);

  throw new Error('No encontré credenciales OAuth. Coloca oauth_client.json en la raíz o define GOOGLE_OAUTH_CLIENT_ID/SECRET en .env');
};

const run = async () => {
  try {
    const oAuth2Client = getOAuthClient();

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    console.log('\n1) Abre esta URL en el navegador y concede permisos:\n\n', authUrl, '\n');
    const code = await question('2) Pega aquí el código de autorización y presiona Enter: ');
    rl.close();

    const { tokens } = await oAuth2Client.getToken(code.trim());
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { encoding: 'utf-8' });
    console.log('\nTokens guardados en', TOKEN_PATH);

    if (tokens.refresh_token) {
      console.log('\nRefresh token (cópialo en tu .env):\n', tokens.refresh_token);
    } else {
      console.warn('\nNo se devolvió refresh_token. Repite con "prompt: consent" y asegúrate de usar una cuenta de usuario (no una cuenta de servicio).');
      if (tokens.access_token) console.log('Access token obtenido (temporal).');
    }

    process.exit(0);
  } catch (err) {
    rl.close();
    console.error('Error en auth_ini:', err.message || err);
    process.exit(1);
  }
};

run();
