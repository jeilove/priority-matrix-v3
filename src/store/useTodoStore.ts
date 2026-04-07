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
    updatedAt: number;
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
    setSortOrder: (order: SortOrderType) => void;
    updateTodoRanks: (updates: { id: string; rank: number }[]) => void;
    
    syncFromDB: () => Promise<void>;
    syncToDB: () => Promise<void>;
    exportTodos: () => void;
    importTodos: (file: File) => Promise<void>;
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set, get) => ({
            todos: [],
            isSyncing: false,
            lastSyncTime: null,
            sortOrder: 'recent',

            addTodo: (params) =>
                set((state) => {
                    const now = Date.now();
                    return {
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
                                createdAt: now,
                                updatedAt: now,
                            },
                        ],
                    };
                }),

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
                    const now = Date.now();
                    const newTodos = [...state.todos];
                    updates.forEach(({ id, rank }) => {
                        const todo = newTodos.find(t => t.id === id);
                        if (todo) {
                            todo.priorityRank = rank;
                            todo.updatedAt = now;
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
                    
                    const localTodos = get().todos || [];

                    if (Array.isArray(dbTodos)) {
                        /* 
                           [최신 데이터 우선 병합 로직]
                           1. 로컬과 온라인의 모든 아이디를 합칩니다.
                           2. 중복되는 아이디는 updatedAt(없으면 createdAt)이 더 큰 것이 이깁니다.
                        */
                        const mergedMap = new Map<string, Todo>();
                        
                        // DB 데이터 셋팅
                        dbTodos.forEach((dbItem: any) => {
                            const dbTime = dbItem.updatedAt ? new Date(dbItem.updatedAt).getTime() : (dbItem.createdAt ? new Date(dbItem.createdAt).getTime() : 0);
                            mergedMap.set(dbItem.id, { ...dbItem, updatedAt: dbTime, createdAt: dbItem.createdAt ? new Date(dbItem.createdAt).getTime() : Date.now() });
                        });
                        
                        // 로컬 데이터 병합
                        localTodos.forEach(localItem => {
                            const localTime = localItem.updatedAt || localItem.createdAt || 0;
                            const dbItem = mergedMap.get(localItem.id);
                            
                            // 로컬이 없거나 로컬이 더 최신이면 채택
                            if (!dbItem || localTime > dbItem.updatedAt) {
                                mergedMap.set(localItem.id, localItem);
                            }
                        });
                        
                        const finalists = Array.from(mergedMap.values());
                        console.log('📡 syncFromDB: Sync Complete', { db: dbTodos.length, local: localTodos.length, final: finalists.length });
                        
                        set({ todos: finalists, lastSyncTime: new Date().toLocaleString() });
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
