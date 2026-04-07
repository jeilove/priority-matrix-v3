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

    addTodo: (todo: Partial<Todo> & { text: string; estimate: string }) => void;
    updateTodo: (id: string, text: string, estimate: string) => void;
    fullUpdateTodo: (id: string, updates: Partial<Todo>) => void;
    updateTodoStatus: (id: string, status: StatusType) => void;
    moveTodo: (id: string, quadrant: QuadrantType) => void;
    moveTodoAndHide: (id: string, quadrant: QuadrantType) => void;
    deleteTodo: (id: string) => void;
    clearInbox: () => void;

    sortOrder: SortOrderType;
    setSortOrder: (order: SortOrderType) => void;

    setTodos: (todos: Todo[]) => void;
    setSyncStatus: (isSyncing: boolean, lastSyncTime?: string) => void;
    syncToCloud: () => Promise<void>;
    syncFromCloud: () => Promise<void>;

    exportTodos: () => void;
    importTodos: (file: File) => Promise<void>;

    updateTodoRanks: (updates: { id: string; rank: number }[]) => void;

    syncToDB: () => Promise<void>;
    syncFromDB: () => Promise<void>;

    ensureGuideTodos: () => void;
}

const GUIDE_TODOS: Todo[] = [
    {
        id: 'guide-1',
        text: '🚀 환영합니다! 중앙의 +를 눌러 할일을 추가하세요',
        estimate: '1m',
        quadrant: 'q1',
        status: 'todo',
        createdAt: Date.now(),
    },
    {
        id: 'guide-2',
        text: '🎯 중요하고 긴급한 일은 Q1(당장해)입니다',
        estimate: '5m',
        quadrant: 'q1',
        status: 'todo',
        createdAt: Date.now() - 1000,
    },
    {
        id: 'guide-3',
        text: '📌 중요하지만 급하지 않은 일은 Q2(살펴봐)입니다',
        estimate: '2m',
        quadrant: 'q2',
        status: 'todo',
        createdAt: Date.now() - 2000,
    }
];

export const useTodoStore = create<TodoState>()(
    persist(
        (set, get) => ({
            todos: [],
            sortOrder: 'recent',
            isSyncing: false,
            lastSyncTime: null,

            ensureGuideTodos: () => {
                const currentTodos = get().todos;
                const isEmpty = !Array.isArray(currentTodos) || currentTodos.length === 0;
                console.log('🛠 ensureGuideTodos:', { count: currentTodos?.length, isEmpty });
                if (isEmpty) {
                    console.log('🛠 ensureGuideTodos: Creating guide data...');
                    set({ todos: GUIDE_TODOS });
                }
            },

            setSortOrder: (order) => set({ sortOrder: order }),
            setTodos: (todos) => set({ todos }),
            setSyncStatus: (isSyncing, lastSyncTime) => set({ isSyncing, lastSyncTime: lastSyncTime || new Date().toLocaleString() }),

            syncToDB: async () => {
                set({ isSyncing: true });
                try {
                    const response = await fetch('/api/todos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ todos: get().todos }),
                    });
                    console.log('📡 syncToDB response:', response.status);
                    if (!response.ok) throw new Error('DB 저장 실패');
                    set({ lastSyncTime: new Date().toLocaleString() });
                } catch (err) {
                    console.error('📡 syncToDB Error:', err);
                    throw err;
                } finally {
                    set({ isSyncing: false });
                }
            },

            syncFromDB: async () => {
                console.log('📡 syncFromDB: Requesting /api/todos (No-Cache)...');
                set({ isSyncing: true });
                try {
                    // 캐시 버스팅 적용하여 항상 최신 데이터 강제 로드
                    const response = await fetch(`/api/todos?t=${Date.now()}`);
                    console.log('📡 syncFromDB response:', response.status);
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('📡 syncFromDB Error Response:', errorText);
                        throw new Error('DB 불러오기 실패: ' + errorText);
                    }
                    const dbTodos = await response.json();
                    console.log('📡 syncFromDB count:', Array.isArray(dbTodos) ? dbTodos.length : 'Not Array');
                    if (Array.isArray(dbTodos)) {
                        // DB 데이터로 항상 덮어씀 (빈 배열이어도 반영)
                        set({ todos: dbTodos, lastSyncTime: new Date().toLocaleString() });
                    }
                } catch (err) {
                    console.error('📡 syncFromDB Exception:', err);
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

            // 구 구글 드라이브 동기화 - 현재 미사용 (Neon DB로 대체)
            syncToCloud: async () => {
                console.warn('syncToCloud: 사용 중단됨. Neon DB 자동 동기화를 이용하세요.');
            },

            syncFromCloud: async () => {
                console.warn('syncFromCloud: 사용 중단됨. Neon DB 자동 동기화를 이용하세요.');
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

                        if ((newStatus === 'done' || newStatus === 'blocked') && newQuadrant !== 'inbox') {
                            newPrevQuadrant = todo.quadrant;
                            newQuadrant = 'inbox';
                        } else if ((todo.status === 'done' || todo.status === 'blocked') &&
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

                        if (status === 'done' || status === 'blocked') {
                            if (todo.quadrant !== 'inbox') {
                                newPrevQuadrant = todo.quadrant;
                                newQuadrant = 'inbox';
                            }
                        } else if ((todo.status === 'done' || todo.status === 'blocked') &&
                                   (status === 'todo' || status === 'in-progress')) {
                            if (todo.prevQuadrant) {
                                newQuadrant = todo.prevQuadrant;
                                newPrevQuadrant = undefined;
                            } else if (todo.quadrant === 'inbox') {
                                newQuadrant = 'unassigned';
                            }
                        }
                        return { ...todo, status, quadrant: newQuadrant, prevQuadrant: newPrevQuadrant, isHidden: false };
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
            onRehydrateStorage: () => {
                console.log('📦 useTodoStore: Rehydration checking...');
                return (rehydratedState, error) => {
                    if (error) {
                        console.error('📦 useTodoStore: Rehydration Error:', error);
                    } else if (rehydratedState) {
                        rehydratedState.ensureGuideTodos();
                        console.log('📦 useTodoStore: Rehydration Complete & Guide Checked.');
                    }
                };
            },
        }
    )
);
