import Link from "next/link"

export default function NotFound() {
    return (
        <>
            <div className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
                <div className="text-center">
                    <p className="text-base font-semibold text-signal">404</p>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Página no encontrada</h1>
                    <p className="mt-6 text-base leading-7 text-muted-foreground">Lo sentimos, no pudimos encontrar la página que estás buscando.</p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link href="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                            Volver al inicio
                        </Link>
                        <Link href="mailto:fastlapsoporte@gmail.com" className="text-sm font-semibold text-foreground">
                            Contactar con soporte<span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
