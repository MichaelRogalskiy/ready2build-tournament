import { sql } from '@vercel/postgres';
import { Boss, Manager, Tournament } from './types';

export async function initDatabase() {
  const schemaSQL = `
    -- Босси (оцінювачі)
    create table if not exists bosses (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      email text unique,
      token text unique,
      created_at timestamptz default now()
    );

    -- Менеджери (з CSV)
    create table if not exists managers (
      id uuid primary key default gen_random_uuid(),
      inn text,
      fio text not null,
      lead_tin text,
      lead_for_jira text,
      staff_category text,
      created_at timestamptz default now()
    );

    -- Турнір (налаштування)
    create table if not exists tournaments (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      rounds int not null default 3,
      group_size int not null default 5,
      created_at timestamptz default now()
    );

    -- Участі менеджерів у групах (щоб відслідковувати повтори)
    create table if not exists appearances (
      id uuid primary key default gen_random_uuid(),
      tournament_id uuid references tournaments(id),
      boss_id uuid references bosses(id),
      round_index int not null,
      group_index int not null,
      manager_id uuid references managers(id)
    );

    -- Вибори на екрані (Top1/Top2/Bottom1)
    create table if not exists picks (
      id uuid primary key default gen_random_uuid(),
      tournament_id uuid references tournaments(id),
      boss_id uuid references bosses(id),
      round_index int not null,
      group_index int not null,
      top1 uuid references managers(id),
      top2 uuid references managers(id),
      bottom1 uuid references managers(id),
      decided_at timestamptz default now(),
      latency_ms int
    );

    -- Похідні пораховані метрики (денормалізовано для простоти)
    create table if not exists scores (
      tournament_id uuid,
      boss_id uuid,
      manager_id uuid,
      round_index int,
      points int,
      wins int,
      losses int,
      top1_count int,
      top2_count int,
      bottom1_count int,
      primary key (tournament_id, boss_id, manager_id, round_index)
    );
  `;

  const statements = schemaSQL
    .split(';')
    .filter(s => s.trim())
    .map(s => s.trim() + ';');

  for (const statement of statements) {
    await sql.query(statement);
  }
}

export async function seedBosses(): Promise<Boss[]> {
  const bossNames = [
    'Михайло Рогальський',
    'Олег Гороховський',
    'Олександр Дубілет',
    'Вадім Ковальов'
  ];

  const bosses: Boss[] = [];
  
  for (const name of bossNames) {
    const result = await sql<Boss>`
      INSERT INTO bosses (name)
      VALUES (${name})
      ON CONFLICT (name) DO NOTHING
      RETURNING *
    `;
    
    if (result.rows.length > 0) {
      bosses.push(result.rows[0]);
    } else {
      const existing = await sql<Boss>`
        SELECT * FROM bosses WHERE name = ${name}
      `;
      if (existing.rows.length > 0) {
        bosses.push(existing.rows[0]);
      }
    }
  }
  
  return bosses;
}

export { sql };