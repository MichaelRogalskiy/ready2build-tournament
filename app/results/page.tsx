'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ManagerScore {
  managerId: string;
  fio: string;
  avgPoints: number;
  stability: number;
  top1Total: number;
  bottom1Total: number;
}

interface BossScores {
  bossId: string;
  bossName: string;
  items: Array<{
    managerId: string;
    fio: string;
    points: number;
    wins: number;
    losses: number;
    top1Count: number;
    top2Count: number;
    bottom1Count: number;
  }>;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  
  const [aggregateScores, setAggregateScores] = useState<ManagerScore[]>([]);
  const [bossScores, setBossScores] = useState<BossScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aggregate');

  useEffect(() => {
    if (tournamentId) {
      loadScores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const loadScores = async () => {
    try {
      const response = await fetch(`/api/scores?tournamentId=${tournamentId}`);
      const data = await response.json();
      setAggregateScores(data.aggregate || []);
      setBossScores(data.perBoss || []);
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    window.open(`/api/export?tournamentId=${tournamentId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="title">Завантаження результатів...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">🏆 Результати турніру</h1>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className={`button ${activeTab === 'aggregate' ? '' : 'secondary'}`}
            onClick={() => setActiveTab('aggregate')}
          >
            Загальний рейтинг
          </button>
          <button
            className={`button ${activeTab === 'bosses' ? '' : 'secondary'}`}
            onClick={() => setActiveTab('bosses')}
          >
            По босах
          </button>
          <button
            className="button secondary"
            onClick={exportCsv}
            style={{ marginLeft: 'auto' }}
          >
            📥 Експорт CSV
          </button>
        </div>

        {activeTab === 'aggregate' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Загальний рейтинг</h2>
            <table className="results-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Менеджер</th>
                  <th>Середній бал</th>
                  <th>Стабільність</th>
                  <th>Top-1</th>
                  <th>Bottom-1</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {aggregateScores.map((score, index) => (
                  <tr key={score.managerId}>
                    <td>{index + 1}</td>
                    <td>{score.fio}</td>
                    <td>{score.avgPoints.toFixed(2)}</td>
                    <td>{score.stability.toFixed(2)}</td>
                    <td>{score.top1Total}</td>
                    <td>{score.bottom1Total}</td>
                    <td>
                      {score.top1Total >= 3 && <span className="badge top1">TOP</span>}
                      {score.bottom1Total >= 3 && <span className="badge bottom1">NEEDS IMPROVEMENT</span>}
                      {score.stability > 1.5 && <span className="badge polarizing">POLARIZING</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bosses' && (
          <div>
            {bossScores.map((boss) => (
              <div key={boss.bossId} style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>{boss.bossName}</h3>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Менеджер</th>
                      <th>Бали</th>
                      <th>Перемоги</th>
                      <th>Поразки</th>
                      <th>Top-1</th>
                      <th>Top-2</th>
                      <th>Bottom-1</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boss.items.map((item, index) => (
                      <tr key={item.managerId}>
                        <td>{index + 1}</td>
                        <td>{item.fio}</td>
                        <td>{item.points}</td>
                        <td>{item.wins}</td>
                        <td>{item.losses}</td>
                        <td>{item.top1Count}</td>
                        <td>{item.top2Count}</td>
                        <td>{item.bottom1Count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/" className="button secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Повернутися на головну
        </Link>
      </div>
    </div>
  );
}