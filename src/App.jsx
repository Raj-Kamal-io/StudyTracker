import { useState, useEffect } from 'react';
import { BrainCircuit, Sun, Moon, Plus } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Dashboard } from './components/Dashboard';
import { SubjectManager } from './components/SubjectManager';
import { SessionForm } from './components/SessionForm';
import { SessionList } from './components/SessionList';
import './App.css';

function App() {
  const [sessions, setSessions] = useLocalStorage('study-tracker-sessions', []);
  const [subjects, setSubjects] = useLocalStorage('study-tracker-subjects', []);
  const [tasks, setTasks] = useLocalStorage('study-tracker-tasks', []);
  const [daysOff, setDaysOff] = useLocalStorage('study-tracker-daysoff', []);
  const [theme, setTheme] = useLocalStorage('study-tracker-theme-mode', 'dark');
  const [dailyGoal, setDailyGoal] = useLocalStorage('study-tracker-daily-goal', 8);
  
  const [activeTimerSubject, setActiveTimerSubject] = useState(null);
  const [dashTab, setDashTab] = useState('home');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const handleAddSession = (newSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleDeleteSession = (id) => {
    setSessions((prev) => prev.filter(session => session.id !== id));
  };

  const handleAddSubject = (newSubject) => {
    setSubjects((prev) => [...prev, newSubject]);
  };

  const handleDeleteSubject = (id) => {
    setSubjects((prev) => prev.filter(subject => subject.id !== id));
    // Also remove all tasks belonging to this subject
    setTasks((prev) => prev.filter(task => task.subjectId !== id));
  };

  const handleAddTask = (subjectId, text) => {
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), subjectId, text, completed: false, createdAt: new Date().toISOString() }
    ]);
  };

  const handleToggleTask = (taskId) => {
    setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter(t => t.id !== taskId));
  };

  const handleStartTimerForSubject = (subjectOrName) => {
    // If it's a string (from SessionList past sessions), find the subject
    if (typeof subjectOrName === 'string') {
      let subj = subjects.find(s => s.name === subjectOrName);
      if (!subj) {
        // Fallback create a dummy one or alert
        subj = { id: crypto.randomUUID(), name: subjectOrName, color: 'var(--primary)' };
      }
      setActiveTimerSubject(subj);
    } else {
      setActiveTimerSubject(subjectOrName);
    }
  };

  return (
    <div className="app-container">
      <header className="animate-fade-in">
        <div className="logo-container">
          <BrainCircuit size={36} className="logo-icon" />
          <h1>Study<span className="text-gradient">Tracker</span></h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn-icon" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ width: '40px', height: '40px', background: 'var(--bg-surface)' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '2rem' }}>
        <Dashboard
          sessions={sessions}
          daysOff={daysOff}
          setDaysOff={setDaysOff}
          activeTab={dashTab}
          setActiveTab={setDashTab}
          dailyGoal={dailyGoal}
          setDailyGoal={setDailyGoal}
        />
      </div>

      {dashTab === 'home' && (
        <main>
        <SubjectManager 
          subjects={subjects} 
          onAddSubject={handleAddSubject} 
          onDeleteSubject={handleDeleteSubject}
          onStartSubjectTimer={handleStartTimerForSubject}
          sessions={sessions}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
        
        <SessionList 
            sessions={sessions} 
            onDeleteSession={handleDeleteSession} 
            onStartTimerForSubject={handleStartTimerForSubject}
          />
        </main>
      )}

      {activeTimerSubject && (
        <SessionForm 
          selectedSubject={activeTimerSubject}
          onAddSession={handleAddSession} 
          onClose={() => setActiveTimerSubject(null)}
          tasks={tasks.filter(t => t.subjectId === activeTimerSubject.id)}
          onToggleTask={handleToggleTask}
        />
      )}
    </div>
  );
}

export default App;
