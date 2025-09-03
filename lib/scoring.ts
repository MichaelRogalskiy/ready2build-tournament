import { sqlite } from './db-sqlite';
import { ManagerScore } from './types';

export interface PickScores {
  [managerId: string]: {
    points: number;
    wins: number;
    losses: number;
    isTop1: boolean;
    isTop2: boolean;
    isBottom1: boolean;
  };
}

export function calculatePickScores(
  top1: string,
  top2: string,
  bottom1: string,
  allManagerIds: string[]
): PickScores {
  const scores: PickScores = {};
  
  // Initialize all managers
  for (const id of allManagerIds) {
    scores[id] = {
      points: 0,
      wins: 0,
      losses: 0,
      isTop1: false,
      isTop2: false,
      isBottom1: false
    };
  }
  
  // Find middle managers (not top1, top2, or bottom1)
  const middleManagers = allManagerIds.filter(
    id => id !== top1 && id !== top2 && id !== bottom1
  );
  
  // Top-1: +2 points, wins against all others (4 wins)
  scores[top1].points = 2;
  scores[top1].wins = 4;
  scores[top1].isTop1 = true;
  
  // Top-2: +1 point, wins against middle and bottom (3 wins), loses to top1 (1 loss)
  scores[top2].points = 1;
  scores[top2].wins = 3;
  scores[top2].losses = 1;
  scores[top2].isTop2 = true;
  
  // Bottom-1: -1 point, loses to all (4 losses)
  scores[bottom1].points = -1;
  scores[bottom1].losses = 4;
  scores[bottom1].isBottom1 = true;
  
  // Middle managers: 0 points, win against bottom (1 win), lose to top1 and top2 (2 losses)
  for (const mid of middleManagers) {
    scores[mid].points = 0;
    scores[mid].wins = 1;
    scores[mid].losses = 2;
  }
  
  return scores;
}

export async function updateScores(
  tournamentId: string,
  bossId: string,
  roundIndex: number,
  pickScores: PickScores
) {
  for (const [managerId, score] of Object.entries(pickScores)) {
    // SQLite doesn't have ON CONFLICT with DO UPDATE, use INSERT OR REPLACE
    sqlite.query(`
      INSERT OR REPLACE INTO scores (
        tournament_id, boss_id, manager_id, round_index,
        points, wins, losses, top1_count, top2_count, bottom1_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tournamentId, bossId, managerId, roundIndex,
      score.points, score.wins, score.losses,
      score.isTop1 ? 1 : 0, score.isTop2 ? 1 : 0, score.isBottom1 ? 1 : 0
    ]);
  }
}

export async function getManagerScoresForBoss(
  tournamentId: string,
  bossId: string
): Promise<ManagerScore[]> {
  const result = sqlite.query(`
    SELECT 
      m.id as manager_id,
      m.fio,
      COALESCE(SUM(s.points), 0) as points,
      COALESCE(SUM(s.wins), 0) as wins,
      COALESCE(SUM(s.losses), 0) as losses,
      COALESCE(SUM(s.top1_count), 0) as top1_count,
      COALESCE(SUM(s.top2_count), 0) as top2_count,
      COALESCE(SUM(s.bottom1_count), 0) as bottom1_count
    FROM managers m
    LEFT JOIN scores s ON 
      s.manager_id = m.id AND 
      s.tournament_id = ? AND
      s.boss_id = ?
    GROUP BY m.id, m.fio
    ORDER BY points DESC, wins DESC, losses ASC
  `, [tournamentId, bossId]);
  
  return (result.rows as {manager_id: string, fio: string, points: number, wins: number, losses: number, top1_count: number, top2_count: number, bottom1_count: number}[]).map((row) => ({
    managerId: row.manager_id,
    fio: row.fio,
    points: Number(row.points),
    wins: Number(row.wins),
    losses: Number(row.losses),
    top1Count: Number(row.top1_count),
    top2Count: Number(row.top2_count),
    bottom1Count: Number(row.bottom1_count)
  }));
}

export async function calculateAggregateScores(tournamentId: string) {
  // SQLite doesn't support STDDEV, we'll calculate it manually
  // First get boss scores
  const bossScoresResult = sqlite.query(`
    SELECT 
      s.manager_id,
      s.boss_id,
      SUM(s.points) as total_points,
      SUM(s.top1_count) as top1_count,
      SUM(s.bottom1_count) as bottom1_count
    FROM scores s
    WHERE s.tournament_id = ?
    GROUP BY s.manager_id, s.boss_id
  `, [tournamentId]);

  // Group by manager and calculate aggregated scores
  const managerScores: { [key: string]: {totalPoints: number[], top1Total: number, bottom1Total: number} } = {};
  
  for (const row of (bossScoresResult.rows as {manager_id: string, boss_id: string, total_points: number, top1_count: number, bottom1_count: number}[])) {
    const managerId = row.manager_id;
    if (!managerScores[managerId]) {
      managerScores[managerId] = {
        totalPoints: [],
        top1Total: 0,
        bottom1Total: 0
      };
    }
    
    managerScores[managerId].totalPoints.push(Number(row.total_points));
    managerScores[managerId].top1Total += Number(row.top1_count);
    managerScores[managerId].bottom1Total += Number(row.bottom1_count);
  }

  // Get all managers with their FIO
  const managersResult = sqlite.query('SELECT id, fio FROM managers');
  
  const aggregatedScores = (managersResult.rows as {id: string, fio: string}[]).map(manager => {
    const scores = managerScores[manager.id];
    let avgPoints = 0;
    let stability = 0;
    
    if (scores && scores.totalPoints.length > 0) {
      avgPoints = scores.totalPoints.reduce((a: number, b: number) => a + b, 0) / scores.totalPoints.length;
      
      // Calculate standard deviation manually
      if (scores.totalPoints.length > 1) {
        const variance = scores.totalPoints.reduce((acc: number, val: number) => {
          return acc + Math.pow(val - avgPoints, 2);
        }, 0) / scores.totalPoints.length;
        stability = Math.sqrt(variance);
      }
    }
    
    return {
      managerId: manager.id,
      fio: manager.fio,
      avgPoints,
      stability,
      top1Total: scores ? scores.top1Total : 0,
      bottom1Total: scores ? scores.bottom1Total : 0,
      tiebreak: {
        sos: 0, // Strength of schedule - to be calculated
        h2h: 0, // Head to head - to be calculated
        top1: scores ? scores.top1Total : 0,
        bottom1: scores ? scores.bottom1Total : 0
      }
    };
  });

  // Sort by average points descending, then stability ascending, etc.
  return aggregatedScores.sort((a, b) => {
    if (a.avgPoints !== b.avgPoints) return b.avgPoints - a.avgPoints;
    if (a.stability !== b.stability) return a.stability - b.stability;
    if (a.top1Total !== b.top1Total) return b.top1Total - a.top1Total;
    return a.bottom1Total - b.bottom1Total;
  });
}