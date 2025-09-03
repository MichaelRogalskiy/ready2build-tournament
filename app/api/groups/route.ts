import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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
    const existingGroups = await sql`
      SELECT DISTINCT group_index, manager_id
      FROM appearances
      WHERE 
        tournament_id = ${tournamentId} AND
        boss_id = ${bossId} AND
        round_index = ${roundIndex}
      ORDER BY group_index, manager_id
    `;
    
    if (existingGroups.rows.length > 0) {
      // Return existing groups
      const groups: Group[] = [];
      let currentGroup: Group | null = null;
      
      for (const row of existingGroups.rows) {
        if (!currentGroup || currentGroup.groupIndex !== row.group_index) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = {
            groupIndex: row.group_index,
            memberIds: []
          };
        }
        currentGroup.memberIds.push(row.manager_id);
      }
      if (currentGroup) groups.push(currentGroup);
      
      return NextResponse.json({ groups });
    }
    
    // Get tournament settings
    const tournamentResult = await sql`
      SELECT group_size FROM tournaments WHERE id = ${tournamentId}
    `;
    const groupSize = tournamentResult.rows[0]?.group_size || 5;
    
    // Get all managers
    let managerIds: string[];
    
    if (roundIndex === 0) {
      // First round: random order
      const managersResult = await sql`
        SELECT id FROM managers ORDER BY random()
      `;
      managerIds = managersResult.rows.map(r => r.id);
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
        await sql`
          INSERT INTO appearances (tournament_id, boss_id, round_index, group_index, manager_id)
          VALUES (${tournamentId}, ${bossId}, ${roundIndex}, ${groupIndex}, ${managerId})
        `;
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