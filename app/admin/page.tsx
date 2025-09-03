'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [title, setTitle] = useState('');
  const [rounds, setRounds] = useState(3);
  const [groupSize, setGroupSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tournamentId: string; managersCount: number; bossesCount: number; message: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      setError('Будь ласка, введіть назву турніру');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          rounds,
          groupSize
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setTitle('');
      } else {
        setError(data.error || 'Помилка створення турніру');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Помилка з\'єднання з сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">🔧 Адмін панель</h1>
        <p className="subtitle">Створення нового турніру</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Назва турніру:
            </label>
            <input
              id="title"
              type="text"
              className="select"
              placeholder="Наприклад: Монобанк — Оцінювання менеджерів, осінь 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div style={{ 
            background: '#e3f2fd', 
            color: '#1565c0', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem' 
          }}>
            <h4 style={{ marginBottom: '0.5rem' }}>📄 Файл менеджерів</h4>
            <p style={{ fontSize: '0.9rem' }}>
              Використовується файл <strong>&quot;List of managers.csv&quot;</strong> з корневої директорії проекту.
              <br />
              <small>Колонки: ИНН, ФИО, ІПН лида, Лид для джира, Категория персонала</small>
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label htmlFor="rounds" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Кількість раундів:
              </label>
              <input
                id="rounds"
                type="number"
                className="select"
                min="1"
                max="10"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
            </div>
            
            <div>
              <label htmlFor="groupSize" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Розмір групи:
              </label>
              <input
                id="groupSize"
                type="number"
                className="select"
                min="3"
                max="10"
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
              />
            </div>
          </div>
          
          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem' 
            }}>
              {error}
            </div>
          )}
          
          {result && (
            <div style={{ 
              background: '#e8f5e9', 
              color: '#2e7d32', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1rem' 
            }}>
              <h3>✅ Турнір створено успішно!</h3>
              <p><strong>ID турніру:</strong> {result.tournamentId}</p>
              <p><strong>Менеджерів:</strong> {result.managersCount}</p>
              <p><strong>Босів:</strong> {result.bossesCount}</p>
              <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #66bb6a' }} />
              <p style={{ fontSize: '0.9rem' }}>
                Поділіться цим ID з босами для початку оцінювання
              </p>
            </div>
          )}
          
          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Створення турніру...' : 'Створити турнір'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem' }}>📋 Інструкція:</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Переконайтеся, що файл &quot;List of managers.csv&quot; є в корені проекту</li>
            <li style={{ marginBottom: '0.5rem' }}>Введіть назву турніру</li>
            <li style={{ marginBottom: '0.5rem' }}>Налаштуйте кількість раундів та розмір груп</li>
            <li style={{ marginBottom: '0.5rem' }}>Створіть турнір - менеджери завантажуються автоматично</li>
            <li>Боси зможуть одразу почати оцінювання на головній сторінці</li>
          </ol>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/" className="button secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Повернутися на головну
        </Link>
      </div>
    </div>
  );
}