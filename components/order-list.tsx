'use client'
import { useEffect, useMemo, useState, useContext } from 'react'
import * as R from 'ramda'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut
} from '@/components/ui/command'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    useAccount,
    useReadContract,
    useReadContracts,
    useSendTransaction,
    // usePrepareTransactionRequest,
    // useConnectors,
    useBlockNumber,
    useBalance,
    // useConnect,
    type UseAccountParameters,
    type UseReadContractsReturnType
} from 'wagmi'
import {
    type Address,
    type MulticallContracts,
    formatUnits,
    parseUnits
} from 'viem'
import { config } from '@/config'
import { useParams } from 'next/navigation'
import { MonoTradeAbi, ERC20Abi, TradeServiceAbi } from '@/constants/abi'
// import { ServiceContext } from '@/components/layout/service-providers'
import { useMarsDexStore } from '@/lib/store'
import { type TokenInfoType } from '@/lib/store'
import { useTradeInfo } from '@/hooks'
type OrderListType = {
    amountIn: bigint
    amountOut: bigint
    orderId: number
    progress: number
}
// type TokenInfoType = {
//     name: string
//     symbol: string
//     decimals: number
//     balanceOf: bigint
// }
const OrderList = () => {
    const { data: blockNumber, refetch: getBlockNumber } = useBlockNumber()
    const { address, isConnected, chainId } = useAccount({
        ...config
    } as UseAccountParameters)
    // const { address, isConnected, chainId } = account
    const { currentPrice, currentTradeMode } = useMarsDexStore()
    // const { serviceAddr } = useContext(ServiceContext)
    const { methods } = useParams<{ methods: string }>()
    const tradeAddr = useMemo(() => {
        return methods && methods.length > 1
            ? (methods[1] as Address)
            : '0x75351fD68BDC2cafc6f1C80993421b08aC2bf0eA'
    }, [methods])

    const { sellList, buyList } = useTradeInfo(tradeAddr as Address)
    return (
        <Card>
            <CardHeader>
                <CardTitle>Order List</CardTitle>
                {/* <CardDescription>
                    MonoTrade is a one-way trading contract.
                </CardDescription> */}
            </CardHeader>
            <CardContent className="px-3">
                <Command className="  w-full">
                    {/* <CommandInput placeholder="Type a command or search..." /> */}
                    <CommandList className="max-h-[680px]">
                        {/* <CommandEmpty>No results found.</CommandEmpty> */}
                        <CommandGroup heading="">
                            <div className="flex justify-between px-2">
                                <span>Price（USDT） </span>
                                <span>Amount </span>
                                {/* <CommandItem>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span>Calendar</span>
                                </CommandItem>
                                <CommandItem>
                                    <FaceIcon className="mr-2 h-4 w-4" />
                                    <span>Search Emoji</span>
                                </CommandItem>
                                <CommandItem disabled>
                                    <RocketIcon className="mr-2 h-4 w-4" />
                                    <span>Launch</span>
                                </CommandItem> */}
                            </div>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="">
                            {sellList &&
                                sellList.map((v, i) => {
                                    return (
                                        <CommandItem
                                            key={`sell-${i}`}
                                            className="text-lg"
                                        >
                                            <span className="text-red-600">
                                                {v.price}
                                            </span>
                                            <CommandShortcut>
                                                <span>{v.amount}</span>
                                            </CommandShortcut>
                                        </CommandItem>
                                    )
                                })}
                            <div className="pl-2 text-xl">
                                {currentPrice || 'Getting price...'}
                            </div>
                            {buyList &&
                                buyList.map((v, i) => {
                                    return (
                                        <CommandItem key={`buy-${i}`}>
                                            <span className="text-green-500">
                                                {v.price}
                                            </span>
                                            <CommandShortcut>
                                                <span>{v.amount}</span>
                                            </CommandShortcut>
                                        </CommandItem>
                                    )
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </CardContent>
        </Card>
    )
}

export default OrderList
