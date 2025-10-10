import GoogleAPI from '../services/googleAPI.js';
import stream from 'stream';

export const GoogleController = {
  async upload(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Archivo requerido (campo "file")' });
      const { originalname, mimetype, buffer } = req.file;
      const result = await GoogleAPI.uploadFile({ buffer: stream.Readable.from(buffer), mimeType: mimetype, name: originalname, folderId: req.body.folderId });
      if (!result.success) return res.status(500).json(result);
      return res.json({ success: true, message: 'Archivo subido', data: result.data });
    } catch (err) {
      console.error('GoogleController.upload error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async listFiles(req, res) {
    try {
      const { folderId, q, pageSize } = req.query;
      const result = await GoogleAPI.listFiles({ folderId, q, pageSize: Number(pageSize) || 100 });
      if (!result.success) return res.status(500).json(result);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('GoogleController.listFiles error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMetadata(req, res) {
    try {
      const { id } = req.params;
      const result = await GoogleAPI.getFileMetadata(id);
      if (!result.success) return res.status(404).json(result);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('GoogleController.getMetadata error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async download(req, res) {
    try {
      const { id } = req.params;
      const result = await GoogleAPI.downloadFileStream(id);
      if (!result.success) return res.status(404).json(result);

      // obtener metadata para nombre/mimetype
      const meta = await GoogleAPI.getFileMetadata(id);
      const filename = meta.success ? (meta.data.name || id) : id;
      const mimeType = meta.success ? (meta.data.mimeType || 'application/octet-stream') : 'application/octet-stream';

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', mimeType);

      result.stream.pipe(res);
    } catch (err) {
      console.error('GoogleController.download error', err);
      if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await GoogleAPI.deleteFile(id);
      if (!result.success) return res.status(500).json(result);
      return res.json({ success: true, message: 'Archivo eliminado' });
    } catch (err) {
      console.error('GoogleController.delete error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createFolder(req, res) {
    try {
      const { name, parentId } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'name es requerido' });
      const result = await GoogleAPI.createFolder({ name, parentId });
      if (!result.success) return res.status(500).json(result);
      return res.json({ success: true, data: result.data });
    } catch (err) {
      console.error('GoogleController.createFolder error', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};