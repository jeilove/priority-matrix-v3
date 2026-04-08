'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { Plus, Search, Trash2, Edit, ChevronDown, ChevronUp, X, Check, Filter } from 'lucide-react';
import { useTodoStore, Todo, QuadrantType, StatusType, EnergyType, RepetitionType, ContextType } from '@/store/useTodoStore';
import { useSearchParams, useRouter } from 'next/navigation';

// 한글 라벨 매핑
const energyLabels: Record<EnergyType, string> = {
  'energy-high': '에너지높음',
  'energy-medium': '에너지중간',
  'energy-low': '에너지낮음'
};

const statusLabels: Record<StatusType, string> = {
  'todo': '준비',
  'in-progress': '진행중',
  'done': '마침',
  'blocked': '중단'
};

const repetitionLabels: Record<RepetitionType, string> = {
  'once': '한번',
  'daily': '매일',
  'weekly': '매주',
  'monthly': '매월'
};

const contextLabels: Record<ContextType, string> = {
  'home': '집',
  'office': '회사',
  'on-the-move': '이동중',
  'pc': 'pc',
  'mobile': '모바일'
};

const quadrantLabels: Record<string, string> = {
  'all': '모든 할 일',
  'q1': '당장 해',
  'q2': '살펴 봐',
  'q3': '남 줘',
  'q4': '요건 빼',
  'inbox': '보관함'
};

const quadrantIcons: Record<string, string> = {
  'all': '/logo_final_v2.png',
  'q1': '/q1.png',
  'q2': '/q2.png',
  'q3': '/q3.png',
  'q4': '/q4_final_v2.png',
  'inbox': '/archive.png'
};

