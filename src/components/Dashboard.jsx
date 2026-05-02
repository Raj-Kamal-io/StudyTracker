import { useState, useEffect, useMemo } from 'react';
import { CalendarWidget } from './CalendarWidget';
import { Home, CalendarDays, Clock, Flame, BookOpen, Plus, MessageSquare, Send } from 'lucide-react';
import './Dashboard.css';

// Stable helper outside component so it never causes useMemo to re-run
const toLocalDateStr = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function TodayStudyTimer({ sessions, dailyGoal, setDailyGoal }) {
  const [now, setNow] = useState(Date.now());
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal);

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

  // Motivational label
  const label =
    todaySeconds === 0
      ? "No sessions yet — start studying!"
      : todaySeconds < (dailyGoal * 3600) / 4
      ? "Great start, keep going!"
      : todaySeconds < (dailyGoal * 3600) / 2
      ? "Solid focus session! 🔥"
      : "Beast mode activated! 🧠";

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

  return (
    <div className="today-timer-card glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="today-timer-header" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="today-timer-icon">
          <Clock size={22} />
        </div>
        <span className="today-timer-title">Today's Study Time</span>
      </div>

      <div className="today-timer-display">
        <span className="timer-digit">{pad(hrs)}</span>
        <span className="timer-sep">:</span>
        <span className="timer-digit">{pad(mins)}</span>
        <span className="timer-sep">:</span>
        <span className="timer-digit">{pad(secs)}</span>
      </div>
      <div className="timer-units">
        <span>HRS</span>
        <div className="unit-spacer" />
        <span>MIN</span>
        <div className="unit-spacer" />
        <span>SEC</span>
      </div>

      <div className="today-timer-label">{label}</div>

      <div className="today-goal-bar-wrap">
        <div className="today-goal-bar-track">
          <div
            className="today-goal-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="today-goal-info">
          {isEditingGoal ? (
            <div className="goal-editor">
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                onBlur={handleSaveGoal}
                onKeyDown={handleKeyDown}
                autoFocus
                className="goal-input"
              />
              <span className="goal-input-suffix">h goal</span>
            </div>
          ) : (
            <button className="goal-display-btn" onClick={() => setIsEditingGoal(true)} title="Click to change goal">
              <span className="today-goal-text">
                {Math.round(progress)}% of {dailyGoal}h daily goal
              </span>
              <Plus size={12} className="goal-edit-icon" />
            </button>
          )}
        </div>
      </div>

      <div className="today-stats-row">
        <div className="today-stat">
          <Flame size={16} className="today-stat-icon flame" />
          <span>{todaySessions.length} sessions today</span>
        </div>
        <div className="today-stat">
          <BookOpen size={16} className="today-stat-icon book" />
          <span>{uniqueSubjectsToday} subject{uniqueSubjectsToday !== 1 ? 's' : ''}</span>
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
    formData.append("access_key", "3298a1df-6a84-4e30-bd60-6612cbe07b15");
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
    <div className="feedback-card glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div className="today-timer-icon" style={{ background: 'var(--secondary)' }}>
          <MessageSquare size={20} />
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
            style={{ marginTop: '0.5rem', width: '100%', padding: '1rem', fontSize: '1rem', background: (feedback.trim() && email.trim() && !isSubmitting) ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: (feedback.trim() && email.trim() && !isSubmitting) ? '#fff' : 'rgba(255,255,255,0.3)', pointerEvents: (feedback.trim() && email.trim() && !isSubmitting) ? 'auto' : 'none', boxShadow: (feedback.trim() && email.trim() && !isSubmitting) ? 'var(--glow-primary)' : 'none' }}
          >
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
}

export function Dashboard({ sessions, daysOff, setDaysOff, activeTab, setActiveTab, dailyGoal, setDailyGoal }) {

  return (
    <section className="dashboard animate-slide-up">
      {/* Tab Bar */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
          id="tab-home"
        >
          <Home size={16} />
          Home
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
          id="tab-calendar"
        >
          <CalendarDays size={16} />
          Calendar
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
          id="tab-feedback"
        >
          <MessageSquare size={16} />
          Feedback
        </button>
        <div
          className="dashboard-tab-indicator"
          style={{ transform: activeTab === 'home' ? 'translateX(0%)' : activeTab === 'calendar' ? 'translateX(100%)' : 'translateX(200%)' }}
        />
      </div>

      {/* Tab Content */}
      <div className="dashboard-tab-content">
        {activeTab === 'home' && (
          <div className="tab-pane animate-fade-in">
            <TodayStudyTimer sessions={sessions} dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} />
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
        {activeTab === 'feedback' && (
          <div className="tab-pane animate-fade-in">
            <FeedbackTab />
          </div>
        )}
      </div>
    </section>
  );
}
