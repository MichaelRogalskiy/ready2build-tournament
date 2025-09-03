export interface Boss {
  id: string;
  name: string;
  email?: string;
  token?: string;
  created_at: Date;
}

export interface Manager {
  id: string;
  inn?: string;
  fio: string;
  lead_tin?: string;
  lead_for_jira?: string;
  staff_category?: string;
  created_at: Date;
}

export interface Tournament {
  id: string;
  title: string;
  rounds: number;
  group_size: number;
  created_at: Date;
}

export interface Appearance {
  id: string;
  tournament_id: string;
  boss_id: string;
  round_index: number;
  group_index: number;
  manager_id: string;
}

export interface Pick {
  id: string;
  tournament_id: string;
  boss_id: string;
  round_index: number;
  group_index: number;
  top1: string;
  top2: string;
  bottom1: string;
  decided_at: Date;
  latency_ms?: number;
}

export interface Score {
  tournament_id: string;
  boss_id: string;
  manager_id: string;
  round_index: number;
  points: number;
  wins: number;
  losses: number;
  top1_count: number;
  top2_count: number;
  bottom1_count: number;
}

export interface Group {
  groupIndex: number;
  memberIds: string[];
}

export interface ManagerScore {
  managerId: string;
  fio: string;
  points: number;
  wins: number;
  losses: number;
  top1Count: number;
  top2Count: number;
  bottom1Count: number;
}

export interface AggregateScore {
  managerId: string;
  fio: string;
  avgPoints: number;
  stability: number;
  top1Total: number;
  bottom1Total: number;
  tiebreak: {
    sos: number;
    h2h: number;
    top1: number;
    bottom1: number;
  };
}