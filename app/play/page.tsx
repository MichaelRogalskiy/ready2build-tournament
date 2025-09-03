'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Manager {
  id: string;
  fio: string;
  staff_category?: string;
  lead_for_jira?: string;
}

interface Group {
  groupIndex: number;
  memberIds: string[];
}

export default function PlayPage() {
  const router = useRouter();
  const [tournamentId, setTournamentId] = useState('');
  const [selectedBoss, setSelectedBoss] = useState('');
  const [bossId, setBossId] = useState('');
  
  const [currentRound, setCurrentRound] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groups, setGroups] = useState<Group[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [currentManagers, setCurrentManagers] = useState<Manager[]>([]);
  
  const [top1, setTop1] = useState('');
  const [top2, setTop2] = useState('');
  const [bottom1, setBottom1] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const totalRounds = 3;
  const totalGroups = groups.length;
  const completedScreens = currentRound * totalGroups + currentGroupIndex;
  const totalScreens = totalRounds * totalGroups;

  useEffect(() => {
    const storedTournamentId = localStorage.getItem('tournamentId');
    const storedBoss = localStorage.getItem('selectedBoss');
    
    if (!storedTournamentId || !storedBoss) {
      router.push('/');
      return;
    }
    
    setTournamentId(storedTournamentId);
    setSelectedBoss(storedBoss);
    
    // Get boss ID
    fetchBossId(storedBoss);
  }, [router]);

  useEffect(() => {
    if (tournamentId && bossId) {
      loadManagers();
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, bossId, currentRound]);

  useEffect(() => {
    if (groups.length > 0 && managers.length > 0) {
      loadCurrentGroup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, managers, currentGroupIndex]);

  const fetchBossId = async (bossName: string) => {
    try {
      const response = await fetch('/api/bosses');
      const bosses = await response.json();
      const boss = bosses.find((b: { id: string; name: string }) => b.name === bossName);
      if (boss) {
        setBossId(boss.id);
      }
    } catch (error) {
      console.error('Error fetching boss ID:', error);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await fetch('/api/managers');
      const data = await response.json();
      setManagers(data);
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const loadGroups = async () => {
    if (!bossId) return;
    
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          bossId,
          roundIndex: currentRound
        })
      });
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadCurrentGroup = () => {
    const currentGroup = groups[currentGroupIndex];
    if (currentGroup) {
      const groupManagers = currentGroup.memberIds
        .map(id => managers.find(m => m.id === id))
        .filter(Boolean) as Manager[];
      
      // Randomize order for display
      const shuffled = [...groupManagers].sort(() => Math.random() - 0.5);
      setCurrentManagers(shuffled);
      setStartTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    if (!top1 || !top2 || !bottom1) return;
    
    setLoading(true);
    const latencyMs = Date.now() - startTime;
    
    try {
      const response = await fetch('/api/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          bossId,
          roundIndex: currentRound,
          groupIndex: currentGroupIndex,
          top1,
          top2,
          bottom1,
          latencyMs
        })
      });
      
      if (response.ok) {
        // Reset selections
        setTop1('');
        setTop2('');
        setBottom1('');
        
        // Move to next group or round
        if (currentGroupIndex < groups.length - 1) {
          setCurrentGroupIndex(currentGroupIndex + 1);
        } else if (currentRound < totalRounds - 1) {
          setCurrentRound(currentRound + 1);
          setCurrentGroupIndex(0);
          setGroups([]); // Force reload groups for new round
        } else {
          // Tournament complete
          router.push('/results?tournamentId=' + tournamentId);
        }
      }
    } catch (error) {
      console.error('Error submitting pick:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectManager = (managerId: string, type: 'top1' | 'top2' | 'bottom1') => {
    // Clear previous selection of this manager
    if (top1 === managerId) setTop1('');
    if (top2 === managerId) setTop2('');
    if (bottom1 === managerId) setBottom1('');
    
    // Set new selection
    if (type === 'top1') setTop1(managerId);
    if (type === 'top2') setTop2(managerId);
    if (type === 'bottom1') setBottom1(managerId);
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Оцінювання менеджерів</h1>
        <p className="subtitle">
          {selectedBoss} • Раунд {currentRound + 1}/{totalRounds} • Екран {currentGroupIndex + 1}/{totalGroups}
        </p>
        
        <div className="progress">
          <div 
            className="progress-bar" 
            style={{ width: `${(completedScreens / totalScreens) * 100}%` }}
          />
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Оберіть менеджерів:</h3>
          
          {currentManagers.map((manager) => (
            <div
              key={manager.id}
              className={`manager-card ${
                top1 === manager.id ? 'selected-top1' :
                top2 === manager.id ? 'selected-top2' :
                bottom1 === manager.id ? 'selected-bottom1' : ''
              }`}
              onClick={() => {
                if (!top1 || top1 === manager.id) {
                  selectManager(manager.id, 'top1');
                } else if (!top2 || top2 === manager.id) {
                  selectManager(manager.id, 'top2');
                } else if (!bottom1 || bottom1 === manager.id) {
                  selectManager(manager.id, 'bottom1');
                }
              }}
            >
              <div className="manager-name">{manager.fio}</div>
              {manager.staff_category && (
                <div className="manager-category">{manager.staff_category}</div>
              )}
              {top1 === manager.id && <span className="badge top1">TOP 1</span>}
              {top2 === manager.id && <span className="badge top2">TOP 2</span>}
              {bottom1 === manager.id && <span className="badge bottom1">BOTTOM 1</span>}
            </div>
          ))}
        </div>
        
        <div className="selection-controls">
          <div className={`selection-button top1 ${top1 ? 'active' : ''}`}>
            <strong>Top 1</strong>
            <div>{top1 ? currentManagers.find(m => m.id === top1)?.fio : 'Не обрано'}</div>
          </div>
          <div className={`selection-button top2 ${top2 ? 'active' : ''}`}>
            <strong>Top 2</strong>
            <div>{top2 ? currentManagers.find(m => m.id === top2)?.fio : 'Не обрано'}</div>
          </div>
          <div className={`selection-button bottom1 ${bottom1 ? 'active' : ''}`}>
            <strong>Bottom 1</strong>
            <div>{bottom1 ? currentManagers.find(m => m.id === bottom1)?.fio : 'Не обрано'}</div>
          </div>
        </div>
        
        <button
          className="button"
          onClick={handleSubmit}
          disabled={!top1 || !top2 || !bottom1 || loading}
          style={{ width: '100%', marginTop: '2rem' }}
        >
          {loading ? 'Зберігання...' : 'Підтвердити вибір'}
        </button>
      </div>
    </div>
  );
}