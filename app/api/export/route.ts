import { NextRequest, NextResponse } from 'next/server';
import { calculateAggregateScores } from '@/lib/scoring';

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
    
    // Get aggregate scores
    const scores = await calculateAggregateScores(tournamentId);
    
    // Create CSV content
    const headers = [
      'ФИО',
      'Середні бали',
      'Стабільність',
      'Top-1 (всього)',
      'Bottom-1 (всього)',
      'SOS',
      'Позиція'
    ];
    
    const rows = scores.map((score, index) => [
      score.fio,
      score.avgPoints.toFixed(2),
      score.stability.toFixed(2),
      score.top1Total.toString(),
      score.bottom1Total.toString(),
      score.tiebreak.sos.toFixed(2),
      (index + 1).toString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tournament-results-${tournamentId}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export results', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}