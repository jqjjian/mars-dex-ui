import Header from '@/components/layout/header'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Next Shadcn Dashboard Starter',
    description: 'Basic dashboard with Next.js and Shadcn'
}

export default function SpotLayout({
    children,
    params
}: {
    children: React.ReactNode
    params: {
        methods: string
    }
}) {
    const { methods } = params
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
                    {children}
                </div>
                {/* </main> */}
            </ScrollArea>
        </div>
    )
}
