import { sql } from './db';
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
    await sql`
      INSERT INTO scores (
        tournament_id, boss_id, manager_id, round_index,
        points, wins, losses, top1_count, top2_count, bottom1_count
      ) VALUES (
        ${tournamentId}, ${bossId}, ${managerId}, ${roundIndex},
        ${score.points}, ${score.wins}, ${score.losses},
        ${score.isTop1 ? 1 : 0}, ${score.isTop2 ? 1 : 0}, ${score.isBottom1 ? 1 : 0}
      )
      ON CONFLICT (tournament_id, boss_id, manager_id, round_index)
      DO UPDATE SET
        points = EXCLUDED.points,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        top1_count = EXCLUDED.top1_count,
        top2_count = EXCLUDED.top2_count,
        bottom1_count = EXCLUDED.bottom1_count
    `;
  }
}

export async function getManagerScoresForBoss(
  tournamentId: string,
  bossId: string
): Promise<ManagerScore[]> {
  const result = await sql`
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
      s.tournament_id = ${tournamentId} AND
      s.boss_id = ${bossId}
    GROUP BY m.id, m.fio
    ORDER BY points DESC, wins DESC, losses ASC
  `;
  
  return result.rows.map(row => ({
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
  const result = await sql`
    WITH boss_scores AS (
      SELECT 
        s.manager_id,
        s.boss_id,
        SUM(s.points) as total_points,
        SUM(s.top1_count) as top1_count,
        SUM(s.bottom1_count) as bottom1_count
      FROM scores s
      WHERE s.tournament_id = ${tournamentId}
      GROUP BY s.manager_id, s.boss_id
    ),
    aggregated AS (
      SELECT 
        m.id as manager_id,
        m.fio,
        AVG(bs.total_points) as avg_points,
        STDDEV(bs.total_points) as stability,
        SUM(bs.top1_count) as top1_total,
        SUM(bs.bottom1_count) as bottom1_total
      FROM managers m
      LEFT JOIN boss_scores bs ON bs.manager_id = m.id
      GROUP BY m.id, m.fio
    )
    SELECT * FROM aggregated
    ORDER BY avg_points DESC, stability ASC, top1_total DESC, bottom1_total ASC
  `;
  
  return result.rows.map(row => ({
    managerId: row.manager_id,
    fio: row.fio,
    avgPoints: Number(row.avg_points) || 0,
    stability: Number(row.stability) || 0,
    top1Total: Number(row.top1_total) || 0,
    bottom1Total: Number(row.bottom1_total) || 0,
    tiebreak: {
      sos: 0, // Strength of schedule - to be calculated
      h2h: 0, // Head to head - to be calculated
      top1: Number(row.top1_total) || 0,
      bottom1: Number(row.bottom1_total) || 0
    }
  }));
}