import { createContext, Dispatch, SetStateAction } from 'react'
import { Address } from 'viem'

type OrderContextType = {
    serviceAddr: Address | undefined
    sellMemeTradeAddr: Address | undefined
}
export const ServiceContext = createContext<OrderContextType>({
    serviceAddr: undefined,
    sellMemeTradeAddr: undefined
})
