'use client';

import React, { useEffect, useState } from 'react';
import RaceResults from '@/components/f1-dashboard/RaceResults';
import { useParams } from 'next/navigation';

const RaceResultsPage = () => {

  const { season, carreraId } = useParams();

  const [raceData, setRaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`Season: ${season}, CarreraId: ${carreraId}`); // Debug: log season and carreraId
    if (season && carreraId) {
      const fetchRaceData = async () => {
        setLoading(true); // Ensure loading is true at the start
        console.log(`Fetching data for season: ${season}, carreraId: ${carreraId}`);
        try {
          const response = await fetch(`/api/ergast/race-results?season=${season}&round=${carreraId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch race data');
          }
          const data = await response.json();
          console.log('Fetched Race Data:', data); // Check the fetched data
          setRaceData(data.content);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchRaceData();
    } else {
      setLoading(false); // Stop loading if no season or carreraId
    }
  }, [season, carreraId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="font-bold text-3xl md:text-4xl mb-2">
        Resultados de la Carrera {season} - Ronda {carreraId}
      </h1>
      <RaceResults raceData={raceData} />
    </div>
  );
};

export default RaceResultsPage;
