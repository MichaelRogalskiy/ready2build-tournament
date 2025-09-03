import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase, seedBosses } from '@/lib/db';
import { Manager, Tournament } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const csvFile = formData.get('csv') as File | string;
    const rounds = Number(formData.get('rounds') || 3);
    const groupSize = Number(formData.get('groupSize') || 5);
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Initialize database schema
    await initDatabase();
    
    // Seed bosses
    const bosses = await seedBosses();
    
    // Create tournament
    const tournamentResult = await sql<Tournament>`
      INSERT INTO tournaments (title, rounds, group_size)
      VALUES (${title}, ${rounds}, ${groupSize})
      RETURNING *
    `;
    const tournament = tournamentResult.rows[0];
    
    // Parse CSV
    let csvContent: string;
    if (typeof csvFile === 'string') {
      csvContent = csvFile;
    } else {
      csvContent = await csvFile.text();
    }
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Expected headers
    const expectedHeaders = ['ИНН', 'ФИО', 'ІПН лида', 'Лид для джира', 'Категория персонала'];
    
    // Map headers to indices
    const headerMap: { [key: string]: number } = {};
    expectedHeaders.forEach(expectedHeader => {
      const index = headers.findIndex(h => h === expectedHeader);
      if (index !== -1) {
        headerMap[expectedHeader] = index;
      }
    });
    
    // Process managers
    const managers: Manager[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const fio = values[headerMap['ФИО']] || '';
      if (!fio) continue; // Skip empty rows
      
      const managerResult = await sql<Manager>`
        INSERT INTO managers (inn, fio, lead_tin, lead_for_jira, staff_category)
        VALUES (
          ${values[headerMap['ИНН']] || null},
          ${fio},
          ${values[headerMap['ІПН лида']] || null},
          ${values[headerMap['Лид для джира']] || null},
          ${values[headerMap['Категория персонала']] || null}
        )
        RETURNING *
      `;
      
      managers.push(managerResult.rows[0]);
    }
    
    return NextResponse.json({
      tournamentId: tournament.id,
      managersCount: managers.length,
      bossesCount: bosses.length,
      message: `Tournament "${title}" created with ${managers.length} managers and ${bosses.length} bosses`
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}