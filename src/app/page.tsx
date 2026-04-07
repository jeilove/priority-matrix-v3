'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import CircleInput from '@/components/home/CircleInput';
import QuadrantGrid from '@/components/home/QuadrantGrid';
import SettingsModal from '@/components/home/SettingsModal';

import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, TouchSensor, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useTodoStore, Todo } from '@/store/useTodoStore';
import { useState, useEffect } from 'react';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
        delay: 150,
        tolerance: 10,
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
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

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

      <div className={`content-container ${activeTodo ? 'is-dragging' : ''}`}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="matrix-container">
            <QuadrantGrid />
            <div className={`input-wrapper ${activeTodo ? 'no-event' : ''}`}>
              <CircleInput />
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTodo ? <DragPreview text={activeTodo.text} /> : null}
          </DragOverlay>
        </DndContext>

        <p className="footer-hint">각 사분면을 <span className="highlight">더블 클릭</span>하여 상세 내용을 확인하세요.</p>
      </div>

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
      `}</style>
    </main>
  );
}
