import React, { useEffect, useState } from 'react';
import { getStats, formatBytes } from '../utils/api';

export default function StatsPanel({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getStats();
        setStats(data);
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
  const totalSize = parseInt(s.total_size) || 1;

  const typeColors = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--danger)', '#a277ff', 'var(--text-secondary)'];

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Files</div>
          <div className="stat-value stat-accent">{loading ? '—' : s.total_files || 0}</div>
          <div className="stat-sub">across all folders</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg File Size</div>
          <div className="stat-value">{loading ? '—' : formatBytes(s.avg_file_size || 0)}</div>
          <div className="stat-sub">per upload</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Downloads</div>
          <div className="stat-value">{loading ? '—' : s.total_downloads || 0}</div>
          <div className="stat-sub">presigned URL access</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="section-header">
            <div className="section-title">Storage by File Type</div>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /> Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byType.map((t, i) => {
                const pct = Math.round((t.size / totalSize) * 100);
                return (
                  <div key={t.type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[i] }} />
                        <span style={{ fontSize: 12, textTransform: 'capitalize', fontWeight: 600 }}>{t.type || 'other'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)' }}>{t.count} files</span>
                        <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: 'var(--text-secondary)' }}>{formatBytes(t.size)}</span>
                        <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: typeColors[i], width: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: typeColors[i], borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
              {byType.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                  No data available yet
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div className="section-title">Infrastructure Status</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'AWS S3 Bucket', status: 'Operational', region: 'us-east-1', color: 'var(--accent)' },
              { label: 'PostgreSQL RDS', status: 'Connected', region: 'us-east-1', color: 'var(--accent)' },
              { label: 'EC2 API Server', status: 'Running', region: 'us-east-1', color: 'var(--accent)' },
              { label: 'GitHub Actions CI', status: 'Passing', region: 'N/A', color: 'var(--accent)' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace' }}>{item.region}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: item.color }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                  {item.status}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>S3 Bucket Info</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Total Size', formatBytes(s.total_size || 0)],
                ['Files', s.total_files || 0],
                ['Folders', s.total_folders || 0],
                ['Avg Size', formatBytes(s.avg_file_size || 0)],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
