import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Column } from '@/components/kanban/board-column'
import { UniqueIdentifier } from '@dnd-kit/core'
import { type UseAccountReturnType } from 'wagmi'
import { Address } from 'viem'
export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE'

const defaultCols = [
    {
        id: 'TODO' as const,
        title: 'Todo'
    }
] satisfies Column[]

export type ColumnId = (typeof defaultCols)[number]['id']

export type TokenInfoType = {
    name: string
    symbol: string
    decimals: number
    balanceOf: string
    address: Address
}
export type Task = {
    id: string
    title: string
    description?: string
    status: Status
}

export type State = {
    tasks: Task[]
    columns: Column[]
    draggedTask: string | null
}

const initialTasks: Task[] = [
    {
        id: 'task1',
        status: 'TODO',
        title: 'Project initiation and planning'
    },
    {
        id: 'task2',
        status: 'TODO',
        title: 'Gather requirements from stakeholders'
    }
]

export type Actions = {
    addTask: (title: string, description?: string) => void
    addCol: (title: string) => void
    dragTask: (id: string | null) => void
    removeTask: (title: string) => void
    removeCol: (id: UniqueIdentifier) => void
    setTasks: (updatedTask: Task[]) => void
    setCols: (cols: Column[]) => void
    updateCol: (id: UniqueIdentifier, newName: string) => void
}

export const useTaskStore = create<State & Actions>()(
    persist(
        (set) => ({
            tasks: initialTasks,
            columns: defaultCols,
            draggedTask: null,
            addTask: (title: string, description?: string) =>
                set((state) => ({
                    tasks: [
                        ...state.tasks,
                        { id: uuid(), title, description, status: 'TODO' }
                    ]
                })),
            updateCol: (id: UniqueIdentifier, newName: string) =>
                set((state) => ({
                    columns: state.columns.map((col) =>
                        col.id === id ? { ...col, title: newName } : col
                    )
                })),
            addCol: (title: string) =>
                set((state) => ({
                    columns: [
                        ...state.columns,
                        {
                            title,
                            id: state.columns.length
                                ? title.toUpperCase()
                                : 'TODO'
                        }
                    ]
                })),
            dragTask: (id: string | null) => set({ draggedTask: id }),
            removeTask: (id: string) =>
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id)
                })),
            removeCol: (id: UniqueIdentifier) =>
                set((state) => ({
                    columns: state.columns.filter((col) => col.id !== id)
                })),
            setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),
            setCols: (newCols: Column[]) => set({ columns: newCols })
        }),
        { name: 'task-store', skipHydration: true }
    )
)
export type OrderListType = {
    price: number
    amount: number
}

export type AccountState = {
    token0Info: TokenInfoType | null
    token1Info: TokenInfoType | null
    currentPrice: number
    sellList: OrderListType[]
    buyList: OrderListType[]
    account: UseAccountReturnType | null
    serviceAddr: Address | undefined
    sellMemeTradeAddr: Address | undefined
    buyMemeTradeAddr: Address | undefined
    currentTradeMode: 'SELL' | 'BUY'
}
export type MarsDexActions = {
    setToken0Info: (token: TokenInfoType) => void
    setToken1Info: (token: TokenInfoType) => void
    setCurrentPrice: (price: number) => void
    setSellList: (list: OrderListType[]) => void
    setBuyList: (list: OrderListType[]) => void
    setSellMemeTradeAddr: (addr: Address) => void
    setBuyMemeTradeAddr: (addr: Address) => void
    setAccount: (account: UseAccountReturnType) => void
    setCurrentTradeMode: (mode: 'SELL' | 'BUY') => void
    // addApiKey: (apikey: ApiKey) => void
    // removeApiKey: (id: number) => void
    // setApiKeys: (updatedApiKey: ApiKey[]) => void
}
export const useMarsDexStore = create<AccountState & MarsDexActions>()(
    persist(
        (set) => ({
            currentTradeMode: 'BUY',
            token0Info: null,
            token1Info: null,
            currentPrice: 0,
            sellList: [],
            buyList: [],
            account: null,
            serviceAddr: '0x2d90e99d7ff0f7ad75e94bfceae21ebfdbadad84',
            sellMemeTradeAddr: undefined,
            buyMemeTradeAddr: undefined,
            setToken0Info: (token: TokenInfoType) =>
                set((state) => ({
                    token0Info: token
                })),
            setToken1Info: (token: TokenInfoType) =>
                set((state) => ({
                    token1Info: token
                })),
            setCurrentPrice: (price: number) =>
                set((state) => ({
                    currentPrice: price
                })),
            setSellList: (list: OrderListType[]) =>
                set((state) => ({
                    sellList: list
                })),
            setBuyList: (list: OrderListType[]) =>
                set((state) => ({
                    buyList: list
                })),
            setSellMemeTradeAddr: (addr: Address) =>
                set((state) => ({
                    sellMemeTradeAddr: addr
                })),
            setBuyMemeTradeAddr: (addr: Address) =>
                set((state) => ({
                    buyMemeTradeAddr: addr
                })),
            setAccount: () =>
                set((state) => ({
                    account: state.account
                })),
            setCurrentTradeMode: (mode: 'SELL' | 'BUY') =>
                set((state) => ({
                    currentTradeMode: mode
                }))
            //     apiKeys: [],
            //     addApiKey: (apikey: ApiKey) =>
            //         set((state) => ({
            //             apiKeys: [...state.apiKeys, apikey]
            //         })),
            //     removeApiKey: (id: number) =>
            //         set((state) => ({
            //             apiKeys: state.apiKeys.filter(
            //                 (_apikey) => _apikey.id !== id
            //             )
            //         })),
            //     setApiKeys: (apiKeys: ApiKey[]) => set({ apiKeys })
        }),
        {
            name: 'mars-dex-store',
            // skipHydration: true,
            storage: createJSONStorage(() => sessionStorage)
        }
    )
)
