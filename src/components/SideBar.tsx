'use client'

import { ChevronLast, ChevronFirst } from "lucide-react"
import { useContext, createContext, useState, ReactNode } from "react"
import { Icons } from "@/components/Icons"

interface SidebarContextType {
    expanded: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProps {
    children: ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <aside className="h-screen">
            <nav className="h-full flex flex-col bg-white border-r shadow-sm">
                <div className="p-4 pb-2 flex justify-between items-center">
                    <Icons.logo className={`h-8 w-8 ${expanded ? "" : "hidden"}`} />
                    <button
                        onClick={() => setExpanded((curr) => !curr)}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                        {expanded ? <ChevronFirst /> : <ChevronLast />}
                    </button>
                </div>

                <SidebarContext.Provider value={{ expanded }}>
                    <ul className="flex-1 px-3">{children}</ul>
                </SidebarContext.Provider>
            </nav>
        </aside>
    )
}

interface SidebarItemProps {
    icon: ReactNode;
    text: string;
    active: boolean;
    alert: boolean;
}

export function SidebarItem({ icon, text, active, alert }: SidebarItemProps) {
    const { expanded } = useContext(SidebarContext)!

    return (
        <li
            className={`
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${active
                    ? "bg-gradient-to-tr from-red-200 to-red-100 text-red-800"
                    : "hover:bg-red-50 text-gray-600"
                }
    `}
        >
            {icon}
            <span
                className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
                    }`}
            >
                {text}
            </span>
            {alert && (
                <div
                    className={`absolute right-2 w-2 h-2 rounded bg-red-400 ${expanded ? "" : "top-2"
                        }`}
                />
            )}

            {!expanded && (
                <div
                    className={`
          absolute left-full rounded-md px-2 py-1 ml-6
          bg-red-100 text-red-800 text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
                >
                    {text}
                </div>
            )}
        </li>
    )
}
