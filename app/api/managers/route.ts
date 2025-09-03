import { NextResponse } from 'next/server';
import { sqlite, initDatabase } from '@/lib/db-sqlite';

export async function GET() {
  try {
    // Auto-initialize database if needed
    await initDatabase();
    const result = sqlite.select('managers', undefined, 'fio');
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch managers' },
      { status: 500 }
    );
  }
}