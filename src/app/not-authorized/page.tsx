import Link from "next/link"

export default function NotAuthorized() {
    return (
        <>
            <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-base font-semibold text-red-600">403</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">Acceso no autorizado</h1>
                    <p className="mt-6 text-base leading-7 text-gray-600">El F1 Dashboard está disponible solo para usuarios Premium. Hazte Premium para acceder a estadísticas, calendarios y mucho más.</p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/premium" className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                            Hazte Premium
                        </Link>
                        <Link href="/" className="text-sm font-semibold text-gray-900">
                            Volver al inicio<span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
