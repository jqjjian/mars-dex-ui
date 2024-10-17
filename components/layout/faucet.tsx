'use client'
import { useEffect, useState, useTransition } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FaFaucetDrip } from 'react-icons/fa6'
import { writeContract, simulateContract, readContract } from '@wagmi/core'
import { parseUnits } from 'viem'
import { ERC20Abi } from '@/constants/abi'
import { config } from '@/config'
import { toast } from 'sonner'
// import {
//     Tooltip,
//     TooltipContent,
//     TooltipProvider,
//     TooltipTrigger
// } from '@/components/ui/tooltip'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover'
import { Address } from 'viem'
const USDT_ADDR = process.env.NEXT_PUBLIC_USDT_ADDR as Address
const MEME_ADDR = process.env.NEXT_PUBLIC_MEME_ADDR as Address
export default function Faucet() {
    const { address } = useAccount()
    const [sendAddress, setSendAddress] = useState('')
    const [isPending, startTransition] = useTransition()
    const receiveToken = (token: string) => {
        startTransition(async () => {
            try {
                const result = await writeContract(config, {
                    address: token === 'USDT' ? USDT_ADDR : MEME_ADDR,
                    abi: ERC20Abi,
                    functionName: 'mint',
                    args: [
                        sendAddress || address,
                        parseUnits('1000', token === 'USDT' ? 6 : 18)
                    ],
                    account: address
                })
                console.log(result)
                if (result) {
                    // await writeContract(config, request)
                    toast.success(`Receive ${token} hash: ${result}`)
                } else {
                    toast.error(`Receive ${token} failed`)
                }
            } catch (error) {
                console.log(error)
            }
        })
    }
    useEffect(() => {}, [address])
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    <FaFaucetDrip />
                </Button>
                {/* <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline">
                                <FaFaucetDrip />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Faucet</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider> */}
            </PopoverTrigger>
            <PopoverContent className="w-96">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                            Unichain Sepolia Faucet
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Get free Sepolia USDT or MEME sent directly to your
                            wallet.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <div className="space-y-2">
                            <Label htmlFor="width">
                                Wallet address or ENS name
                            </Label>
                            <Input
                                id="width"
                                defaultValue={address || sendAddress}
                                onChange={(e) => setSendAddress(e.target.value)}
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="flex justify-between">
                            <Button
                                disabled={isPending}
                                onClick={() => receiveToken('USDT')}
                            >
                                Receive 1000 USDT
                            </Button>
                            <Button
                                disabled={isPending}
                                onClick={() => receiveToken('MEME')}
                            >
                                Receive 1000 MEME
                            </Button>
                        </div>
                        {/* <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="maxWidth">Max. width</Label>
                            <Input
                                id="maxWidth"
                                defaultValue="300px"
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="height">Height</Label>
                            <Input
                                id="height"
                                defaultValue="25px"
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="maxHeight">Max. height</Label>
                            <Input
                                id="maxHeight"
                                defaultValue="none"
                                className="col-span-2 h-8"
                            />
                        </div> */}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
