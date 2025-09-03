import { NextResponse } from 'next/server';
import { sqlite, initDatabase } from '@/lib/db-sqlite';

export async function GET() {
  try {
    // Auto-initialize database if needed
    await initDatabase();
    
    const result = sqlite.query(`
      SELECT id, title, rounds, group_size, created_at 
      FROM tournaments 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
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