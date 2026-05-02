import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Flame, X } from 'lucide-react';
import './CalendarWidget.css';

export function CalendarWidget({ sessions, daysOff, setDaysOff }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedOffDate, setSelectedOffDate] = useState(null);
  const [offReason, setOffReason] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const activeDates = useMemo(() => {
    const dates = new Set();
    sessions.forEach(s => dates.add(new Date(s.date).toDateString()));
    return dates;
  }, [sessions]);

  const offDatesMap = useMemo(() => {
    const map = new Map();
    daysOff.forEach(d => map.set(new Date(d.date).toDateString(), d.reason));
    return map;
  }, [daysOff]);

  const streak = useMemo(() => {
    let currentStreak = 0;
    let iterDate = new Date();
    iterDate.setHours(0, 0, 0, 0);
    
    // Check today
    if (activeDates.has(iterDate.toDateString())) {
      currentStreak++;
    }
    // If today is empty or an off day, we don't break the streak yet.

    // Loop backwards from yesterday
    iterDate.setDate(iterDate.getDate() - 1);
    while (true) {
      let dateStr = iterDate.toDateString();
      if (activeDates.has(dateStr)) {
        currentStreak++;
      } else if (offDatesMap.has(dateStr)) {
        // do nothing, streak is frozen
      } else {
        break; // streak broken
      }
      iterDate.setDate(iterDate.getDate() - 1);
    }
    return currentStreak;
  }, [activeDates, offDatesMap]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const clickedDate = new Date(year, month, day);
    const dateStr = clickedDate.toDateString();
    
    setSelectedOffDate(dateStr);

    setSelectedOffDate(dateStr);
    setOffReason(offDatesMap.get(dateStr) || '');
  };

  const handleSaveDayOff = (e) => {
    e.preventDefault();
    if (!selectedOffDate) return;
    
    // Remove if already exists to update
    const newDaysOff = daysOff.filter(d => new Date(d.date).toDateString() !== selectedOffDate);
    
    newDaysOff.push({
      date: new Date(selectedOffDate).toISOString(),
      reason: offReason.trim()
    });
    
    setDaysOff(newDaysOff);
    setSelectedOffDate(null);
    setOffReason('');
  };

  const handleRemoveDayOff = () => {
    if (!selectedOffDate) return;
    setDaysOff(daysOff.filter(d => new Date(d.date).toDateString() !== selectedOffDate));
    setSelectedOffDate(null);
    setOffReason('');
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCells = () => {
    const cells = [];
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    // Day cells
    const todayStr = new Date().toDateString();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const dateStr = cellDate.toDateString();
      const isToday = dateStr === todayStr;
      const isStudied = activeDates.has(dateStr);
      const isOff = offDatesMap.has(dateStr);
      const reason = offDatesMap.get(dateStr);

      let statusClass = '';
      if (isStudied) statusClass = 'studied';
      else if (isOff) statusClass = 'off-day';

      cells.push(
        <div 
          key={day} 
          className={`calendar-cell ${statusClass} ${isToday ? 'today' : ''} clickable`}
          onClick={() => handleDayClick(day)}
          title={isOff ? `Day Off: ${reason || 'No reason provided'}` : isStudied ? 'Studied' : 'No activity'}
        >
          <span className="day-number">{day}</span>
          {isStudied && !isOff && (
            <span className="studied-label">
              Studied
            </span>
          )}
          {isOff && (
            <span className="day-off-label">
              Day Off
            </span>
          )}
        </div>
      );
    }
    return cells;
  };

  return (
    <>
      <div className="calendar-widget glass-panel">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
          <h3>{monthNames[month]} {year}</h3>
          <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
        </div>
        <div className="streak-badge" title="Current Streak (Days off freeze your streak!)">
          <Flame size={20} color="var(--danger)" />
          <span>{streak} Days</span>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDays.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
        {renderCells()}
      </div>

      <div className="calendar-help">
        <h4>How it works</h4>
        <div className="help-items">
          <div className="help-item">
            <span className="studied-label">Studied</span>
            <p>Complete a session to maintain your streak.</p>
          </div>
          <div className="help-item">
            <span className="day-off-label">Day Off</span>
            <p>Click any day to take a break without losing your streak!</p>
          </div>
        </div>
      </div>

      </div>

      {selectedOffDate && createPortal(
        <div className="day-off-modal-overlay animate-fade-in">
          <div className="day-off-modal glass-panel animate-slide-up">
            <div className="modal-header">
              <h4>Mark Day Off</h4>
              <button className="btn-icon" onClick={() => setSelectedOffDate(null)}><X size={20} /></button>
            </div>
            <p className="modal-date">{new Date(selectedOffDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <form onSubmit={handleSaveDayOff}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Reason (optional, e.g., Sick, Rest Day)"
                value={offReason}
                onChange={e => setOffReason(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                {offDatesMap.has(selectedOffDate) && (
                  <button type="button" className="btn-danger" onClick={handleRemoveDayOff}>Remove Day Off</button>
                )}
                <div style={{ flex: 1 }}></div>
                <button type="button" className="btn-icon" onClick={() => setSelectedOffDate(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
