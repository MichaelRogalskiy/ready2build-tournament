export function makeSwissGroups(
  orderedManagerIds: string[],
  groupSize = 5,
  wasTogether: (a: string, b: string) => boolean
): string[][] {
  const groups: string[][] = [];
  
  // Initial grouping: slice ordered list into groups
  for (let i = 0; i < orderedManagerIds.length; i += groupSize) {
    groups.push(orderedManagerIds.slice(i, Math.min(i + groupSize, orderedManagerIds.length)));
  }
  
  // Try to fix groups with repeat opponents
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    if (isGroupValid(group, wasTogether)) continue;
    
    // Try swaps with neighboring groups
    for (const gj of [gi - 1, gi + 1]) {
      if (gj < 0 || gj >= groups.length) continue;
      if (tryLocalSwap(groups[gi], groups[gj], wasTogether)) {
        break;
      }
    }
  }
  
  return groups;
}

function isGroupValid(group: string[], wasTogether: (a: string, b: string) => boolean): boolean {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      if (wasTogether(group[i], group[j])) {
        return false;
      }
    }
  }
  return true;
}

function tryLocalSwap(
  groupA: string[],
  groupB: string[],
  wasTogether: (a: string, b: string) => boolean
): boolean {
  // Try swapping each member of A with each member of B
  for (let ai = 0; ai < groupA.length; ai++) {
    for (let bi = 0; bi < groupB.length; bi++) {
      // Temporarily swap
      const tempA = groupA[ai];
      groupA[ai] = groupB[bi];
      groupB[bi] = tempA;
      
      // Check if both groups are now valid
      if (isGroupValid(groupA, wasTogether) && isGroupValid(groupB, wasTogether)) {
        return true; // Keep the swap
      }
      
      // Revert swap
      groupB[bi] = groupA[ai];
      groupA[ai] = tempA;
    }
  }
  
  return false;
}

export async function getWasTogetherFunction(
  tournamentId: string,
  bossId: string,
  currentRound: number
): Promise<(a: string, b: string) => boolean> {
  const { sql } = await import('./db');
  
  // Get all previous appearances for this boss in this tournament
  const result = await sql`
    SELECT DISTINCT a1.manager_id as m1, a2.manager_id as m2
    FROM appearances a1
    JOIN appearances a2 ON 
      a1.tournament_id = a2.tournament_id AND
      a1.boss_id = a2.boss_id AND
      a1.round_index = a2.round_index AND
      a1.group_index = a2.group_index AND
      a1.manager_id < a2.manager_id
    WHERE 
      a1.tournament_id = ${tournamentId} AND
      a1.boss_id = ${bossId} AND
      a1.round_index < ${currentRound}
  `;
  
  const pairs = new Set<string>();
  for (const row of result.rows) {
    pairs.add(`${row.m1}|${row.m2}`);
    pairs.add(`${row.m2}|${row.m1}`);
  }
  
  return (a: string, b: string) => pairs.has(`${a}|${b}`);
}