'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DriverStandings from '@/components/f1-dashboard/DriverStandings';
import CountdownCard from '@/components/f1-dashboard/CountDownCard'

const DashboardPage: React.FC = () => {
    const [nextRace, setNextRace] = useState<{ date: string, raceName: string, time: string } | null>(null);

    useEffect(() => {
        const fetchNextRace = async () => {
            try {
                const response = await axios.get('/api/ergast/calendar?limit=1000');
                const races = response.data.content;
                const now = new Date();
                const upcomingRaces = races.filter((race: any) => new Date(`${race.date}`) > now);
                const nextRace = upcomingRaces[0]; // Get the first upcoming race
                if (nextRace) {
                    setNextRace({ date: nextRace.date, raceName: nextRace.raceName, time: nextRace.time });
                }
            } catch (error) {
                console.error('Error fetching next race:', error);
            }
        };

        fetchNextRace();
    }, []);

    return (
        <div>
            <h1 className="font-bold text-3xl md:text-4xl mb-4">Bienvenido al Dashboard de F1</h1>
            {nextRace && <CountdownCard nextRace={nextRace} />}
            <DriverStandings />
        </div>
    );
};

export default DashboardPage;
