'use client';

import React from 'react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useTodoStore, Todo } from '@/store/useTodoStore';
import { Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

const energyLabels: Record<string, string> = {
  'energy-high': '에너지높음',
  'energy-medium': '에너지중간',
  'energy-low': '에너지낮음'
};

const statusLabels: Record<string, string> = {
  'todo': '준비',
  'in-progress': '진행중',
  'done': '마침',
  'blocked': '중단'
};

const quadrants = [
  { id: 1, label: '당장 해', color: 'var(--q1-color)', slug: 'q1' },
  { id: 2, label: '살펴 봐', color: 'var(--q2-color)', slug: 'q2' },
  { id: 3, label: '남 줘', color: 'var(--q3-color)', slug: 'q3' },
  { id: 4, label: '요건 빼', color: 'var(--q4-color)', slug: 'q4' },
];

const DraggableTodoCard = ({ todo, color, onEdit, onDelete }: { todo: Todo; color: string; onEdit: (todo: Todo) => void; onDelete: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  const isRightQuadrant = todo.quadrant === 'q2' || todo.quadrant === 'q4';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`todo-card ${isDragging ? 'dragging' : ''} ${isRightQuadrant ? 'right-align' : ''}`}
    >
      <span className="todo-indicator" style={{ backgroundColor: color }}></span>
      <div className="todo-info-wrapper">
        <p className="todo-text" title={todo.text}>{todo.text}</p>
        <div className="todo-meta-tags">
          <span className="mini-tag energy">{energyLabels[todo.energy || 'energy-medium']}</span>
          <span className="mini-tag status" data-status={todo.status}>{statusLabels[todo.status]}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="action-icon-btn edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(todo); }} onPointerDown={e => e.stopPropagation()}>
          <Edit size={18} />
        </button>
        <button className="action-icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(todo.id); }} onPointerDown={e => e.stopPropagation()}>
          <Trash2 size={18} />
        </button>
      </div>

      <style jsx>{`
        .todo-card {
          background: rgba(255, 255, 255, 0.04); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 12px;
          padding: 8px 12px; 
          display: flex; 
          align-items: center; 
          gap: 10px;
          width: 100%; 
          max-width: 100%; 
          min-height: 70px;
          position: relative; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          cursor: grab; 
          overflow: hidden;
        }
        .todo-card:hover { border-color: rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.1); }
        .todo-card.dragging { opacity: 0.5; z-index: 1000; }
        .right-align { flex-direction: row-reverse; }
        
        .todo-indicator { width: 5px; height: 16px; border-radius: 2px; flex-shrink: 0; }
        .todo-info-wrapper { flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; min-width: 0; }
        .right-align .todo-info-wrapper { align-items: flex-end; }
        
        .todo-text { 
          font-size: 1.05rem; font-weight: 700; margin: 0; color: white; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;
        }
        .right-align .todo-text { text-align: right; }
        
        .todo-meta-tags { display: flex; gap: 6px; align-items: center; }
        .mini-tag { 
          font-size: 0.75rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; 
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1);
        }
        .mini-tag.energy { color: var(--accent-color); border-color: rgba(46,160,67,0.3); }
        .mini-tag.status[data-status="done"] { background: var(--accent-color); color: white; border: none; }
        .mini-tag.status[data-status="blocked"] { background: #ff9800; color: white; border: none; }
        
        .card-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
        .todo-card:hover .card-actions { opacity: 1; }
        @media (max-width: 768px) {
          .todo-card { min-height: 52px; padding: 6px 8px; gap: 6px; }
          .todo-text { font-size: 0.88rem; }
          .mini-tag { font-size: 0.68rem; padding: 1px 4px; }
          .todo-meta-tags { display: none !important; }
          .card-actions { opacity: 1; }
        }
        .action-icon-btn { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 4px; display: flex; align-items: center; }
        .action-icon-btn:hover { color: white; }
      `}</style>
    </div>
  );
};

