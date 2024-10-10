import { Icons } from '@/components/icons'
import { type Address } from 'viem'
export interface NavItem {
    title: string
    href?: string
    disabled?: boolean
    external?: boolean
    icon?: keyof typeof Icons
    label?: string
    description?: string
}

export interface NavItemWithChildren extends NavItem {
    items: NavItemWithChildren[]
}

export interface NavItemWithOptionalChildren extends NavItem {
    items?: NavItemWithChildren[]
}

export interface FooterItem {
    title: string
    items: {
        title: string
        href: string
        external?: boolean
    }[]
}

export type MainNavItem = NavItemWithOptionalChildren

export type SidebarNavItem = NavItemWithChildren

export type OrderListType = {
    amountIn: bigint
    amountOut: bigint
    index: number
    orderId: number
    isRemoved: boolean
    progress: number
    token0: Address
    token1: Address
    trade: Address
}
