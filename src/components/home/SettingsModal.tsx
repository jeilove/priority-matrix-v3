'use client';

import React, { useState, useEffect } from 'react';
import { X, Cloud, Download, Save, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';
import { useSession, signIn } from 'next-auth/react';

const SettingsModal = () => {
  const { data: session, status } = useSession();
  const { lastSyncTime, exportTodos, importTodos, isSettingsOpen, setSettingsOpen } = useTodoStore();
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isAuthenticated = status === 'authenticated';

  // 메시지 자동 삭제
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('현재 목록이 파일 데이터로 대체됩니다. 계속하시겠습니까?')) {
      try {
        await importTodos(file);
        setStatusMessage('파일 데이터를 성공적으로 불러왔습니다!');
      } catch (err: any) {
        alert('가져오기 실패: ' + err.message);
      }
    }
  };

  if (!isSettingsOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
      <div className="settings-modal glass" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="title-section">
            <ShieldCheck size={24} className="title-icon" />
            <h2>동기화 및 보안 설정</h2>
          </div>
          <button className="close-btn" onClick={() => setSettingsOpen(false)}><X size={20} /></button>
        </header>

        <section className="modal-body">
          <div className="setting-section">
            <label>실시간 데이터 보호 (Neon DB)</label>
            
            {!isAuthenticated ? (
              <div className="sync-status-card locked-panel">
                <div className="status-main">
                  <div className="lock-icon">
                    <Lock size={32} />
                  </div>
                  <div className="status-text">
                    <h3>로그인 필요</h3>
                    <p>클라우드 동기화를 위해 구글 로그인이 필요합니다.</p>
                  </div>
                </div>
                <button className="login-prompt-btn" onClick={() => signIn('google')}>
                  구글로 로그인하기
                </button>
              </div>
            ) : (
              <div className="sync-status-card active-panel">
                <div className="status-main">
                  <div className="pulse-icon">
                    <Cloud size={32} />
                    <div className="pulse-ring"></div>
                  </div>
                  <div className="status-text">
                    <h3>실시간 동기화 중</h3>
                    <p>{session?.user?.name}님, 모든 데이터가 안전하게 보관되고 있습니다.</p>
                  </div>
                </div>
                <div className="status-footer">
                  <div className="sync-info">
                    <span className="info-label">최종 동기화:</span>
                    <span className="info-value">{lastSyncTime || '방금 전'}</span>
                  </div>
                  <div className="sync-badge">ONLINE</div>
                </div>
              </div>
            )}
          </div>

          <div className="divider"></div>

          <div className="setting-section">
            <label>로컬 백업 및 복구 (JSON)</label>
            <p className="section-desc">파일로 별도 보관하고 싶을 때 사용하세요.</p>
            <div className="action-grid">
              <button className="action-card local-export" onClick={exportTodos}>
                <Download size={20} color="#7ED321" />
                <span className="card-title">내보내기</span>
              </button>
              <button className="action-card local-import" onClick={() => fileInputRef.current?.click()}>
                <Save size={20} color="#4A90E2" />
                <span className="card-title">가져오기</span>
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
          <p className="footer-copyright">© 2026 AI Priority Matrix Cloud v3.2</p>
        </footer>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 3000;
        }
        
        .settings-modal {
          width: 440px; max-width: 90%; background: rgba(20, 25, 35, 0.95);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 28px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6); overflow: hidden;
        }

        .modal-header {
          padding: 24px 30px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .title-section { display: flex; align-items: center; gap: 12px; }
        .title-icon { color: #00D1FF; }
        h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: white; }
        .close-btn { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s; }
        .close-btn:hover { color: white; transform: rotate(90deg); }

        .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
        
        .setting-section { display: flex; flex-direction: column; gap: 8px; }
        .divider { height: 1px; background: rgba(255,255,255,0.05); }

        label { font-size: 0.75rem; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px; }
        .section-desc { font-size: 0.8rem; color: rgba(255,255,255,0.5); }

        .sync-status-card {
           border-radius: 20px; padding: 20px; transition: all 0.3s ease;
        }
        .active-panel {
          background: linear-gradient(135deg, rgba(0, 209, 255, 0.08) 0%, rgba(0, 209, 255, 0.03) 100%);
          border: 1px solid rgba(0, 209, 255, 0.2);
        }
        .locked-panel {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-main { display: flex; align-items: center; gap: 20px; margin-bottom: 15px; }
        
        .pulse-icon { position: relative; color: #00D1FF; }
        .lock-icon { color: rgba(255,255,255,0.2); }
        .pulse-ring {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          border: 2px solid #00D1FF; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }

        .status-text h3 { margin: 0; font-size: 0.95rem; color: white; font-weight: 700; }
        .status-text p { margin: 4px 0 0 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); line-height: 1.4; }

        .status-footer { 
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);
        }
        .sync-info { display: flex; align-items: center; gap: 8px; }
        .info-label { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
        .info-value { font-size: 0.75rem; color: #00D1FF; font-weight: 600; }

        .sync-badge {
          font-size: 0.65rem; padding: 2px 8px; border-radius: 100px;
          background: rgba(0, 209, 255, 0.1); color: #00D1FF; font-weight: 900;
        }

        .login-prompt-btn {
          width: 100%; background: #4285F4; color: white; border: none; padding: 12px;
          border-radius: 12px; font-weight: 700; font-size: 0.85rem; cursor: pointer;
          transition: all 0.2s;
        }
        .login-prompt-btn:hover { background: #3367D6; transform: translateY(-2px); }

        .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .action-card {
           background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
           padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
           cursor: pointer; transition: all 0.2s ease;
        }
        .action-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); transform: translateY(-3px); }
        .card-title { font-size: 0.85rem; font-weight: 700; color: white; }

        .status-banner {
          background: rgba(0, 209, 255, 0.08); border: 1px solid rgba(0, 209, 255, 0.2); border-radius: 12px;
          padding: 10px 14px; display: flex; align-items: center; gap: 8px; color: #00D1FF; font-size: 0.78rem;
          font-weight: 600;
        }

        .modal-footer { padding: 16px; text-align: center; }
        .footer-copyright { font-size: 0.65rem; color: rgba(255,255,255,0.2); margin: 0; }
      `}</style>
    </div>
  );
};

export default SettingsModal;