const DroppableQuadrant = ({ q, todos, onDoubleClick }: { q: any; todos: Todo[]; onDoubleClick: () => void }) => {
  const { isOver, setNodeRef } = useDroppable({ id: q.slug });
  const { isOver: isHeaderOver, setNodeRef: setHeaderRef } = useDroppable({ id: `${q.slug}-header` });
  const { deleteTodo, sortOrder, setSortOrder } = useTodoStore();
  const router = useRouter();

  // 정렬 로직 적용
  const sortedTodos = [...todos].sort((a, b) => {
    if (sortOrder === 'abc') {
      return a.text.localeCompare(b.text, 'ko');
    }
    if (sortOrder === 'rank') {
      const rankA = a.priorityRank ?? 9999;
      const rankB = b.priorityRank ?? 9999;
      if (rankA !== rankB) return rankA - rankB;
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    // 최근순 (기본값)
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/all-todos?filter=${q.slug}`);
  };

  return (
    <div
      ref={setNodeRef}
      className={`quadrant-container q${q.id} ${isOver ? 'drag-over' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      <div
        ref={setHeaderRef}
        className={`quadrant-info-new ${isHeaderOver ? 'header-drag-over' : ''}`}
        onClick={handleInfoClick}
      >
        <div className="q-branding-row">
          <div className="q-branding">
            <img 
              src={q.id === 4 ? `/icons/q4_w.png` : `/q${q.id}.png`} 
              alt={`Q${q.id} 아이콘`} 
              className={`q-icon-img-new ${q.id === 4 ? 'q-blend-yo' : ''}`} 
              style={{ width: '44px', height: '44px', objectFit: 'contain', flexShrink: 0 }}
              loading="eager"
            />
            <span className="q-label">
              {q.id === 4 ? (
                <>
                  <span style={{ color: q.color }}>요</span>
                  <span style={{ color: 'white' }}>건 빼</span>
                </>
              ) : (
                q.label.split(' ').map((part: string, index: number, array: string[]) => (
                  <React.Fragment key={index}>
                    <span style={{ color: index === array.length - 1 ? q.color : 'white' }}>
                      {part}
                    </span>
                    {index < array.length - 1 ? ' ' : ''}
                  </React.Fragment>
                ))
              )}
            </span>
          </div>

          <div className="q-sort-control glass" onClick={(e) => e.stopPropagation()}>
            <span className="q-sort-label">정렬:</span>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="q-sort-select"
            >
              <option value="recent">최근순 ▾</option>
              <option value="abc">가나다순 ▾</option>
              {q.slug === 'q1' && <option value="rank">실행순위 ▾</option>}
            </select>
            {q.slug === 'q1' && (
              <button 
                className="q-rank-btn" 
                onClick={() => router.push('/ranking')}
                title="우선순위 랭킹 설정"
              >
                <img src="/ranking.png" alt="랭킹" className="rank-icon-img" />
              </button>
            )}
          </div>
        </div>
        
        {isHeaderOver && <span className="hide-hint">목록에서 숨김</span>}
      </div>

      <div className="todo-content-area">
        {sortedTodos.filter(t => !t.isHidden).length > 0 ? (
          <div className="todo-list">
            {sortedTodos.filter(t => !t.isHidden).map(todo => (
              <DraggableTodoCard 
                key={todo.id} 
                todo={todo} 
                color={q.color} 
                onEdit={(t) => router.push(`/all-todos?filter=${q.slug}&edit=${t.id}&from=home`)} 
                onDelete={(id) => deleteTodo(id)} 
              />
            ))}
          </div>
        ) : (
          <div className="placeholder-text">
            <p>할 일을 드래그하여 배치하세요</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .quadrant-container {
          position: relative; padding: 24px; display: flex; flex-direction: column;
          background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid var(--glass-border); border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; min-height: 280px; overflow: hidden;
        }
        .quadrant-container:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
        .drag-over { background: rgba(46, 160, 67, 0.1) !important; border-color: var(--accent-color) !important; transform: scale(1.01); }

        .quadrant-info-new {
          position: absolute; display: flex; flex-direction: column; align-items: flex-start;
          z-index: 10; cursor: pointer; transition: transform 0.2s ease;
        }
        /* Q1, Q2는 상단 배치 */
        .q1 .quadrant-info-new { top: 18px; left: 24px; align-items: flex-start; }
        .q2 .quadrant-info-new { top: 18px; right: 24px; align-items: flex-end; }
        /* Q3, Q4는 하단 배치 */
        .q3 .quadrant-info-new { bottom: 18px; left: 24px; align-items: flex-start; }
        .q4 .quadrant-info-new { bottom: 18px; right: 24px; align-items: flex-end; }
        
        .q-branding-row { 
          display: flex; align-items: center; gap: 12px; width: 100%; 
        }
        .q2 .q-branding-row, .q4 .q-branding-row { flex-direction: row-reverse; }

        .q-branding { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .q2 .q-branding, .q4 .q-branding { flex-direction: row-reverse; }
        
        .q-sort-control {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
        }
        .q-sort-label { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }
        .q-sort-select {
          background: none; border: none; color: white;
          font-family: inherit; font-size: 0.75rem; font-weight: 800;
          cursor: pointer; outline: none; appearance: none;
          padding-right: 2px;
        }
        .q-sort-select option { background: #1a1f2e; color: white; }
        
        .q-rank-btn {
          background: none; border: none; padding: 0 4px; display: flex; align-items: center; cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .q-rank-btn:hover { transform: scale(1.15) translateY(-2px); filter: drop-shadow(0 0 8px rgba(255,159,67,0.4)); }
        .rank-icon-img { width: 22px; height: 22px; object-fit: contain; }
        
        .q-icon-img-new { height: 44px; width: auto; object-fit: contain; }
        .q-blend-yo { mix-blend-mode: multiply; }
        .q-label { font-size: 1.1rem; font-weight: 900; letter-spacing: -0.02em; color: white; }
        
        .header-drag-over { background: rgba(46, 160, 67, 0.2) !important; border-radius: 12px; padding: 4px; }
        .todo-content-area { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          margin-top: 85px; 
          margin-bottom: 20px; 
          height: 100%; 
          min-height: 0; 
          z-index: 5; 
        }
        .q1 .todo-content-area, .q3 .todo-content-area { align-items: flex-start; }
        .q2 .todo-content-area, .q4 .todo-content-area { align-items: flex-end; }
        .q3 .todo-content-area, .q4 .todo-content-area { margin-top: 20px; margin-bottom: 85px; }

        .todo-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: min-content;
          gap: 12px;
          overflow-y: auto;
          height: 100%;
          width: 100%;
          padding: 10px 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
        }
        .todo-list::-webkit-scrollbar { width: 5px; }
        .todo-list::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .q2 .todo-list, .q4 .todo-list { justify-items: end; }
        
        .placeholder-text {
          flex: 1; display: flex; align-items: center; justify-content: center;
          border: 1px dashed rgba(255, 255, 255, 0.05); border-radius: 16px;
          color: var(--text-secondary); font-size: 0.75rem; padding: 10px; opacity: 0.5;
        }
        .hide-hint { font-size: 0.65rem; color: var(--accent-color); font-weight: 800; animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .quadrant-container { padding: 10px; min-height: 0; border-radius: 16px; }
          .quadrant-container:hover { transform: none; }
          .q-icon-img-new { width: 28px !important; height: 28px !important; }
          .q-label { font-size: 0.85rem; }
          .q-sort-control { display: none; }
          .q-branding-row { gap: 6px; }
          .q-branding { gap: 5px; }
          .todo-content-area { margin-top: 52px; margin-bottom: 10px; }
          .q3 .todo-content-area, .q4 .todo-content-area { margin-top: 10px; margin-bottom: 52px; }
          .todo-list { grid-template-columns: 1fr; gap: 6px; padding: 4px 2px; }
          .placeholder-text { font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
};

const QuadrantGrid = () => {
  const { todos } = useTodoStore();
  const [mounted, setMounted] = React.useState(false);

  // 클라이언트 하이드레이션 완료 후에만 실제 데이터를 렌더링
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="grid-wrapper">
      <div className="quadrant-grid">
        {quadrants.map((q) => (
          <DroppableQuadrant
            key={`quad-grid-${q.slug}`}
            q={q}
            todos={todos.filter(t => t.quadrant === q.slug)}
            onDoubleClick={() => {}}
          />
        ))}
      </div>

      <style jsx>{`
        .grid-wrapper { width: 100%; height: calc(100vh - 120px); max-height: 950px; display: flex; justify-content: center; align-items: center; }
        .quadrant-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 28px; width: 100%; height: 100%; }
        @media (max-width: 768px) {
          .grid-wrapper { height: calc(100dvh - 140px); max-height: none; padding: 0 10px; }
          .quadrant-grid { gap: 10px; }
        }
      `}</style>
    </div>
  );
};

export default QuadrantGrid;
