import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '0';
    const season = searchParams.get('season');
    const winner = searchParams.get('winner') === 'true';
    const podium = searchParams.get('podium') === 'true';
    
    const pageNum = parseInt(page, 10);
    let url = `https://ergast.com/api/f1/drivers.json?limit=8&offset=${pageNum * 8}`;

    if (season) {
        url = `https://ergast.com/api/f1/${season}/drivers.json?limit=8&offset=${pageNum * 8}`;
    }

    if (winner) {
        url = `https://ergast.com/api/f1/results/1/drivers.json?limit=8&offset=${pageNum * 8}`;
        if (season) {
            url = `https://ergast.com/api/f1/${season}/results/1/drivers.json?limit=8&offset=${pageNum * 8}`;
        }
    }

    if (podium) {
        // Realizar múltiples solicitudes para posiciones de podio
        const urls = [
            season ? `https://ergast.com/api/f1/${season}/results/1/drivers.json?limit=1000` : `https://ergast.com/api/f1/results/1/drivers.json?limit=1000`,
            season ? `https://ergast.com/api/f1/${season}/results/2/drivers.json?limit=1000` : `https://ergast.com/api/f1/results/2/drivers.json?limit=1000`,
            season ? `https://ergast.com/api/f1/${season}/results/3/drivers.json?limit=1000` : `https://ergast.com/api/f1/results/3/drivers.json?limit=1000`,
        ];

        try {
            const responses = await Promise.all(urls.map(url => fetch(url)));
            const data = await Promise.all(responses.map(res => res.json()));
            
            // Combinar los resultados y eliminar duplicados
            const driversSet = new Set<string>();
            data.forEach(result => {
                result.MRData.DriverTable.Drivers.forEach((driver: unknown) => {
                    driversSet.add(JSON.stringify(driver));
                });
            });
            
            const drivers = Array.from(driversSet).map(driver => JSON.parse(driver));
            const totalElements = drivers.length;
            const totalPages = Math.ceil(totalElements / 8);
            const content = drivers.slice(pageNum * 8, (pageNum + 1) * 8);

            return NextResponse.json({ content, totalElements, totalPages }, { status: 200 });
        } catch (error) {
            return NextResponse.json({ message: (error as Error).message }, { status: 500 });
        }
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        const drivers = data.MRData.DriverTable.Drivers;
        const totalElements = parseInt(data.MRData.total, 10); // Ajusta esto según la estructura de la respuesta
        const totalPages = Math.ceil(totalElements / 8);

        return NextResponse.json({ content: drivers, totalElements, totalPages }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
