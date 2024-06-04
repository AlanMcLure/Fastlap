import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season') || new Date().getFullYear().toString();

    const url = `https://ergast.com/api/f1/${season}.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const races = data.MRData.RaceTable.Races;

        return NextResponse.json({ content: races }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
