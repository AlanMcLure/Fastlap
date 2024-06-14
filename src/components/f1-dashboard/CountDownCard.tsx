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
            <h2 className="font-bold text-2xl mb-4 text-center">Próximo Gran Premio: {nextRace.raceName}</h2>
            <div className="countdown flex justify-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                <div className="flex flex-col items-center mx-2">
                    <span className="font-bold">{timeLeft.days}</span>
                    <span className="text-sm sm:text-base">días</span>
                </div>
                <div className="flex flex-col items-center mx-2">
                    <span className="font-bold">{timeLeft.hours}</span>
                    <span className="text-sm sm:text-base">horas</span>
                </div>
                <div className="flex flex-col items-center mx-2">
                    <span className="font-bold">{timeLeft.minutes}</span>
                    <span className="text-sm sm:text-base">minutos</span>
                </div>
                <div className="flex flex-col items-center mx-2">
                    <span className="font-bold">{timeLeft.seconds}</span>
                    <span className="text-sm sm:text-base">segundos</span>
                </div>
            </div>
        </div>
    );
};

export default CountdownCard;
