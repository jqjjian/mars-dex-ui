import { http, createConfig } from '@wagmi/core'
// import { createPublicClient, http as hp } from 'viem'
//mtk 0xd074429dC6E9060a5cCED81A287F26ef39594633
// import { Chain } from '@rainbow-me/rainbowkit'
import { mainnet, linea, lineaSepolia } from '@wagmi/core/chains'
// import { linea, lineaSepolia } from 'viem/chains'
import { type UseAccountParameters } from 'wagmi'
import { injected } from 'wagmi/connectors'
// export const Merlin_Testnet = {
//     id: 59141,
//     name: 'Linea Sepolia Testnet',
//     iconUrl:
//         'https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/QmURjritnHL7a8TwZgsFwp3f272DJmG5paaPtWDZ98QZwH',
//     iconBackground: '#fff',
//     nativeCurrency: { name: 'Merlin Testnet', symbol: 'ETH', decimals: 18 },
//     rpcUrls: {
//         default: { http: ['https://testnet-rpc.merlinchain.io'] }
//     },
//     blockExplorers: {
//         default: {
//             name: 'MerlinScan',
//             url: 'https://testnet-scan.merlinchain.io'
//         }
//     }
//     // contracts: {
//     //     multicall3: {
//     //         address: '0xca11bde05977b3631167028862be2a173976ca11',
//     //         blockCreated: 11_907_934
//     //     }
//     // }
// } as const satisfies Chain
export const config = createConfig({
    ssr: true,
    connectors: [injected()],
    chains: [
        // mainnet,
        linea,
        lineaSepolia
        // sepolia,
        // Merlin_Testnet
    ],
    transports: {
        // [mainnet.id]: http(),
        // [sepolia.id]: http(),
        [linea.id]: http(),
        [lineaSepolia.id]: http()
    }
})

// export const merlinClient = createPublicClient({
//     chain: Merlin_Testnet,
//     transport: hp()
// })
