import { NextResponse } from 'next/server';
import { sqlite, initDatabase } from '@/lib/db-sqlite';

export async function GET() {
  try {
    // Auto-initialize database if needed
    await initDatabase();
    const result = sqlite.select('bosses', undefined, 'name');
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching bosses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bosses' },
      { status: 500 }
    );
  }
}