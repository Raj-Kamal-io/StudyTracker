import { useState, useEffect, useRef } from 'react';
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

  // Global Timer State
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [timerPhase, setTimerPhase] = useState('focus');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [relaxMinutes, setRelaxMinutes] = useState(5);
  const [showFullScreenTimer, setShowFullScreenTimer] = useState(false);

  const timerIntervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isTimerActive) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (timerMode === 'pomodoro') {
            if (s <= 1) {
              handleTimerComplete();
              return 0;
            }
            return s - 1;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerActive, timerMode]);

  // Handle phase completion in pomodoro mode
  const handleTimerComplete = () => {
    setIsTimerActive(false);
    // Play beep logic ideally goes here, or in a dedicated sound manager
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) {}
    
    if (timerPhase === 'focus') {
      saveSession(pomodoroMinutes);
      setTimerPhase('relax');
      setTimerSeconds(relaxMinutes * 60);
    } else {
      setTimerPhase('focus');
      setTimerSeconds(pomodoroMinutes * 60);
    }
  };

  const saveSession = (durationMinutes) => {
    if (!activeTimerSubject) return;
    handleAddSession({
      id: crypto.randomUUID(),
      subject: activeTimerSubject.name,
      duration: durationMinutes,
      date: new Date().toISOString(),
      notes: '',
    });
  };

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

  const handleSwitchMode = (newMode) => {
    if (isTimerActive) {
      if (!confirm("Switch modes? Current timer will be reset.")) return;
    }
    setIsTimerActive(false);
    setTimerMode(newMode);
    if (newMode === 'timer') {
      setTimerSeconds(0);
    } else {
      setTimerPhase('focus');
      setTimerSeconds(pomodoroMinutes * 60);
    }
  };

  const handleTimerAction = (action) => {
    if (action === 'pause') {
      setIsTimerActive(false);
    } else if (action === 'resume') {
      setIsTimerActive(true);
    } else if (action === 'stop') {
      setIsTimerActive(false);
      if (activeTimerSubject) {
        const durationMinutes = timerMode === 'pomodoro' 
          ? Math.max(1, Math.round((pomodoroMinutes * 60 - timerSeconds) / 60))
          : Math.max(1, Math.round(timerSeconds / 60));
        saveSession(durationMinutes);
      }
      setActiveTimerSubject(null);
      if (timerMode === 'timer') {
        setTimerSeconds(0);
      } else {
        setTimerPhase('focus');
        setTimerSeconds(pomodoroMinutes * 60);
      }
    }
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
    
    // Initialize timer for new subject if not already running
    if (!isTimerActive) {
      if (timerMode === 'timer') {
        setTimerSeconds(0);
      } else {
        setTimerSeconds(timerPhase === 'focus' ? pomodoroMinutes * 60 : relaxMinutes * 60);
      }
      setIsTimerActive(true); // Auto-start the timer
    }
    setShowFullScreenTimer(true);
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
          // Pass global timer state to dashboard
          timerState={{
            isActive: isTimerActive,
            seconds: timerSeconds,
            mode: timerMode,
            phase: timerPhase,
            activeSubject: activeTimerSubject,
            pomodoroMinutes,
            relaxMinutes
          }}
          onSwitchMode={handleSwitchMode}
          setPomodoroMinutes={setPomodoroMinutes}
          setRelaxMinutes={setRelaxMinutes}
          onTimerAction={handleTimerAction}
          onOpenFullScreen={() => setShowFullScreenTimer(true)}
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

      {showFullScreenTimer && activeTimerSubject && (
        <SessionForm 
          selectedSubject={activeTimerSubject}
          tasks={tasks.filter(t => t.subjectId === activeTimerSubject.id)}
          onToggleTask={handleToggleTask}
          dailyGoal={dailyGoal}
          sessions={sessions}
          // Global timer props
          isActive={isTimerActive}
          setIsActive={setIsTimerActive}
          seconds={timerSeconds}
          setSeconds={setTimerSeconds}
          mode={timerMode}
          onSwitchMode={handleSwitchMode}
          phase={timerPhase}
          setPhase={setTimerPhase}
          pomodoroMinutes={pomodoroMinutes}
          setPomodoroMinutes={setPomodoroMinutes}
          relaxMinutes={relaxMinutes}
          setRelaxMinutes={setRelaxMinutes}
          saveSession={saveSession}
          onTimerAction={handleTimerAction}
          onClose={() => setShowFullScreenTimer(false)}
        />
      )}
    </div>
  );
}

export default App;
