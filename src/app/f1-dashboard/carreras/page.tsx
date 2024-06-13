'use client';

import React, { useEffect, useState, useRef } from 'react';
import RaceCard, { RaceStats } from '@/components/f1-dashboard/RaceCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';

export default function RacesPage() {
  const [races, setRaces] = useState<RaceStats[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const totalElementsRef = useRef(20);
  const router = useRouter();

  const [season, setSeason] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchRaces = async () => {
      let url = `/api/ergast/calendar?page=${page}&limit=8&season=${season}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setRaces(data.content);
        setTotalPages(data.totalPages);
        totalElementsRef.current = data.totalElements;
      } catch (error) {
        console.error(error);
        router.push('/notfound');
      }
    };

    fetchRaces();
  }, [page, season]);

  const handlePreviousPage = () => {
    if (page >= 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <BackButton defaultPath="/f1-dashboard" backText="Volver al Dashboard" />
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 mt-4">
        <h1 className="font-bold text-3xl md:text-4xl mb-2">Calendario de Carreras</h1>
        <div className="flex items-center space-x-2">
          <div>
            <select
              value={season}
              onChange={e => {
                setSeason(e.target.value);
                setPage(0);
              }}
              className="border border-gray-300 rounded p-2"
            >
              <option value={new Date().getFullYear().toString()}>Actual</option>
              {Array.from({ length: 75 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {races && races.length > 0 ? (
          races.map(race => (
            <Link href={`/f1-dashboard/carrera/${race.season}/${race.round}`} key={race.round}>
              <RaceCard key={race.round} race={race} />
            </Link>
          ))
        ) : (
          <p>No se encontraron carreras que cumplan con el filtro.</p>
        )}
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
            disabled={page === totalPages - 1}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(page) * 8 + 1}</span> a <span className="font-medium">{Math.min((page + 1) * 8, totalPages * 8, totalElementsRef.current)}</span> de{' '}
              <span className="font-medium">{totalElementsRef.current}</span> carreras
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
                {page !== totalPages - 1 && <button className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0" onClick={() => setPage(totalPages - 1)}>{totalPages}</button>}
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
