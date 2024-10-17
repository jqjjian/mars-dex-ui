'use client'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'
import { config } from '@/config'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { ERC20Abi, TradeServiceAbi, MonoTradeAbi } from '@/constants/abi'
import { writeContract, simulateContract, readContract } from '@wagmi/core'
import { useTokenInfoByTrade } from '@/hooks'
import { OrderListType } from '@/types'
import { useEffect, useMemo, useState } from 'react'
import { formatUnits, type Address } from 'viem'
import { uint32Value } from '@/constants/data'
import { Button } from './ui/button'
const DECIMAL_PLACES = 4
const USTD_SYMBOL = 'USDT'

const formatAmount = (amount: bigint, decimals: number) => {
    const formatted = formatUnits(amount, decimals)
    const [integerPart, decimalPart = ''] = formatted.split('.')
    const trimmedDecimal = decimalPart.replace(/0+$/, '')
    if (trimmedDecimal.length > DECIMAL_PLACES) {
        return `${integerPart}.${trimmedDecimal.slice(0, DECIMAL_PLACES)}`
    }
    return trimmedDecimal.length > 0
        ? `${integerPart}.${trimmedDecimal}`
        : integerPart
}

const UserListItem = ({
    tradeInfo,
    cbfn,
    mode
}: {
    tradeInfo: OrderListType
    cbfn: () => void
    mode: 'open-order' | 'order-history'
}) => {
    const { address } = useAccount()
    const { token0Info, token1Info } = useTokenInfoByTrade(tradeInfo.trade)
    const [tradeHash, setTradeHash] = useState<Address>()
    const { data: tradeRes } = useWaitForTransactionReceipt({
        confirmations: 3,
        hash: tradeHash,
        config
    })

    const formattedAmountIn = useMemo(
        () =>
            token1Info && tradeInfo.amountIn
                ? formatAmount(BigInt(tradeInfo.amountIn), token1Info.decimals)
                : '0',
        [token1Info, tradeInfo.amountIn]
    )

    const formattedAmountOut = useMemo(
        () =>
            token0Info && tradeInfo.amountOut
                ? formatAmount(BigInt(tradeInfo.amountOut), token0Info.decimals)
                : '0',
        [token0Info, tradeInfo.amountOut]
    )

    // const isSellUstd = useMemo(
    //     () => token0Info?.symbol === USTD_SYMBOL,
    //     [token0Info]
    // )

    const calculatePrice = useMemo(() => {
        if (
            token0Info &&
            token1Info &&
            tradeInfo.amountIn &&
            tradeInfo.amountOut
        ) {
            const amountInDecimal = Number(
                formatUnits(BigInt(tradeInfo.amountIn), token1Info.decimals)
            )
            const amountOutDecimal = Number(
                formatUnits(BigInt(tradeInfo.amountOut), token0Info.decimals)
            )
            if (token0Info.symbol === USTD_SYMBOL) {
                // 如果token0是USDT，直接返回USDT价格
                return amountOutDecimal / amountInDecimal
            } else if (token1Info.symbol === USTD_SYMBOL) {
                // 如果token1是USDT，返回USDT价格的倒数
                return amountInDecimal / amountOutDecimal
            } else {
                // 如果都不是USDT，这种情况不应该发生，返回0或抛出错误
                console.error('Neither token is USDT')
                return 0
            }
        }
        return 0
    }, [token0Info, token1Info, tradeInfo.amountIn, tradeInfo.amountOut])

    const priceDisplay = useMemo(() => {
        const price = calculatePrice.toFixed(DECIMAL_PLACES)
        const formattedPrice = parseFloat(price).toString()
        const nonUsdtSymbol =
            token0Info?.symbol === USTD_SYMBOL
                ? token1Info?.symbol
                : token0Info?.symbol
        return `${formattedPrice} USDT pre ${nonUsdtSymbol}`
    }, [calculatePrice, token0Info, token1Info])

    const progressPercentage = useMemo(() => {
        if (tradeInfo.progress === 0) return 0
        return Math.min((tradeInfo.progress / uint32Value) * 100, 100)
    }, [tradeInfo.progress])

    const progressDisplay = useMemo(() => {
        return progressPercentage === 100
            ? 'Completed'
            : tradeInfo.isRemoved
            ? 'Cancelled'
            : `${progressPercentage.toFixed(2)}%`
    }, [progressPercentage])

    const soldAmount = useMemo(() => {
        const totalAmount = BigInt(tradeInfo.amountIn)
        const soldAmount =
            (totalAmount * BigInt(Math.floor(progressPercentage))) / 100n
        return token1Info ? formatAmount(soldAmount, token1Info.decimals) : '0'
    }, [token1Info, tradeInfo.amountIn, progressPercentage])

    const totalFilledDisplay = useMemo(() => {
        if (!token1Info) return ''
        return `${soldAmount} / ${formattedAmountIn} ${token1Info.symbol} (${progressDisplay})`
    }, [soldAmount, formattedAmountIn, token1Info, progressDisplay])

    const handleCancelOrder = async () => {
        const { request, result } = await simulateContract(config, {
            address: tradeInfo.trade,
            abi: MonoTradeAbi,
            functionName: 'cancelOrder',
            args: [tradeInfo.orderId],
            account: address
        })

        if (result) {
            const res = await writeContract(config, request)
            setTradeHash(res)

            console.log(res)
        }
    }
    // console.log(3333)
    useEffect(() => {
        if (tradeRes && cbfn) {
            console.log('Cancel Order Success!')
            cbfn()
            setTradeHash(undefined)
        }
    }, [tradeRes, cbfn])

    if (!token0Info || !token1Info) {
        return <div>Loading trade information...</div>
    }

    return (
        <AccordionItem value={tradeInfo.orderId.toString()}>
            <AccordionTrigger className="flex items-center justify-between hover:no-underline">
                <div className="flex flex-col items-start gap-y-2">
                    <div className="w-48 whitespace-nowrap text-left text-red-500">{`Sell: ${formattedAmountIn} ${token1Info.symbol}`}</div>
                    <div className="w-48 whitespace-nowrap text-left text-green-500">{`Buy: ${formattedAmountOut} ${token0Info.symbol}`}</div>
                </div>
                <div className="w-48 whitespace-nowrap text-left">{`${priceDisplay}`}</div>
                <div className="w-48 whitespace-nowrap text-left">
                    {progressDisplay}
                </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-y-2">
                <div>Trade Details:</div>
                <div className="flex justify-between">
                    <div>Total Deposited</div>
                    <div>{`${formattedAmountIn} ${token1Info.symbol}`}</div>
                </div>
                <div className="flex justify-between">
                    <div>Total Filled</div>
                    <div>{totalFilledDisplay}</div>
                </div>
                <div className="flex justify-center">
                    {mode === 'open-order' && (
                        <Button
                            onClick={() => handleCancelOrder()}
                            variant="ghost"
                        >{` Cancel Order `}</Button>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    )
}

export default UserListItem
