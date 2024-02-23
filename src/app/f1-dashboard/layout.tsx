'use client'

import React from 'react';
import Sidebar, { SidebarItem } from '@/components/SideBar';
import Link from 'next/link';
import { UserCircle, Flag } from 'lucide-react'
import { usePathname } from 'next/navigation';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const pathname = usePathname();

    return (
        <div className="flex">
            <div className='fixed h-auto left-0 top-16 overflow-auto z-10'>
                <Sidebar>
                    <Link href="/f1-dashboard/pilotos">
                        <SidebarItem icon={<UserCircle />} text="Pilotos" active={pathname.includes('piloto')} alert={false} />
                    </Link>
                    <Link href="/f1-dashboard/carreras">
                        <SidebarItem icon={<Flag />} text="Carreras" active={pathname.includes('carrera')} alert={false} />
                    </Link>
                    {/* Próximamente más */}
                </Sidebar>
            </div>
            <main className="flex-grow ml-20 sm:ml-40">
                {children}
            </main>
        </div>
    );
};

export default Layout;