'use client';

import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, RefreshCw, LogIn, Save, Download, AlertTriangle } from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { todos, setTodos, syncToCloud, syncFromCloud, isSyncing, lastSyncTime, exportTodos, importTodos } = useTodoStore();
  const [googleClientId, setGoogleClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 로컬 스토리지에서 클라이언트 ID 불러오기
  useEffect(() => {
    const savedId = localStorage.getItem('google_client_id');
    if (savedId) setGoogleClientId(savedId);
  }, []);

  const handleSaveClientId = () => {
    localStorage.setItem('google_client_id', googleClientId);
    setStatusMessage('ID가 저장되었습니다. 클라우드 버튼을 누르면 인증 창이 뜹니다.');
  };

  const wrapSync = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setIsConnected(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('현재 목록이 파일 데이터로 대체됩니다. 계속하시겠습니까?')) {
      try {
        await importTodos(file);
        setStatusMessage('파일에서 데이터를 성공적으로 불러왔습니다!');
      } catch (err: any) {
        alert('가져오기 실패: ' + err.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal glass" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-section">
            <Cloud size={24} className="title-icon" />
            <h2>데이터 동기화 및 백업</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <section className="modal-body">
          <div className="setting-section">
            <label>구글 클라우드 동기화</label>
            <div className="setting-item">
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="구글 클라우드 Client ID 입력"
                  value={googleClientId}
                  onChange={e => setGoogleClientId(e.target.value)}
                  className="glass-input"
                />
                <button className="small-btn save-btn" onClick={handleSaveClientId} title="저장">
                  <Save size={16} />
                </button>
              </div>
            </div>

            <div className="sync-status glass-panel">
              <div className="status-indicator">
                {isConnected ? (
                  <div className="connected"><Cloud size={18} /> <span>연결됨</span></div>
                ) : (
                  <div className="disconnected"><CloudOff size={18} /> <span>연결 대기 중</span></div>
                )}
              </div>
              <div className="sync-info">
                <span className="last-sync">마지막: {lastSyncTime || '없음'}</span>
                <button 
                  className={`sync-btn ${isSyncing ? 'spinning' : ''}`} 
                  onClick={() => wrapSync(syncFromCloud)}
                  disabled={!googleClientId}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div className="action-grid">
              <button className="action-card push" onClick={() => wrapSync(syncFromCloud)} disabled={!googleClientId}>
                <Download size={20} />
                <span className="card-title">불러오기</span>
              </button>
              <button className="action-card pull" onClick={() => wrapSync(syncToCloud)} disabled={!googleClientId}>
                <Save size={20} />
                <span className="card-title">저장하기</span>
              </button>
            </div>
          </div>

          <div className="divider"></div>

          <div className="setting-section">
            <label>내 컴퓨터로 수동 백업</label>
            <div className="action-grid">
              <button className="action-card local-export" onClick={exportTodos}>
                <Download size={20} color="#7ED321" />
                <span className="card-title">PC로 다운로드</span>
              </button>
              <button className="action-card local-import" onClick={() => fileInputRef.current?.click()}>
                <Save size={20} color="#4A90E2" />
                <span className="card-title">파일에서 업로드</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleFileImport} 
              />
            </div>
          </div>

          {statusMessage && (
            <div className="status-banner">
                <AlertTriangle size={14} />
                <span>{statusMessage}</span>
            </div>
          )}
        </section>

        <footer className="modal-footer">
          <p className="footer-copyright">© 2026 AI Eisenhower Matrix Sync Engine</p>
        </footer>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 3000;
          animation: fade-in 0.3s ease;
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        
        .settings-modal {
          width: 480px; max-width: 90%; background: rgba(20, 25, 35, 0.85);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5); overflow: hidden;
          animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-header {
          padding: 24px 30px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .title-section { display: flex; align-items: center; gap: 12px; }
        .title-icon { color: var(--accent-color); }
        h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: white; }
        .close-btn { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; transition: color 0.2s; }
        .close-btn:hover { color: white; }

        .modal-body { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
        
        .setting-section { display: flex; flex-direction: column; gap: 12px; }
        .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }

        label { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.6); }
        .setting-item { display: flex; flex-direction: column; gap: 10px; }
        .input-group { display: flex; gap: 8px; }
        .glass-input {
          flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 10px 16px; color: white; font-size: 0.85rem; outline: none; transition: all 0.2s;
        }
        .glass-input:focus { border-color: var(--accent-color); background: rgba(255,255,255,0.08); }
        
        .small-btn { 
          padding: 8px 12px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; 
        }
        .save-btn { background: var(--accent-color); color: white; }
        .save-btn:hover { background: var(--accent-hover); transform: translateY(-2px); }

        .sync-status {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
        }
        .status-indicator .connected { color: var(--accent-color); display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 0.85rem; }
        .status-indicator .disconnected { color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.85rem; }
        
        .sync-info { display: flex; align-items: center; gap: 10px; }
        .last-sync { font-size: 0.7rem; color: rgba(255,255,255,0.3); }
        .sync-btn { 
          background: rgba(255,255,255,0.05); border: none; color: white; padding: 6px; border-radius: 50%; cursor: pointer;
          transition: all 0.3s ease;
        }
        .sync-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .action-card {
           background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
           padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
           cursor: pointer; transition: all 0.2s ease; color: white;
        }
        .action-card:hover:not(:disabled) { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); transform: translateY(-3px); }
        .action-card:disabled { opacity: 0.3; cursor: not-allowed; }
        .card-title { font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
        
        .status-banner {
          background: rgba(46,160,67,0.08); border: 1px solid rgba(46,160,67,0.2); border-radius: 12px;
          padding: 10px 14px; display: flex; align-items: center; gap: 8px; color: var(--accent-color); font-size: 0.75rem;
          font-weight: 600; margin-top: 10px;
        }

        .modal-footer {
          padding: 16px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-copyright { font-size: 0.65rem; color: rgba(255,255,255,0.25); margin: 0; }
      `}</style>
    </div>
  );
};

export default SettingsModal;
