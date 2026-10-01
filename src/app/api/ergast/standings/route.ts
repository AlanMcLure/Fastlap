import { ERGAST_BASE_URL, ERGAST_FETCH_OPTIONS } from '@/lib/ergast'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || 'current';
    const classificationType = searchParams.get('classificationType') || 'driver';
    const round = searchParams.get('round');

    const url = round
        ? `${ERGAST_BASE_URL}/${season}/${round}/${classificationType}Standings.json`
        : `${ERGAST_BASE_URL}/${season}/${classificationType}Standings.json`;

    try {
        const response = await fetch(url, ERGAST_FETCH_OPTIONS);
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
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
