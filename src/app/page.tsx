'use client';

import React from 'react';
import Link from 'next/link';
import { Home as HomeIcon, List, Settings, Plus, LogIn, LogOut } from 'lucide-react';
import Header from '@/components/layout/Header';
import CircleInput from '@/components/home/CircleInput';
import QuadrantGrid from '@/components/home/QuadrantGrid';
import SettingsModal from '@/components/home/SettingsModal';

import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useTodoStore, Todo } from '@/store/useTodoStore';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

// 드래그 시 보여줄 오버레이 (잡고 움직이는 요소)
const DragPreview = ({ text }: { text: string }) => (
  <div className="drag-preview-card">
    <p>{text}</p>
    <style jsx>{`
      .drag-preview-card {
        background: var(--accent-color);
        padding: 12px 20px;
        border-radius: 12px;
        color: white;
        box-shadow: 0 15px 40px rgba(0,0,0,0.6);
        font-weight: 700;
        border: 2px solid white;
        min-width: 180px;
        z-index: 9991;
        pointer-events: none;
      }
      p { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `}</style>
  </div>
);

export const dynamic = 'force-dynamic';

export default function Home() {
  const { todos, moveTodo, moveTodoAndHide, sortOrder, setSortOrder } = useTodoStore();
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const { data: session } = useSession();
  const version = "3.2.0";

  useEffect(() => {
    setMounted(true);
    console.log(`🚀 Priority Matrix Home v${version} - Initialized`);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const todo = todos.find(t => t.id === active.id);
    if (todo) setActiveTodo(todo);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodo(null);

    if (over) {
      const todoId = active.id as string;
      const overId = over.id as string;

      if (overId.endsWith('-header')) {
        const quadrant = overId.replace('-header', '') as any;
        moveTodoAndHide(todoId, quadrant);
      } else {
        const quadrant = overId as any;
        moveTodo(todoId, quadrant);
      }
    }
  };

  if (!mounted) return null;

  return (
    <main className="main-layout" style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.3s' }}>
      <Header />

      <SettingsModal />

      {/* PC 브랜드 영역 */}
      <div className="top-center-brand">
        <img
          src="/logo_final_v2.png"
          alt="해줘봐요 로고"
          className="brand-logo"
          style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
        />
        <div className="brand-slogan">
          <span className="slogan-line">실행-계획</span>
          <span className="slogan-line">위임-삭제</span>
        </div>

        <div className="global-sort-control glass">
          <span className="sort-label">정렬:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="sort-select-v2"
          >
            <option value="recent">최근순 ▾</option>
            <option value="abc">가나다순 ▾</option>
          </select>
        </div>
      </div>

      {/* 모바일 전용 상단 바 */}
      <div className="mobile-top-bar">
        <img src="/logo_final_v2.png" alt="해줘봐요 로고" className="mobile-brand-logo" />
        <span className="mobile-app-title">해줘봐요</span>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="mobile-sort-select glass"
        >
          <option value="recent">최근순</option>
          <option value="abc">가나다순</option>
        </select>
      </div>

      <div className={`content-container ${activeTodo ? 'is-dragging' : ''}`}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="matrix-container">
            <QuadrantGrid />
            <div className={`input-wrapper ${activeTodo ? 'no-event' : ''}`}>
              <CircleInput forceOpen={mobileAddOpen} onClose={() => setMobileAddOpen(false)} />
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTodo ? <DragPreview text={activeTodo.text} /> : null}
          </DragOverlay>
        </DndContext>

        <p className="footer-hint">각 사분면을 <span className="highlight">더블 클릭</span>하여 상세 내용을 확인하세요.</p>
      </div>

      {/* 모바일 전용 하단 탭바 */}
      <nav className="mobile-bottom-nav">
        <Link href="/" className="mobile-nav-item active">
          <HomeIcon size={24} />
        </Link>
        <Link href="/all-todos" className="mobile-nav-item">
          <List size={24} />
        </Link>
        
        {session ? (
          <button className="mobile-nav-item" onClick={() => signOut()}>
            <LogOut size={24} />
            <span>로그아웃</span>
          </button>
        ) : (
          <button className="mobile-nav-item" onClick={() => signIn('google')}>
            <LogIn size={24} />
            <span>로그인</span>
          </button>
        )}

        <button
          className="mobile-nav-item"
          onClick={() => useTodoStore.getState().setSettingsOpen(true)}
        >
          <Settings size={24} />
          <span>설정</span>
        </button>
      </nav>

      <style jsx>{`
        .no-event { pointer-events: none; }
        .main-layout {
          min-height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          background: radial-gradient(circle at 50% 50%, #1a1f2e 0%, #0d1117 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 50px; /* 로고와 사분면 밸런스 조정 */
        }
        .top-center-brand {
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 100;
        }
        .global-sort-control {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
        }
        .sort-label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }
        .sort-select-v2 {
          background: none; border: none; color: white;
          font-family: inherit; font-size: 0.85rem; font-weight: 800;
          cursor: pointer; outline: none; appearance: none;
          padding-right: 4px;
        }
        .sort-select-v2 option { background: #1a1f2e; color: white; }
        .brand-logo {
          height: 80px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2));
        }
        .brand-slogan {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }
        .slogan-line {
          font-weight: 800;
          font-size: 0.95rem;
          color: white;
          white-space: nowrap;
          letter-spacing: 0.05em;
          text-shadow: 0 0 10px rgba(0,0,0,0.5);
          line-height: 1.1;
        }
        .content-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 100px; /* 로고 아래로 충분히 내림 */
        }
        .matrix-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .input-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          pointer-events: none; 
        }
        .footer-hint { margin-top: 50px; color: var(--text-secondary); font-size: 0.9rem; opacity: 0.6; }
        .highlight { color: var(--accent-hover); font-weight: 600; }

        /* 모바일 전용 상단 바 */
        .mobile-top-bar {
          display: none;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          width: 100%;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          backdrop-filter: blur(12px);
        }
        .mobile-brand-logo { height: 32px; width: auto; object-fit: contain; }
        .mobile-app-title { font-size: 1rem; font-weight: 800; color: white; flex: 1; }
        .mobile-sort-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 5px 10px;
          color: white;
          font-size: 0.8rem;
          font-weight: 700;
          outline: none;
          font-family: inherit;
        }
        .mobile-sort-select option { background: #1a1f2e; color: white; }

        /* 모바일 하단 탭바 */
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(13,17,23,0.95);
          border-top: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(16px);
          align-items: center;
          justify-content: space-around;
          z-index: 2000;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          color: rgba(255,255,255,0.45);
          font-size: 0.65rem;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 16px;
          transition: color 0.2s;
          text-decoration: none;
        }
        .mobile-nav-item.active { color: var(--accent-color); }
        .mobile-nav-item:hover { color: rgba(255,255,255,0.8); }
        .mobile-add-btn { position: relative; top: -10px; }
        .mobile-add-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(46,160,67,0.45);
        }

        @media (max-width: 768px) {
          .mobile-top-bar { display: flex; }
          .mobile-bottom-nav { display: flex; }
          .top-center-brand { display: none; }
          .main-layout { padding-top: 56px; padding-bottom: 64px; }
          .content-container { margin-top: 16px; }
          .footer-hint { display: none; }
        }
      `}</style>
    </main>
  );
}
