import type { Metadata } from "next"
import Link from "next/link"

import { PREMIUM_ENABLED } from "@/lib/features"

export const metadata: Metadata = { title: 'Acceso no autorizado', robots: { index: false, follow: false } }

export default function NotAuthorized() {
    return (
        <>
            <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-base font-semibold text-signal">403</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Acceso no autorizado</h1>
                    <p className="mt-6 text-base leading-7 text-muted-foreground">
                        {PREMIUM_ENABLED
                            ? 'El F1 Dashboard está disponible solo para usuarios Premium. Hazte Premium para acceder a estadísticas, calendarios y mucho más.'
                            : 'No tienes acceso a esta página.'}
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        {PREMIUM_ENABLED && <Link href="/premium" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                            Hazte Premium
                        </Link>}
                        <Link href="/" className="text-sm font-semibold text-foreground">
                            Volver al inicio<span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
