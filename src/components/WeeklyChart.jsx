import { useMemo, useState } from 'react';
import './WeeklyChart.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toLocalDateStr = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function WeeklyChart({ sessions }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, label, hours }

  const { days, maxHours } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = toLocalDateStr(d);
      const totalMins = sessions
        .filter(s => s.date && toLocalDateStr(s.date) === dateStr)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      return {
        dateStr,
        label: DAY_LABELS[d.getDay()],
        hours: +(totalMins / 60).toFixed(1),
        isToday: i === 6,
      };
    });
    const maxHours = Math.max(...days.map(d => d.hours), 1);
    return { days, maxHours };
  }, [sessions]);

  const chartH = 120;
  const barW = 28;
  const gapW = 16;
  const totalW = days.length * (barW + gapW) - gapW;

  return (
    <div className="weekly-chart-card glass-card">
      <div className="weekly-chart-header">
        <span className="weekly-chart-title">📊 Last 7 Days</span>
        <span className="weekly-chart-sub">Hours studied per day</span>
      </div>

      <div className="weekly-chart-body">
        <svg
          width="100%"
          viewBox={`0 0 ${totalW} ${chartH + 36}`}
          preserveAspectRatio="xMidYMid meet"
          className="weekly-chart-svg"
        >
          {/* Horizontal guide lines */}
          {[0.25, 0.5, 0.75, 1].map((frac) => {
            const y = chartH - frac * chartH;
            return (
              <line
                key={frac}
                x1={0}
                y1={y}
                x2={totalW}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            );
          })}

          {days.map((day, i) => {
            const barH = Math.max((day.hours / maxHours) * chartH, day.hours > 0 ? 4 : 0);
            const x = i * (barW + gapW);
            const y = chartH - barH;
            const fill = day.isToday ? '#ea580c' : 'var(--primary)';
            const opacity = day.isToday ? 1 : 0.65;

            return (
              <g key={day.dateStr}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={fill}
                  opacity={opacity}
                  className="weekly-bar"
                  style={{ '--bar-height': `${barH}px`, '--bar-delay': `${i * 60}ms` }}
                  onMouseEnter={(e) => setTooltip({ i, label: day.label, hours: day.hours })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Day label */}
                <text
                  x={x + barW / 2}
                  y={chartH + 18}
                  textAnchor="middle"
                  fill={day.isToday ? '#ea580c' : 'var(--text-muted)'}
                  fontSize={10}
                  fontFamily="Inter, sans-serif"
                  fontWeight={day.isToday ? '700' : '500'}
                >
                  {day.label}
                </text>
                {/* Tooltip */}
                {tooltip && tooltip.i === i && (
                  <g>
                    <rect
                      x={x + barW / 2 - 26}
                      y={y - 30}
                      width={52}
                      height={22}
                      rx={5}
                      fill="rgba(20,20,20,0.95)"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                    />
                    <text
                      x={x + barW / 2}
                      y={y - 14}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10}
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                    >
                      {day.hours}h
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
