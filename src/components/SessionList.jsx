import { useState, useEffect, useCallback } from 'react';
import { Trash2, Calendar, Clock, Play, Sparkles, Zap, Target, Brain, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import './SessionList.css';

const FALLBACK_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Study hard what interests you the most.", author: "Richard Feynman" },
  { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Learning is not attained by chance, it must be sought for with passion.", author: "Abigail Adams" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { text: "The more I learn, the more I realize how much I don't know.", author: "Albert Einstein" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
];

function randomFallback() {
  return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
}

function EmptyState() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    setSpinning(true);
    try {
      const res = await fetch(
        'https://api.quotable.io/random?tags=education|inspirational|success|motivational&maxLength=120',
        { signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setQuote({ text: data.content, author: data.author });
    } catch {
      setQuote(randomFallback());
    } finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 500);
    }
  }, []);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  return (
    <div className="empty-state-premium animate-fade-in">
      {/* Glow orb */}
      <div className="empty-orb">
        <div className="empty-orb-ring" />
        <Brain size={38} className="empty-orb-icon" />
      </div>

      {/* Heading */}
      <div className="empty-headline">
        <h3>Your journey starts here</h3>
        <p className="empty-sub">Pick a subject and start a focus session — your sessions will appear here.</p>
      </div>

      {/* Quote */}
      <div className="empty-quote">
        <div className="quote-header">
          <Sparkles size={14} className="quote-star" />
          <button
            className={`quote-refresh ${spinning ? 'spinning' : ''}`}
            onClick={fetchQuote}
            title="New quote"
            disabled={loading}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {loading && !quote ? (
          <div className="quote-skeleton">
            <div className="skeleton-line long" />
            <div className="skeleton-line short" />
            <div className="skeleton-author" />
          </div>
        ) : (
          <>
            <span className="quote-text">&ldquo;{quote?.text}&rdquo;</span>
            <span className="quote-author">— {quote?.author}</span>
          </>
        )}
      </div>

      {/* Tip pills */}
      <div className="empty-tips">
        <div className="tip-pill">
          <Zap size={14} />
          <span>Start a 25-min Pomodoro</span>
        </div>
        <div className="tip-pill">
          <Target size={14} />
          <span>Set tasks before studying</span>
        </div>
        <div className="tip-pill">
          <Calendar size={14} />
          <span>Build a daily streak</span>
        </div>
      </div>
    </div>
  );
}



export function SessionList({ sessions, onDeleteSession, onStartTimerForSubject }) {
  if (sessions.length === 0) {
    return <EmptyState />;
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = new Date(session.date).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="session-list-container animate-fade-in">
      <h2 className="list-title">Recent Activity</h2>
      
      {sortedDates.map(date => (
        <div key={date} className="date-group">
          <div className="date-header">
            <Calendar size={18} />
            <h4>{format(new Date(date), 'EEEE, MMMM do')}</h4>
          </div>
          
          <div className="sessions">
            {groupedSessions[date]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(session => (
              <div key={session.id} className="session-card glass-panel">
                <div className="session-details">
                  <h4 className="session-subject">{session.subject}</h4>
                  {session.notes && <p className="session-notes">{session.notes}</p>}
                  <div className="session-meta">
                    <span className="meta-item">
                      <Clock size={14} />
                      {session.duration} {session.duration === 1 ? 'min' : 'mins'}
                    </span>
                    <span className="meta-item">
                      {format(new Date(session.date), 'h:mm a')}
                    </span>
                  </div>
                </div>
                
                <div className="session-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-icon play-btn" 
                    onClick={() => onStartTimerForSubject(session.subject)}
                    title="Start timer for this subject"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Play size={18} />
                  </button>
                  <button 
                    className="btn-icon delete-btn" 
                    onClick={() => onDeleteSession(session.id)}
                    title="Delete session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
