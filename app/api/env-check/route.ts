import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables without exposing them
  const envVars = {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    VERCEL_ENV: process.env.VERCEL_ENV || 'not_set',
    NODE_ENV: process.env.NODE_ENV || 'not_set',
    VERCEL: !!process.env.VERCEL
  };
  
  // Check if we have the minimum required env vars
  const hasRequiredEnvVars = envVars.POSTGRES_URL || envVars.POSTGRES_PRISMA_URL;
  
  return NextResponse.json({
    hasRequiredEnvVars,
    environment: envVars,
    message: hasRequiredEnvVars 
      ? 'Environment variables look good' 
      : 'Missing required database environment variables'
  });
}