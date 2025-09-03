import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('Using connection string:', process.env.POSTGRES_URL ? 'POSTGRES_URL found' : 'No POSTGRES_URL');
    console.log('Alternative:', process.env.POSTGRES_URL_NON_POOLING ? 'NON_POOLING available' : 'No NON_POOLING');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('Basic query result:', result.rows);
    
    // Test if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Existing tables:', tables.rows);
    
    // Check environment variables (without exposing sensitive data)
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const hasVercelEnv = !!process.env.VERCEL_ENV;
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      testQuery: result.rows[0],
      tablesCount: tables.rows.length,
      tableNames: tables.rows.map(t => t.table_name),
      environment: {
        hasPostgresUrl,
        hasVercelEnv,
        nodeEnv: process.env.NODE_ENV
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