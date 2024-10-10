'use client'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { type Address } from 'viem'
import {
    type UseAccountParameters,
    useAccount,
    useReadContract,
    useBlockNumber
} from 'wagmi'
import { useMarsDexStore } from '@/lib/store'
import { config } from '@/config'
import { TradeServiceAbi } from '@/constants/abi'
import UserListItem from './user-list-item'
import { OrderListType } from '@/types'
import { useState } from 'react'
import { uint32Value } from '@/constants/data'

const UserList = () => {
    const { data: blockNumber, refetch } = useBlockNumber()
    const [activeTab, setActiveTab] = useState('open-order')
    const { address } = useAccount({
        ...config
    } as UseAccountParameters)

    const { serviceAddr } = useMarsDexStore()
    const lastIndex = 0
    const num = 20

    const { data: orderList } = useReadContract({
        blockNumber,
        abi: TradeServiceAbi,
        address: serviceAddr,
        functionName: 'getUserOrders',
        args: [address, lastIndex, num]
    }) as { data: OrderListType[] | undefined }
    // console.log(orderList)
    const filteredOrderList =
        orderList?.reduce((acc, order) => {
            if (
                // !order.isRemoved &&
                order.orderId !== 0 &&
                !acc.some((item) => item.orderId === order.orderId)
            ) {
                const progressPercentage =
                    order.progress === 0
                        ? 0
                        : Math.min((order.progress / uint32Value) * 100, 100)
                const isCompleted = progressPercentage === 100

                if (
                    (activeTab === 'open-order' &&
                        !isCompleted &&
                        !order.isRemoved) ||
                    activeTab === 'order-history'
                ) {
                    acc.push(order)
                }
            }
            return acc
        }, [] as OrderListType[]) || []

    return (
        <div className="h-full w-full">
            <Tabs defaultValue="open-order" onValueChange={setActiveTab}>
                <TabsList defaultValue="open-order">
                    <TabsTrigger value="open-order">Open Order</TabsTrigger>
                    <TabsTrigger value="order-history">
                        Order History
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="open-order">
                    {/* <ScrollArea className="h-[500px]"> */}
                    <Accordion type="multiple" className="w-full">
                        {filteredOrderList.map((v, i) => (
                            <UserListItem
                                key={`${v.trade}-${i}`}
                                mode="open-order"
                                tradeInfo={v}
                                cbfn={refetch}
                            />
                        ))}
                    </Accordion>
                    {/* </ScrollArea> */}
                </TabsContent>
                <TabsContent value="order-history">
                    {/* <ScrollArea className="h-[500px]"> */}
                    <Accordion type="multiple" className="w-full">
                        {filteredOrderList.map((v, i) => (
                            <UserListItem
                                key={`${v.trade}-${i}`}
                                mode="order-history"
                                tradeInfo={v}
                                cbfn={refetch}
                            />
                        ))}
                    </Accordion>
                    {/* </ScrollArea> */}
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default UserList
