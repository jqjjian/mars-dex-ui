'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { FaArrowRightArrowLeft } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
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
    CommandList
} from '@/components/ui/command'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from '@/components/ui/resizable'

import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tokenlist } from '@/constants/data'
import { cn } from '@/lib/utils'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'

import { writeContract, simulateContract, readContract } from '@wagmi/core'
import { type Address, parseUnits } from 'viem'
import { config } from '@/config'
import { useMarsDexStore } from '@/lib/store'
import { useParams } from 'next/navigation'
import { ERC20Abi, TradeServiceAbi } from '@/constants/abi'
import { useTradeInfo } from '@/hooks'
import { toast } from 'sonner'

const OrderForm = () => {
    const router = useRouter()
    const { methods } = useParams<{ methods: string }>()
    const { address } = useAccount()
    const {
        currentPrice,
        currentTradeMode,
        sellMemeTradeAddr,
        buyMemeTradeAddr,
        serviceAddr,
        token0Info,
        token1Info
    } = useMarsDexStore()

    const [symbolList] = useState<string[]>([
        'USDT',
        'MEME'
        // ...new Set([...tokenlist, 'USDT'])
    ])
    const [formOpen, setFormOpen] = useState(false)
    const [formToken, setFormToken] = useState('')
    const [toOpen, setToOpen] = useState(false)
    const [toToken, setToToken] = useState('')
    const [tokenIn, setTokenIn] = useState(5)
    const [tokenOut, setTokenOut] = useState(0)
    const [customPrice, setCustomPrice] = useState<number>(0)
    const [customPriceInput, setCustomPriceInput] = useState(
        customPrice.toString()
    )
    const [approveHash, setApproveHash] = useState<Address>()
    const [tradeHash, setTradeHash] = useState<Address>()

    const tradeAddr = useMemo(
        () =>
            methods && methods.length > 1
                ? (methods[1] as Address)
                : '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F',
        [methods]
    )
    const mode = useMemo(
        () => (methods && methods.length > 0 ? methods[0] : 'market'),
        [methods]
    )

    const { usdtInfo, memeInfo, sellList, buyList, refetchData } = useTradeInfo(
        tradeAddr as Address
    )

    const { data: approveRes } = useWaitForTransactionReceipt({
        hash: approveHash,
        config
    })
    const { data: tradeRes } = useWaitForTransactionReceipt({
        hash: tradeHash,
        config
    })

    const handleChangeMode = useCallback(() => {
        const _tradeAddr =
            currentTradeMode === 'BUY' ? sellMemeTradeAddr : buyMemeTradeAddr
        if (methods && methods[0]) {
            router.push(`/${methods[0]}/${_tradeAddr}`)
        } else {
            router.push(`/market/${_tradeAddr}`)
        }
    }, [currentTradeMode, sellMemeTradeAddr, buyMemeTradeAddr, router, methods])

    const changeTokenInSymbol = (value: string) => {
        const _tradeAddr =
            currentTradeMode === 'BUY' ? sellMemeTradeAddr : buyMemeTradeAddr
        if (methods && methods[0]) {
            if (value !== token0Info?.symbol) {
                handleChangeMode()
            }
        } else {
            router.push(`/market/${_tradeAddr}`)
        }
    }

    const changeTokenOutSymbol = (value: string) => {
        const _tradeAddr =
            currentTradeMode === 'BUY' ? sellMemeTradeAddr : buyMemeTradeAddr
        if (methods && methods[0]) {
            if (value !== token1Info?.symbol) {
                handleChangeMode()
            }
        } else {
            router.push(`/market/${_tradeAddr}`)
        }
    }
    const changeTokenIn = useCallback(
        (value: number) => {
            setTokenIn(value)
            const _out =
                currentTradeMode === 'BUY'
                    ? value * customPrice
                    : value / customPrice
            setTokenOut(Math.round(_out * 1000000) / 1000000)
        },
        [currentTradeMode, customPrice]
    )

    const changeTokenOut = useCallback(
        (value: number) => {
            const _in =
                currentTradeMode === 'BUY'
                    ? value / customPrice
                    : value * customPrice
            setTokenIn(Math.round(_in * 1000000) / 1000000)
        },
        [currentTradeMode, customPrice]
    )

    const handleSubmitOrder = useCallback(async () => {
        if (!address || !usdtInfo || !memeInfo || !serviceAddr) return

        const _token0In = parseUnits(
            `${tokenIn}`,
            currentTradeMode === 'BUY' ? memeInfo.decimals : usdtInfo.decimals
        )
        const _token1Out = parseUnits(
            `${tokenOut}`,
            currentTradeMode === 'BUY' ? usdtInfo.decimals : memeInfo.decimals
        )
        const priceList = (currentTradeMode === 'BUY' ? buyList : sellList).map(
            (item) => item.price
        )
        const isTakeOrder =
            mode === 'market'
                ? true
                : currentTradeMode === 'BUY'
                ? customPrice <= priceList[0]
                : customPrice >= priceList[priceList.length - 1]

        try {
            const _tradeaddress = isTakeOrder
                ? currentTradeMode === 'BUY'
                    ? buyMemeTradeAddr
                    : sellMemeTradeAddr
                : currentTradeMode === 'BUY'
                ? sellMemeTradeAddr
                : buyMemeTradeAddr
            let args = []
            if (isTakeOrder) {
                args = [
                    _tradeaddress,
                    _token0In,
                    mode === 'market' ? 1n : _token1Out
                ]
            } else {
                const beforeOrderId = (await readContract(config, {
                    address: serviceAddr,
                    abi: TradeServiceAbi,
                    functionName: 'findBeforeOrderId',
                    args: [_tradeaddress, _token0In, _token1Out, 0],
                    account: address
                })) as number
                args = [_tradeaddress, _token0In, _token1Out, beforeOrderId]
            }
            // console.log({ mode, isTakeOrder })
            // console.log({ args })
            const { request, result } = await simulateContract(config, {
                address: serviceAddr,
                abi: TradeServiceAbi,
                functionName:
                    mode === 'market' || isTakeOrder
                        ? 'takeOrder'
                        : 'makeOrder',
                args,
                account: address
            })

            if (result) {
                const res = await writeContract(config, request)
                setTradeHash(res)
            } else {
                setApproveHash(undefined)
                setTradeHash(undefined)
                toast.error('Error info', { description: String(result) })
            }
        } catch (error) {
            setApproveHash(undefined)
            setTradeHash(undefined)
            console.error(error)
            toast.error('An error occurred', {
                description: 'Please try again'
            })
        }
    }, [
        address,
        usdtInfo,
        memeInfo,
        tokenIn,
        tokenOut,
        currentTradeMode,
        customPrice,
        buyList,
        sellList,
        buyMemeTradeAddr,
        sellMemeTradeAddr,
        serviceAddr
    ])

    const handleApprove = useCallback(async () => {
        if (!address || !usdtInfo || !memeInfo || !tradeAddr || !serviceAddr)
            return

        const _token0In = parseUnits(
            `${tokenIn}`,
            currentTradeMode === 'BUY' ? memeInfo.decimals : usdtInfo.decimals
        )
        const fee = 100n
        const token0InWithFee = (_token0In * fee) / 10000n + _token0In

        try {
            const res = await writeContract(config, {
                address:
                    currentTradeMode === 'BUY'
                        ? memeInfo.address
                        : usdtInfo.address,
                abi: ERC20Abi,
                functionName: 'approve',
                args: [serviceAddr, token0InWithFee],
                account: address
            })
            setApproveHash(res)
        } catch (error) {
            console.error(error)
            toast.error('Approval failed', { description: 'Please try again' })
        }
    }, [
        address,
        usdtInfo,
        memeInfo,
        tradeAddr,
        tokenIn,
        currentTradeMode,
        serviceAddr
    ])

    useEffect(() => {
        if (token0Info && token1Info) {
            setFormToken(token0Info.symbol)
            setToToken(token1Info.symbol)
        }
    }, [token0Info, token1Info])

    useEffect(() => {
        if (currentPrice) {
            const _out =
                currentTradeMode === 'BUY'
                    ? tokenIn * currentPrice
                    : tokenIn / currentPrice
            setTokenOut(Math.round(_out * 1000000) / 1000000)
            setCustomPrice(currentPrice)
        }
    }, [currentPrice, currentTradeMode, tokenIn])

    useEffect(() => {
        if (customPrice) {
            const _out =
                currentTradeMode === 'BUY'
                    ? tokenIn * customPrice
                    : tokenIn / customPrice
            setTokenOut(
                _out !== 0 && !!_out
                    ? Math.round(_out * 1000000) / 1000000
                    : currentTradeMode === 'BUY'
                    ? Math.round(tokenIn * currentPrice * 1000000) / 1000000
                    : Math.round((tokenIn / currentPrice) * 1000000) / 1000000
            )
        }
    }, [customPrice, currentTradeMode, tokenIn, currentPrice])

    useEffect(() => {
        approveRes && handleSubmitOrder()
    }, [approveRes, handleSubmitOrder])

    useEffect(() => {
        if (tradeRes) {
            toast.success('Message', {
                description: 'Trade Completed!'
            })
            setApproveHash(undefined)
            setTradeHash(undefined)
            refetchData()
        }
    }, [tradeRes, refetchData])

    useEffect(() => {
        setCustomPriceInput(customPrice.toString())
    }, [customPrice])

    return (
        <Card className="w-[700px]">
            <CardContent className="space-y-2">
                <div className="space-y-3 pt-4">
                    <Label htmlFor="name">{`You're Selling`}</Label>
                    <div className="flex items-center space-x-4">
                        <Popover open={formOpen} onOpenChange={setFormOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    role="combobox"
                                    variant="outline"
                                    className="w-[200px] justify-between text-lg"
                                >
                                    {formToken
                                        ? symbolList.find(
                                              (_token) => _token === formToken
                                          )
                                        : 'Select token...'}
                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[166px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Change status..."
                                        className="h-9"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            No results found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {symbolList.map((symbol, i) => (
                                                <CommandItem
                                                    key={`${symbol}-formToken`}
                                                    value={symbol}
                                                    onSelect={(value) => {
                                                        changeTokenInSymbol(
                                                            value
                                                        )
                                                    }}
                                                >
                                                    {symbol}
                                                    <CheckIcon
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            symbol === formToken
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Input
                            id="name"
                            type="number"
                            className="border-0 text-right text-lg"
                            placeholder="0.00"
                            value={tokenIn}
                            onChange={(v) =>
                                changeTokenIn(
                                    +v.target.value.replace(/[^0-9.]/g, '')
                                )
                            }
                        />
                    </div>
                </div>
                <div className="flex justify-center py-5">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full text-lg"
                        onClick={() => handleChangeMode()}
                    >
                        <FaArrowRightArrowLeft className="h-4 w-4 rotate-90" />
                    </Button>
                </div>
                <div className="space-y-3 ">
                    <Label htmlFor="username">{`You're Buying`}</Label>
                    <div className="flex items-center space-x-4">
                        <Popover open={toOpen} onOpenChange={setToOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    role="combobox"
                                    variant="outline"
                                    className="w-[200px] justify-between text-lg"
                                >
                                    {toToken
                                        ? symbolList.find(
                                              (_token) => _token === toToken
                                          )
                                        : 'Select token...'}
                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[166px] p-0">
                                <Command>
                                    <CommandInput
                                        placeholder="Change status..."
                                        className="h-9"
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            No results found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {symbolList.map((symbol) => (
                                                <CommandItem
                                                    key={`${symbol}-toToken`}
                                                    value={symbol}
                                                    onSelect={(value) => {
                                                        changeTokenOutSymbol(
                                                            value
                                                        )
                                                        // setFormToken(value)
                                                    }}
                                                >
                                                    {symbol}
                                                    <CheckIcon
                                                        className={cn(
                                                            'ml-auto h-4 w-4',
                                                            symbol === toToken
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Input
                            id="name"
                            type="number"
                            className="border-0 text-right text-lg"
                            placeholder="0.00"
                            value={tokenOut}
                            onChange={(v) =>
                                changeTokenOut(
                                    +v.target.value.replace(/[^0-9.]/g, '')
                                )
                            }
                        />
                    </div>
                </div>
                <div className="pt-8">
                    <ResizablePanelGroup
                        direction="horizontal"
                        className=" w-full rounded-lg border"
                    >
                        <ResizablePanel defaultSize={100}>
                            <div className="pl-5 pt-3 text-sm text-gray-400">
                                {`${
                                    currentTradeMode === 'SELL' ? 'Buy' : 'Sell'
                                } MEME at rate`}
                            </div>
                            <div className="flex h-[50px] items-center justify-center gap-4 px-6">
                                <Input
                                    className="border-0 text-left text-lg"
                                    placeholder="0.00"
                                    value={customPriceInput}
                                    disabled={mode === 'market'}
                                    onChange={(v) => {
                                        if (mode === 'limit') {
                                            const value =
                                                v.target.value.replace(
                                                    /[^0-9.]/g,
                                                    ''
                                                )
                                            const parts = value.split('.')
                                            if (parts.length > 2) {
                                                // More than one decimal point, ignore
                                                return
                                            }
                                            if (
                                                parts[1] &&
                                                parts[1].length > 8
                                            ) {
                                                // Limit to 8 decimal places
                                                return
                                            }
                                            setCustomPriceInput(value)
                                            setCustomPrice(
                                                parseFloat(value) || 0
                                            )
                                        }
                                    }}
                                />
                                <span className="text-lg">USDT</span>
                            </div>
                            <div className="px-6 py-2 text-sm text-gray-400">
                                ≈ $
                                {parseFloat(
                                    customPriceInput || currentPrice.toString()
                                ).toFixed(2)}
                            </div>
                        </ResizablePanel>
                        {/* <ResizableHandle /> */}
                        {/* <ResizablePanel defaultSize={30}></ResizablePanel> */}
                    </ResizablePanelGroup>
                </div>
            </CardContent>
            <CardFooter className="">
                <Button
                    onClick={() => handleApprove()}
                    className={cn('w-full py-6 text-lg font-bold')}
                >
                    {mode && mode === 'market'
                        ? 'Place Market Order'
                        : 'Place Limit Order'}
                </Button>
            </CardFooter>
        </Card>
    )
}

export default OrderForm
