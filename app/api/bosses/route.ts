import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, name, email FROM bosses ORDER BY name
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching bosses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bosses' },
      { status: 500 }
    );
  }
}