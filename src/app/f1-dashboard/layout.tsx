'use client'

import React from 'react';
import Sidebar, { SidebarItem } from '@/components/SideBar';
import Link from 'next/link';
import { UserCircle, Flag, Book, Trophy } from 'lucide-react'
import { usePathname } from 'next/navigation';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const pathname = usePathname();

    return (
        <div className="flex">
            <div className='sticky top-14 z-10 h-[calc(100vh-3.5rem)] shrink-0 self-start'>
                <Sidebar>
                    <Link href="/f1-dashboard/pilotos">
                        <SidebarItem icon={<UserCircle />} text="Pilotos" active={pathname.includes('piloto')} alert={false} />
                    </Link>
                    <Link href="/f1-dashboard/clasificacion">
                        <SidebarItem icon={<Trophy />} text="Clasificación" active={pathname.includes('clasificacion')} alert={false} />
                    </Link>
                    <Link href="/f1-dashboard/carreras">
                        <SidebarItem icon={<Flag />} text="Carreras" active={pathname.includes('carrera')} alert={false} />
                    </Link>
                    <Link href="/f1-dashboard/noticias">
                        <SidebarItem icon={<Book />} text="Noticias" active={pathname.includes('noticia')} alert={false} />
                    </Link>
                    {/* Próximamente más */}
                </Sidebar>
            </div>
            <main className="min-w-0 flex-1">
                {children}
            </main>
        </div>
    );
};

export default Layout;