// --- 컴포넌트: 할 일 입력/수정 폼 모달 ---
const TodoFormModal = ({ 
  initialTodo, 
  onClose, 
  onSave 
}: { 
  initialTodo?: Partial<Todo>, 
  onClose: () => void, 
  onSave: (data: Partial<Todo>) => void 
}) => {
  const [formData, setFormData] = useState<Partial<Todo>>({
    text: '',
    estimate: '0.5',
    energy: 'energy-medium',
    status: 'todo',
    repetition: [],
    context: [],
    tags: [],
    description: '',
    quadrant: 'unassigned',
    ...initialTodo
  });

  const [tagInput, setTagInput] = useState('');

  const handleToggleArray = (field: 'repetition' | 'context', value: any) => {
    const current = (formData[field] as any[]) || [];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass">
        <header className="modal-header">
          <h2>{initialTodo?.id ? '할 일 수정' : '새 할 일 추가'}</h2>
          <button onClick={onClose}><X /></button>
        </header>
        
        <div className="modal-body">
          <div className="form-group">
            <label>제목</label>
            <input 
              className="form-input" 
              value={formData.text} 
              onChange={e => setFormData({...formData, text: e.target.value})} 
              placeholder="무엇을 해야 하나요?"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>예상 시간 (시간)</label>
              <input 
                className="form-input" 
                value={formData.estimate} 
                onChange={e => setFormData({...formData, estimate: e.target.value})} 
                placeholder="0.5"
              />
            </div>
            <div className="form-group">
              <label>필요 에너지</label>
              <select 
                className="form-select"
                value={formData.energy}
                onChange={e => setFormData({...formData, energy: e.target.value as any})}
              >
                {Object.entries(energyLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>상태</label>
            <div className="chip-group">
              {Object.entries(statusLabels).map(([val, label]) => (
                <button 
                  key={val} 
                  className={`chip ${formData.status === val ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, status: val as any})}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>반복여부</label>
            <div className="chip-group">
              {Object.entries(repetitionLabels).map(([val, label]) => (
                <button 
                  key={val} 
                  className={`chip ${formData.repetition?.includes(val as any) ? 'active' : ''}`}
                  onClick={() => handleToggleArray('repetition', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>컨텍스트</label>
            <div className="chip-group">
              {Object.entries(contextLabels).map(([val, label]) => (
                <button 
                  key={val} 
                  className={`chip ${formData.context?.includes(val as any) ? 'active' : ''}`}
                  onClick={() => handleToggleArray('context', val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>태그 (업무, 개인, 투자, 공부 등)</label>
            <div className="tag-input-row">
              <input 
                className="form-input" 
                value={tagInput} 
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="태그 입력 후 추가 클릭"
              />
              <button onClick={handleAddTag} className="tag-add-btn">추가</button>
            </div>
            <div className="tag-list">
              {formData.tags?.map(tag => (
                <span key={tag} className="tag-item">
                  #{tag} <button onClick={() => setFormData({...formData, tags: formData.tags?.filter(t => t !== tag)})}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>설명</label>
            <textarea 
              className="form-textarea" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="상세 내용을 적어주세요..."
            />
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-save" onClick={() => onSave(formData)}>저장하기</button>
        </footer>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex; justify-content: center; align-items: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 500px; max-width: 95%; max-height: 90vh;
          background: #1a1a1a; border: 1px solid var(--glass-border);
          border-radius: 20px; overflow: hidden; display: flex; flex-direction: column;
        }
        .modal-header { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .modal-header button { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
        
        .modal-body { padding: 20px 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
        
        .form-input, .form-select, .form-textarea {
          background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
          border-radius: 8px; padding: 10px 12px; color: white; width: 100%;
        }
        .form-textarea { height: 80px; resize: none; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        .chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
          padding: 6px 14px; border-radius: 20px; color: var(--text-secondary);
          font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
        }
        .chip.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }
        
        .tag-input-row { display: flex; gap: 10px; align-items: stretch; }
        .tag-input-row .form-input { flex: 1; }
        .tag-add-btn { background: var(--accent-color); color: white; border-radius: 8px; padding: 0 15px; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
        .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
        .tag-item { background: rgba(46,160,67,0.1); color: var(--accent-color); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        .tag-item button { background: none; border: none; color: var(--accent-color); margin-left: 4px; cursor: pointer; font-size: 1rem; }

        .modal-footer { padding: 20px 25px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--glass-border); }
        .btn-cancel { background: rgba(255,255,255,0.05); color: var(--text-secondary); padding: 10px 20px; border-radius: 10px; font-weight: 600; }
        .btn-save { background: var(--accent-color); color: white; padding: 10px 20px; border-radius: 10px; font-weight: 600; }
      `}</style>
    </div>
  );
};

// --- 메인 콘텐츠 컴포넌트 ---
const AllTodosContent = () => {
    const { todos, deleteTodo, updateTodo, fullUpdateTodo, addTodo, updateTodoStatus, sortOrder, setSortOrder } = useTodoStore();
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialFilter = searchParams.get('filter') as QuadrantType | 'all' || 'all';
    
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | QuadrantType>(initialFilter as any);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // 필터링 상태들
    const [statusFilters, setStatusFilters] = useState<StatusType[]>([]);
    const [contextFilters, setContextFilters] = useState<ContextType[]>([]);
    const [repetitionFilters, setRepetitionFilters] = useState<RepetitionType[]>([]);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | undefined>(undefined);

    // 아코디언 상태
    const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);

    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        setFilter(urlFilter as any || 'all');
        
        const editId = searchParams.get('edit');
        if (editId) {
          const todo = todos.find(t => t.id === editId);
          if (todo) {
            setEditingTodo(todo);
            setIsModalOpen(true);
          }
        }
    }, [searchParams, todos]);

    const handleFilterChange = (newFilter: string) => {
      setFilter(newFilter as any);
      router.push(`/all-todos?filter=${newFilter}`);
    };

    const handleSave = (data: Partial<Todo>) => {
      if (editingTodo) {
        fullUpdateTodo(editingTodo.id, data);
      } else {
        addTodo({ ...data, text: data.text || '', estimate: data.estimate || '0.5' });
      }
      setIsModalOpen(false);
      setEditingTodo(undefined);
      
      const from = searchParams.get('from');
      if (from === 'home') {
        router.push('/');
      } else if (from === 'ranking') {
        router.push('/ranking');
      } else if (searchParams.get('edit')) {
        router.push(`/all-todos?filter=${filter}`);
      }
    };

    const handleStatusUpdate = (id: string, status: StatusType) => {
      updateTodoStatus(id, status);
      setOpenAccordionId(null);
    };

    const toggleFilter = (setFn: any, current: any[], val: any) => {
      if (current.includes(val)) setFn(current.filter(v => v !== val));
      else setFn([...current, val]);
    };

    const handleClose = () => {
      setIsModalOpen(false);
      setEditingTodo(undefined);
      
      const from = searchParams.get('from');
      if (from === 'home') {
        router.push('/');
      } else if (from === 'ranking') {
        router.push('/ranking');
      } else if (searchParams.get('edit')) {
        router.push(`/all-todos?filter=${filter}`);
      }
    };

    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesQuad = filter === 'all' || todo.quadrant === filter;
        
        // '마침' 또는 '중단' 상태 필터링: 보관함(inbox) 탭이 아닐 때는 보이지 않게 함
        const isDoneOrBlocked = todo.status === 'done' || todo.status === 'blocked';
        const shouldHide = filter !== 'inbox' && isDoneOrBlocked;
        if (shouldHide) return false;

        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(todo.status);
        const matchesContext = contextFilters.length === 0 || todo.context?.some(c => contextFilters.includes(c));
        const matchesRepet = repetitionFilters.length === 0 || todo.repetition?.some(r => repetitionFilters.includes(r));
        return matchesSearch && matchesQuad && matchesStatus && matchesContext && matchesRepet;
    });

    // 정렬 로직 적용
    const sortedFilteredTodos = [...filteredTodos].sort((a, b) => {
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

    const getTagColor = (q: string) => {
        switch (q) {
            case 'q1': return 'var(--q1-color)';
            case 'q2': return 'var(--q2-color)';
            case 'q3': return 'var(--q3-color)';
            case 'q4': return 'var(--q4-color)';
            case 'unassigned': return 'var(--text-secondary)';
            default: return 'var(--glass-border)';
        }
    };

    return (
        <div className="container" style={{ paddingTop: '20px' }}>
            <section className="controls-row">
              <div className="search-box glass">
                  <Search size={18} color="var(--text-secondary)" />
                  <input 
                      type="text" 
                      placeholder="제목 또는 태그로 검색..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="all-todos-sort-control glass mobile-icon-only">
                <span className="sort-label">정렬:</span>
                <div className="mobile-sort-trigger">
                  <img src="/icons/sort.png" alt="정렬" className="mobile-only-icon sort-img" />
                  <ChevronDown size={14} className="mobile-only-icon chevron" />
                </div>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="all-todos-sort-select"
                >
                  <option value="recent">최근순 ▾</option>
                  <option value="abc">가나다순 ▾</option>
                  {filter === 'q1' && <option value="rank">실행순위 ▾</option>}
                </select>
              </div>

              <button className={`filter-toggle-btn glass mobile-icon-only ${isFilterOpen ? 'active' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <Filter size={18} className="pc-only-icon" />
                <img src="/icons/filter.jpg" alt="필터" className="mobile-only-icon filter-img" />
                <span className="pc-only-text">상세 필터</span>
                {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </section>

            {/* 모바일 전용 하단 고정 탭바 */}
            <nav className="mobile-all-bottom-nav">
              <Link href="/" className={`mobile-all-nav-item`}>
                <img src="/icons/home.png" alt="홈" className="mobile-nav-icon" />
              </Link>
              <button className={`mobile-all-nav-item ${filter === 'q1' ? 'active' : ''}`} onClick={() => handleFilterChange('q1')}>
                <img src="/icons/q1.png" alt="해" className="mobile-nav-icon" />
              </button>
              <button className={`mobile-all-nav-item ${filter === 'q2' ? 'active' : ''}`} onClick={() => handleFilterChange('q2')}>
                <img src="/icons/q2.png" alt="봐" className="mobile-nav-icon" />
              </button>
              <button className={`mobile-all-nav-item ${filter === 'q3' ? 'active' : ''}`} onClick={() => handleFilterChange('q3')}>
                <img src="/icons/q3.png" alt="줘" className="mobile-nav-icon" />
              </button>
              <button className={`mobile-all-nav-item ${filter === 'q4' ? 'active' : ''}`} onClick={() => handleFilterChange('q4')}>
                <img src="/icons/q4.png" alt="요" className="mobile-nav-icon" />
              </button>
              <button className={`mobile-all-nav-item ${filter === 'inbox' ? 'active' : ''}`} onClick={() => handleFilterChange('inbox')}>
                <img src="/icons/inbox.png" alt="보관함" className="mobile-nav-icon" />
              </button>
            </nav>

            {isFilterOpen && (
              <section className="filter-advanced-section glass accordion-open">
                <div className="filter-row">
                  <span className="filter-label">상태</span>
                  <div className="filter-chips">
                    {Object.entries(statusLabels).map(([val, label]) => (
                      <label key={val} className={`filter-chip ${statusFilters.includes(val as any) ? 'active' : ''}`}>
                        <input type="checkbox" checked={statusFilters.includes(val as any)} onChange={() => toggleFilter(setStatusFilters, statusFilters, val)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="filter-row">
                  <span className="filter-label">컨텍스트</span>
                  <div className="filter-chips">
                    {Object.entries(contextLabels).map(([val, label]) => (
                      <label key={val} className={`filter-chip ${contextFilters.includes(val as any) ? 'active' : ''}`}>
                        <input type="checkbox" checked={contextFilters.includes(val as any)} onChange={() => toggleFilter(setContextFilters, contextFilters, val)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="filter-row">
                  <span className="filter-label">반복여부</span>
                  <div className="filter-chips">
                    {Object.entries(repetitionLabels).map(([val, label]) => (
                      <label key={val} className={`filter-chip ${repetitionFilters.includes(val as any) ? 'active' : ''}`}>
                        <input type="checkbox" checked={repetitionFilters.includes(val as any)} onChange={() => toggleFilter(setRepetitionFilters, repetitionFilters, val)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="todo-list-wrapper">
                <div className="list-stats">검색 결과: {sortedFilteredTodos.length}개</div>
                <div className="todo-grid">
                    {sortedFilteredTodos.length > 0 ? sortedFilteredTodos.map((todo) => (
                        <div key={todo.id} className="todo-card-full glass">
                            <div className="card-inner" onClick={() => setOpenAccordionId(openAccordionId === todo.id ? null : todo.id)}>
                                <div className="card-side-indicator" style={{ backgroundColor: getTagColor(todo.quadrant) }}></div>
                                <div className="card-main-content">
                                    <div className="card-header-row">
                                      <div className="title-area">
                                        {filter === 'all' && (
                                          <span className="quadrant-desc">{quadrantLabels[todo.quadrant]}</span>
                                        )}
                                        <h3 className="todo-title" title={todo.text}>{todo.text}</h3>
                                      </div>
                                      <div className="card-actions">
                                          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setEditingTodo(todo); setIsModalOpen(true); }} title="수정">
                                              <Edit size={16} />
                                          </button>
                                          <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); deleteTodo(todo.id); }} title="삭제">
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                    </div>
                                    
                                    <div className="todo-meta-info">
                                      <span className="meta-item energy">{energyLabels[todo.energy || 'energy-medium']}</span>
                                      <span className="meta-item status-badge" data-status={todo.status}>{statusLabels[todo.status]}</span>
                                      {todo.repetition && todo.repetition.length > 0 && (
                                        <span className="meta-item">{todo.repetition.map(r => repetitionLabels[r]).join(', ')}</span>
                                      )}
                                      {todo.context && todo.context.length > 0 && (
                                        <span className="meta-item context">{todo.context.map(c => contextLabels[c]).join(', ')}</span>
                                      )}
                                    </div>

                                    {todo.tags && todo.tags.length > 0 && (
                                      <div className="card-tags">
                                        {todo.tags.map(t => <span key={t} className="tag">#{t}</span>)}
                                      </div>
                                    )}
                                </div>
                                <div className="accordion-toggle">
                                  {openAccordionId === todo.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {openAccordionId === todo.id && (
                              <div className="accordion-content">
                                <div className="status-change-group">
                                  <span className="group-label">상태 변경:</span>
                                  {Object.entries(statusLabels).map(([val, label]) => (
                                    <button 
                                      key={val} 
                                      className={`status-btn ${todo.status === val ? 'active' : ''}`}
                                      onClick={() => handleStatusUpdate(todo.id, val as any)}
                                    >
                                      {todo.status === val && <Check size={14} style={{ marginRight: 4 }} />}
                                      {label}
                                    </button>
                                  ))}
                                </div>
                                {todo.description && (
                                  <div className="todo-description">
                                    <p>{todo.description}</p>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                    )) : (
                        <p className="no-data">해당하는 할 일이 없습니다.</p>
                    )}
                </div>
            </div>

            {isModalOpen && (
              <TodoFormModal 
                initialTodo={editingTodo} 
                onClose={handleClose}
                onSave={handleSave}
              />
            )}

            <style jsx>{`
                .container { max-width: 1000px; margin: 0 auto; }
                
                .quadrant-tabs { 
                  display: flex; justify-content: center; gap: 15px; 
                  padding: 10px; margin-top: 25px; margin-bottom: 35px;
                  background: none; border: none;
                  flex-wrap: wrap;
                }
                .tab-btn { 
                  background: none; border: none; color: var(--text-secondary); 
                  padding: 10px 18px; border-radius: 12px; font-weight: 700; 
                  font-size: 0.95rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                  display: flex; align-items: center; gap: 12px;
                }
                .tab-btn:hover { color: white; background: rgba(255,255,255,0.08); }
                .tab-btn.active { 
                    color: white; 
                    transform: translateY(-2px);
                }
                .tab-icon-small { 
                    width: 36px; height: 36px; object-fit: contain; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .tab-btn.active .tab-icon-small { 
                    transform: scale(1.5); 
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.4));
                }
                .tab-label-text { white-space: nowrap; }

                .controls-row { display: flex; gap: 15px; margin-bottom: 20px; align-items: stretch; }
                .search-box { flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 20px; border-radius: 12px; }
                .search-box input { background: none; border: none; color: white; width: 100%; font-size: 1rem; }
                .search-box input:focus { outline: none; }
                
                .all-todos-sort-control {
                  display: flex; align-items: center; gap: 8px; padding: 0 16px; 
                  border-radius: 12px; transition: all 0.2s;
                }
                .all-todos-sort-control .sort-label { color: var(--text-secondary); }
                .all-todos-sort-select {
                  background: none; border: none; color: white;
                  font-family: inherit; font-size: 0.9rem; font-weight: 800;
                  cursor: pointer; outline: none; appearance: none;
                  padding-right: 4px;
                }
                .all-todos-sort-select option { background: #1a1f2e; color: white; }

                .filter-toggle-btn { 
                  display: flex; align-items: center; gap: 10px; padding: 0 20px; 
                  border-radius: 12px; color: var(--text-secondary); font-weight: 700; font-size: 0.9rem;
                  cursor: pointer; transition: all 0.2s;
                }
                .filter-toggle-btn.active { color: var(--accent-color); border-color: var(--accent-color); }
                .filter-toggle-btn:hover { background: rgba(255,255,255,0.08); }

                .filter-advanced-section { padding: 20px 25px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 15px; animation: slideDown 0.3s ease-out; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                
                .filter-row { display: flex; align-items: baseline; gap: 20px; }
                .filter-label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); min-width: 70px; }
                .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
                .filter-chip { display: flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
                .filter-chip input { display: none; }
                .filter-chip.active { background: rgba(46, 160, 67, 0.1); border-color: var(--accent-color); color: var(--accent-color); }
                
                .todo-list-wrapper { margin-bottom: 100px; }
                .list-stats { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; font-weight: 600; opacity: 0.7; }
                
                .todo-grid { 
                  display: grid; 
                  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
                  gap: 24px; 
                  padding: 10px 2px;
                }
                .todo-card-full { 
                  border-radius: 16px; 
                  overflow: hidden; 
                  border: 1px solid var(--glass-border); 
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
                  height: auto;
                  min-height: 120px;
                  background: rgba(255, 255, 255, 0.03);
                  display: flex;
                  flex-direction: column;
                }
                .todo-card-full:hover { 
                  border-color: rgba(255, 255, 255, 0.3); 
                  background: rgba(255, 255, 255, 0.07); 
                  transform: translateY(-5px); 
                  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
                }
                
                .card-inner { display: flex; align-items: stretch; cursor: pointer; position: relative; }
                .card-side-indicator { width: 4px; }
                .card-main-content { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 0; overflow: hidden; }
                
                .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; min-width: 0; }
                .title-area { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; overflow: hidden; }
                .quadrant-desc { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; opacity: 0.6; transition: all 0.2s; cursor: default; }
                .quadrant-desc:hover { color: white; opacity: 1; }
                .todo-title { 
                  font-size: 1.05rem; font-weight: 700; margin: 0; line-height: 1.4; color: white;
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; display: block;
                }
                
                .card-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; flex-shrink: 0; }
                .todo-card-full:hover .card-actions { opacity: 1; }
                .icon-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 4px; }
                .icon-btn:hover { color: white; background: rgba(255,255,255,0.1); }
                .icon-btn.delete:hover { color: #ff4d4d; background: rgba(255,77,77,0.1); }

                .todo-meta-info { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
                .meta-item { font-size: 0.65rem; font-weight: 700; color: var(--text-secondary); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
                .meta-item.energy { color: var(--accent-color); border: 1px solid rgba(46,160,67,0.2); }
                .meta-item.status-badge[data-status="done"] { background: var(--accent-color); color: white; }
                .meta-item.status-badge[data-status="blocked"] { background: #ff9800; color: white; }
                
                .card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
                .tag { font-size: 0.65rem; color: var(--accent-color); font-weight: 800; opacity: 0.7; }
                
                .accordion-toggle { display: flex; align-items: center; padding-right: 12px; color: var(--text-secondary); opacity: 0.3; }
                
                .accordion-content { background: rgba(0,0,0,0.2); padding: 14px 16px; border-top: 1px solid var(--glass-border); animation: slideDown 0.2s ease-out; }
                
                .status-change-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .group-label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-right: 4px; }
                .status-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; transition: all 0.2s; }
                .status-btn.active { background: rgba(46, 160, 67, 0.1); border-color: var(--accent-color); color: var(--accent-color); font-weight: 800; }
                
                .todo-description { margin-top: 12px; border-top: 1px dashed var(--glass-border); padding-top: 8px; }
                .todo-description p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0; }

                .no-data { text-align: center; color: var(--text-secondary); padding: 50px; font-weight: 600; font-size: 0.9rem; }

                .mobile-all-bottom-nav { display: none; } /* 기본적으로 숨김 (PC) */
                .mobile-only-icon { display: none; }
                .pc-only-icon { display: block; }
                .pc-only-text { display: inline; }

                @media (max-width: 768px) {
                  .all-todos-layout { padding-top: 10px; }
                  .container { padding-top: 5px !important; }
                  .controls-row { flex-wrap: nowrap; gap: 8px; padding: 0 10px; margin-top: 5px; }
                  .search-box { flex: 3; padding: 8px 12px; }
                  .search-box input { font-size: 0.9rem; }
                  
                  /* 상단 탭바 숨기기 (모바일전용) */
                  .quadrant-tabs { display: none !important; }

                  .mobile-icon-only { 
                    flex: 1; 
                    min-width: 44px; 
                    padding: 0 !important; 
                    justify-content: center; 
                    position: relative;
                  }
                  .mobile-sort-trigger { display: flex; align-items: center; gap: 2px; }
                  .mobile-only-icon { display: block !important; width: 22px; height: 22px; object-fit: contain; }
                  .chevron { color: var(--text-secondary); opacity: 0.6; width: 14px; height: 14px; }
                  .sort-img { mix-blend-mode: color-dodge; opacity: 0.9; }
                  .filter-img { mix-blend-mode: color-dodge; opacity: 0.8; }
                  
                  .pc-only-icon, .pc-only-text, .sort-label { display: none !important; }
                  
                  .all-todos-sort-select {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    opacity: 0; /* 글자는 안보이지만 클릭은 가능하게 */
                    z-index: 2;
                  }
                  
                  .todo-list-wrapper { margin-bottom: 120px; }
                  .todo-grid { grid-template-columns: 1fr; gap: 16px; }

                  /* 모바일 하단 탭바 스타일 */
                  .mobile-all-bottom-nav {
                    display: flex !important;
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    height: 70px;
                    background: rgba(13, 17, 23, 0.9);
                    backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    justify-content: space-around;
                    align-items: center;
                    z-index: 9999;
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: 10px; padding-right: 10px;
                  }
                  .mobile-all-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: none; border: none;
                    width: 50px; height: 50px;
                    border-radius: 12px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                  }
                  .mobile-all-nav-item.active {
                    background: rgba(255, 255, 255, 0.06);
                    box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.05);
                    transform: translateY(-2px);
                  }
                  .mobile-nav-icon {
                    width: 32px; height: 32px; object-fit: contain;
                    opacity: 0.5; transition: all 0.3s;
                    filter: grayscale(1);
                  }
                  .mobile-all-nav-item.active .mobile-nav-icon {
                    opacity: 1; 
                    filter: grayscale(0) drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
                  }
                }
            `}</style>
        </div>
    );
};

const AllTodos = () => {
    return (
        <main className="all-todos-layout">
            <Header />
            <Suspense fallback={<div className="container">로딩 중...</div>}>
                <AllTodosContent />
            </Suspense>

            <style jsx>{`
                .all-todos-layout {
                  min-height: 100vh;
                  padding-top: 30px;
                  padding-bottom: 120px;
                  background: radial-gradient(circle at 50% 0%, #1a1f2e 0%, #0d1117 100%);
                  overflow-y: auto;
                }
            `}</style>
        </main>
    );
};

export default AllTodos;
