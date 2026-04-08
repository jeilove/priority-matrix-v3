'use client';

import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, GripVertical, Maximize2, Minimize2, X } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useTodoStore, Todo } from '@/store/useTodoStore';

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

const repetitionLabels: Record<string, string> = {
  'once': '한번',
  'daily': '매일',
  'weekly': '매주',
  'monthly': '매월'
};

const contextLabels: Record<string, string> = {
  'home': '집',
  'office': '회사',
  'on-the-move': '이동중',
  'pc': 'pc',
  'mobile': '모바일'
};

const DraggableTodo = ({ todo }: { todo: Todo }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
  });

  const style = {
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const infoText = [
    energyLabels[todo.energy || 'energy-medium'],
    statusLabels[todo.status || 'todo'],
    todo.repetition?.map(r => repetitionLabels[r]).join(','),
    todo.context?.map(c => contextLabels[c]).join(',')
  ].filter(Boolean).join(' / ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`draggable-todo-card ${isDragging ? 'dragging' : ''}`}
    >
      <GripVertical size={16} className="grip-icon" />
      <div className="todo-content">
        <p className="todo-text-small">{todo.text}</p>
        <span className="estimate-badge-v2">{infoText}</span>
      </div>
    </div>
  );
};

const CircleInput = ({ forceOpen, onClose }: { forceOpen?: boolean; onClose?: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false); // 중앙 박스 확장 여부
  const [todoText, setTodoText] = useState('');
  const [estimate, setEstimate] = useState('');
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputStage, setInputStage] = useState<'text' | 'estimate'>('text');
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    if (forceOpen) setIsExpanded(true);
  }, [forceOpen]);

  const { todos, addTodo } = useTodoStore();
  const inboxTodos = todos.filter(t => t.quadrant === 'inbox');
  const currentTodo = inboxTodos[inboxTodos.length - 1 - currentIndex];

  const handleNextStage = () => {
    if (todoText.trim()) {
      setInputStage('estimate');
    }
  };

  const handleSave = () => {
    if (todoText.trim()) {
      const finalEstimate = estimate.trim() || '0.5';
      addTodo({ text: todoText, estimate: finalEstimate, quadrant: 'inbox' });
      setTodoText('');
      setEstimate('');
      setIsInputMode(false);
      setInputStage('text');
      setCurrentIndex(0);
      // setIsExpanded(false); // 더 이상 자동으로 닫지 않고 내용을 보여줌
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (inputStage === 'text') handleNextStage();
      else handleSave();
    }
  };

  const handlePrev = () => {
    if (currentIndex < inboxTodos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className={`circle-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <button 
          className="expand-trigger glass" 
          onClick={() => setIsExpanded(true)}
          title="할 일 추가 및 미분류 확인"
        >
          <Plus size={32} color="var(--accent-color)" />
          {inboxTodos.length > 0 && <span className="inbox-notification">{inboxTodos.length}</span>}
        </button>
      ) : (
        <div className="main-input-box glass expanded-box">
          <button className="minimize-btn" onClick={() => { setIsExpanded(false); setIsInputMode(false); onClose?.(); }} title="닫기">
            <Minimize2 size={20} />
          </button>

          {!isInputMode ? (
            <div className="display-mode">
              {currentTodo ? (
                <div className="active-todo-display">
                  <div className="todo-nav-container">
                    {inboxTodos.length > 1 && (
                      <button
                        className="nav-arrow-btn"
                        onClick={handlePrev}
                        disabled={currentIndex === inboxTodos.length - 1}
                      >
                        <ChevronLeft size={24} />
                      </button>
                    )}

                    <DraggableTodo todo={currentTodo} />

                    {inboxTodos.length > 1 && (
                      <button
                        className="nav-arrow-btn"
                        onClick={handleNext}
                        disabled={currentIndex === 0}
                      >
                        <ChevronRight size={24} />
                      </button>
                    )}
                  </div>

                  <div className="action-row">
                    <button 
                      className="add-more-btn" 
                      onClick={() => {
                        setIsInputMode(true);
                        setInputStage('text');
                      }}
                      title="새 할 일 추가"
                    >
                      <Plus size={18} />
                      <span>또 다른 일?</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  className="add-btn" 
                  onClick={() => {
                    setIsInputMode(true);
                    setInputStage('text');
                  }}
                  title="새 할 일 추가"
                >
                  <Plus size={28} />
                  <div className="inbox-badge-wrapper" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="inbox-badge">
                      <span className="inbox-count">{inboxTodos.length}</span>
                    </div>
                  </div>
                  <span>할 일 추가</span>
                </button>
              )}
              <div className="inbox-status">
                <span className="count-badge">{inboxTodos.length}</span>
                <span className="status-text">미분류 할 일</span>
                {inboxTodos.length > 1 && (
                  <span className="index-indicator">({currentIndex + 1} / {inboxTodos.length})</span>
                )}
              </div>
            </div>
          ) : (
            <div className={`input-mode stage-${inputStage}`}>
              <button className="close-input-x" onClick={() => setIsInputMode(false)}>×</button>

              {inputStage === 'text' ? (
                <div className="input-content-v2">
                  <span className="step-tag">STEP 1</span>
                  <h3 className="guide-msg">무엇을 해야 하나요?</h3>
                  <input
                    type="text"
                    placeholder="할 일 내용을 입력하세요..."
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="todo-input-large"
                    autoFocus
                  />
                  <button className="stage-next-btn" onClick={handleNextStage} disabled={!todoText.trim()}>
                    시간 설정하기
                  </button>
                </div>
              ) : (
                <div className="input-content-v2 estimate-stage">
                  <span className="step-tag accent">STEP 2</span>
                  <h3 className="guide-msg">예상 소요시간 적기</h3>
                  <div className="todo-preview-card">"{todoText}"</div>

                  <div className="estimate-input-area">
                    <input
                      type="text"
                      placeholder="0.5 (시간)"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="estimate-input-large"
                      autoFocus
                    />
                  </div>

                  <div className="stage-final-actions">
                    <button className="stage-back-btn" onClick={() => setInputStage('text')}>이전</button>
                    <button className="stage-save-btn" onClick={handleSave}>등록완료</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .circle-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto; /* 상위 wrapper가 none이어도 여긴 클릭되어야 함 */
        }
        
        /* 축소 상태의 트리거 아이콘 */
        .expand-trigger {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid var(--accent-color);
          box-shadow: 0 0 30px rgba(46, 160, 67, 0.2);
          transition: all 0.3s ease;
          position: relative;
          pointer-events: auto;
          background: rgba(13, 17, 23, 0.8);
          backdrop-filter: blur(8px);
        }
        .expand-trigger:hover {
          transform: scale(1.1);
          background: rgba(46, 160, 67, 0.15);
          box-shadow: 0 0 50px rgba(46, 160, 67, 0.4);
        }
        .inbox-notification {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff4d4d;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          border: 2px solid var(--bg-color);
          z-index: 10;
        }

        @media (max-width: 768px) {
          .circle-container { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); top: auto; }
          .expand-trigger { width: 54px; height: 54px; }
          .main-input-box { width: calc(100vw - 32px); max-width: 360px; height: 260px; }
        }
        .main-input-box {
          width: 270px;
          height: 270px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 15px;
          border: 2px solid var(--accent-color);
          box-shadow: 0 0 40px rgba(46, 160, 67, 0.2);
          position: relative;
          overflow: hidden;
          pointer-events: auto;
          animation: expandAnim 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background: rgba(13, 17, 23, 0.9);
          backdrop-filter: blur(12px);
        }
        @keyframes expandAnim {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .minimize-btn {
          position: absolute;
          top: 15px;
          left: 15px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }
        .minimize-btn:hover { opacity: 1; color: white; }

        .close-input-x {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 2rem;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0.5;
          transition: opacity 0.2s;
          line-height: 1;
          z-index: 20;
        }
        .close-input-x:hover { opacity: 1; color: var(--accent-color); }

        .display-mode {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .active-todo-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          width: 100%;
        }
        .todo-nav-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
        }
        .nav-arrow-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .nav-arrow-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: var(--accent-color);
        }
        .nav-arrow-btn:disabled { opacity: 0.1; cursor: not-allowed; }

        .add-btn {
          background: var(--accent-color);
          color: white;
          width: 110px;
          height: 110px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(46, 160, 67, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .add-btn:hover { transform: scale(1.05); background: var(--accent-hover); }

        .add-more-btn {
          background: rgba(46, 160, 67, 0.1);
          border: 1px solid var(--accent-color);
          color: white;
          padding: 8px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .add-more-btn:hover { background: rgba(46, 160, 67, 0.2); transform: translateY(-2px); }

        .draggable-todo-card {
          background: rgba(46, 160, 67, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid var(--accent-color);
          border-radius: 10px;
          padding: 8px 12px;
          width: 140px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: grab;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .grip-icon { color: var(--accent-color); opacity: 0.6; }
        .todo-content { flex: 1; text-align: left; overflow: hidden; }
        .todo-text-small { font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; color: white; }
        .estimate-badge-v2 { font-size: 0.7rem; color: var(--accent-color); font-weight: 700; opacity: 0.8; }

        .input-mode { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .input-content-v2 { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        
        .step-tag { background: rgba(255, 255, 255, 0.1); padding: 3px 10px; border-radius: 8px; font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); }
        .step-tag.accent { background: var(--accent-color); color: white; }
        
        .guide-msg { font-size: 1.2rem; font-weight: 700; margin: 0; }
        .todo-input-large, .estimate-input-large {
          width: 90%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 10px;
          padding: 12px;
          color: white;
          font-size: 1rem;
          text-align: center;
        }

        .stage-next-btn, .stage-save-btn { background: var(--accent-color); color: white; padding: 10px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; }
        .stage-next-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .estimate-stage { gap: 12px; }
        .todo-preview-card { background: rgba(255, 255, 255, 0.05); padding: 5px 12px; border-radius: 8px; color: var(--text-secondary); font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85%; }
        .estimate-input-area { width: 70%; display: flex; justify-content: center; }

        .stage-final-actions { display: flex; gap: 8px; width: 85%; }
        .stage-back-btn { flex: 1; background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); padding: 10px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; }
        .stage-save-btn { flex: 2; }

        .inbox-status { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 0.85rem; }
        .count-badge { background: var(--accent-color); color: white; padding: 1px 6px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; }
        .index-indicator { opacity: 0.5; font-size: 0.75rem; }
      `}</style>
    </div>
  );
};

export default CircleInput;
