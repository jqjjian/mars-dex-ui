import { useMemo, useCallback, useEffect } from 'react'
import * as R from 'ramda'
import { useAccount, useReadContracts, useBlockNumber } from 'wagmi'
import { type Address, formatUnits } from 'viem'
import { TradeServiceAbi } from '@/constants/abi'
import { config } from '@/config'
import { useMarsDexStore } from '@/lib/store'
import { uint32Value } from '@/constants/data'
import { useTokenInfoByTrade } from '@/hooks'

type OrderListType = {
    amountIn: bigint
    amountOut: bigint
    orderId: number
    progress: number
}

export default function useTradeInfo(tradeAddr: Address) {
    const {
        serviceAddr,
        sellMemeTradeAddr,
        buyMemeTradeAddr,
        setSellMemeTradeAddr,
        setBuyMemeTradeAddr,
        setSellList,
        setBuyList,
        setCurrentPrice,
        setToken0Info,
        setToken1Info,
        setCurrentTradeMode
    } = useMarsDexStore()
    const { data: blockNumber, refetch: refetchData } = useBlockNumber()
    // const { address, isConnected, chainId } = useAccount()

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

    const { data: _tradeAddrs } = useReadContracts({
        contracts: [
            {
                abi: TradeServiceAbi,
                address: serviceAddr,
                functionName: 'getTrade',
                args: [usdtAddr, memeAddr]
            },
            {
                abi: TradeServiceAbi,
                address: serviceAddr,
                functionName: 'getTrade',
                args: [memeAddr, usdtAddr]
            }
        ]
    })

    const tradeAddrs: Address[] = useMemo(
        () => _tradeAddrs?.map(({ result }) => result as Address) || [],
        [_tradeAddrs]
    )

    const { data: _tradeList } = useReadContracts({
        blockNumber,
        contracts: [
            {
                address: serviceAddr,
                abi: TradeServiceAbi,
                functionName: 'getOrderList',
                args: [sellMemeTradeAddr, 0, 30]
            },
            {
                address: serviceAddr,
                abi: TradeServiceAbi,
                functionName: 'getOrderList',
                args: [buyMemeTradeAddr, 0, 30]
            }
        ]
    })

    const processOrderList = useCallback(
        (list: OrderListType[], isUSDT: boolean) => {
            return list
                .filter((v) => v.orderId !== 0)
                .map((v) => {
                    const _out = +formatUnits(
                        v.amountOut,
                        isUSDT ? usdtInfo!.decimals : memeInfo!.decimals
                    )
                    const _in = +formatUnits(
                        v.amountIn,
                        isUSDT ? memeInfo!.decimals : usdtInfo!.decimals
                    )
                    const _amount = +formatUnits(
                        isUSDT ? v.amountIn : v.amountOut,
                        memeInfo!.decimals
                    )
                    const proportion =
                        v.progress !== 0 ? 1 - v.progress / uint32Value : 1
                    return {
                        price: isUSDT
                            ? +(_out / _in).toFixed(4)
                            : +(_in / _out).toFixed(4),
                        amount: proportion * _amount
                    }
                })
        },
        [usdtInfo, memeInfo]
    )

    const aggregateOrders = useCallback(
        (priceList: { price: number; amount: number }[]) => {
            const uniqPrices = R.uniq(priceList.map(R.prop('price')))
            return uniqPrices.map((price) => ({
                price: +price.toFixed(4),
                amount: +R.sum(
                    priceList
                        .filter((v) => v.price === price)
                        .map(R.prop('amount'))
                ).toFixed(4)
            }))
        },
        []
    )

    const sellList = useMemo(() => {
        const list = (_tradeList?.[0].result as OrderListType[]) || []
        return aggregateOrders(processOrderList(list, true)).reverse()
    }, [_tradeList, processOrderList, aggregateOrders])

    const buyList = useMemo(() => {
        const list = (_tradeList?.[1].result as OrderListType[]) || []
        return aggregateOrders(processOrderList(list, false))
    }, [_tradeList, processOrderList, aggregateOrders])

    useEffect(() => {
        if (tradeAddrs.length === 2) {
            setSellMemeTradeAddr(tradeAddrs[0])
            setBuyMemeTradeAddr(tradeAddrs[1])
        }
    }, [tradeAddrs, setSellMemeTradeAddr, setBuyMemeTradeAddr])

    useEffect(() => {
        setSellList(sellList)
        setBuyList(buyList)
        const _price =
            ((sellList[sellList.length - 1]?.price ?? 0) +
                (buyList[0]?.price ?? 0)) /
            2
        setCurrentPrice(Math.round(_price * 10000) / 10000)
    }, [sellList, buyList, setSellList, setBuyList, setCurrentPrice])

    useEffect(() => {
        if (token0Info) setToken0Info(token0Info)
        if (token1Info) setToken1Info(token1Info)
    }, [token0Info, token1Info, setToken0Info, setToken1Info])

    useEffect(() => {
        if (tradeAddr && tradeAddrs.length) {
            setCurrentTradeMode(tradeAddr === tradeAddrs[0] ? 'SELL' : 'BUY')
        }
    }, [tradeAddr, tradeAddrs, setCurrentTradeMode])

    return {
        sellList,
        buyList,
        usdtInfo,
        memeInfo,
        refetchData
    }
}
