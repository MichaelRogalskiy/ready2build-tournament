import { NextResponse } from 'next/server';

export async function GET() {
  // Show all environment variables related to database (masked for security)
  const envVars = Object.keys(process.env)
    .filter(key => key.includes('POSTGRES') || key.includes('DATABASE'))
    .reduce((acc, key) => {
      const value = process.env[key];
      if (value) {
        // Mask sensitive parts but show structure
        acc[key] = value.length > 20 
          ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}` 
          : '[HIDDEN]';
      }
      return acc;
    }, {} as Record<string, string>);

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION
    },
    databaseVars: envVars,
    suggestions: [
      'Check if POSTGRES_URL starts with postgresql://',
      'Verify the database is running and accessible',
      'Try using POSTGRES_URL_NON_POOLING if pooling issues exist',
      'Ensure Vercel Postgres (not Neon) is being used'
    ]
  });
}