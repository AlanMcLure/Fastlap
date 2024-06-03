import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '0';
    const season = searchParams.get('season');
    const winner = searchParams.get('winner') === 'true';
    const podium = searchParams.get('podium') === 'true';
    
    let url = `https://ergast.com/api/f1/drivers.json?limit=8&offset=${parseInt(page) * 8}`;

    if (season) {
        url = `https://ergast.com/api/f1/${season}/drivers.json?limit=8&offset=${parseInt(page) * 8}`;
    }

    if (podium) {
        url = `https://ergast.com/api/f1/results/3/drivers.json?limit=8&offset=${parseInt(page) * 8}`;
        if (season) {
            url = `https://ergast.com/api/f1/${season}/results/3/drivers.json?limit=8&offset=${parseInt(page) * 8}`;
        }
    }

    if (winner) {
        url = `https://ergast.com/api/f1/results/1/drivers.json?limit=8&offset=${parseInt(page) * 8}`;
        if (season) {
            url = `https://ergast.com/api/f1/${season}/results/1/drivers.json?limit=8&offset=${parseInt(page) * 8}`;
        }
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const drivers = data.MRData.DriverTable.Drivers;
        const totalElements = data.MRData.total; // Ajusta esto según la estructura de la respuesta
        const totalPages = Math.ceil(totalElements / 8);

        return NextResponse.json({ content: drivers, totalElements, totalPages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
