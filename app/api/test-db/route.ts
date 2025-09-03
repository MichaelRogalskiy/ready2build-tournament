import { NextResponse } from 'next/server';
import { sqlite, initDatabase } from '@/lib/db-sqlite';

export async function GET() {
  try {
    console.log('Testing SQLite database connection...');
    
    // Auto-initialize database if needed
    await initDatabase();
    
    // Test basic connection
    const result = sqlite.query('SELECT 1 as test');
    console.log('Basic query result:', result.rows);
    
    // Test if tables exist
    const tables = sqlite.query(`
      SELECT name as table_name 
      FROM sqlite_master 
      WHERE type='table'
    `);
    console.log('Existing tables:', tables.rows);
    
    return NextResponse.json({
      status: 'success',
      message: 'SQLite database connection successful',
      databaseType: 'SQLite',
      testQuery: result.rows[0],
      tablesCount: tables.rows.length,
      tableNames: (tables.rows as {table_name: string}[]).map(t => t.table_name),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}