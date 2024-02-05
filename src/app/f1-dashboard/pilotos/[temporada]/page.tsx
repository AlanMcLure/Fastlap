'use client'

import React, { useEffect, useRef, useState } from 'react';
import PilotCard, { PilotStats } from '@/components/f1-dashboard/PilotoCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PilotsSeasonPageProps {
    params: {
        temporada: string;

    }
}

export default function PilotsSeasonPage({ params }: PilotsSeasonPageProps) {
    const { temporada } = params;
    const [pilots, setPilots] = useState<PilotStats[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const totalElementsRef = useRef(20);

    console.log('temporada:', temporada);

    useEffect(() => {
        if (temporada) {
            fetch(`http://localhost:8083/piloto/temporada/${temporada}?page=${page}&size=8`)
                .then(response => response.json())
                .then(data => {
                    setPilots(data.content);
                    setTotalPages(data.totalPages);
                    totalElementsRef.current = data.totalElements;
                });
        }
    }, [page, temporada]);

    const handlePreviousPage = () => {
        if (page >= 1) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            setPage(page + 1);
        }
    };

    return (
        <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
            <h1 className='font-bold text-3xl md:text-4xl mb-2'>Pilotos</h1>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 '>
                {pilots.map(pilot => (
                    <PilotCard key={pilot.id} pilot={pilot} />
                ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-2">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={handlePreviousPage}
                        disabled={page === 0}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={page === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Siguiente
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{(page) * 8 + 1}</span> a <span className="font-medium">{Math.min((page + 1) * 8, totalPages * 8, totalElementsRef.current)}</span> de{' '}
                            <span className="font-medium">{totalElementsRef.current}</span> pilotos
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={handlePreviousPage}
                                disabled={page === 0}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                                <span className="sr-only">Anterior</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            <div className="flex justify-between">
                                {page !== 0 && <button className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" onClick={() => setPage(0)} disabled={page === 0}>1</button>}
                                {page > 0 && page !== 1 && <button className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" onClick={() => setPage(page - 1)}>{page}</button>}
                                <button className="relative inline-flex items-center px-2 py-2 bg-red-500 text-white ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0" disabled>{page + 1}</button>
                                {page < totalPages - 1 && page !== totalPages - 2 && <button className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" onClick={() => setPage(page + 1)}>{page + 2}</button>}
                                {page !== totalPages - 1 && <button className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>{totalPages}</button>}
                            </div>
                            <button
                                onClick={handleNextPage}
                                disabled={page === totalPages - 1}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            >
                                <span className="sr-only">Siguiente</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}