import { useMemo, useCallback, useState, useEffect } from 'react'
import * as R from 'ramda'
import { useAccount, useReadContracts, type UseAccountParameters } from 'wagmi'
import { type Address, formatUnits, type Abi } from 'viem'
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
            abi: ERC20Abi as Abi
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
                ...(address
                    ? [
                          {
                              ...symbolConfig,
                              functionName: 'balanceOf',
                              args: [address]
                          }
                      ]
                    : [])
            ]
        })

        const tokenInfo = useMemo(() => {
            if (!_tokenInfo) return null

            const [name, symbol, decimals, balance] = _tokenInfo

            return {
                address: tokenAddress,
                name: name.result,
                symbol: symbol.result,
                decimals: decimals.result,
                balanceOf:
                    balance &&
                    balance.status === 'success' &&
                    balance.result !== undefined
                        ? formatUnits(
                              balance.result as bigint,
                              decimals.result as number
                          )
                        : '0'
            } as TokenInfoType
        }, [_tokenInfo, address, tokenAddress])

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
