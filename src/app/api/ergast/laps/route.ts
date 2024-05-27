import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season')
    const round = searchParams.get('classificationType')
    const driver = searchParams.get('driver')
     
    const url = `https://ergast.com/api/f1/${season}/${round}/drivers/${driver}/laps.json`
    
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        const data = await response.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
    
}