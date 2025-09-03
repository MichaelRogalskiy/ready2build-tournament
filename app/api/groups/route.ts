import { NextRequest, NextResponse } from 'next/server';
import { sqlite } from '@/lib/db-sqlite';
import { makeSwissGroups, getWasTogetherFunction } from '@/lib/swiss';
import { getManagerScoresForBoss } from '@/lib/scoring';
import { Group } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { tournamentId, bossId, roundIndex } = await request.json();
    
    if (!tournamentId || !bossId || roundIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Check if groups already exist for this round
    const existingGroups = sqlite.query(`
      SELECT DISTINCT group_index, manager_id
      FROM appearances
      WHERE 
        tournament_id = ? AND
        boss_id = ? AND
        round_index = ?
      ORDER BY group_index, manager_id
    `, [tournamentId, bossId, roundIndex]);
    
    if (existingGroups.rows.length > 0) {
      // Return existing groups
      const groups: Group[] = [];
      let currentGroup: Group | null = null;
      
      for (const row of existingGroups.rows) {
        const groupRow = row as { group_index: number; manager_id: string };
        if (!currentGroup || currentGroup.groupIndex !== groupRow.group_index) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            groupIndex: groupRow.group_index,
            memberIds: []
          };
        }
        currentGroup.memberIds.push(groupRow.manager_id);
      }
      if (currentGroup) groups.push(currentGroup);
      
      return NextResponse.json({ groups });
    }
    
    // Get tournament settings
    const tournamentResult = sqlite.query(
      'SELECT group_size FROM tournaments WHERE id = ?',
      [tournamentId]
    );
    const groupSize = (tournamentResult.rows[0] as {group_size: number})?.group_size || 5;
    
    // Get all managers
    let managerIds: string[];
    
    if (roundIndex === 0) {
      // First round: random order
      const managersResult = sqlite.query('SELECT id FROM managers ORDER BY RANDOM()');
      managerIds = (managersResult.rows as {id: string}[]).map(r => r.id);
    } else {
      // Subsequent rounds: order by score
      const scores = await getManagerScoresForBoss(tournamentId, bossId);
      managerIds = scores.map(s => s.managerId);
    }
    
    // Get wasTogether function
    const wasTogether = await getWasTogetherFunction(tournamentId, bossId, roundIndex);
    
    // Create Swiss groups
    const swissGroups = makeSwissGroups(managerIds, groupSize, wasTogether);
    
    // Save appearances
    const groups: Group[] = [];
    for (let groupIndex = 0; groupIndex < swissGroups.length; groupIndex++) {
      const group = swissGroups[groupIndex];
      groups.push({
        groupIndex,
        memberIds: group
      });
      
      for (const managerId of group) {
        sqlite.insert('appearances', {
          tournament_id: tournamentId,
          boss_id: bossId,
          round_index: roundIndex,
          group_index: groupIndex,
          manager_id: managerId
        });
      }
    }
    
    return NextResponse.json({ groups });
    
  } catch (error) {
    console.error('Groups error:', error);
    return NextResponse.json(
      { error: 'Failed to create groups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}