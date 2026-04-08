'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import SettingsModal from '@/components/home/SettingsModal';
import { useTodoStore, Todo } from '@/store/useTodoStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, GripVertical, Edit, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 컴포넌트: 정렬 가능한 할 일 카드 ---
const SortableTodoCard = ({ todo, onEdit, onDelete }: { todo: Todo; onEdit: (todo: Todo) => void; onDelete: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`rank-card glass ${isDragging ? 'dragging' : ''}`}>
      <div className="rank-badge">{todo.priorityRank || 'N/A'}</div>
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>
      <div className="rank-card-content">
        <h3 className="rank-todo-text" title={todo.text}>{todo.text}</h3>
        <div className="rank-todo-meta">
           <span className="rank-tag">#{todo.energy === 'energy-high' ? '고에너지' : todo.energy === 'energy-low' ? '저에너지' : '중에너지'}</span>
           {todo.estimate && <span className="rank-tag">{todo.estimate}h</span>}
        </div>
      </div>

      <div className="rank-actions">
        <button className="rank-action-btn edit" onClick={() => onEdit(todo)} onPointerDown={e => e.stopPropagation()}>
          <Edit size={16} />
        </button>
        <button className="rank-action-btn delete" onClick={() => onDelete(todo.id)} onPointerDown={e => e.stopPropagation()}>
          <Trash2 size={16} />
        </button>
      </div>

      <style jsx>{`
        .rank-card {
          position: relative;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          border-radius: 16px;
          transition: border-color 0.2s;
        }
        .rank-card:hover { border-color: var(--accent-color); }
        .dragging { border-color: var(--accent-color); box-shadow: 0 0 20px rgba(46,160,67,0.3); }

        .rank-badge {
          width: 28px; height: 28px; background: var(--q1-color);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 0.8rem; color: white; flex-shrink: 0;
        }
        .drag-handle {
          cursor: grab; color: var(--text-secondary); opacity: 0.5;
          transition: opacity 0.2s;
        }
        .drag-handle:hover { opacity: 1; color: white; }
        
        .rank-card-content { flex: 1; overflow: hidden; }
        .rank-todo-text { 
           margin: 0; font-size: 1.1rem; font-weight: 700; white-space: nowrap; 
           overflow: hidden; text-overflow: ellipsis; 
        }
        .rank-todo-meta { display: flex; gap: 8px; margin-top: 6px; }
        .rank-tag { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px; }

        .rank-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; margin-left: 10px; }
        .rank-card:hover .rank-actions { opacity: 1; }
        .rank-action-btn { 
          background: rgba(255,255,255,0.05); border: none; color: rgba(255,255,255,0.4); 
          width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .rank-action-btn:hover { background: rgba(255,255,255,0.15); color: white; }
        .rank-action-btn.delete:hover { border-color: #ff4d4d; color: #ff4d4d; background: rgba(255,77,77,0.1); }
      `}</style>
    </div>
  );
};

const RankingPage = () => {
  const { todos, updateTodoRanks, deleteTodo } = useTodoStore();
  const q1Todos = todos.filter(t => t.quadrant === 'q1' && t.status !== 'done' && t.status !== 'blocked');
  const router = useRouter();

  const [items, setItems] = useState<Todo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    // 스토어의 할 일들과 로컬 정렬 배열의 싱크가 맞지 않는 경우(예: 추가/삭제 등)에만 초기화
    if (items.length !== q1Todos.length || items.some(item => !q1Todos.find(t => t.id === item.id))) {
      const sorted = [...q1Todos].sort((a, b) => {
          const rankA = a.priorityRank ?? 9999;
          const rankB = b.priorityRank ?? 9999;
          if (rankA !== rankB) return rankA - rankB;
          return (a.createdAt || 0) - (b.createdAt || 0);
      });
      setItems(sorted);
    }
  }, [todos, q1Todos.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      const newArray = arrayMove(items, oldIndex, newIndex);
      setItems(newArray);
      
      // 순번 업데이트를 위한 데이터 가공 후 스토어 반영
      const updates = newArray.map((item, idx) => ({ id: item.id, rank: idx + 1 }));
      updateTodoRanks(updates);
    }
  };

  const activeTodo = items.find(i => i.id === activeId);

  return (
    <main className="ranking-layout">
      <Header />
      
      <SettingsModal />
      
      <div className="container">
        <header className="page-header">
           <button className="back-btn" onClick={() => router.push('/')}>
             <ArrowLeft size={24} />
           </button>
           <div className="title-section">
              <div className="icon-badge">
                 <img src="/ranking.png" alt="랭킹" />
              </div>
              <div className="text-col">
                 <h1>당장해 우선순위 랭킹</h1>
                 <p>드래그하여 중요도와 시업성에 따른 실행 순서를 정하세요.</p>
              </div>
           </div>
        </header>

        <section className="ranking-content">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="rank-grid">
                {items.map((todo) => (
                  <SortableTodoCard 
                    key={todo.id} 
                    todo={todo} 
                    onEdit={(t) => router.push(`/all-todos?filter=q1&edit=${t.id}&from=ranking`)}
                    onDelete={(id) => deleteTodo(id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay adjustScale={true}>
              {activeTodo ? (
                <div className="rank-card glass dragging-overlay">
                   <div className="rank-badge">{activeTodo.priorityRank || 'N/A'}</div>
                   <GripVertical size={20} style={{ opacity: 0.5 }} />
                   <div className="rank-card-content">
                      <h3 className="rank-todo-text">{activeTodo.text}</h3>
                   </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>
      </div>

      <style jsx>{`
        .ranking-layout {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 10%, #1c2541 0%, #0d1117 100%);
          padding-top: 50px;
          padding-bottom: 100px;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        
        .page-header { display: flex; align-items: center; gap: 25px; margin-bottom: 50px; }
        .back-btn { 
          background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); 
          color: white; width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .back-btn:hover { background: rgba(255,255,255,0.1); border-color: var(--accent-color); }
        
        .title-section { display: flex; align-items: center; gap: 18px; }
        .icon-badge { 
           width: 56px; height: 56px; background: rgba(255,159,67,0.1); 
           border: 1px solid rgba(255,159,67,0.2); border-radius: 16px;
           display: flex; align-items: center; justify-content: center;
        }
        .icon-badge img { width: 34px; height: 34px; object-fit: contain; }
        
        .title-section h1 { margin: 0; font-size: 1.8rem; font-weight: 900; letter-spacing: -0.02em; }
        .title-section p { margin: 4px 0 0; color: var(--text-secondary); font-size: 0.95rem; font-weight: 600; }
        
        .rank-grid {
           display: grid;
           grid-template-columns: repeat(2, 1fr);
           gap: 16px;
        }

        .dragging-overlay {
          background: var(--accent-color);
          border: 2px solid white;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          width: 470px; /* 대략적인 너비 */
          pointer-events: none;
        }
      `}</style>
    </main>
  );
};

export default RankingPage;
