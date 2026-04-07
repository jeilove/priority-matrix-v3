import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuadrantType = 'q1' | 'q2' | 'q3' | 'q4' | 'inbox' | 'unassigned';
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
    updatedAt: number; // 최신성 추적용 필드
    isHidden?: boolean;
    energy?: EnergyType;
    status: StatusType;
    repetition?: RepetitionType[];
    context?: ContextType[];
    tags?: string[];
    description?: string;
    priorityRank?: number;
    prevQuadrant?: QuadrantType;
}

interface TodoState {
    todos: Todo[];
    isSyncing: boolean;
    lastSyncTime: string | null;
    sortOrder: SortOrderType;

    addTodo: (todo: Partial<Todo> & { text: string; estimate: string }) => void;
    updateTodo: (id: string, text: string, estimate: string) => void;
    fullUpdateTodo: (id: string, updates: Partial<Todo>) => void;
    updateTodoStatus: (id: string, status: StatusType) => void;
    moveTodo: (id: string, quadrant: QuadrantType) => void;
    moveTodoAndHide: (id: string, quadrant: QuadrantType) => void;
    deleteTodo: (id: string) => void;
    clearInbox: () => void;
    
    syncFromDB: () => Promise<void>;
    syncToDB: () => Promise<void>;
    setSortOrder: (order: SortOrderType) => void;

    // 추가 복구 함수들
    exportTodos: () => void;
    importTodos: (file: File) => Promise<void>;
    updateTodoRanks: (updates: { id: string; rank: number }[]) => void;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set, get) => ({
            todos: [],
            isSyncing: false,
            lastSyncTime: null,
            sortOrder: 'recent',

            addTodo: (params) =>
                set((state) => ({
                    todos: [
                        ...state.todos,
                        {
                            id: Math.random().toString(36).substring(2, 11),
                            text: params.text,
                            estimate: params.estimate,
                            quadrant: params.quadrant || 'inbox',
                            status: params.status || 'todo',
                            energy: params.energy || 'energy-medium',
                            repetition: params.repetition || [],
                            context: params.context || [],
                            tags: params.tags || [],
                            description: params.description || '',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        },
                    ],
                })),

            updateTodo: (id, text, estimate) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, text, estimate, updatedAt: Date.now() } : todo
                    ),
                })),

            fullUpdateTodo: (id, updates) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
                    ),
                })),

            updateTodoStatus: (id, status) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, status, updatedAt: Date.now() } : todo
                    ),
                })),

            moveTodo: (id, quadrant) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, quadrant, updatedAt: Date.now() } : todo
                    ),
                })),

            moveTodoAndHide: (id, quadrant) =>
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id
                            ? { ...todo, quadrant, isHidden: true, updatedAt: Date.now() }
                            : todo
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

            setSortOrder: (order) => set({ sortOrder: order }),

            updateTodoRanks: (updates) =>
                set((state) => {
                    const newTodos = [...state.todos];
                    updates.forEach(({ id, rank }) => {
                        const todo = newTodos.find(t => t.id === id);
                        if (todo) {
                            todo.priorityRank = rank;
                            todo.updatedAt = Date.now();
                        }
                    });
                    return { todos: newTodos };
                }),

            exportTodos: () => {
                const dataStr = JSON.stringify(get().todos, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const exportFileDefaultName = `priority-matrix-backup-${new Date().toISOString().split('T')[0]}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            },

            importTodos: async (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const json = JSON.parse(e.target?.result as string);
                            if (Array.isArray(json)) {
                                // 기존 데이터와 병합하거나 대체 (사용자 모달에서 컨펌을 받았으므로 대체)
                                set({ todos: json, updatedAt: Date.now() } as any);
                                resolve();
                            } else {
                                throw new Error('올바른 JSON 형식이 아닙니다.');
                            }
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.readAsText(file);
                });
            },

            syncFromDB: async () => {
                try {
                    console.log('📡 syncFromDB: Requesting /api/todos (No-Cache)...');
                    const response = await fetch(`/api/todos?t=${Date.now()}`);
                    if (!response.ok) throw new Error('DB 불러오기 실패');
                    const dbTodos = await response.json();
                    
                    const currentTodos = get().todos || [];

                    if (Array.isArray(dbTodos)) {
                        const mergedMap = new Map();
                        dbTodos.forEach((dbTodo: any) => {
                            const dbUpdatedAt = dbTodo.updatedAt ? new Date(dbTodo.updatedAt).getTime() : 0;
                            mergedMap.set(dbTodo.id, { ...dbTodo, updatedAt: dbUpdatedAt });
                        });
                        
                        currentTodos.forEach(localTodo => {
                            const dbItem = mergedMap.get(localTodo.id);
                            if (!dbItem || (localTodo.updatedAt || 0) > dbItem.updatedAt) {
                                mergedMap.set(localTodo.id, localTodo);
                            }
                        });
                        
                        const mergedTodos = Array.from(mergedMap.values());
                        set({ todos: mergedTodos, lastSyncTime: new Date().toLocaleString() });
                    }
                } catch (err) {
                    console.error('📡 syncFromDB Exception:', err);
                    throw err;
                }
            },

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
                    console.log('✅ syncToDB success');
                } catch (err) {
                    console.error('❌ syncToDB Error:', err);
                    throw err;
                } finally {
                    set({ isSyncing: false });
                }
            },
        }),
        {
            name: 'todo-storage',
            onRehydrateStorage: () => {
                console.log('📦 useTodoStore: Rehydration checking...');
                return (state) => {
                    console.log('📦 useTodoStore: Rehydration Complete.');
                };
            },
        }
    )
);
