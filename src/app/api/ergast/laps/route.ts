import { ERGAST_BASE_URL, ERGAST_FETCH_OPTIONS } from '@/lib/ergast'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season')
    const round = searchParams.get('classificationType')
    const driver = searchParams.get('driver')
     
    const url = `${ERGAST_BASE_URL}/${season}/${round}/drivers/${driver}/laps.json`
    
    try {
        const response = await fetch(url, ERGAST_FETCH_OPTIONS)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        const data = await response.json()
        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ message }, { status: 500 })
    }
    
}