import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, title, rounds, group_size, created_at 
      FROM tournaments 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No tournaments found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching latest tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest tournament' },
      { status: 500 }
    );
  }
}