import { google } from 'googleapis';
import { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI, GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_CLIENT_EMAIL, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_PRIVATE_KEY } from '../config/config.js';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Crea cliente OAuth2.
 */
const createOAuthClient = () => {
  const clientId = GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = GOOGLE_OAUTH_CLIENT_SECRET;
  const redirect = GOOGLE_OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';
  const refreshToken = GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect);
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
};

/**
 * Crea cliente Service Account.
 */
const createServiceAccountClient = () => {
  const clientEmail = GOOGLE_CLIENT_EMAIL;
  let privateKey = GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;

  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n').trim();

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('GOOGLE_PRIVATE_KEY no tiene formato PEM válido.');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
    subject: process.env.GOOGLE_DELEGATED_USER || undefined
  });
};

const getAuth = () => {
  // sube usando la cuota del usuario
  const oauth = createOAuthClient();
  if (oauth) {
    // refrescar token
    return oauth;
  }
  const sa = createServiceAccountClient();
  if (sa) return sa;

  throw new Error('No se encontró configuración válida de autenticación Google (OAuth2 o Service Account).');
};

const getDrive = () => {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
};

const GoogleAPI = {
  async uploadFile({ buffer, mimeType, name, folderId }) {
    try {
      const drive = getDrive();
      const parents = folderId ? [folderId] : (GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : undefined);

      const res = await drive.files.create({
        requestBody: {
          name,
          parents
        },
        media: {
          mimeType,
          body: buffer
        },
        supportsAllDrives: true,
        fields: 'id,name,mimeType,parents,webViewLink'
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('googleAPI.uploadFile error', err?.response?.data || err?.message || err);
      return { success: false, message: err?.response?.data?.error?.message || err?.message || 'Error subiendo archivo', error: err?.response?.data || err };
    }
  },

  async listFiles({ folderId, pageSize = 100, q = '' } = {}) {
    try {
      const drive = getDrive();
      const folder = folderId || GOOGLE_DRIVE_FOLDER_ID;

      let queryParts = ['trashed = false'];
      if (folder) queryParts.push(`'${folder}' in parents`);
      if (q) queryParts.push(`(${q})`);
      const query = queryParts.join(' and ');

      const res = await drive.files.list({
        q: query,
        pageSize,
        fields: 'files(id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

      return { success: true, data: res.data.files || [] };
    } catch (err) {
      console.error('googleAPI.listFiles error', err);
      return { success: false, message: err.message, error: err };
    }
  },

  async getFileMetadata(fileId) {
    try {
      const drive = getDrive();
      const res = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size',
        supportsAllDrives: true
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('googleAPI.getFileMetadata error', err);
      return { success: false, message: err.message, error: err };
    }
  },

  async downloadFileStream(fileId) {
    try {
      const drive = getDrive();
      const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream', supportsAllDrives: true }
      );
      return { success: true, stream: res.data };
    } catch (err) {
      console.error('googleAPI.downloadFileStream error', err);
      return { success: false, message: err.message, error: err };
    }
  },

  async deleteFile(fileId) {
    try {
      const drive = getDrive();
      await drive.files.delete({ fileId, supportsAllDrives: true });
      return { success: true };
    } catch (err) {
      console.error('googleAPI.deleteFile error', err);
      return { success: false, message: err.message, error: err };
    }
  },

  async createFolder({ name, parentId }) {
    try {
      const drive = getDrive();
      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        },
        fields: 'id,name,parents',
        supportsAllDrives: true
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('googleAPI.createFolder error', err);
      return { success: false, message: err.message, error: err };
    }
  }
};

export default GoogleAPI;