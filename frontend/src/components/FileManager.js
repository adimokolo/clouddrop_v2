import React, { useState, useEffect, useCallback } from 'react';
import { listFiles, deleteFile, downloadFile, formatBytes, getFileIcon, getMimeBadgeClass } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const MIME_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Images', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
  { label: 'Documents', value: 'application' },
  { label: 'Text', value: 'text' },
];

export default function FileManager({ refreshKey }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (mimeFilter) params.mime_type = mimeFilter;
      const { data } = await listFiles(params);
      setFiles(data.files || []);
      setPagination(data.pagination || {});
    } catch (err) {
      showToast('Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, mimeFilter, refreshKey]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  useEffect(() => { setPage(1); }, [search, mimeFilter]);

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.original_name}"?`)) return;
    setDeleting(file.id);
    try {
      await deleteFile(file.id);
      showToast(`Deleted "${file.original_name}"`);
      fetchFiles();
    } catch (err) {
      showToast('Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const { data } = await downloadFile(file.id);
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  const handleCopyLink = async (file) => {
    try {
      const { data } = await downloadFile(file.id);
      await navigator.clipboard.writeText(data.downloadUrl);
      showToast('Link copied to clipboard');
    } catch (err) {
      showToast('Copy failed', 'error');
    }
  };

  const getMimeLabel = (mimeType) => {
    if (!mimeType) return 'unknown';
    const parts = mimeType.split('/');
    return parts[1]?.split(';')[0]?.toUpperCase() || parts[0];
  };

  return (
    <div>
      <div className="fm-toolbar">
        <div className="fm-search">
          <span className="fm-search-icon">⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
          />
        </div>
        <div className="fm-filters">
          {MIME_FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-btn ${mimeFilter === f.value ? 'active' : ''}`}
              onClick={() => setMimeFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No files found</h3>
            <p>{search ? 'Try adjusting your search terms' : 'Upload some files to get started'}</p>
          </div>
        ) : (
          <div className="file-table-wrap">
            <table className="file-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Folder</th>
                  <th>Downloads</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td>
                      <div className="file-name-cell">
                        <span style={{ fontSize: 18 }}>{getFileIcon(file.mime_type)}</span>
                        <span className="file-name-text" title={file.original_name}>
                          {file.original_name}
                        </span>
                        {file.is_public && (
                          <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 4 }}>🌐</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`mime-badge ${getMimeBadgeClass(file.mime_type)}`}>
                        {getMimeLabel(file.mime_type)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
                      {formatBytes(file.file_size)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      /{file.folder}
                    </td>
                    <td style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {file.download_count}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </td>
                    <td>
                      <div className="action-cell">
                        <button className="action-btn" title="Download" onClick={() => handleDownload(file)}>↓</button>
                        <button className="action-btn" title="Copy link" onClick={() => handleCopyLink(file)}>⎘</button>
                        <button
                          className="action-btn danger"
                          title="Delete"
                          disabled={deleting === file.id}
                          onClick={() => handleDelete(file)}
                        >
                          {deleting === file.id ? '…' : '✕'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <div className="page-info">
            Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total} files
          </div>
          <div className="page-btns">
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <button className="btn btn-ghost" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
}
