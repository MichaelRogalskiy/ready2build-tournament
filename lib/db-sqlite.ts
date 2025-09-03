import Database from 'better-sqlite3';
import path from 'path';
import { Boss } from './types';

let db: Database.Database;

function initDB() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'tournament.db');
    
    // Ensure data directory exists
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    console.log('SQLite database initialized at:', dbPath);
  }
  return db;
}

export async function initDatabase() {
  console.log('Starting SQLite database initialization...');
  const database = initDB();

  const createTables = `
    -- Босси (оцінювачі)
    CREATE TABLE IF NOT EXISTS bosses (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      name TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Менеджери (з CSV)
    CREATE TABLE IF NOT EXISTS managers (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      inn TEXT,
      fio TEXT NOT NULL,
      lead_tin TEXT,
      lead_for_jira TEXT,
      staff_category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Турнір (налаштування)
    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      title TEXT NOT NULL,
      rounds INTEGER NOT NULL DEFAULT 3,
      group_size INTEGER NOT NULL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Участі менеджерів у групах (щоб відслідковувати повтори)
    CREATE TABLE IF NOT EXISTS appearances (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      tournament_id TEXT REFERENCES tournaments(id),
      boss_id TEXT REFERENCES bosses(id),
      round_index INTEGER NOT NULL,
      group_index INTEGER NOT NULL,
      manager_id TEXT REFERENCES managers(id)
    );

    -- Вибори на екрані (Top1/Top2/Bottom1)
    CREATE TABLE IF NOT EXISTS picks (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      tournament_id TEXT REFERENCES tournaments(id),
      boss_id TEXT REFERENCES bosses(id),
      round_index INTEGER NOT NULL,
      group_index INTEGER NOT NULL,
      top1 TEXT REFERENCES managers(id),
      top2 TEXT REFERENCES managers(id),
      bottom1 TEXT REFERENCES managers(id),
      decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      latency_ms INTEGER
    );

    -- Похідні пораховані метрики (денормалізовано для простоти)
    CREATE TABLE IF NOT EXISTS scores (
      tournament_id TEXT,
      boss_id TEXT,
      manager_id TEXT,
      round_index INTEGER,
      points INTEGER,
      wins INTEGER,
      losses INTEGER,
      top1_count INTEGER,
      top2_count INTEGER,
      bottom1_count INTEGER,
      PRIMARY KEY (tournament_id, boss_id, manager_id, round_index)
    );
  `;

  // Execute all table creation statements
  const statements = createTables
    .split(';')
    .filter(s => s.trim())
    .map(s => s.trim());

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}`);
    try {
      database.exec(statement);
    } catch (error) {
      console.error(`Error executing statement ${i + 1}:`, error);
      console.error('Statement was:', statement);
      throw error;
    }
  }

  console.log('SQLite database initialization completed successfully');
}

export async function seedBosses(): Promise<Boss[]> {
  const bossNames = [
    'Михайло Рогальський',
    'Олег Гороховський',
    'Олександр Дубілет',
    'Вадим Ковальов'
  ];

  console.log('Seeding bosses:', bossNames);
  const database = initDB();
  const bosses: Boss[] = [];

  const insertStmt = database.prepare(`
    INSERT OR IGNORE INTO bosses (name) VALUES (?)
  `);

  const selectStmt = database.prepare(`
    SELECT * FROM bosses WHERE name = ?
  `);

  for (const name of bossNames) {
    console.log(`Processing boss: ${name}`);
    try {
      insertStmt.run(name);
      const boss = selectStmt.get(name) as Boss;
      if (boss) {
        console.log(`Boss processed: ${name}`);
        bosses.push(boss);
      }
    } catch (error) {
      console.error(`Error processing boss ${name}:`, error);
      throw error;
    }
  }

  console.log('Bosses seeded successfully:', bosses.length);
  return bosses;
}

// SQLite query functions to replace Vercel Postgres sql`` template
export const sqlite = {
  query: (sql: string, params: unknown[] = []) => {
    const database = initDB();
    try {
      if (sql.trim().toLowerCase().startsWith('select')) {
        const stmt = database.prepare(sql);
        const rows = stmt.all(params);
        return { rows };
      } else {
        const stmt = database.prepare(sql);
        const result = stmt.run(params);
        return { 
          rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [],
          rowsAffected: result.changes 
        };
      }
    } catch (error) {
      console.error('SQLite query error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  },

  insert: (table: string, data: Record<string, unknown>) => {
    const database = initDB();
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const stmt = database.prepare(sql);
    const result = stmt.get(values);
    return { rows: result ? [result] : [] };
  },

  select: (table: string, where?: Record<string, unknown>, orderBy?: string) => {
    const database = initDB();
    let sql = `SELECT * FROM ${table}`;
    const params: unknown[] = [];
    
    if (where) {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params.push(...Object.values(where));
    }
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    const stmt = database.prepare(sql);
    const rows = stmt.all(params);
    return { rows };
  }
};

export { initDB };