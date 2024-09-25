'use client'
import { useEffect, useMemo, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { tokenlist } from '@/constants/data'
import { cn } from '@/lib/utils'
import * as R from 'ramda'
import {
    type UseAccountParameters,
    useAccount,
    useConnect,
    useReadContract,
    useReadContracts,
    useSendTransaction,
    // usePrepareTransactionRequest,
    // useConnectors,
    useBlockNumber,
    useBalance,
    // useConnect,
    useWaitForTransactionReceipt
} from 'wagmi'

import { writeContract, simulateContract, readContract } from '@wagmi/core'
import { type Address, type MulticallContracts, parseUnits } from 'viem'
import { config } from '@/config'
import { useMarsDexStore } from '@/lib/store'
import { useParams } from 'next/navigation'
import { MonoTradeAbi, ERC20Abi, TradeServiceAbi } from '@/constants/abi'
import { useTradeInfo } from '@/hooks'
import { toast } from 'sonner'
// import { linea, lineaSepolia } from '@wagmi/core/chains'
// import { getChainId } from 'viem/actions'
const OrderForm = () => {
    const router = useRouter()
    const [symbolList, setSymbolList] = useState<string[]>([
        ...new Set([...tokenlist, 'USDT'])
    ])
    const { methods } = useParams<{ methods: string }>()
    const tradeAddr = useMemo(() => {
        return methods.length > 1 ? (methods[1] as Address) : undefined
    }, [methods])
    const { usdtInfo, memeInfo, sellList, buyList, refetchData } = useTradeInfo(
        tradeAddr as Address
    )
    const mode = useMemo(() => {
        return methods.length > 0 ? methods[0] : undefined
    }, [methods])
    // console.log(methods)
    const { data: blockNumber } = useBlockNumber()
    const account = useAccount({ ...config } as UseAccountParameters)
    const { address, isConnected, chainId } = account
    const { connect, error } = useConnect()
    const {
        currentPrice,
        currentTradeMode,
        sellMemeTradeAddr,
        buyMemeTradeAddr,
        serviceAddr,
        token0Info,
        token1Info
    } = useMarsDexStore()
    const [formOpen, setFormOpen] = useState(false)
    const [formToken, setFormToken] = useState('')
    const [toOpen, setToOpen] = useState(false)
    const [toToken, setToToken] = useState('')
    const [orderAction, setOrderAction] = useState('BUY')
    const [tokenIn, setTokenIn] = useState(5)
    const [tokenOut, setTokenOut] = useState(0)
    const [customPrice, setCustomPrice] = useState<number>(0)
    const [approveHash, setApproveHash] = useState<Address>()
    const [tradeHash, setTradeHash] = useState<Address>()
    const { data: approveRes } = useWaitForTransactionReceipt({
        hash: approveHash,
        config
    })
    const { data: tradeRes } = useWaitForTransactionReceipt({
        hash: tradeHash,
        config
    })
    // const { data: token0 } = useReadContract({
    //     // blockNumber,
    //     // chainId: lineaSepolia.id,
    //     // config,
    //     address: tradeAddr,
    //     abi: MonoTradeAbi,
    //     functionName: 'token0'
    //     // args: [userId]
    // })
    // console.log({ token0 })
    const handleChangeMode = () => {
        console.log(methods)
        const _tradeAddr =
            currentTradeMode === 'BUY' ? sellMemeTradeAddr : buyMemeTradeAddr
        router.push(`/${methods[0]}/${_tradeAddr}`)
    }
    const changeTokenIn = (value: number) => {
        setTokenIn(value)
        // console.log(value / customPrice)
        console.log(customPrice)
        console.log(currentTradeMode)
        const _out =
            currentTradeMode === 'BUY'
                ? value * customPrice
                : value / customPrice
        setTokenOut(_out)
    }
    const changeTokenOut = (value: number) => {
        const _in =
            currentTradeMode === 'BUY'
                ? value / customPrice
                : value * customPrice
        setTokenIn(_in)
    }
    const tradeConfig = {
        address: tradeAddr,
        abi: MonoTradeAbi
    } as const
    type TradeTokensDataType = {
        data: {
            result: Address | undefined
        }[]
    }
    const { data: _tradeTokens } = useReadContracts({
        contracts: [
            {
                ...tradeConfig,
                functionName: 'token0'
            },
            {
                ...tradeConfig,
                functionName: 'token1'
            },
            { ...tradeConfig, functionName: 'fee' }
        ]
    })
    const tradeTokens: Address[] = useMemo(() => {
        return (
            (_tradeTokens &&
                R.map<{ result: Address; status: string }, Address>(
                    R.prop<'result'>('result')
                )([..._tradeTokens] as {
                    result: Address
                    status: string
                }[])) ||
            []
        )
    }, [_tradeTokens])

    const symbolConfig = {
        abi: ERC20Abi,
        functionName: 'symbol'
    } as const
    const { data: _symbols } = useReadContracts({
        contracts: [
            {
                address: tradeTokens[0],
                ...symbolConfig
            },
            {
                address: tradeTokens[1],
                ...symbolConfig
            }
        ]
    })
    const symbols: string[] = useMemo(() => {
        return (
            (_symbols &&
                R.map<{ result: string; status: string }, string>(
                    R.prop<'result'>('result')
                )([..._symbols] as {
                    result: string
                    status: string
                }[])) ||
            []
        )
    }, [_symbols])
    const handleSubmitOrder = async () => {
        const _token0In = parseUnits(
            `${tokenIn}`,
            currentTradeMode === 'BUY'
                ? (memeInfo?.decimals as number)
                : (usdtInfo?.decimals as number)
        )
        const _token1Out = parseUnits(
            `${tokenOut}`,
            currentTradeMode === 'BUY'
                ? (usdtInfo?.decimals as number)
                : (memeInfo?.decimals as number)
        )
        const priceList = R.map<{ price: number; amount: number }, number>(
            R.prop<'price'>('price')
        )(currentTradeMode === 'BUY' ? buyList : sellList)
        console.log({ priceList })
        const isTakeOrder =
            currentTradeMode === 'BUY'
                ? customPrice <= priceList[0]
                : customPrice >= priceList[priceList.length - 1]
        let fee = 100n //read from contract
        let token0InWithFee = (_token0In * fee) / 10000n + _token0In
        try {
            // let beforeOrderId = 0
            console.log(isTakeOrder)
            console.log(currentTradeMode)
            let args = []
            if (isTakeOrder) {
                const _tradeaddress =
                    currentTradeMode === 'BUY'
                        ? buyMemeTradeAddr
                        : sellMemeTradeAddr
                console.log(_tradeaddress)
                args = [_tradeaddress, _token0In, _token1Out]
            } else {
                const _tradeaddress =
                    currentTradeMode === 'BUY'
                        ? sellMemeTradeAddr
                        : buyMemeTradeAddr
                const beforeOrderId = await readContract(config, {
                    address: serviceAddr as Address,
                    abi: TradeServiceAbi,
                    functionName: 'findBeforeOrderId',
                    args: [
                        currentTradeMode === 'BUY'
                            ? sellMemeTradeAddr
                            : buyMemeTradeAddr,
                        token0InWithFee,
                        _token1Out,
                        0
                    ],
                    account: address
                })
                console.log({ beforeOrderId })
                args = [_tradeaddress, _token0In, _token1Out, beforeOrderId]
            }
            console.log({ args })
            const { request, result } = await simulateContract(config, {
                address: serviceAddr as Address,
                abi: TradeServiceAbi,
                functionName: isTakeOrder ? 'takeOrder' : 'makeOrder',
                args,
                account: address
            })
            console.log(result)
            if (result) {
                const res = await writeContract(config, request)
                setTradeHash(res)
            } else {
                toast.error('Error info', {
                    description: result
                })
            }
        } catch (error) {
            console.log(error)
        }
        // const res = await simulateContract()
    }
    const handleApprove = async () => {
        console.log(currentTradeMode)
        console.log(tradeTokens[0])
        let _token0In = parseUnits(
            `${tokenIn}`,
            currentTradeMode === 'BUY'
                ? (memeInfo?.decimals as number)
                : (usdtInfo?.decimals as number)
        )
        console.log(_token0In)
        // let token1Want = parseUnits(`${tokenIn}`, token1Info?.decimals as number)

        let fee = 100n //read from contract
        let token0InWithFee = (_token0In * fee) / 10000n + _token0In
        console.log(token0InWithFee)
        const res = await writeContract(config, {
            address: tradeTokens[0], // sellMemeTradeAddr as Address,
            abi: ERC20Abi,
            functionName: 'approve',
            args: [serviceAddr, token0InWithFee],
            account: address
        })
        console.log(res)
        setApproveHash(res)
    }
    // console.log({ symbols })
    // console.log(tradeTokens)
    useEffect(() => {
        if (symbols && symbols.length === 2) {
            setFormToken(symbols[0])
            setToToken(symbols[1])
        }
    }, [symbols])
    // useEffect(() => {
    //     account && setAccount(account)
    // }, [account])
    useEffect(() => {
        if (currentPrice) {
            const _out =
                currentTradeMode === 'BUY'
                    ? tokenIn * currentPrice
                    : tokenIn / currentPrice
            setTokenOut(_out)
            setCustomPrice(currentPrice)
        }
    }, [currentPrice])
    useEffect(() => {
        if (customPrice) {
            const _out =
                currentTradeMode === 'BUY'
                    ? tokenIn * customPrice
                    : tokenIn / customPrice
            // console.log(_out)
            setTokenOut(
                _out !== 0 && !!_out
                    ? _out
                    : currentTradeMode === 'BUY'
                    ? tokenIn * currentPrice
                    : tokenIn / currentPrice
            )
        }
    }, [customPrice])
    useEffect(() => {
        // if (approveRes) {
        approveRes && handleSubmitOrder()
        // }
    }, [approveRes])
    useEffect(() => {
        // if (approveRes) {
        tradeRes && refetchData()
        // }
    }, [tradeRes])
    // useEffect(() => {
    //     if (isConnected) {
    //         // 在连接成功后调用
    //         // const chainId = connection.connector.getChainId()
    //         console.log('Chain ID:', chainId)
    //     }
    // }, [isConnected])
    return (
        <Card>
            <CardHeader>
                <CardTitle>MonoTrade</CardTitle>
                <CardDescription>
                    MonoTrade is a one-way trading contract.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* <Tabs
                    defaultValue="BUY"
                    className="mb-8 w-full"
                    onValueChange={setOrderAction}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="BUY">Buy</TabsTrigger>
                        <TabsTrigger value="SELL">Sell</TabsTrigger>
                    </TabsList>
                </Tabs> */}
                <Card>
                    <CardContent className="space-y-2">
                        <div className="space-y-1 pt-4">
                            <Label htmlFor="name">{`You're Selling`}</Label>
                            <div className="flex items-center space-x-4">
                                <Popover
                                    open={formOpen}
                                    onOpenChange={setFormOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            role="combobox"
                                            variant="outline"
                                            className="w-[200px] justify-between"
                                        >
                                            {formToken
                                                ? symbolList.find(
                                                      (_token) =>
                                                          _token === formToken
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
                                                    {symbolList.map(
                                                        (symbol, i) => (
                                                            <CommandItem
                                                                key={`${symbol}-formToken`}
                                                                value={symbol}
                                                                onSelect={(
                                                                    value
                                                                ) => {
                                                                    setFormToken(
                                                                        value
                                                                    )
                                                                }}
                                                            >
                                                                {symbol}
                                                                <CheckIcon
                                                                    className={cn(
                                                                        'ml-auto h-4 w-4',
                                                                        symbol ===
                                                                            formToken
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        )
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    id="name"
                                    type="number"
                                    className="border-0 text-right"
                                    placeholder="0.00"
                                    value={tokenIn}
                                    // defaultValue={tokenIn}
                                    onChange={(v) =>
                                        changeTokenIn(
                                            +v.target.value.replace(
                                                /[^0-9.]/g,
                                                ''
                                            )
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex justify-center py-5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full"
                                onClick={() => handleChangeMode()}
                            >
                                <FaArrowRightArrowLeft className="h-4 w-4 rotate-90" />
                            </Button>
                        </div>
                        <div className="space-y-1 ">
                            <Label htmlFor="username">{`You're Buying`}</Label>
                            <div className="flex items-center space-x-4">
                                <Popover open={toOpen} onOpenChange={setToOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            role="combobox"
                                            variant="outline"
                                            className="w-[200px] justify-between"
                                        >
                                            {toToken
                                                ? symbolList.find(
                                                      (_token) =>
                                                          _token === toToken
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
                                                    {symbolList.map(
                                                        (symbol) => (
                                                            <CommandItem
                                                                key={`${symbol}-toToken`}
                                                                value={symbol}
                                                                onSelect={(
                                                                    value
                                                                ) => {
                                                                    setFormToken(
                                                                        value
                                                                    )
                                                                }}
                                                            >
                                                                {symbol}
                                                                <CheckIcon
                                                                    className={cn(
                                                                        'ml-auto h-4 w-4',
                                                                        symbol ===
                                                                            toToken
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        )
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    id="name"
                                    className="border-0 text-right"
                                    placeholder="0.00"
                                    value={tokenOut}
                                    // defaultValue={tokenOut}
                                    onChange={(v) =>
                                        changeTokenOut(
                                            +v.target.value.replace(
                                                /[^0-9.]/g,
                                                ''
                                            )
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <ResizablePanelGroup
                            direction="horizontal"
                            className="max-w-md rounded-lg border md:min-w-[450px]"
                        >
                            <ResizablePanel defaultSize={70}>
                                <div className="pl-5 pt-3 text-sm text-gray-400">
                                    Buy MEME at rate
                                </div>
                                <div className="flex h-[50px] items-center justify-center gap-4 px-6">
                                    <Input
                                        className="border-0 text-left"
                                        placeholder="0.00"
                                        // value={customPrice}
                                        defaultValue={currentPrice || 0}
                                        onChange={(v) => {
                                            console.log(v.target.value)
                                            setCustomPrice(
                                                +v.target.value.replace(
                                                    /[^0-9.]/g,
                                                    ''
                                                )
                                            )
                                            // const _out =
                                            //     currentTradeMode === 'BUY'
                                            //         ? tokenIn * +customPrice
                                            //         : tokenIn / +customPrice
                                            // setTokenOut(_out)
                                        }}
                                    />
                                    <span>USDT</span>
                                </div>
                                <div className="px-6 py-2 text-sm text-gray-400">
                                    ≈ ${customPrice.toFixed(2)}
                                </div>
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={30}>
                                {/* <ResizablePanelGroup direction="vertical">
                                    <ResizablePanel defaultSize={25}>
                                        <div className="flex h-full items-center justify-center p-6">
                                            <span className="font-semibold">
                                                Two
                                            </span>
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle />
                                    <ResizablePanel defaultSize={75}>
                                        <div className="flex h-full items-center justify-center p-6">
                                            <span className="font-semibold">
                                                Three
                                            </span>
                                        </div>
                                    </ResizablePanel>
                                </ResizablePanelGroup> */}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </CardContent>
                    <CardFooter className="">
                        <Button
                            onClick={() => handleApprove()}
                            className={cn(
                                'w-full'
                                // orderAction === 'SELL' && 'bg-red-500'
                            )}
                        >
                            {mode && mode === 'market'
                                ? 'Place Market order'
                                : 'Place Limit order'}
                        </Button>
                    </CardFooter>
                </Card>
                {/* <RecentSales /> */}
            </CardContent>
        </Card>
    )
}

export default OrderForm
