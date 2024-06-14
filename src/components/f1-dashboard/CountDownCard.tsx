'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface CountdownCardProps {
    nextRace: { date: string, raceName: string, time: string };
}

const CountdownCard: React.FC<CountdownCardProps> = ({ nextRace }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const raceDateTime = new Date(`${nextRace.date}`);
            const difference = +raceDateTime - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [nextRace]);

    return (
        <div className="card bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="font-bold text-2xl mb-4">Próximo Gran Premio: {nextRace.raceName}</h2>
            {/* <p className="text-lg mb-4">Empieza en:</p> */}
            <div className="countdown flex justify-center text-2xl">
                <div className="mx-2">
                    <span>{timeLeft.days}</span> <span>días</span>
                </div>
                <div className="mx-2">
                    <span>{timeLeft.hours}</span> <span>horas</span>
                </div>
                <div className="mx-2">
                    <span>{timeLeft.minutes}</span> <span>minutos</span>
                </div>
                <div className="mx-2">
                    <span>{timeLeft.seconds}</span> <span>segundos</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownCard;
