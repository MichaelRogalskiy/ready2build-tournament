import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getManagerScoresForBoss, calculateAggregateScores } from '@/lib/scoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }
    
    // Get all bosses
    const bossesResult = await sql`
      SELECT id, name FROM bosses ORDER BY name
    `;
    
    // Get scores per boss
    const perBoss = await Promise.all(
      bossesResult.rows.map(async (boss) => {
        const scores = await getManagerScoresForBoss(tournamentId, boss.id);
        return {
          bossId: boss.id,
          bossName: boss.name,
          items: scores
        };
      })
    );
    
    // Get aggregate scores
    const aggregate = await calculateAggregateScores(tournamentId);
    
    return NextResponse.json({
      perBoss,
      aggregate
    });
    
  } catch (error) {
    console.error('Scores error:', error);
    return NextResponse.json(
      { error: 'Failed to get scores', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}