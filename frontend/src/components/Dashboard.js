import React, { useEffect, useState } from 'react';
import { getStats, listFiles, formatBytes, getFileIcon } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard({ onNavigate, refreshKey }) {
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, filesRes] = await Promise.all([
          getStats(),
          listFiles({ limit: 8, sort: 'created_at', order: 'desc' }),
        ]);
        setStats(statsRes.data);
        setRecentFiles(filesRes.data.files || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const s = stats?.summary || {};
  const byType = stats?.by_type || [];

  const mockWeekly = [42, 67, 38, 91, 55, 73, 48];
  const maxBar = Math.max(...mockWeekly);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Files</div>
          <div className="stat-value stat-accent">{loading ? '—' : (s.total_files || 0)}</div>
          <div className="stat-sub">stored in S3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Storage</div>
          <div className="stat-value">{loading ? '—' : formatBytes(s.total_size || 0)}</div>
          <div className="stat-sub">across all buckets</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Folders</div>
          <div className="stat-value">{loading ? '—' : (s.total_folders || 0)}</div>
          <div className="stat-sub">in PostgreSQL</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Downloads</div>
          <div className="stat-value">{loading ? '—' : (s.total_downloads || 0)}</div>
          <div className="stat-sub">total all time</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Uploads</div>
            <span className="section-link" onClick={() => onNavigate('files')}>View all →</span>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /> Loading...</div>
          ) : recentFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: 13 }}>
              No files uploaded yet.<br />
              <span className="section-link" onClick={() => onNavigate('upload')}>Upload your first file →</span>
            </div>
          ) : (
            recentFiles.map(file => (
              <div className="recent-file" key={file.id}>
                <span style={{ fontSize: 20 }}>{getFileIcon(file.mime_type)}</span>
                <span className="recent-file-name">{file.original_name}</span>
                <span className="recent-file-meta">
                  {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                </span>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-header">
              <div className="section-title">Upload Activity (7d)</div>
            </div>
            <div className="bar-chart">
              {mockWeekly.map((v, i) => (
                <div className="bar-group" key={i}>
                  <div className="bar" style={{ height: `${(v / maxBar) * 100}%` }} title={`${v} uploads`} />
                  <div className="bar-label">{days[i]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <div className="section-title">File Types</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{color:'var(--text-muted)',fontSize:12,fontFamily:'Space Mono,monospace'}}>Loading...</div>
              ) : byType.length === 0 ? (
                <div style={{color:'var(--text-muted)',fontSize:12}}>No data yet</div>
              ) : (
                byType.slice(0, 5).map((t, i) => {
                  const colors = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--danger)', '#a277ff'];
                  return (
                    <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, flex: 1, textTransform: 'capitalize' }}>{t.type || 'other'}</span>
                      <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>
                        {t.count} · {formatBytes(t.size)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
