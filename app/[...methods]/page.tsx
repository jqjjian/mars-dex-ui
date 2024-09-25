import { Metadata } from 'next'
import OrderForm from '@/components/forms/order-form'
import OrderList from '@/components/order-list'
import UserList from '@/components/user-list'

export const metadata: Metadata = {
    title: 'spot',
    description: ''
}

export default function Page() {
    return (
        <div className="flex h-screen flex-col">
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
    )
}
