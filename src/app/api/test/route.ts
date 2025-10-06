import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('GET /api/test called')
  return NextResponse.json({ message: 'Test endpoint working' })
}

export async function POST(request: NextRequest) {
  console.log('POST /api/test called')
  try {
    const body = await request.json()
    console.log('Request body:', body)
    return NextResponse.json({ message: 'Test POST working', body })
  } catch (error) {
    console.error('Error in test endpoint:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}