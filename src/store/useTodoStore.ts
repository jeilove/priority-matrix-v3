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
    lastModifiedAt: number;
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
            lastModifiedAt: 0,
            isSyncing: false,
            lastSyncTime: null,
            sortOrder: 'recent',

            addTodo: (params) => {
                const now = Date.now();
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
                            createdAt: now,
                            updatedAt: now,
                        },
                    ],
                    lastModifiedAt: now,
                }));
            },

            updateTodo: (id, text, estimate) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, text, estimate, updatedAt: now } : todo
                    ),
                    lastModifiedAt: now,
                }));
            },

            fullUpdateTodo: (id, updates) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, ...updates, updatedAt: now } : todo
                    ),
                    lastModifiedAt: now,
                }));
            },

            updateTodoStatus: (id, status) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, status, updatedAt: now } : todo
                    ),
                    lastModifiedAt: now,
                }));
            },

            moveTodo: (id, quadrant) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id ? { ...todo, quadrant, updatedAt: now } : todo
                    ),
                    lastModifiedAt: now,
                }));
            },

            moveTodoAndHide: (id, quadrant) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.map((todo) =>
                        todo.id === id
                            ? { ...todo, quadrant, isHidden: true, updatedAt: now }
                            : todo
                    ),
                    lastModifiedAt: now,
                }));
            },

            deleteTodo: (id) => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.filter((todo) => todo.id !== id),
                    lastModifiedAt: now,
                }));
            },

            clearInbox: () => {
                const now = Date.now();
                set((state) => ({
                    todos: state.todos.filter((todo) => todo.quadrant !== 'inbox'),
                    lastModifiedAt: now,
                }));
            },

            setSortOrder: (order) => set({ sortOrder: order }),

            updateTodoRanks: (updates) => {
                const now = Date.now();
                set((state) => {
                    const newTodos = [...state.todos];
                    updates.forEach(({ id, rank }) => {
                        const todo = newTodos.find(t => t.id === id);
                        if (todo) {
                            todo.priorityRank = rank;
                            todo.updatedAt = now;
                        }
                    });
                    return { todos: newTodos, lastModifiedAt: now };
                });
            },

            exportTodos: () => {
                const dataStr = JSON.stringify(get().todos, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', `backup-${new Date().getTime()}.json`);
                linkElement.click();
            },

            importTodos: async (file: File) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const json = JSON.parse(e.target?.result as string);
                            if (Array.isArray(json)) {
                                set({ todos: json, lastModifiedAt: Date.now() });
                                resolve();
                            } else {
                                throw new Error('Invalid JSON');
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
                    console.log('📡 syncFromDB: Fetching Snapshots...');
                    const response = await fetch(`/api/todos?t=${Date.now()}`);
                    if (!response.ok) throw new Error('DB fetch failed');
                    const dbData = await response.json();
                    
                    if (!Array.isArray(dbData)) return;

                    const localTodos = get().todos || [];
                    const localModified = Number(get().lastModifiedAt) || 0;
                    
                    const dbDataWithTimes = dbData.map(t => ({
                        ...t,
                        updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : 0,
                        createdAt: t.createdAt ? new Date(t.createdAt).getTime() : 0
                    }));

                    const dbMaxModified = dbDataWithTimes.length > 0 
                        ? Math.max(...dbDataWithTimes.map(t => t.updatedAt)) 
                        : 0;

                    console.log('📡 syncFromDB Time Check:', { db: dbMaxModified, local: localModified });

                    // [최신성 절대 승리 원칙]
                    // 1. 온라인(DB)이 더 최근이면 온라인 승리
                    // 2. 시간은 같지만 로컬에 데이터가 없고 온라인에는 있다면 온라인 승리 (0개/N개 꼬임 방지)
                    if (dbMaxModified > localModified || (dbMaxModified === localModified && localTodos.length === 0 && dbDataWithTimes.length > 0)) {
                        console.log('📡 syncFromDB: Online is Master. Updating Local.');
                        set({ todos: dbDataWithTimes, lastModifiedAt: dbMaxModified, lastSyncTime: new Date().toLocaleString() });
                    } else if (localModified > dbMaxModified) {
                        console.log('📡 syncFromDB: Local is Master. Will sync to DB soon.');
                    } else {
                        console.log('📡 syncFromDB: Already synced.');
                    }
                } catch (err) {
                    console.error('❌ syncFromDB Error:', err);
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

                    if (!response.ok) throw new Error('DB sync failure');
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
