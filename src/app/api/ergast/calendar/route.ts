import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || new Date().getFullYear().toString();
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    const url = `https://ergast.com/api/f1/${season}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const races = data.MRData.RaceTable.Races;

        // Paginate the races array
        const startIndex = page * limit;
        const paginatedRaces = races.slice(startIndex, startIndex + limit);

        return NextResponse.json({ content: paginatedRaces, totalPages: Math.ceil(races.length / limit), totalElements: races.length }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
