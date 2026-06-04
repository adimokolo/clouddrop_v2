import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../utils/api';
import { formatBytes, getFileIcon } from '../utils/api';

const STATUS = { PENDING: 'pending', UPLOADING: 'uploading', DONE: 'done', ERROR: 'error' };

export default function UploadZone({ onUploadComplete }) {
  const [queue, setQueue] = useState([]);
  const [folder, setFolder] = useState('root');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const items = acceptedFiles.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: STATUS.PENDING,
      progress: 0,
      error: null,
    }));
    setQueue(prev => [...prev, ...items]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 500 * 1024 * 1024,
  });

  const updateItem = (id, patch) => setQueue(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const handleUpload = async () => {
    const pending = queue.filter(i => i.status === STATUS.PENDING);
    if (!pending.length) return;
    setUploading(true);

    for (const item of pending) {
      updateItem(item.id, { status: STATUS.UPLOADING, progress: 0 });
      try {
        await uploadFile(
          item.file,
          { folder, isPublic: isPublic.toString() },
          (pct) => updateItem(item.id, { progress: pct })
        );
        updateItem(item.id, { status: STATUS.DONE, progress: 100 });
      } catch (err) {
        updateItem(item.id, { status: STATUS.ERROR, error: err.response?.data?.error || err.message });
      }
    }

    setUploading(false);
    const doneCount = queue.filter(i => i.status === STATUS.DONE).length + pending.length;
    showToast(`${pending.length} file(s) uploaded successfully`);
    onUploadComplete?.();
  };

  const removeItem = (id) => setQueue(prev => prev.filter(i => i.id !== id));
  const clearAll = () => setQueue([]);

  const pendingCount = queue.filter(i => i.status === STATUS.PENDING).length;

  return (
    <div className="upload-zone-wrapper">
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'drag-active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon">
          {isDragActive ? '⬇' : '☁'}
        </div>
        <div className="dropzone-title">
          {isDragActive ? 'Drop to upload' : 'Drag & drop files here'}
        </div>
        <div className="dropzone-subtitle">
          or click to browse your computer
        </div>
        <div className="dropzone-hint">
          MAX 500 MB · Any file type · Stored on AWS S3
        </div>
      </div>

      <div className="upload-options">
        <div className="option-group">
          <label className="option-label">Destination Folder</label>
          <input
            className="option-input"
            value={folder}
            onChange={e => setFolder(e.target.value)}
            placeholder="root"
          />
        </div>
        <div className="option-group">
          <label className="option-label">Visibility</label>
          <select
            className="option-select"
            value={isPublic ? 'public' : 'private'}
            onChange={e => setIsPublic(e.target.value === 'public')}
          >
            <option value="private">🔒 Private (signed URLs)</option>
            <option value="public">🌐 Public (direct link)</option>
          </select>
        </div>
      </div>

      {queue.length > 0 && (
        <>
          <div className="upload-queue">
            {queue.map(item => (
              <div key={item.id} className={`queue-item ${item.status}`}>
                <div className="file-type-icon">{getFileIcon(item.file.type)}</div>
                <div className="queue-info">
                  <div className="queue-name">{item.file.name}</div>
                  <div className="queue-meta">{formatBytes(item.file.size)} · {item.file.type || 'unknown'}</div>
                  {item.error && <div style={{fontSize:'11px',color:'var(--danger)',marginTop:2}}>{item.error}</div>}
                </div>
                {item.status === STATUS.UPLOADING && (
                  <div className="queue-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="progress-text">{item.progress}%</div>
                  </div>
                )}
                <div className="queue-status">
                  {item.status === STATUS.PENDING && (
                    <button className="action-btn danger" onClick={() => removeItem(item.id)}>✕</button>
                  )}
                  {item.status === STATUS.UPLOADING && <span style={{color:'var(--accent)'}}>↑</span>}
                  {item.status === STATUS.DONE && <span style={{color:'var(--accent)'}}>✓</span>}
                  {item.status === STATUS.ERROR && <span style={{color:'var(--danger)'}}>✗</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading || pendingCount === 0}
            >
              {uploading ? (
                <><span className="spinner" style={{borderTopColor:'#0a0b0d'}}/>Uploading...</>
              ) : (
                `↑ Upload ${pendingCount} File${pendingCount !== 1 ? 's' : ''}`
              )}
            </button>
            <button className="btn btn-ghost" onClick={clearAll} disabled={uploading}>
              Clear All
            </button>
          </div>
        </>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
}
