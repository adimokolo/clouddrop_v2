import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 120000,
});

API.interceptors.request.use((config) => {
  config.headers['x-user-id'] = 'demo-user';
  return config;
});

export const uploadFile = (file, options = {}, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (options.folder) formData.append('folder', options.folder);
  if (options.tags) formData.append('tags', JSON.stringify(options.tags));
  if (options.isPublic) formData.append('isPublic', options.isPublic);

  return API.post('/api/uploads/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
};

export const uploadBulk = (files, folder = 'root', onProgress) => {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  formData.append('folder', folder);
  return API.post('/api/uploads/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => { if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); },
  });
};

export const listFiles = (params = {}) => API.get('/api/files', { params });
export const getFile = (id) => API.get(`/api/files/${id}`);
export const downloadFile = (id) => API.get(`/api/files/${id}/download`);
export const deleteFile = (id) => API.delete(`/api/files/${id}`);
export const updateFile = (id, data) => API.patch(`/api/files/${id}`, data);
export const getStats = () => API.get('/api/files/stats/summary');

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📕';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz')) return '📦';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('text/')) return '📃';
  return '📄';
};

export const getMimeBadgeClass = (mimeType) => {
  if (!mimeType) return '';
  if (mimeType.startsWith('image/')) return 'mime-image';
  if (mimeType.startsWith('video/')) return 'mime-video';
  if (mimeType.startsWith('audio/')) return 'mime-audio';
  if (mimeType === 'application/pdf') return 'mime-pdf';
  return '';
};
