import Providers from '@/components/layout/providers'
// import { Toaster } from '@/components/ui/toaster
import { Toaster } from '@/components/ui/sonner'
import '@uploadthing/react/styles.css'
import type { Metadata } from 'next'
import NextTopLoader from 'nextjs-toploader'
import { Inter } from 'next/font/google'
import '@rainbow-me/rainbowkit/styles.css'

// import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
// import { WagmiProvider } from 'wagmi'
// import {
//     mainnet,
//     polygon,
//     optimism,
//     arbitrum,
//     base,
//     linea,
//     lineaSepolia
// } from 'wagmi/chains'
// import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import './globals.css'
// import { auth } from '@/auth'

const inter = Inter({ subsets: ['latin'] })

// const queryClient = new QueryClient()
export const metadata: Metadata = {
    title: 'Mars dex',
    description: 'This is a decentralized exchange on the Linea chain.'
}
// const config = getDefaultConfig({
//     appName: 'Mars dex',
//     projectId: 'b7408fdb8a4e47d42ee136ebb42cb532',
//     // metadata,
//     // chains: [mainnet, polygon, optimism, arbitrum, base, linea, lineaSepolia],
//     chains: [linea, lineaSepolia],
//     ssr: true // If your dApp uses server side rendering (SSR)
// })
export default async function RootLayout({
    children
}: {
    children: React.ReactNode
}) {
    // const session = await auth()
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} overflow-hidden `}>
                <NextTopLoader showSpinner={false} />
                {/* <WagmiProvider config={config}>
                    <QueryClientProvider client={queryClient}>
                        <RainbowKitProvider> */}
                <Providers>
                    <Toaster />
                    {children}
                </Providers>
                {/* Your App */}
                {/* </RainbowKitProvider>
                    </QueryClientProvider>
                </WagmiProvider> */}
            </body>
        </html>
    )
}
