'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import { Moon, Sun, Bell, Database, Shield, Github } from 'lucide-react';

const SettingsPage = () => {
    return (
        <main className="settings-layout">
            <Header />

            <div className="container">
                <header className="page-header">
                    <h1 className="page-title">설정</h1>
                </header>

                <div className="settings-sections">
                    <section className="settings-card glass">
                        <div className="section-header">
                            <Sun size={20} />
                            <h2>테마 및 디스플레이</h2>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>다크 모드</h3>
                                <p>시스템 설정에 따라 다크/라이트 테마를 전환합니다.</p>
                            </div>
                            <div className="toggle-switch">
                                <input type="checkbox" id="dark-mode" defaultChecked />
                                <label htmlFor="dark-mode"></label>
                            </div>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>사분면 색상 커스터마이징</h3>
                                <p>각 사분면의 강조 색상을 설정합니다.</p>
                            </div>
                            <button className="setting-action">변경하기</button>
                        </div>
                    </section>

                    <section className="settings-card glass">
                        <div className="section-header">
                            <Database size={20} />
                            <h2>데이터 및 스토리지</h2>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>구글 드라이브 연동</h3>
                                <p>할 일 데이터를 구글 드라이브에 안전하게 보관하고 동기화합니다.</p>
                            </div>
                            <button className="setting-action primary">연동하기</button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>데이터 내보내기</h3>
                                <p>모든 데이터를 JSON 파일로 다운로드합니다.</p>
                            </div>
                            <button className="setting-action">다운로드</button>
                        </div>
                    </section>

                    <section className="settings-card glass">
                        <div className="section-header">
                            <Bell size={20} />
                            <h2>알림 설정</h2>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>브라우저 푸시 알림</h3>
                                <p>중요한 마감 시한이나 AI 브리핑 알림을 받습니다.</p>
                            </div>
                            <div className="toggle-switch">
                                <input type="checkbox" id="push-notif" />
                                <label htmlFor="push-notif"></label>
                            </div>
                        </div>
                    </section>

                    <div className="version-info">
                        <p>Priority Matrix v1.0.0-beta</p>
                        <p>© 2026 Developed by Antigravity</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .settings-layout {
          min-height: 100vh;
          padding-top: 120px;
          padding-bottom: 60px;
          background: var(--bg-color);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 40px;
        }
        .page-title {
          font-size: 2.2rem;
          font-weight: 800;
        }
        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .settings-card {
          padding: 30px;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
          color: var(--accent-color);
        }
        .section-header h2 {
          font-size: 1.2rem;
          font-weight: 700;
          color: white;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 1px solid var(--glass-border);
        }
        .setting-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .setting-info h3 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .setting-info p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .setting-action {
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .setting-action:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .setting-action.primary {
          background: var(--accent-color);
        }
        .setting-action.primary:hover {
          background: var(--accent-hover);
        }

        /* Toggle Switch Style */
        .toggle-switch {
          position: relative;
          width: 50px;
          height: 26px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-switch label {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 34px;
        }
        .toggle-switch label:before {
          position: absolute;
          content: "";
          height: 20px; width: 20px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        .toggle-switch input:checked + label {
          background-color: var(--accent-color);
        }
        .toggle-switch input:checked + label:before {
          transform: translateX(24px);
        }

        .version-info {
          margin-top: 40px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
      `}</style>
        </main>
    );
};

export default SettingsPage;
