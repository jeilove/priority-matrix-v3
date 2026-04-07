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
}

export const useTodoStore = create<TodoState>()(
    persist(
        (set, get) => ({
            todos: [],
            isSyncing: false,
            lastSyncTime: null,

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
                            updatedAt: Date.now(), // 초기 생성 시 동일
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

            syncFromDB: async () => {
                try {
                    console.log('📡 syncFromDB: Requesting /api/todos (No-Cache)...');
                    const response = await fetch(`/api/todos?t=${Date.now()}`);
                    if (!response.ok) throw new Error('DB 불러오기 실패');
                    const dbTodos = await response.json();
                    
                    const currentTodos = get().todos || [];
                    console.log('📡 syncFromDB check:', { db: dbTodos.length, local: currentTodos.length });

                    if (Array.isArray(dbTodos)) {
                        // updatedAt 기반 지능형 병합 (Most Recent Wins)
                        const mergedMap = new Map();
                        
                        // DB 데이터 먼저 셋팅
                        dbTodos.forEach((dbTodo: any) => {
                            // DB의 DateTime을 timestamp 숫자로 변환
                            const dbUpdatedAt = dbTodo.updatedAt ? new Date(dbTodo.updatedAt).getTime() : 0;
                            mergedMap.set(dbTodo.id, { ...dbTodo, updatedAt: dbUpdatedAt });
                        });
                        
                        // 로컬 데이터와 비교하여 더 최신인 것으로 교체
                        currentTodos.forEach(localTodo => {
                            const dbItem = mergedMap.get(localTodo.id);
                            // DB에 없거나 로컬이 더 최신이면 로컬 채택
                            if (!dbItem || (localTodo.updatedAt || 0) > dbItem.updatedAt) {
                                mergedMap.set(localTodo.id, localTodo);
                            }
                        });
                        
                        const mergedTodos = Array.from(mergedMap.values());
                        
                        console.log('📡 syncFromDB merge complete:', { 
                            db: dbTodos.length, 
                            local: currentTodos.length, 
                            result: mergedTodos.length 
                        });
                        
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
