import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || 'current';
    const classificationType = searchParams.get('classificationType') || 'driver';
    const round = searchParams.get('round');

    const url = round
        ? `http://ergast.com/api/f1/${season}/${round}/${classificationType}Standings.json`
        : `http://ergast.com/api/f1/${season}/${classificationType}Standings.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Verificar si data.MRData.StandingsTable.StandingsLists existe y no está vacío
        if (!data.MRData.StandingsTable.StandingsLists || data.MRData.StandingsTable.StandingsLists.length === 0) {
            throw new Error('No standings data found');
        }

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
