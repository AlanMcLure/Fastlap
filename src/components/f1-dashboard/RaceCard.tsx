import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';

export interface RaceStats {
    season: string;
    round: string;
    url: string;
    raceName: string;
    Circuit: {
        circuitId: string;
        url: string;
        circuitName: string;
        Location: {
            lat: string;
            long: string;
            locality: string;
            country: string;
        };
    };
    date: string;
    time: string;
    FirstPractice: {
        date: string;
        time: string;
    };
    SecondPractice: {
        date: string;
        time: string;
    };
    ThirdPractice?: {
        date: string;
        time: string;
    };
    Qualifying: {
        date: string;
        time: string;
    };
    Sprint?: {
        date: string;
        time: string;
    };
}

interface RaceCardProps {
    race: RaceStats;
}

const RaceCard: React.FC<RaceCardProps> = ({ race }) => {
    const { raceName, Circuit, date } = race;
    const circuitName = Circuit?.circuitName;
    const locality = Circuit?.Location?.locality;
    const country = Circuit?.Location?.country;

    return (
        <Card className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col justify-between h-36 sm:h-48">
            <CardHeader className="px-4 py-2">
                <CardTitle className="text-lg font-semibold">{raceName}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-2 flex-1">
                <p className="text-base">{circuitName}</p>
                <p className="text-sm text-gray-600">{locality}, {country}</p>
                <p className="text-sm text-gray-600">{new Date(date).toLocaleDateString()}</p>
            </CardContent>
        </Card>
    );
};

export default RaceCard;
