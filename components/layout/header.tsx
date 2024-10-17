import ThemeToggle from '@/components/layout/ThemeToggle/theme-toggle'
import { cn } from '@/lib/utils'
import { MobileSidebar } from './mobile-sidebar'
import { UserNav } from './user-nav'
import Faucet from './faucet'
export default function Header() {
    return (
        <header className="fixed inset-x-0 top-0 z-10 w-full">
            <nav className="flex items-center justify-between px-4 py-2 md:justify-end">
                <div className={cn('block lg:!hidden')}>
                    <MobileSidebar />
                </div>
                <div className="flex items-center gap-2">
                    <UserNav />
                    <Faucet />
                    <ThemeToggle />
                </div>
            </nav>
        </header>
    )
}
