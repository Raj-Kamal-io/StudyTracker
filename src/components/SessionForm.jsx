import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, Timer, Clock, CheckCircle2, Circle, Settings, Coffee, BrainCircuit } from 'lucide-react';
import './SessionForm.css';

// ── Web Audio beep ────────────
function playBeep(frequency = 880, duration = 0.4, volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

export function SessionForm({ 
  onAddSession, 
  selectedSubject, 
  onClose,
  tasks = [],
  onToggleTask,
}) {
  const [mode, setMode] = useState('pomodoro'); // 'timer', 'pomodoro'
  const [phase, setPhase] = useState('focus'); // 'focus', 'relax'
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [relaxMinutes, setRelaxMinutes] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef(null);

  // Initialize timer
  useEffect(() => {
    if (selectedSubject && !isActive) {
      if (mode === 'timer') {
        setSeconds(0);
      } else {
        setSeconds(phase === 'focus' ? pomodoroMinutes * 60 : relaxMinutes * 60);
      }
    }
  }, [selectedSubject, mode, phase, isActive, pomodoroMinutes, relaxMinutes]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (mode === 'pomodoro') {
            if (s <= 1) {
              handleComplete();
              return 0;
            }
            return s - 1;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, mode]);

  const handleComplete = () => {
    setIsActive(false);
    playBeep(880, 0.5, 0.3);
    
    if (phase === 'focus') {
      saveSession(pomodoroMinutes);
      setPhase('relax');
      setSeconds(relaxMinutes * 60);
    } else {
      setPhase('focus');
      setSeconds(pomodoroMinutes * 60);
    }
  };

  const saveSession = (durationMinutes) => {
    if (!selectedSubject) return;
    onAddSession({
      id: crypto.randomUUID(),
      subject: selectedSubject.name,
      duration: durationMinutes,
      date: new Date().toISOString(),
      notes: '',
    });
  };

  const handleMainButton = () => {
    if (isActive && mode === 'timer') {
      const elapsedMins = Math.max(1, Math.round(seconds / 60));
      saveSession(elapsedMins);
      setIsActive(false);
      setSeconds(0);
      onClose();
      return;
    }
    setIsActive(!isActive);
    if (showSettings) setShowSettings(false);
  };

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePhase = () => {
    setIsActive(false);
    const newPhase = phase === 'focus' ? 'relax' : 'focus';
    setPhase(newPhase);
    setSeconds(newPhase === 'focus' ? pomodoroMinutes * 60 : relaxMinutes * 60);
  };

  const handleSwitchMode = (newMode) => {
    if (isActive) {
      if (!confirm("Switch modes? Current timer will be reset.")) return;
    }
    setIsActive(false);
    setMode(newMode);
    if (newMode === 'timer') {
      setSeconds(0);
    } else {
      setPhase('focus');
      setSeconds(pomodoroMinutes * 60);
    }
  };

  const adjustTime = (type, amount) => {
    if (type === 'focus') {
      const newVal = Math.max(1, Math.min(120, pomodoroMinutes + amount));
      setPomodoroMinutes(newVal);
    } else {
      const newVal = Math.max(1, Math.min(60, relaxMinutes + amount));
      setRelaxMinutes(newVal);
    }
  };

  // SVG Progress calculation
  const total = phase === 'focus' ? pomodoroMinutes * 60 : relaxMinutes * 60;
  const progress = mode === 'pomodoro' ? (seconds / total) : 0;
  const strokeDash = 2 * Math.PI * 90;
  const offset = strokeDash * (1 - progress);

  return (
    <div className={`session-form-overlay animate-fade-in ${isActive ? 'timer-running' : ''}`}>
      {/* Mode Tabs */}
      {!isActive && (
        <div className="mode-tabs">
          <button 
            className={`mode-tab-btn ${mode === 'timer' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('timer')}
          >
            <Clock size={16} /> Manual
          </button>
          <button 
            className={`mode-tab-btn ${mode === 'pomodoro' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('pomodoro')}
          >
            <Timer size={16} /> Pomodoro
          </button>
        </div>
      )}

      <div className={`timer-card-container ${mode === 'timer' ? 'manual' : phase} session-animate-slide-up`}>
        <div className={`timer-card glass-panel ${showSettings ? 'settings-open' : ''}`}>
          
          {showSettings && (
            <div className="card-settings-overlay animate-fade-in">
              <h3>Timer Settings</h3>
              <div className="setting-row">
                <span>Focus Time</span>
                <div className="adjustor">
                  <button onClick={() => adjustTime('focus', -5)}>-</button>
                  <span className="val">{pomodoroMinutes}m</span>
                  <button onClick={() => adjustTime('focus', 5)}>+</button>
                </div>
              </div>
              <div className="setting-row">
                <span>Break Time</span>
                <div className="adjustor">
                  <button onClick={() => adjustTime('relax', -1)}>-</button>
                  <span className="val">{relaxMinutes}m</span>
                  <button onClick={() => adjustTime('relax', 1)}>+</button>
                </div>
              </div>
              <button className="done-btn" onClick={() => setShowSettings(false)}>Done</button>
            </div>
          )}

          <div className="timer-ring-container">
            <svg viewBox="0 0 200 200" className="timer-svg">
              <defs>
                <radialGradient id="innerFace" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--theme-glow)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="88" fill="url(#innerFace)" />
              <circle cx="100" cy="100" r="90" className="ring-track" />
              <circle 
                cx="100" 
                cy="100" 
                r="90" 
                className={`ring-fill ${mode === 'timer' ? 'manual' : ''}`}
                style={{ 
                  strokeDasharray: strokeDash,
                  strokeDashoffset: mode === 'pomodoro' ? offset : 0,
                  transition: mode === 'pomodoro' ? 'stroke-dashoffset 1s linear' : 'none'
                }}
              />
            </svg>
            
            <div className="timer-content">
              <div className="timer-status-icon">
                {mode === 'timer' ? <Clock size={28} /> : 
                 (phase === 'focus' ? <BrainCircuit size={28} /> : <Coffee size={28} />)}
              </div>
              <div className={`timer-digits ${seconds >= 3600 ? 'long-time' : ''}`}>
                {formatTime(seconds)}
              </div>
              {mode === 'pomodoro' && (
                <div className="timer-label">{phase.toUpperCase()}</div>
              )}
              
              <button className="timer-toggle-btn" onClick={handleMainButton}>
                {isActive ? <Pause size={32} /> : <Play size={32} />}
              </button>
            </div>
          </div>

          {/* Task list INSIDE the card */}
          {tasks.length > 0 && (
            <div className="timer-tasks-container">
               {tasks.map(task => (
                <div key={task.id} className="mini-task" onClick={() => onToggleTask(task.id)}>
                  {task.completed ? <CheckCircle2 size={16} color="var(--success)" /> : <Circle size={16} />}
                  <span className={task.completed ? 'completed' : ''}>{task.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="timer-card-footer">
            {mode === 'pomodoro' && (
              <button 
                className={`settings-btn ${showSettings ? 'active' : ''}`} 
                onClick={() => setShowSettings(!showSettings)}
                disabled={isActive}
              >
                <Settings size={20} />
              </button>
            )}
            {mode === 'pomodoro' ? (
              <button className="phase-switch-btn" onClick={togglePhase}>
                {phase === 'focus' ? 'BREAK' : 'POMODORO'}
              </button>
            ) : (
              <div className="spacer" style={{ flex: 1 }}></div>
            )}
            <button className="close-card-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}



