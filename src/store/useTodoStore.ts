import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initGoogleAuth, uploadTodos, downloadTodos } from '@/utils/googleSyncEngine';

export type QuadrantType = 'q1' | 'q2' | 'q3' | 'q4' | 'inbox' | 'unassigned';
// ... 나머지 타입들 동일
export type EnergyType = 'energy-high' | 'energy-medium' | 'energy-low';
export type StatusType = 'todo' | 'in-progress' | 'done' | 'blocked';
export type RepetitionType = 'once' | 'daily' | 'weekly' | 'monthly';
export type ContextType = 'home' | 'office' | 'mobile' | 'pc' | 'on-the-move';
export type SortOrderType = 'recent' | 'abc' | 'rank';

export interface Todo {
    id: string;
    text: string;
    estimate: string;
    quadrant: QuadrantType;
    createdAt: number;
    isHidden?: boolean;

    // 추가 필드
    energy?: EnergyType;
    status: StatusType; // 기본값 'todo'
    repetition?: RepetitionType[];
    context?: ContextType[];
    tags?: string[];
    description?: string;

    priorityRank?: number; // 중요도 및 시급성 순위
    prevQuadrant?: QuadrantType;
}

interface TodoState {
    todos: Todo[];
    isSyncing: boolean;
    lastSyncTime: string | null;
    
    addTodo: (todo: Partial<Todo> & { text: string; estimate: string }) => void;
    updateTodo: (id: string, text: string, estimate: string) => void;
    fullUpdateTodo: (id: string, updates: Partial<Todo>) => void;
    updateTodoStatus: (id: string, status: StatusType) => void;
    moveTodo: (id: string, quadrant: QuadrantType) => void;
    moveTodoAndHide: (id: string, quadrant: QuadrantType) => void;
    deleteTodo: (id: string) => void;
    clearInbox: () => void;
    // 정렬 관련
    sortOrder: SortOrderType;
    setSortOrder: (order: SortOrderType) => void;
    // 동기화 관련
    setTodos: (todos: Todo[]) => void;
    setSyncStatus: (isSyncing: boolean, lastSyncTime?: string) => void;
    syncToCloud: () => Promise<void>;
    syncFromCloud: () => Promise<void>;
    // 로컬 파일 백업/복구
    exportTodos: () => void;
    importTodos: (file: File) => Promise<void>;
    // 순위(랭킹) 업데이트
    updateTodoRanks: (updates: { id: string; rank: number }[]) => void;
    
