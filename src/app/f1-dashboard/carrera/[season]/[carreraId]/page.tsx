'use client';

import React, { useEffect, useState } from 'react';
import RaceResults from '@/components/f1-dashboard/RaceResults';
import { useParams } from 'next/navigation';
import BackButton from '@/components/BackButton';
import DataError from '@/components/f1-dashboard/DataError';
import DriverStandings from '@/components/f1-dashboard/DriverStandings';

const RaceResultsPage = () => {

  const { season, carreraId } = useParams();

  const [raceData, setRaceData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (season && carreraId) {
      const fetchRaceData = async () => {
        setLoading(true); // Ensure loading is true at the start
        setError(null);
        try {
          const response = await fetch(`/api/ergast/race-results?season=${season}&round=${carreraId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch race data');
          }
          const data = await response.json();
          setRaceData(data.content);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      fetchRaceData();
    } else {
      setLoading(false); // Stop loading if no season or carreraId
    }
  }, [season, carreraId, attempt]);

  if (loading) return <div className='loader'></div>;
  if (error) return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className='w-full mb-2'><BackButton defaultPath="/f1-dashboard/carreras" backText="Volver al Dashboard" /></div>
      <DataError message='No hay resultados disponibles para esta carrera: puede que aún no se haya disputado o que no se hayan podido cargar los datos.' onRetry={() => setAttempt((n) => n + 1)} />
    </div>
  );
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className='w-full mb-2'>
        <BackButton defaultPath="/f1-dashboard/carreras" backText="Volver al Dashboard" />
      </div>
      <h1 className="font-bold text-3xl md:text-4xl mb-2">
        Resultados de la Carrera {season} - Ronda {carreraId}
      </h1>
      <RaceResults raceData={raceData} />
      <DriverStandings round={carreraId}></DriverStandings>
    </div>
  );
};

export default RaceResultsPage;
