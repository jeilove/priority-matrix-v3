'use client';

import React from 'react';
import { Home as HomeIcon, Settings } from 'lucide-react';
import Link from 'next/link';

const Header = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  return (
    <header className="fixed-nav">
      <div className="nav-icons">
        <Link href="/" className="nav-icon-link" title="홈">
          <HomeIcon size={30} />
        </Link>
        <Link href="/all-todos" className="nav-icon-link" title="해봐줘요 (모든 할 일)">
          <img src="/logo_final_v2.png" alt="해줘봐요" className="nav-logo-img" />
        </Link>

        <span className="version-badge">v2.9.0</span>
        <button 
          className="nav-icon-link settings-trigger" 
          title="설정"
          onClick={onSettingsClick}
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
          gap: 24px;
          padding: 10px 24px;
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
        .settings-trigger {
          padding: 0;
        }
      `}</style>
    </header>
  );
};

export default Header;
