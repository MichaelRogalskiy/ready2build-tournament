'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BOSSES = [
  'Михайло Рогальський',
  'Олег Гороховський',
  'Олександр Дубілет',
  'Вадім Ковальов'
];

export default function Home() {
  const [selectedBoss, setSelectedBoss] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (selectedBoss && tournamentId) {
      localStorage.setItem('selectedBoss', selectedBoss);
      localStorage.setItem('tournamentId', tournamentId);
      router.push('/play');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">🏆 Tournament Ranking System</h1>
        <p className="subtitle">Swiss-турнір для оцінювання менеджерів</p>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="tournament" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            ID турніру:
          </label>
          <input
            id="tournament"
            type="text"
            className="select"
            placeholder="Введіть ID турніру"
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="boss" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            Я — бос:
          </label>
          <select
            id="boss"
            className="select"
            value={selectedBoss}
            onChange={(e) => setSelectedBoss(e.target.value)}
          >
            <option value="">Оберіть себе</option>
            {BOSSES.map((boss) => (
              <option key={boss} value={boss}>
                {boss}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ background: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📖 Як це працює:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>✅ 3 раунди оцінювання</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ На кожному екрані — 5 менеджерів</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ Обираєте Top-1, Top-2 та Bottom-1</li>
            <li style={{ marginBottom: '0.5rem' }}>✅ Swiss-система: сильні з сильними</li>
            <li>✅ Після завершення — зведений рейтинг</li>
          </ul>
        </div>
        
        <button
          className="button"
          onClick={handleStart}
          disabled={!selectedBoss || !tournamentId}
          style={{ width: '100%' }}
        >
          Почати оцінювання
        </button>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🚀 Адмін: Створити новий турнір</h2>
        <a href="/admin" className="button secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Перейти до адмін-панелі
        </a>
      </div>
    </div>
  );
}