import { NextRequest, NextResponse } from 'next/server';
import { sqlite, initDatabase, seedBosses } from '@/lib/db-sqlite';
import { Manager, Tournament } from '@/lib/types';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCSV } from '@/lib/csv';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Seed endpoint called ===');
    
    console.log('Using SQLite file-based database');
    
    // Parse request body - now only need title, rounds, groupSize
    const body = await request.json();
    console.log('Request body:', body);
    
    const title = body.title;
    const rounds = Number(body.rounds || 3);
    const groupSize = Number(body.groupSize || 5);
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    console.log('Initializing database...');
    // Initialize database schema
    await initDatabase();
    console.log('Database initialized successfully');
    
    console.log('Seeding bosses...');
    // Seed bosses
    const bosses = await seedBosses();
    console.log('Bosses seeded:', bosses.length);
    
    console.log('Creating tournament...');
    // Create tournament
    const tournamentResult = sqlite.insert('tournaments', {
      title,
      rounds,
      group_size: groupSize
    });
    const tournament = tournamentResult.rows[0] as Tournament;
    console.log('Tournament created:', tournament.id);
    
    // Read CSV from local file
    const csvPath = path.join(process.cwd(), 'List of managers.csv');
    console.log('Reading CSV from:', csvPath);
    let csvContent: string;
    
    try {
      csvContent = await fs.readFile(csvPath, 'utf-8');
      console.log('CSV file read successfully, size:', csvContent.length, 'characters');
    } catch (error) {
      console.error('Error reading CSV file:', error);
      return NextResponse.json(
        { error: `CSV file not found at ${csvPath}. Make sure "List of managers.csv" exists in project root.` },
        { status: 400 }
      );
    }
    
    const csvRows = parseCSV(csvContent);
    console.log('CSV rows found:', csvRows.length);
    
    if (csvRows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      );
    }
    
    const headers = csvRows[0].map(h => h.trim());
    console.log('CSV headers:', headers);
    
    // Expected headers
    const expectedHeaders = ['ИНН', 'ФИО', 'ІПН лида', 'Лид для джира', 'Категория персонала'];
    
    // Map headers to indices
    const headerMap: { [key: string]: number } = {};
    expectedHeaders.forEach(expectedHeader => {
      const index = headers.findIndex(h => h === expectedHeader);
      if (index !== -1) {
        headerMap[expectedHeader] = index;
      } else {
        console.log(`Header "${expectedHeader}" not found in CSV`);
      }
    });
    console.log('Header mapping:', headerMap);
    
    // Process managers
    console.log('Processing managers...');
    const managers: Manager[] = [];
    for (let i = 1; i < csvRows.length; i++) {
      const values = csvRows[i].map(v => v.trim());
      
      const fio = values[headerMap['ФИО']] || '';
      if (!fio) {
        console.log(`Skipping row ${i}: no ФИО`);
        continue;
      }
      
      console.log(`Processing manager ${i}: ${fio}`);
      
      try {
        const managerResult = sqlite.insert('managers', {
          inn: values[headerMap['ИНН']] || null,
          fio,
          lead_tin: values[headerMap['ІПН лида']] || null,
          lead_for_jira: values[headerMap['Лид для джира']] || null,
          staff_category: values[headerMap['Категория персонала']] || null
        });
        
        managers.push(managerResult.rows[0] as Manager);
      } catch (error) {
        console.error(`Error inserting manager ${fio}:`, error);
        throw error;
      }
    }
    
    console.log('Managers processed:', managers.length);
    
    return NextResponse.json({
      tournamentId: tournament.id,
      managersCount: managers.length,
      bossesCount: bosses.length,
      message: `Tournament "${title}" created with ${managers.length} managers and ${bosses.length} bosses`
    });
    
  } catch (error) {
    console.error('=== SEED ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_') || error.message.includes('database')) {
        return NextResponse.json({
          error: 'SQLite database error',
          details: error.message,
          suggestion: 'Check SQLite database file permissions and structure'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}