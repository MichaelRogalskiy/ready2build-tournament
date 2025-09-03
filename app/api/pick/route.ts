import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db-sqlite';
import { calculatePickScores, updateScores } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const { 
      tournamentId, 
      bossId, 
      roundIndex, 
      groupIndex, 
      top1, 
      top2, 
      bottom1, 
      latencyMs 
    } = await request.json();
    
    // Validate required fields
    if (!tournamentId || !bossId || roundIndex === undefined || 
        groupIndex === undefined || !top1 || !top2 || !bottom1) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate that all three picks are different
    if (top1 === top2 || top1 === bottom1 || top2 === bottom1) {
      return NextResponse.json(
        { error: 'Top1, Top2, and Bottom1 must be different managers' },
        { status: 400 }
      );
    }
    
    // Get group members to validate picks
    const groupResult = sqlite.query(`
      SELECT manager_id 
      FROM appearances
      WHERE 
        tournament_id = ? AND
        boss_id = ? AND
        round_index = ? AND
        group_index = ?
    `, [tournamentId, bossId, roundIndex, groupIndex]);
    
    const groupMemberIds = (groupResult.rows as {manager_id: string}[]).map(r => r.manager_id);
    
    // Validate that picks are from the current group
    if (!groupMemberIds.includes(top1) || !groupMemberIds.includes(top2) || !groupMemberIds.includes(bottom1)) {
      return NextResponse.json(
        { error: 'All picks must be from the current group' },
        { status: 400 }
      );
    }
    
    // Check if pick already exists
    const existingPick = sqlite.query(`
      SELECT id FROM picks
      WHERE 
        tournament_id = ? AND
        boss_id = ? AND
        round_index = ? AND
        group_index = ?
    `, [tournamentId, bossId, roundIndex, groupIndex]);
    
    if (existingPick.rows.length > 0) {
      return NextResponse.json(
        { error: 'Pick already exists for this group' },
        { status: 400 }
      );
    }
    
    // Save pick
    sqlite.insert('picks', {
      tournament_id: tournamentId,
      boss_id: bossId,
      round_index: roundIndex,
      group_index: groupIndex,
      top1,
      top2,
      bottom1,
      latency_ms: latencyMs || null
    });
    
    // Calculate and update scores
    const pickScores = calculatePickScores(top1, top2, bottom1, groupMemberIds);
    await updateScores(tournamentId, bossId, roundIndex, pickScores);
    
    return NextResponse.json({ 
      ok: true,
      message: 'Pick saved successfully'
    });
    
  } catch (error) {
    console.error('Pick error:', error);
    return NextResponse.json(
      { error: 'Failed to save pick', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}