'use client'
import React from 'react'
import ThemeProvider from './ThemeToggle/theme-provider'
// import { SessionProvider, SessionProviderProps } from 'next-auth/react'
import {
    RainbowKitProvider,
    getDefaultWallets,
    getDefaultConfig,
    Chain
} from '@rainbow-me/rainbowkit'
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
    okxWallet,
    metaMaskWallet
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider } from 'wagmi'
import {
    mainnet,
    // polygon,
    // optimism,
    // arbitrum,
    // base,
    linea,
    lineaSepolia
} from 'wagmi/chains'
import { config } from '@/config'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

const { wallets } = getDefaultWallets()
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            structuralSharing: false // Disable structural sharing
        }
    }
})
// export const metadata: Metadata = {
//     title: 'Mars dex',
//     description: 'This is a decentralized exchange on the Linea chain.'
// }
// const config = getDefaultConfig({
//     appName: 'Mars dex',
//     projectId: 'b7408fdb8a4e47d42ee136ebb42cb532',
//     wallets: [
//         ...wallets,
//         {
//             groupName: 'Other',
//             wallets: [
//                 metaMaskWallet,
//                 okxWallet,
//                 argentWallet,
//                 trustWallet,
//                 ledgerWallet
//             ]
//         }
//     ],
//     // metadata,
//     // chains: [mainnet, polygon, optimism, arbitrum, base, linea, lineaSepolia],
//     chains: [linea, lineaSepolia]
//     // ssr: true // If your dApp uses server side rendering (SSR)
// })
export default function Providers({
    // session,
    children
}: {
    // session: SessionProviderProps['session']
    children: React.ReactNode
}) {
    return (
        <>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider>
                        <ThemeProvider attribute="class" defaultTheme="dark">
                            {/* <SessionProvider session={session}> */}
                            {children}
                            {/* </SessionProvider> */}
                        </ThemeProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </>
    )
}
