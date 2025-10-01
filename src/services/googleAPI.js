import { google } from 'googleapis';
import { GOOGLE_CLIENT_EMAIL, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_PRIVATE_KEY  } from '../config/config.js';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const getAuth = () => {
  const clientEmail = GOOGLE_CLIENT_EMAIL;
  let privateKey = GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) {
    throw new Error('Faltan GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY en .env');
  }
  privateKey = privateKey.replace(/\\n/g, '\n');
  if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
    throw new Error('GOOGLE_PRIVATE_KEY no tiene formato PEM válido. Debe pegar el campo private_key del JSON de la cuenta de servicio (usa \\n para saltos de línea en .env).');
  }

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES
  });
  return jwt;
};

const getDrive = () => {
  const auth = getAuth();
  return google.drive({ version: 'v3', auth });
};

const GoogleAPI = {
  async uploadFile({ buffer, mimeType, name, folderId }) {
    try {
      const drive = getDrive();
      const res = await drive.files.create({
        requestBody: {
          name,
          parents: folderId ? [folderId] : (GOOGLE_DRIVE_FOLDER_ID ? [GOOGLE_DRIVE_FOLDER_ID] : undefined)
        },
        media: {
          mimeType,
          body: buffer
        },
        fields: 'id,name,mimeType,parents,webViewLink'
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('googleAPI.uploadFile error', err);
      return { success: false, message: err.message, error: err };
    }
  },

    async listFiles({ folderId, pageSize = 100, q = '' } = {}) {
    try {
      const drive = getDrive();
      const folder = GOOGLE_DRIVE_FOLDER_ID || folderId;

      let queryParts = ['trashed = false'];
      if (folder) queryParts.push(`'${folder}' in parents`);
      if (q) queryParts.push(`(${q})`);
      const query = queryParts.join(' and ');

      const res = await drive.files.list({
        q: query,
        pageSize,
        fields: 'files(id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size)'
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
        fields: 'id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size'
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
        { responseType: 'stream' }
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
      await drive.files.delete({ fileId });
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
        fields: 'id,name,parents'
      });
      return { success: true, data: res.data };
    } catch (err) {
      console.error('googleAPI.createFolder error', err);
      return { success: false, message: err.message, error: err };
    }
  }
};

export default GoogleAPI;