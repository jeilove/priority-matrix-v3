'use client';

import React from 'react';
import { Home as HomeIcon, Settings, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTodoStore } from '@/store/useTodoStore';

const Header = () => {
  const { data: session } = useSession();
  const setSettingsOpen = useTodoStore(state => state.setSettingsOpen);

  React.useEffect(() => {
    console.log("Priority Matrix v3.2.0 - Active");
  }, []);

  return (
    <header className="fixed-nav">
      <div className="nav-icons">
        <Link href="/" className="nav-icon-link" title="홈">
          <HomeIcon size={30} />
        </Link>
        <Link href="/all-todos" className="nav-icon-link" title="해봐줘요 (모든 할 일)">
          <img src="/logo_final_v2.png" alt="해줘봐요" className="nav-logo-img" />
        </Link>

        <span className="version-badge">v3.2.0</span>

        {session ? (
          <div className="user-profile">
            {session.user?.image ? (
              <img src={session.user.image} alt="User" className="user-avatar" title={session.user.name || 'User'} />
            ) : (
              <span className="user-initial">{session.user?.name?.[0] || 'U'}</span>
            )}
            <button className="nav-icon-link logout-btn-with-text" onClick={() => signOut()} title="로그아웃">
              <LogOut size={18} />
              <span className="btn-text">로그아웃</span>
            </button>
          </div>
        ) : (
          <button className="nav-icon-link login-btn-with-text" onClick={() => signIn('google')} title="구글 로그인">
            <LogIn size={18} />
            <span className="btn-text">LOGIN</span>
          </button>
        )}

        <button 
          className="nav-icon-link settings-trigger" 
          title="설정"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings size={30} />
        </button>
      </div>

      <style jsx>{`
        .fixed-nav {
          position: fixed;
          top: 30px;
          right: 40px;
          z-index: 2000;
          pointer-events: auto;
        }
        .nav-icons {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border-radius: 50px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
        .nav-icons:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .nav-icon-link {
          color: rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: none;
          border: none;
          cursor: pointer;
        }
        .nav-icon-link:hover {
          color: white;
          transform: translateY(-2px) scale(1.1);
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.4));
        }
        .nav-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          filter: grayscale(0.6) brightness(1.2);
          transition: all 0.3s ease;
        }
        .nav-icon-link:hover .nav-logo-img {
          filter: grayscale(0) brightness(1);
          transform: scale(1.1);
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 8px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
        .user-initial {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        .version-badge {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .login-btn-with-text, .logout-btn-with-text {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }
        .login-btn-with-text {
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.3), rgba(52, 168, 83, 0.3));
          border-color: rgba(66, 133, 244, 0.5);
        }
        .login-btn-with-text:hover {
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.5), rgba(52, 168, 83, 0.5));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);
        }
        .btn-text {
          letter-spacing: 0.5px;
        }
        @media (max-width: 600px) {
          .btn-text { display: none; }
          .login-btn-with-text, .logout-btn-with-text { padding: 8px; }
        }
        @media (max-width: 768px) {
          .fixed-nav { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;
