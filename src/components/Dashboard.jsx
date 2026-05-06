import { useState, useEffect, useMemo } from 'react';
import { CalendarWidget } from './CalendarWidget';
import { StudyGroups } from './StudyGroups';
import { Home, CalendarDays, Clock, Flame, BookOpen, Plus, MessageSquare, Send, BrainCircuit, Coffee, Play, Settings, Menu, Users, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

// Stable helper outside component so it never causes useMemo to re-run
const toLocalDateStr = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function DashboardTimer({ sessions, dailyGoal, setDailyGoal, timerState, onOpenFullScreen, onSwitchMode, setPomodoroMinutes, setRelaxMinutes, onTimerAction }) {
  const [now, setNow] = useState(Date.now());
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Use LOCAL date so sessions before midnight UTC still count
  const todayStr = toLocalDateStr(new Date());

  const todaySessions = useMemo(
    () => sessions.filter(s => s.date && toLocalDateStr(s.date) === todayStr),
    [sessions, todayStr]
  );
  const todaySeconds = useMemo(
    () => todaySessions.reduce((sum, s) => sum + (s.duration || 0) * 60, 0),
    [todaySessions]
  );

  const hrs = Math.floor(todaySeconds / 3600);
  const mins = Math.floor((todaySeconds % 3600) / 60);
  const secs = todaySeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  // Calculate display seconds based on state
  const isGlobalTimerActive = timerState && !!timerState.activeSubject;
  
  let displaySeconds = 0;
  if (isGlobalTimerActive) {
    displaySeconds = timerState.seconds;
  } else {
    if (timerState && timerState.mode === 'pomodoro') {
      displaySeconds = timerState.pomodoroMinutes * 60;
    } else {
      displaySeconds = 0;
    }
  }
  
  const displayHrs = Math.floor(displaySeconds / 3600);
  const displayMins = Math.floor((displaySeconds % 3600) / 60);
  const displaySecs = displaySeconds % 60;
  
  const formattedTime = displayHrs > 0 
    ? `${displayHrs.toString().padStart(2, '0')}:${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`
    : `${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;


  const formatHHMM = (d) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const getDashboardEstEnd = () => {
    if (timerState && timerState.mode === 'pomodoro') {
      const d = new Date(Date.now() + timerState.pomodoroMinutes * 60000);
      return `Now → ${formatHHMM(d)}`;
    }
    return '';
  };

  // Progress toward daily goal
  const goalSeconds = (dailyGoal || 8) * 3600;
  const progress = Math.min((todaySeconds / goalSeconds) * 100, 100);

  const uniqueSubjectsToday = [...new Set(todaySessions.map(s => s.subject))].length;

  const handleSaveGoal = () => {
    const parsed = parseFloat(tempGoal);
    if (!isNaN(parsed) && parsed > 0) {
      setDailyGoal(parsed);
      setIsEditingGoal(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveGoal();
    if (e.key === 'Escape') {
      setTempGoal(dailyGoal);
      setIsEditingGoal(false);
    }
  };

  const adjustTime = (type, amount) => {
    if (type === 'focus') {
      const newVal = Math.max(1, Math.min(120, timerState.pomodoroMinutes + amount));
      setPomodoroMinutes(newVal);
    } else {
      const newVal = Math.max(1, Math.min(60, timerState.relaxMinutes + amount));
      setRelaxMinutes(newVal);
    }
  };

  const handleDashboardPlayClick = (e) => {
    e.stopPropagation();
    if (isGlobalTimerActive) {
      if (timerState.isActive) {
        onTimerAction('pause');
      } else {
        onTimerAction('resume');
      }
    }
  };

  const handleDashboardStopClick = (e) => {
    e.stopPropagation();
    onTimerAction('stop');
  };

  return (
    <div 
      className="dashboard-timer-card glass-panel" 
      style={{ 
        width: '100%', 
        maxWidth: '850px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        padding: 'clamp(1rem, 3vw, 2rem) clamp(1rem, 4vw, 3rem)'
      }}
      onClick={isGlobalTimerActive ? onOpenFullScreen : undefined}
    >
      {/* Top Header Row for Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'clamp(1rem, 3vw, 2rem)', minHeight: '32px', gap: '0.5rem' }}>
        
        {/* Left: Settings Icon & Panel */}
        <div style={{ flexShrink: 0 }}>
          {timerState && timerState.mode === 'pomodoro' && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                style={{ background: 'var(--glass-bg-subtle)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: 'none', color: 'var(--text-muted)' }}
                title="Timer Settings"
              >
                <Settings size={18} />
              </button>
              
              {showSettings && (
                <div className="glass-panel animate-fade-in" style={{ position: 'absolute', top: '120%', left: 0, zIndex: 10, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '180px', borderRadius: 'var(--radius-lg)' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Timer Durations</div>
                  <div className="h-setting" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', opacity: isGlobalTimerActive ? 0.5 : 1, pointerEvents: isGlobalTimerActive ? 'none' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><BrainCircuit size={14} color="var(--primary)" /> <span style={{ fontSize: '0.85rem' }}>Focus</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => adjustTime('focus', -5)} className="h-adj" style={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span className="h-val" style={{ fontSize: '0.9rem', fontWeight: '600', width: '24px', textAlign: 'center' }}>{timerState.pomodoroMinutes}</span>
                      <button onClick={() => adjustTime('focus', 5)} className="h-adj" style={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                  <div className="h-setting" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', opacity: isGlobalTimerActive ? 0.5 : 1, pointerEvents: isGlobalTimerActive ? 'none' : 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Coffee size={14} color="var(--success)" /> <span style={{ fontSize: '0.85rem' }}>Rest</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => adjustTime('relax', -1)} className="h-adj" style={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span className="h-val" style={{ fontSize: '0.9rem', fontWeight: '600', width: '24px', textAlign: 'center' }}>{timerState.relaxMinutes}</span>
                      <button onClick={() => adjustTime('relax', 1)} className="h-adj" style={{ background: 'var(--bg-surface)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0 }}>
          <div className="pomodoro-toggle-wrap" style={{ background: 'var(--glass-bg-subtle)', padding: '0.3rem 0.6rem', borderRadius: '20px', cursor: isGlobalTimerActive ? 'not-allowed' : 'default', opacity: isGlobalTimerActive ? 0.5 : 1 }} onClick={(e) => e.stopPropagation()}>
            <Clock size={14} color="var(--text-muted)" style={{ marginRight: '4px' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Pomodoro</span>
            <button 
              className={`toggle-pill ${timerState && timerState.mode === 'pomodoro' ? 'on' : ''}`}
              onClick={() => {
                if (!isGlobalTimerActive) {
                  onSwitchMode(timerState && timerState.mode === 'pomodoro' ? 'timer' : 'pomodoro');
                }
              }}
              style={{ pointerEvents: isGlobalTimerActive ? 'none' : 'auto' }}
            >
              <div className="toggle-handle" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Timer Layout */}
      <div className="dashboard-timer-main-layout" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(1.5rem, 4vw, 2rem)',
        flexWrap: 'wrap'
      }}>
        
        {/* Left Column: Circle (Only in Pomodoro) */}
        {timerState && timerState.mode === 'pomodoro' && (() => {
          const totalPhaseSeconds = timerState.phase === 'focus' ? timerState.pomodoroMinutes * 60 : timerState.relaxMinutes * 60;
          const progress = isGlobalTimerActive ? (timerState.seconds / totalPhaseSeconds) : 1;
          const radius = 66;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference * (1 - progress);
          
          return (
            <div className="dash-visual-col" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className={`dash-timer-circle ${timerState.isActive ? 'pulse' : ''} ${timerState.phase}`}>
                <svg className="timer-svg" viewBox="0 0 140 140">
                  <circle 
                    className="timer-ring-bg" 
                    cx="70" cy="70" r={radius} 
                    strokeWidth="6"
                  />
                  <circle 
                    className="timer-ring-progress" 
                    cx="70" cy="70" r={radius} 
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <Flame size={40} className="flame-icon" style={{ position: 'relative', zIndex: 1, color: 'var(--icon-base)' }} />
              </div>
            </div>
          );
        })()}

        {/* Right Column: Timer Info */}
        <div className="dash-info-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {timerState && timerState.mode === 'pomodoro' ? (
            <div style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              {isGlobalTimerActive ? (timerState.phase === 'focus' ? 'Focus Time' : 'Rest Time') : 'Focus Time'}
            </div>
          ) : (
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Stopwatch
            </div>
          )}

          <div className="countdown-display" style={{ fontWeight: '700', fontFamily: "'Roboto Mono', monospace", lineHeight: 1, marginBottom: '1rem', color: isGlobalTimerActive && timerState.mode === 'pomodoro' ? (timerState.phase === 'focus' ? 'var(--timer-red)' : 'var(--timer-rest)') : 'var(--text-main)' }}>
            {formattedTime}
          </div>
          
          <div className="time-range-subtext" style={{ color: 'var(--text-muted)', opacity: 0.6, minHeight: '1.2rem' }}>
            {isGlobalTimerActive ? `Recording: ${timerState.activeSubject?.name}` : getDashboardEstEnd()}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackTab() {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !email.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append("access_key", "400fbac2-005e-4c65-89be-617ba0e689ac");
    formData.append("email", email);
    formData.append("message", feedback);
    formData.append("subject", "New StudyTracker Feedback");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        setFeedback('');
        setEmail('');
        setTimeout(() => setSubmitted(false), 4000);
      } else {
        setErrorMsg(data.message || "Something went wrong.");
      }
    } catch (err) {
      setErrorMsg("Failed to send feedback. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)' }}>
          <MessageSquare size={20} color="#fff" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>We value your thoughts</h3>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2.5rem', textAlign: 'center' }}>
        Help us improve StudyTracker by sharing your experience, feature requests, or reporting any bugs you found.
      </p>

      {submitted ? (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={28} />
          </div>
          <h4 style={{ fontSize: '1.2rem', color: 'var(--success)' }}>Thank you!</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your feedback has been sent to our team.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {errorMsg && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '4px' }}>Your Email</label>
            <input 
              type="email"
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '4px' }}>Your Feedback</label>
            <textarea 
              className="input-field" 
              placeholder="Tell us what you love, what you hate, or what you'd like to see next..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', minHeight: '120px' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting || !feedback.trim() || !email.trim()}
            style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', fontSize: '1rem', background: (feedback.trim() && email.trim() && !isSubmitting) ? 'var(--primary)' : 'var(--btn-disabled-bg)', color: (feedback.trim() && email.trim() && !isSubmitting) ? '#fff' : 'var(--btn-disabled-text)', pointerEvents: (feedback.trim() && email.trim() && !isSubmitting) ? 'auto' : 'none', boxShadow: (feedback.trim() && email.trim() && !isSubmitting) ? 'var(--glow-primary)' : 'none' }}
          >
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}

export function Dashboard({ sessions, daysOff, setDaysOff, activeTab, setActiveTab, dailyGoal, setDailyGoal, drawerOpen, setDrawerOpen, timerState, onOpenFullScreen, onSwitchMode, setPomodoroMinutes, setRelaxMinutes, onTimerAction }) {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`nav-backdrop ${drawerOpen ? 'open' : ''}`} 
        onClick={() => setDrawerOpen(false)} 
      />

      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <BrainCircuit size={24} color="var(--primary)" />
          <span className="nav-drawer-title">Study<span className="text-gradient">Tracker</span></span>
        </div>

        <nav className="nav-drawer-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-drawer-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              id={`nav-${item.id}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.id === 'groups' && isGuest && (
                <span className="nav-badge">Trial</span>
              )}
            </button>
          ))}
        </nav>

        <div className="nav-drawer-footer">
          {(isAuthenticated || isGuest) && (
            <div className="nav-user-info">
              <div className="nav-user-avatar">
                <User size={18} />
              </div>
              <div className="nav-user-details">
                <span className="nav-user-name">{isGuest ? 'Guest User' : user?.name}</span>
                <span className="nav-user-email">{isGuest ? 'Limited access' : user?.email}</span>
              </div>
            </div>
          )}
          <button className="nav-drawer-item nav-logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>{isGuest ? 'Exit Guest Mode' : 'Log Out'}</span>
          </button>
        </div>
      </div>

      {/* Dashboard content — inside animated section */}
      <section className="dashboard animate-slide-up">
        <div className="dashboard-tab-content">
          {activeTab === 'home' && (
            <div className="tab-pane animate-fade-in">
              <DashboardTimer 
                sessions={sessions} 
                dailyGoal={dailyGoal} 
                setDailyGoal={setDailyGoal} 
                timerState={timerState}
                onOpenFullScreen={onOpenFullScreen}
                onSwitchMode={onSwitchMode}
                setPomodoroMinutes={setPomodoroMinutes}
                setRelaxMinutes={setRelaxMinutes}
                onTimerAction={onTimerAction}
              />
            </div>
          )}
          {activeTab === 'calendar' && (
            <div className="tab-pane animate-fade-in">
              <CalendarWidget
                sessions={sessions}
                daysOff={daysOff}
                setDaysOff={setDaysOff}
              />
            </div>
          )}
          {activeTab === 'groups' && (
            <div className="tab-pane animate-fade-in">
              <StudyGroups />
            </div>
          )}
          {activeTab === 'feedback' && (
            <div className="tab-pane animate-fade-in">
              <FeedbackTab />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
