import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const season = searchParams.get('season')
    const classificationType = searchParams.get('classificationType')

    const url = `http://ergast.com/api/f1/${season}/${classificationType}Standings.json`

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