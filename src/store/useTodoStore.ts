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
    lastModifiedAt: number; // 사용자가 직접 수정한 마지막 시각만 기록
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
                const exportFileDefaultName = `pm-backup-${new Date().getTime()}.json`;
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
                                set({ todos: json, lastModifiedAt: Date.now() });
                                resolve();
                            } else {
                                throw new Error('Invalid Format');
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
                    console.log('📡 syncFromDB: Fetching from Cloud...');
                    const res = await fetch(`/api/todos?t=${Date.now()}`);
                    if (!res.ok) throw new Error('Fetch failed');
                    const dbData = await res.json();
                    
                    if (!Array.isArray(dbData)) return;

                    const localTodos = get().todos || [];
                    const localModified = Number(get().lastModifiedAt) || 0;
                    
                    const dbTodos = dbData.map(t => ({
                        ...t,
                        updatedAt: t.updatedAt ? new Date(t.updatedAt).getTime() : 0,
                        createdAt: t.createdAt ? new Date(t.createdAt).getTime() : 0
                    }));

                    const dbMaxModified = dbTodos.length > 0 
                        ? Math.max(...dbTodos.map(t => t.updatedAt)) 
                        : 0;

                    // [ID 기반 지문(Fingerprint) 검증]
                    // 시간뿐만 아니라 아이템 목록 자체가 다른지 확인하여 교착 상태를 방지합니다.
                    const localFingerprint = localTodos.map(t => t.id).sort().join(',');
                    const dbFingerprint = dbTodos.map(t => t.id).sort().join(',');

                    console.log('📡 syncFromDB Status Log:', { 
                        DB: { time: dbMaxModified, count: dbTodos.length }, 
                        PC: { time: localModified, count: localTodos.length } 
                    });

                    // [수정된 판별 로직]
                    // 사용자님 의견 반영: lastModifiedAt 오염 방지 및 실질적 데이터 차이 감지
                    const isRemoteNewer = dbMaxModified > localModified;
                    const isContentDifferent = localFingerprint !== dbFingerprint;

                    if (isRemoteNewer || isContentDifferent) {
                        console.log('📡 syncFromDB: Potential change detected. Comparing...');
                        
                        // 만약 로컬 시각이 서버보다 늦다면(사용자가 방금 PC에서 수정함), 서버 데이터를 덮어쓰지 않고 대기합니다.
                        // (잠시 후 syncToDB가 이 새로운 데이터를 서버로 올릴 것입니다.)
                        if (localModified > dbMaxModified && localTodos.length > 0) {
                            console.log('📡 syncFromDB: Local is Master. Waiting for Auto-Save.');
                        } else {
                            console.log('📡 syncFromDB: Loading Remote Snapshot.');
                            set({ 
                                todos: dbTodos, 
                                // 주의: 여기서 lastModifiedAt을 dbMaxModified로 맞추지 않습니다.
                                // 그래야 로컬에서 새로 작업할 때만 localModified가 올라가서 업로드 우선권을 갖게 됩니다.
                                lastSyncTime: new Date().toLocaleString() 
                            });
                        }
                    } else {
                        console.log('📡 syncFromDB: Completely synced.');
                    }
                } catch (err) {
                    console.error('❌ syncFromDB Error:', err);
                    throw err;
                }
            },

            syncToDB: async () => {
                set({ isSyncing: true });
                try {
                    const currentTodos = get().todos;
                    const response = await fetch('/api/todos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ todos: currentTodos }),
                    });

                    if (!response.ok) throw new Error('Upload failed');
                    set({ lastSyncTime: new Date().toLocaleString() });
                    console.log('✅ syncToDB success (Count:', currentTodos.length, ')');
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
                return (state) => {
                    console.log('📦 useTodoStore: Rehydrated.');
                };
            },
        }
    )
);
