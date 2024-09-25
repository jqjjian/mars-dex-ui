import { useMemo, useCallback, useState, useEffect } from 'react'
import * as R from 'ramda'
import { useAccount, useReadContracts, type UseAccountParameters } from 'wagmi'
import { type Address, formatUnits } from 'viem'
import { MonoTradeAbi, ERC20Abi } from '@/constants/abi'
import { config } from '@/config'
import { type TokenInfoType } from '@/lib/store'

export default function useTokenInfoByTrade(tradeAddr: Address) {
    const { address, isConnected, chainId } = useAccount({
        ...config
    } as UseAccountParameters)

    const { data: _tradeTokens, error: tradeTokensError } = useReadContracts({
        contracts: [
            {
                address: tradeAddr,
                abi: MonoTradeAbi,
                functionName: 'token0'
            },
            {
                address: tradeAddr,
                abi: MonoTradeAbi,
                functionName: 'token1'
            }
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

    const fetchTokenInfo = (tokenAddress: Address) => {
        const symbolConfig = {
            address: tokenAddress,
            abi: ERC20Abi
        } as const

        const { data: _tokenInfo, error: tokenInfoError } = useReadContracts({
            config,
            contracts: [
                {
                    ...symbolConfig,
                    functionName: 'name'
                },
                {
                    ...symbolConfig,
                    functionName: 'symbol'
                },
                {
                    ...symbolConfig,
                    functionName: 'decimals'
                },
                {
                    ...symbolConfig,
                    functionName: 'balanceOf',
                    args: [address ?? undefined]
                }
            ]
        })

        const tokenInfo = useMemo(() => {
            return (
                address &&
                _tokenInfo &&
                ({
                    address: tokenAddress,
                    name: _tokenInfo[0].result,
                    symbol: _tokenInfo[1].result,
                    decimals: _tokenInfo[2].result,
                    balanceOf: formatUnits(
                        _tokenInfo[3].result as bigint,
                        _tokenInfo[2].result as number
                    )
                } as TokenInfoType)
            )
        }, [_tokenInfo, address])

        return { tokenInfo, tokenInfoError }
    }

    const { tokenInfo: token0Info, tokenInfoError: token0Error } =
        fetchTokenInfo(tradeTokens[0])
    const { tokenInfo: token1Info, tokenInfoError: token1Error } =
        fetchTokenInfo(tradeTokens[1])

    useEffect(() => {
        if (tradeTokensError) {
            console.error('Error fetching trade tokens:', tradeTokensError)
        }
        if (token0Error) {
            console.error('Error fetching token0 info:', token0Error)
        }
        if (token1Error) {
            console.error('Error fetching token1 info:', token1Error)
        }
    }, [tradeTokensError, token0Error, token1Error])

    return {
        token0Info,
        token1Info,
        tradeTokens
    }
}
