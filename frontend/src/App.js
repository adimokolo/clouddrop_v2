import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadZone from './components/UploadZone';
import FileManager from './components/FileManager';
import StatsPanel from './components/StatsPanel';
import Login from './components/Login';
import { isAuthenticated, logout } from './utils/apiClient';
import './App.css';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [activeView, setActiveView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => setRefreshKey(k => k + 1);
  const handleLoginSuccess = () => setAuthed(true);

  if (!authed) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M20 4L36 12V28L20 36L4 28V12L20 4Z" fill="var(--accent)" opacity="0.15" />
              <path d="M20 4L36 12V28L20 36L4 28V12L20 4Z" stroke="var(--accent)" strokeWidth="1.5" />
              <path d="M13 20L18 25L27 16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="logo-text">CloudDrop</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
            { id: 'upload', label: 'Upload', icon: '↑' },
            { id: 'files', label: 'All Files', icon: '⊞' },
            { id: 'stats', label: 'Analytics', icon: '◈' },
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="storage-meter">
            <div className="meter-label">
              <span>Storage Used</span>
              <span className="meter-pct">64%</span>
            </div>
            <div className="meter-track"><div className="meter-fill" style={{ width: '64%' }} /></div>
            <span className="meter-detail">6.4 GB of 10 GB</span>
          </div>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            {activeView === 'dashboard' && 'Overview'}
            {activeView === 'upload' && 'Upload Files'}
            {activeView === 'files' && 'File Manager'}
            {activeView === 'stats' && 'Analytics'}
          </div>
          <div className="topbar-actions">
            <div className="env-badge">AWS · eu-central-1</div>
            <div className="user-avatar">A</div>
          </div>
        </header>
        <div className="view-content">
          {activeView === 'dashboard' && (
            <Dashboard onNavigate={setActiveView} refreshKey={refreshKey} />
          )}
          {activeView === 'upload' && (
            <UploadZone onUploadComplete={handleUploadComplete} />
          )}
          {activeView === 'files' && (
            <FileManager refreshKey={refreshKey} />
          )}
          {activeView === 'stats' && (
            <StatsPanel refreshKey={refreshKey} />
          )}
        </div>
      </main>
    </div>
  );
}