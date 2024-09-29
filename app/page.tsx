import { Metadata } from 'next'
import OrderForm from '@/components/forms/order-form'
import OrderList from '@/components/order-list'
import UserList from '@/components/user-list'
import Header from '@/components/layout/header'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
export const metadata: Metadata = {
    title: 'spot',
    description: ''
}

export default function Page() {
    const methods = ['market', '0x566137bC9A4a28214B4407dd6dE8bff291C4C21F']
    return (
        <div className="m-0 h-screen p-0">
            <Header />
            <ScrollArea className="h-screen">
                {/* <main className="h-[calc(100vh - 56px)]"> */}
                <div className="mx-auto max-w-screen-xl pt-14">
                    <Tabs
                        defaultValue={
                            methods.length > 0 ? methods[0] : 'market'
                        }
                        className="w-full"
                    >
                        <TabsList>
                            <TabsTrigger value="market">
                                <Link
                                    href={`/market/${
                                        methods.length > 1 ? methods[1] : ''
                                    }`}
                                >
                                    Market
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger value="limit">
                                <Link
                                    href={`/limit/${
                                        methods.length > 1 ? methods[1] : ''
                                    }`}
                                >
                                    Limit
                                </Link>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex justify-end gap-5 pb-5 pt-10">
                        <div className="w-full">
                            <OrderList />
                        </div>
                        <div className="w-lg">
                            <OrderForm />
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <UserList />
                    </div>
                </div>
                {/* </main> */}
            </ScrollArea>
        </div>
    )
}
