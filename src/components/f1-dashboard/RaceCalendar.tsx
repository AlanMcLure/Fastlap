'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RaceCalendar = () => {
  const [calendar, setCalendar] = useState([]);
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const router = useRouter();

  useEffect(() => {
    const fetchCalendar = async () => {
      let url = `/api/ergast/calendar?season=${season}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setCalendar(data.content);
      } catch (error) {
        console.error(error);
        router.push('/notfound');
      }
    };

    fetchCalendar();
  }, [season]);

  return (
    <div>
      <div>
        <label>
          Temporada:
          <input type="text" value={season} onChange={e => setSeason(e.target.value)} />
        </label>
      </div>
      <div>
        {calendar && calendar.length > 0 ? (
          calendar.map(race => (
            <div key={race.round}>
              <Link href={`/f1-dashboard/carrera/${season}/${race.round}`}>
                {race.raceName} - {race.date}
              </Link>
            </div>
          ))
        ) : (
          <p>No se encontraron carreras para la temporada especificada.</p>
        )}
      </div>
    </div>
  );
};

export default RaceCalendar;
