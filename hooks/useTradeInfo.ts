import { useMemo, useCallback, useState, useEffect } from 'react'
import * as R from 'ramda'
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
import { MonoTradeAbi, ERC20Abi, TradeServiceAbi } from '@/constants/abi'
import { config } from '@/config'
import { type TokenInfoType, useMarsDexStore } from '@/lib/store'
import { uint32Value } from '@/constants/data'
import { useTokenInfoByTrade } from '@/hooks'
type OrderListType = {
    amountIn: bigint
    amountOut: bigint
    orderId: number
    progress: number
}

export default function useTradeInfo(tradeAddr: Address) {
    const [tradeList, setTradeList] = useState([])
    const {
        serviceAddr,
        sellMemeTradeAddr,
        buyMemeTradeAddr,
        setBuyMemeTradeAddr,
        setSellMemeTradeAddr,
        setSellList,
        setBuyList,
        setCurrentPrice,
        // currentPrice,
        setToken0Info,
        setToken1Info,
        setCurrentTradeMode
    } = useMarsDexStore()
    const { data: blockNumber, refetch: refetchBigNum } = useBlockNumber()
    const { address, isConnected, chainId } = useAccount({
        ...config
    } as UseAccountParameters)

    const { token0Info, token1Info, tradeTokens } =
        useTokenInfoByTrade(tradeAddr)

    const [usdtInfo, memeInfo, usdtAddr, memeAddr] = useMemo(() => {
        if (!token0Info || !token1Info || !tradeTokens)
            return [null, null, null, null]

        const isToken0USDT = token0Info.symbol === 'USDT'
        return isToken0USDT
            ? [token0Info, token1Info, tradeTokens[0], tradeTokens[1]]
            : [token1Info, token0Info, tradeTokens[1], tradeTokens[0]]
    }, [token0Info, token1Info, tradeTokens])

    const serviceArgs = {
        abi: TradeServiceAbi,
        address: serviceAddr,
        functionName: 'getTrade'
    }

    const { data: _tradeAddrs } = useReadContracts({
        contracts: [
            {
                ...serviceArgs,
                args: [usdtAddr, memeAddr]
            },
            {
                ...serviceArgs,
                args: [memeAddr, usdtAddr]
            }
        ]
    })
    const tradeAddrs: Address[] = useMemo(() => {
        return (
            (_tradeAddrs &&
                R.map<{ result: Address; status: string }, Address>(
                    R.prop<'result'>('result')
                )([..._tradeAddrs] as {
                    result: Address
                    status: string
                }[])) ||
            []
        )
    }, [_tradeAddrs])

    let fromOrderId = 0
    let num = 30
    const tradeListArgs = {
        address: serviceAddr,
        abi: TradeServiceAbi,
        functionName: 'getOrderList'
    } as const
    const { data: _tradeList } = useReadContracts({
        blockNumber,
        contracts: [
            {
                ...tradeListArgs,
                args: [sellMemeTradeAddr, fromOrderId, num]
            },
            {
                ...tradeListArgs,
                args: [buyMemeTradeAddr, fromOrderId, num]
            }
        ]
    })
    // console.log({ _tradeList })
    const sellList = useMemo(() => {
        const list =
            (_tradeList && (_tradeList[0].result as OrderListType[])) || []
        const priceList = list
            .filter((v) => v.orderId !== 0)
            .reverse()
            .map((v) => {
                const _out = formatUnits(v.amountOut, usdtInfo!.decimals)
                // console.log(_out)
                // console.log(token0Info?.decimals)
                const _in = formatUnits(v.amountIn, memeInfo!.decimals)
                const _amount = formatUnits(v.amountIn, memeInfo!.decimals)
                const proportion =
                    v.progress !== 0 ? 1 - v.progress / uint32Value : 1

                return {
                    price: +(+_out / +_in).toFixed(4),
                    amount: proportion * +_amount
                }
                // console.log(_in)
                // console.log(token1Info?.decimals)
                // return +_out / +_in
            })
        const _priceList = R.map<{ price: number; amount: number }, number>(
            R.prop<'price'>('price')
        )(priceList)
        const uniqPriceList = R.uniq(_priceList)
        // console.log({ uniqPriceList })
        // console.log(uniqPriceList)
        return uniqPriceList.map((price) => {
            const filterList = priceList.filter((v) => price === v.price)
            const amount = R.sum(
                R.map<{ price: number; amount: number }, number>(
                    R.prop<'amount'>('amount')
                )(filterList)
            )
            return {
                price: +price.toFixed(4),
                amount: +amount.toFixed(4)
            }
        })
    }, [_tradeList, usdtInfo, memeInfo])
    const buyList = useMemo(() => {
        const list =
            (_tradeList && (_tradeList[1].result as OrderListType[])) || []
        const priceList = list
            .filter((v) => v.orderId !== 0)
            .map((v) => {
                const _out = +formatUnits(v.amountOut, memeInfo!.decimals)
                const _in = +formatUnits(v.amountIn, usdtInfo!.decimals)
                const _amount = formatUnits(v.amountOut, memeInfo!.decimals)
                const proportion =
                    v.progress !== 0 ? 1 - v.progress / uint32Value : 1
                // console.log(proportion)
                return {
                    price: +(_in / _out).toFixed(4),
                    amount: proportion * +_amount
                }
                // return (
                //     +formatUnits(v.amountIn, token0Info?.decimals || 6) /
                //     +formatUnits(v.amountOut, token1Info?.decimals || 18)
                // )
            })
        const _priceList = R.map<{ price: number; amount: number }, number>(
            R.prop<'price'>('price')
        )(priceList)
        const uniqPriceList = R.uniq(_priceList)
        // console.log(uniqPriceList)
        return uniqPriceList.map((price) => {
            // console.log(price)
            const filterList = priceList.filter((v) => price === v.price)
            const amount = R.sum(
                R.map<{ price: number; amount: number }, number>(
                    R.prop<'amount'>('amount')
                )(filterList)
            )
            return {
                price: +price.toFixed(4),
                amount: +amount.toFixed(4)
            }
        })
    }, [_tradeList, usdtInfo, memeInfo])
    // console.log(sellList, buyList)
    useEffect(() => {
        if (tradeAddrs && tradeAddrs.length === 2) {
            setSellMemeTradeAddr(tradeAddrs[0])
            setBuyMemeTradeAddr(tradeAddrs[1])
        }
    }, [tradeAddrs])
    useEffect(() => {
        sellList && setSellList(sellList)
    }, [sellList])
    useEffect(() => {
        buyList && setBuyList(buyList)
    }, [buyList])
    useEffect(() => {
        if (sellList && buyList) {
            const _price =
                (sellList[sellList.length - 1]?.price ??
                    0 + buyList[0]?.price ??
                    0) / 2
            setCurrentPrice(_price)
        }
    }, [sellList, buyList])

    useEffect(() => {
        if (token0Info) setToken0Info(token0Info)
        if (token1Info) setToken1Info(token1Info)
    }, [token0Info, token1Info])

    useEffect(() => {
        if (tradeAddr && tradeAddrs) {
            setCurrentTradeMode(tradeAddr === tradeAddrs[0] ? 'SELL' : 'BUY')
        }
    }, [tradeAddr, tradeAddrs])

    const refetchData = useCallback(() => {
        refetchBigNum()
    }, [refetchBigNum])

    return {
        sellList,
        buyList,
        usdtInfo,
        memeInfo,
        refetchData
    }
}
