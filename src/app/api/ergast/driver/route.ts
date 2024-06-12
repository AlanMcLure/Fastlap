import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '0';
    const season = searchParams.get('season');
    const winner = searchParams.get('winner') === 'true';
    const podium = searchParams.get('podium') === 'true';
    const driverId = searchParams.get('driverId');
    
    const pageNum = parseInt(page, 10);
    let url = `https://ergast.com/api/f1/drivers.json?limit=8&offset=${pageNum * 8}`;

    if (driverId) {
        url = `https://ergast.com/api/f1/drivers/${driverId}.json`;
    } else {
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
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (driverId) {
            let driver;
            if (driverId === 'alonso') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Aston Martin',
                    country: 'Spain',
                    podiums: 106,
                    points: 2308,
                    grandsPrixEntered: 389,
                    worldChampionships: 2,
                    highestRaceFinish: '1 (x32)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Oviedo, Spain'
                };
            } else if (driverId === 'albon') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Williams',
                    country: 'Thailand',
                    podiums: 2,
                    points: 230,
                    grandsPrixEntered: 90,
                    worldChampionships: 0,
                    highestRaceFinish: '3 (x2)',
                    highestGridPosition: '4',
                    placeOfBirth: 'London, England'
                };
            } else if (driverId === 'hulkenberg') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Haas',
                    country: 'Germany',
                    podiums: 0,
                    points: 536,
                    grandsPrixEntered: 215,
                    worldChampionships: 0,
                    highestRaceFinish: '4 (x3)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Emmerich am Rhein, Germany'
                };
            } else if (driverId === 'perez') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Aston Martin',
                    country: 'Mexico',
                    podiums: 39,
                    points: 1593,
                    grandsPrixEntered: 267,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x6)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Guadalajara, Mexico'
                };
            } else if (driverId === 'alonso') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Red Bull Racing',
                    country: 'Spain',
                    podiums: 106,
                    points: 2308,
                    grandsPrixEntered: 389,
                    worldChampionships: 2,
                    highestRaceFinish: '1 (x32)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Oviedo, Spain'
                };
            } else if (driverId === 'sargeant') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Williams',
                    country: 'Spain',
                    podiums: 0,
                    points: 1,
                    grandsPrixEntered: 30,
                    worldChampionships: 0,
                    highestRaceFinish: '10 (x1)',
                    highestGridPosition: '6',
                    placeOfBirth: 'Fort Lauderdale, Florida'
                };
            } else if (driverId === 'leclerc') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Ferrari',
                    country: 'Monaco',
                    podiums: 35,
                    points: 1212,
                    grandsPrixEntered: 134,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x6)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Monte Carlo, Monaco'
                };
            } else if (driverId === 'piastri') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'McLaren',
                    country: 'Australia',
                    podiums: 3,
                    points: 178,
                    grandsPrixEntered: 31,
                    worldChampionships: 0,
                    highestRaceFinish: '2 (x2)',
                    highestGridPosition: '2',
                    placeOfBirth: 'Melbourne, Australia'
                };
            } else if (driverId === 'stroll') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Aston Martin',
                    country: 'Canada',
                    podiums: 3,
                    points: 285,
                    grandsPrixEntered: 152,
                    worldChampionships: 0,
                    highestRaceFinish: '2 (x3)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Montreal, Canada'
                };
            } else if (driverId === 'bottas') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Kick Sauber',
                    country: 'Finland',
                    podiums: 67,
                    points: 1797,
                    grandsPrixEntered: 231,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x10)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Nastola, Finland'
                };
            } else if (driverId === 'ricciardo') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'RB',
                    country: 'Australia',
                    podiums: 32,
                    points: 1326,
                    grandsPrixEntered: 248,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x8)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Perth, Australia'
                };
            } else if (driverId === 'kevin_magnussen') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Haas',
                    country: 'Denmark',
                    podiums: 1,
                    points: 187,
                    grandsPrixEntered: 173,
                    worldChampionships: 0,
                    highestRaceFinish: '2 (x1)',
                    highestGridPosition: '4',
                    placeOfBirth: 'Roskilde, Denmark'
                };
            } else if (driverId === 'tsunoda') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'RB',
                    country: 'Japan',
                    podiums: 0,
                    points: 80,
                    grandsPrixEntered: 75,
                    worldChampionships: 0,
                    highestRaceFinish: '4 (x1)',
                    highestGridPosition: '6',
                    placeOfBirth: 'Sagamihara, Japan'
                };
            } else if (driverId === 'gasly') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Alpine',
                    country: 'France',
                    podiums: 4,
                    points: 397,
                    grandsPrixEntered: 139,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x1)',
                    highestGridPosition: '2',
                    placeOfBirth: 'Rouen, France'
                };
            } else if (driverId === 'norris') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'McLaren',
                    country: 'United Kingdom',
                    podiums: 18,
                    points: 764,
                    grandsPrixEntered: 113,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x1)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Bristol, England'
                };
            } else if (driverId === 'russell') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Mercedes',
                    country: 'United Kingdom',
                    podiums: 12,
                    points: 538,
                    grandsPrixEntered: 113,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x1)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Kings Lynn, England'
                };
            } else if (driverId === 'max_verstappen') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Red Bull Racing',
                    country: 'Netherlands',
                    podiums: 105,
                    points: 2780.5,
                    grandsPrixEntered: 194,
                    worldChampionships: 3,
                    highestRaceFinish: '1 (x60)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Hasselt, Belgium'
                };
            } else if (driverId === 'hamilton') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Mercedes',
                    country: 'United Kingdom',
                    podiums: 197,
                    points: 4694.5,
                    grandsPrixEntered: 341,
                    worldChampionships: 7,
                    highestRaceFinish: '1 (x103)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Stevenage, England'
                };
            } else if (driverId === 'ocon') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Alpine',
                    country: 'France',
                    podiums: 3,
                    points: 424,
                    grandsPrixEntered: 142,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x1)',
                    highestGridPosition: '3',
                    placeOfBirth: 'Évreux, France'
                };
            } else if (driverId === 'sainz') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Ferrari',
                    country: 'Spain',
                    podiums: 22,
                    points: 1090.5,
                    grandsPrixEntered: 193,
                    worldChampionships: 0,
                    highestRaceFinish: '1 (x3)',
                    highestGridPosition: '1',
                    placeOfBirth: 'Madrid, Spain'
                };
            } else if (driverId === 'zhou') {
                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Kick Sauber',
                    country: 'china',
                    podiums: 0,
                    points: 12,
                    grandsPrixEntered: 53,
                    worldChampionships: 0,
                    highestRaceFinish: '8 (x1)',
                    highestGridPosition: '5',
                    placeOfBirth: 'Shanghai, China'
                };
            } else {
                const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

                driver = {
                    ...data.MRData.DriverTable.Drivers[0],
                    team: 'Ferrari',
                    country: 'England',
                    podiums: getRandomNumber(10, 100),
                    points: getRandomNumber(50, 1000),
                    grandsPrixEntered: getRandomNumber(20, 500),
                    worldChampionships: getRandomNumber(0, 5),
                    highestRaceFinish: `1 (x${getRandomNumber(0, 10)})`,
                    highestGridPosition: getRandomNumber(1, 20),
                    placeOfBirth: 'Desconocido'
                };
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
