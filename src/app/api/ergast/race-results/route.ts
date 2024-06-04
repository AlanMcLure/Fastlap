import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = searchParams.get('season');
  const round = searchParams.get('round');

  if (!season || !round) {
    return NextResponse.json({ message: 'Season and round parameters are required' }, { status: 400 });
  }

  const url = `https://ergast.com/api/f1/${season}/${round}/results.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log('API Data:', data); // Agrega este console log para ver los datos de la API
    return NextResponse.json({ content: data.MRData.RaceTable.Races[0].Results }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
