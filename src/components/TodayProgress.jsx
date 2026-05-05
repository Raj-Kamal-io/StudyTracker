import { useMemo } from 'react';
import { Clock, BookOpen, Play, TrendingUp } from 'lucide-react';
import './TodayProgress.css';

export function TodayProgress({ sessions, subjects, onStartTimerForSubject }) {
  const todayStr = new Date().toDateString();

  const subjectStats = useMemo(() => {
    // Filter today's sessions
    const todaySessions = sessions.filter(
      (s) => s.date && new Date(s.date).toDateString() === todayStr
    );

    // Group by subject name
    const map = new Map();
    todaySessions.forEach((s) => {
      const prev = map.get(s.subject) || { totalMinutes: 0, sessionCount: 0 };
      map.set(s.subject, {
        totalMinutes: prev.totalMinutes + (s.duration || 0),
        sessionCount: prev.sessionCount + 1,
      });
    });

    // Build stats array, sorted by most studied first
    const stats = [];
    map.forEach((value, subjectName) => {
      const subjectObj = subjects.find((s) => s.name === subjectName);
      stats.push({
        name: subjectName,
        color: subjectObj?.color || 'var(--primary)',
        totalMinutes: value.totalMinutes,
        sessionCount: value.sessionCount,
      });
    });

    stats.sort((a, b) => b.totalMinutes - a.totalMinutes);
    return stats;
  }, [sessions, subjects, todayStr]);

  const totalMinutesToday = subjectStats.reduce((s, x) => s + x.totalMinutes, 0);
  const maxMinutes = subjectStats.length > 0 ? Math.max(...subjectStats.map((s) => s.totalMinutes)) : 0;

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  if (subjectStats.length === 0) {
    return (
      <div className="today-progress animate-fade-in">
        <div className="today-progress-header">
          <div className="today-progress-title-row">
            <TrendingUp size={20} className="today-progress-icon" />
            <h2>Today's Progress</h2>
          </div>
        </div>
        <div className="today-empty glass-panel">
          <BookOpen size={28} className="today-empty-icon" />
          <p>No study sessions recorded today.</p>
          <span>Start a timer from your subjects to begin!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="today-progress animate-fade-in">
      <div className="today-progress-header">
        <div className="today-progress-title-row">
          <TrendingUp size={20} className="today-progress-icon" />
          <h2>Today's Progress</h2>
        </div>
        <div className="today-total-badge">
          <Clock size={14} />
          <span>{formatDuration(totalMinutesToday)} total</span>
        </div>
      </div>

      <div className="today-subjects-list">
        {subjectStats.map((stat) => {
          const barPercent = maxMinutes > 0 ? (stat.totalMinutes / maxMinutes) * 100 : 0;
          return (
            <div key={stat.name} className="today-subject-row glass-panel">
              <div className="today-subject-info">
                <div className="today-subject-color" style={{ background: stat.color }} />
                <div className="today-subject-details">
                  <span className="today-subject-name">{stat.name}</span>
                  <span className="today-subject-meta">
                    {stat.sessionCount} {stat.sessionCount === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              </div>

              <div className="today-subject-right">
                <div className="today-subject-bar-wrap">
                  <div
                    className="today-subject-bar"
                    style={{ width: `${barPercent}%`, background: stat.color }}
                  />
                </div>
                <span className="today-subject-duration">{formatDuration(stat.totalMinutes)}</span>
                <button
                  className="btn-icon today-play-btn"
                  onClick={() => onStartTimerForSubject(stat.name)}
                  title={`Continue studying ${stat.name}`}
                  style={{ color: stat.color }}
                >
                  <Play size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
