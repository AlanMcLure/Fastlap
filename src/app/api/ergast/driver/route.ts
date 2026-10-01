import { ERGAST_BASE_URL, ERGAST_FETCH_OPTIONS, fetchAllDrivers } from '@/lib/ergast'
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '0';
    const season = searchParams.get('season');
    const winner = searchParams.get('winner') === 'true';
    const podium = searchParams.get('podium') === 'true';
    const driverId = searchParams.get('driverId');
    
    const pageNum = parseInt(page, 10);
    let url = `${ERGAST_BASE_URL}/drivers.json?limit=8&offset=${pageNum * 8}`;

    if (driverId) {
        url = `${ERGAST_BASE_URL}/drivers/${driverId}.json`;
    } else {
        if (season) {
            url = `${ERGAST_BASE_URL}/${season}/drivers.json?limit=8&offset=${pageNum * 8}`;
        }

        if (winner) {
            url = `${ERGAST_BASE_URL}/results/1/drivers.json?limit=8&offset=${pageNum * 8}`;
            if (season) {
                url = `${ERGAST_BASE_URL}/${season}/results/1/drivers.json?limit=8&offset=${pageNum * 8}`;
            }
        }

        if (podium) {
            // Realizar múltiples solicitudes para posiciones de podio
            const paths = [1, 2, 3].map(position =>
                season ? `${season}/results/${position}/drivers.json` : `results/${position}/drivers.json`
            );

            try {
                const results = await Promise.all(paths.map(fetchAllDrivers));

                // Combinar los resultados y eliminar duplicados
                const driversSet = new Set<string>();
                results.flat().forEach(driver => driversSet.add(JSON.stringify(driver)));

                const drivers = Array.from(driversSet).map(driver => JSON.parse(driver));
                const totalElements = drivers.length;
                const totalPages = Math.ceil(totalElements / 8);
                const content = drivers.slice(pageNum * 8, (pageNum + 1) * 8);

                return NextResponse.json({ content, totalElements, totalPages }, { status: 200 });
            } catch (error) {
                return NextResponse.json({ message: (error as Error).message }, { status: 500 });
            }
        }
    }

    try {
        const response = await fetch(url, ERGAST_FETCH_OPTIONS);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (driverId) {
            const driver = data.MRData.DriverTable.Drivers[0];
            if (!driver) {
                return NextResponse.json({ message: 'Driver not found' }, { status: 404 });
            }

            return NextResponse.json({ content: driver }, { status: 200 });
        } else {
            const drivers = data.MRData.DriverTable.Drivers;
            const totalElements = parseInt(data.MRData.total, 10); // Ajusta esto según la estructura de la respuesta
            const totalPages = Math.ceil(totalElements / 8);

            return NextResponse.json({ content: drivers, totalElements, totalPages }, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json({ message: (error as Error).message }, { status: 500 });
    }
}
