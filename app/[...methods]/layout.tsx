import Header from '@/components/layout/header'
import Link from 'next/link'
import Sidebar from '@/components/layout/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { ScrollArea } from '@/components/ui/scroll-area';
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
        <div className="flex">
            {/* <Sidebar /> */}
            <main className="h-screen w-full flex-1 overflow-hidden">
                <Header />
                <div className="mx-auto max-w-screen-xl">
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
            </main>
        </div>
    )
}
