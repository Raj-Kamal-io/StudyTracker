import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, Timer, Clock, CheckCircle2, Circle, Settings, Coffee, BrainCircuit, Flame, Square } from 'lucide-react';
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
  selectedSubject, 
  onClose,
  tasks = [],
  onToggleTask,
  dailyGoal = 8,
  sessions = [],
  isActive,
  setIsActive,
  seconds,
  setSeconds,
  mode,
  onSwitchMode,
  phase,
  setPhase,
  pomodoroMinutes,
  setPomodoroMinutes,
  relaxMinutes,
  setRelaxMinutes,
  saveSession,
  onTimerAction
}) {
  const handleMainButton = () => {
    setIsActive(!isActive);
  };

  const handleStopSession = () => {
    onTimerAction('stop');
    onClose();
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


  const adjustTime = (type, amount) => {
    if (type === 'focus') {
      const newVal = Math.max(1, Math.min(120, pomodoroMinutes + amount));
      setPomodoroMinutes(newVal);
    } else {
      const newVal = Math.max(1, Math.min(60, relaxMinutes + amount));
      setRelaxMinutes(newVal);
    }
  };

  // Calculate study time today
  const todayDateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const todayStudySeconds = sessions
    .filter(s => s.date && new Date(s.date).toLocaleDateString('en-CA') === todayDateStr)
    .reduce((sum, s) => sum + (s.duration || 0) * 60, 0);

  // Calculate target reach time (for daily goal)
  const goalSeconds = dailyGoal * 3600;
  const remainingForGoal = Math.max(0, goalSeconds - todayStudySeconds - (mode === 'timer' ? seconds : 0));
  const goalReachTime = new Date(Date.now() + remainingForGoal * 1000);

  // Calculate session end time
  const sessionEndTime = new Date(Date.now() + seconds * 1000);


  const today = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dDayStr = `${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear().toString().slice(-2)}`;
  const topDateStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

  return (
    <div className={`session-form-overlay animate-fade-in`}>
      <div className="timer-section-container session-animate-slide-up">
        
        {/* Top Header Bar */}
        <div className="timer-header-bar">
          <button className="d-day-btn">{dDayStr}</button>
          
          <div className="top-center-settings">
            {/* Timer mode switch removed during active full screen per user request */}
          </div>

          <div className="top-right-controls">
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className={`timer-main-layout ${mode}`}>
          {/* Left Column: Large Circle Visual - ONLY in Pomodoro mode */}
          {mode === 'pomodoro' && (
            <div className="timer-visual-col">
              <div className={`large-timer-circle ${isActive ? 'pulse' : ''} ${phase}`}>
                <Flame size={48} className="flame-icon" />
              </div>
            </div>
          )}

          {/* Right Column: Timer Info */}
          <div className="timer-info-col">
            {mode === 'pomodoro' && <div className="session-label">{phase === 'focus' ? 'Focus Time' : 'Rest Time'}</div>}
            <div className="countdown-display">
              {formatTime(seconds)}
            </div>

            <div className="timer-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="text-action-btn primary" onClick={handleMainButton} style={{ padding: '0.8rem 2.5rem', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', background: 'var(--text-main)', color: 'var(--bg-base)', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                {isActive ? "Pause" : "Resume"}
              </button>
              <button className="text-action-btn secondary" onClick={handleStopSession} style={{ padding: '0.8rem 2.5rem', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                Finish
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}



