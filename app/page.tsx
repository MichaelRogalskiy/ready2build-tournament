'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BOSSES = [
  'Михайло Рогальський',
  'Олег Гороховський',
  'Олександр Дубілет',
  'Вадім Ковальов'
];

export default function Home() {
  const [selectedBoss, setSelectedBoss] = useState('');
  const [tournament, setTournament] = useState<{ id: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadLatestTournament();
  }, []);

  const loadLatestTournament = async () => {
    try {
      const response = await fetch('/api/tournaments/latest');
      if (response.ok) {
        const data = await response.json();
        setTournament(data);
      } else {
        setError('Турнір не знайдено. Створіть новий турнір через адмін-панель.');
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      setError('Помилка завантаження турніру.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (selectedBoss && tournament) {
      localStorage.setItem('selectedBoss', selectedBoss);
      localStorage.setItem('tournamentId', tournament.id);
      router.push('/play');
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">🏆 Tournament Ranking System</h1>
        <p className="subtitle">Swiss-турнір для оцінювання менеджерів</p>
        
        {loading && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p>Завантаження турніру...</p>
          </div>
        )}
        
        {error && (
          <div style={{ 
            background: '#ffebee', 
            color: '#c62828', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem' 
          }}>
            {error}
          </div>
        )}
        
        {tournament && (
          <div style={{ 
            background: '#e8f5e9', 
            color: '#2e7d32', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem' 
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>📋 Поточний турнір:</h3>
            <p><strong>{tournament.title}</strong></p>
            <small>ID: {tournament.id}</small>
          </div>
        )}
        
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
          disabled={!selectedBoss || !tournament || loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Завантаження...' : 'Почати оцінювання'}
        </button>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>🚀 Адмін: Створити новий турнір</h2>
        <Link href="/admin" className="button secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Перейти до адмін-панелі
        </Link>
      </div>
    </div>
  );
}