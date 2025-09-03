import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, inn, fio, lead_tin, lead_for_jira, staff_category 
      FROM managers 
      ORDER BY fio
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch managers' },
      { status: 500 }
    );
  }
}