    // DB 동기화 관련
    syncToDB: () => Promise<void>;
    syncFromDB: () => Promise<void>;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set, get) => ({
            todos: [],
            sortOrder: 'recent',
            isSyncing: false,
            lastSyncTime: null,

            setSortOrder: (order) => set({ sortOrder: order }),
            setTodos: (todos) => set({ todos }),
            setSyncStatus: (isSyncing, lastSyncTime) => set({ isSyncing, lastSyncTime: lastSyncTime || new Date().toLocaleString() }),
            
            // DB 동기화 (Neon)
            syncToDB: async () => {
                set({ isSyncing: true });
                try {
                    const response = await fetch('/api/todos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ todos: get().todos }),
                    });
                    if (!response.ok) throw new Error('DB 저장 실패');
                    set({ lastSyncTime: new Date().toLocaleString() });
                } catch (err) {
                    console.error('DB Sync Error:', err);
                    throw err;
                } finally {
                    set({ isSyncing: false });
                }
            },

            syncFromDB: async () => {
                set({ isSyncing: true });
                try {
                    const response = await fetch('/api/todos');
                    if (!response.ok) throw new Error('DB 불러오기 실패');
                    const dbTodos = await response.json();
                    if (Array.isArray(dbTodos)) {
                        // DB 데이터가 비어있지 않은 경우에만 업데이트
                        if (dbTodos.length > 0) {
                            set({ todos: dbTodos, lastSyncTime: new Date().toLocaleString() });
                        }
                    }
                } catch (err) {
                    console.error('DB Fetch Error:', err);
                    throw err;
                } finally {
                    set({ isSyncing: false });
                }
            },

            exportTodos: () => {
                const data = JSON.stringify(get().todos, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `todos_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            },

            importTodos: async (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const content = e.target?.result as string;
                            const importedTodos = JSON.parse(content);
                            if (Array.isArray(importedTodos)) {
                                set({ todos: importedTodos });
                                resolve();
                            } else {
                                throw new Error('올바른 할 일 목록 형식이 아닙니다.');
                            }
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = () => reject(new Error('파일 읽기 실패'));
                    reader.readAsText(file);
                });
            },
            syncToCloud: async () => {
                const clientId = localStorage.getItem('google_client_id');
                if (!clientId) throw new Error('Client ID가 없습니다.');
                
                set({ isSyncing: true });
                try {
                    await initGoogleAuth(clientId);
                    await uploadTodos((useTodoStore.getState() as any).todos);
                    set({ lastSyncTime: new Date().toLocaleString() });
                    alert('성공적으로 클라우드에 저장되었습니다!');
                } catch (err: any) {
                    alert('저장 실패: ' + err.message);
                } finally {
                    set({ isSyncing: false });
                }
            },
            syncFromCloud: async () => {
                const clientId = localStorage.getItem('google_client_id');
                if (!clientId) throw new Error('Client ID가 없습니다.');
                
                set({ isSyncing: true });
                try {
                    await initGoogleAuth(clientId);
                    const cloudTodos = await downloadTodos();
                    if (Array.isArray(cloudTodos)) {
                        set({ todos: cloudTodos, lastSyncTime: new Date().toLocaleString() });
                        alert('클라우드에서 데이터를 성공적으로 가져왔습니다!');
                    }
                } catch (err: any) {
                    alert('가져오기 실패: ' + err.message);
                } finally {
                    set({ isSyncing: false });
                }
            },
            addTodo: (params) =>
                set((state) => ({
                    todos: [
                        ...state.todos,
                        {
                            id: Math.random().toString(36).substring(2, 9),
                            text: params.text,
                            estimate: params.estimate,
                            quadrant: (params.status === 'done' || params.status === 'blocked') ? 'inbox' : (params.quadrant || 'unassigned'),
                            status: params.status || 'todo',
                            energy: params.energy || 'energy-medium',
                            repetition: params.repetition || [],
                            context: params.context || [],
                            tags: params.tags || [],
                            description: params.description || '',
                            createdAt: Date.now(),
                        },
                    ],
                })),
            updateTodo: (id, text, estimate) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, text, estimate } : todo
                    ),
                })),
            fullUpdateTodo: (id, updates) =>
                set((state) => ({
                    todos: state.todos.map((todo) => {
                        if (todo.id !== id) return todo;
                        
                        const newStatus = updates.status || todo.status;
                        let newQuadrant = updates.quadrant || todo.quadrant;
                        let newPrevQuadrant = todo.prevQuadrant;

                        // 상태가 마침/중단으로 바뀐 경우
                        if ((newStatus === 'done' || newStatus === 'blocked') && newQuadrant !== 'inbox') {
                            newPrevQuadrant = todo.quadrant;
                            newQuadrant = 'inbox';
                        }
                        // 마침/중단에서 다시 복구된 경우
                        else if ((todo.status === 'done' || todo.status === 'blocked') && 
                                 (newStatus === 'todo' || newStatus === 'in-progress')) {
                            if (todo.prevQuadrant) {
                                newQuadrant = todo.prevQuadrant;
                                newPrevQuadrant = undefined;
                            } else if (newQuadrant === 'inbox') {
                                newQuadrant = 'unassigned';
                            }
                        }

                        return { ...todo, ...updates, quadrant: newQuadrant, prevQuadrant: newPrevQuadrant };
                    }),
                })),
            updateTodoStatus: (id, status) =>
                set((state) => ({
                    todos: state.todos.map((todo) => {
                        if (todo.id !== id) return todo;

                        let newQuadrant = todo.quadrant;
                        let newPrevQuadrant = todo.prevQuadrant;

                        // 마침(done) 또는 중단(blocked) 상태로 변경 시 inbox로 이동
                        if (status === 'done' || status === 'blocked') {
                            if (todo.quadrant !== 'inbox') {
                                newPrevQuadrant = todo.quadrant;
                                newQuadrant = 'inbox';
                            }
                        } 
                        // 마침/중단에서 다시 준비/진행으로 변경 시 이전 사분면으로 복구
                        else if ((todo.status === 'done' || todo.status === 'blocked') && 
                                 (status === 'todo' || status === 'in-progress')) {
                            if (todo.prevQuadrant) {
                                newQuadrant = todo.prevQuadrant;
                                newPrevQuadrant = undefined;
                            } else if (todo.quadrant === 'inbox') {
                                // 이전 사분면 정보가 없는데 inbox에 있었다면 unassigned로 복구
                                newQuadrant = 'unassigned';
                            }
                        }

                        return { 
                            ...todo, 
                            status, 
                            quadrant: newQuadrant, 
                            prevQuadrant: newPrevQuadrant,
                            isHidden: false 
                        };
                    }),
                })),
            moveTodo: (id, quadrant) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, quadrant, isHidden: false, prevQuadrant: undefined } : todo
                    ),
                })),
            moveTodoAndHide: (id, quadrant) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, quadrant, isHidden: true, prevQuadrant: undefined } : todo
                    ),
                })),
            deleteTodo: (id) =>
                set((state) => ({
                    todos: state.todos.filter((todo) => todo.id !== id),
                })),
            clearInbox: () =>
                set((state) => ({
                    todos: state.todos.filter((todo) => todo.quadrant !== 'inbox'),
                })),
            updateTodoRanks: (updates) =>
                set((state) => ({
                    todos: state.todos.map((todo) => {
                        const update = updates.find((u) => u.id === todo.id);
                        return update ? { ...todo, priorityRank: update.rank } : todo;
                    }),
                })),
        }),
        {
            name: 'eisenhower-todos',
        }
    )
);
