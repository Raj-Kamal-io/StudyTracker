import { useState } from 'react';
import { Plus, Play, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import './SubjectManager.css';

const PRESET_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

export function SubjectManager({
  subjects,
  onAddSubject,
  onDeleteSubject,
  onStartSubjectTimer,
  sessions,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    onAddSubject({
      id: crypto.randomUUID(),
      name: newSubjectName.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    });
    setNewSubjectName('');
    setIsAdding(false);
  };

  const handleAddTask = (e, subjectId) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(subjectId, newTaskText.trim());
    setNewTaskText('');
  };

  const toggleExpand = (subjectId) => {
    setExpandedSubjectId((prev) => {
      if (prev !== subjectId) setNewTaskText('');
      return prev === subjectId ? null : subjectId;
    });
  };

  const getTodayTime = (subjectName) => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      (s) => s.subject === subjectName && new Date(s.date).toDateString() === today
    );
    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="subject-manager animate-fade-in">
      <div className="subject-manager-header">
        <h2>Your Subjects</h2>
        {!isAdding && (
          <button className="btn-primary btn-sm" onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Add Subject
          </button>
        )}
      </div>

      <div className="subjects-grid">
        {subjects.map((subject) => {
          const subjectTasks = tasks.filter((t) => t.subjectId === subject.id);
          const isExpanded = expandedSubjectId === subject.id;
          const completedCount = subjectTasks.filter((t) => t.completed).length;

          return (
            <div
              key={subject.id}
              className={`subject-card glass-panel ${isExpanded ? 'expanded' : ''}`}
              style={{ borderLeft: `4px solid ${subject.color}` }}
            >
              {/* Card Header Row */}
              <div className="subject-content" onClick={() => toggleExpand(subject.id)}>
                <div className="subject-info">
                  <h3>{subject.name}</h3>
                  <p className="subject-today-time">
                    Today: {getTodayTime(subject.name)}
                    {subjectTasks.length > 0 && (
                      <span className="task-badge" style={{ borderColor: subject.color, color: subject.color }}>
                        {completedCount}/{subjectTasks.length} tasks
                      </span>
                    )}
                  </p>
                </div>
                <div className="subject-header-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-icon play-btn"
                    title="Start Focus Timer"
                    style={{ color: subject.color }}
                    onClick={() => onStartSubjectTimer(subject)}
                  >
                    <Play size={22} />
                  </button>
                  <button
                    className="btn-icon expand-btn"
                    title={isExpanded ? 'Collapse' : 'Show tasks'}
                    onClick={() => toggleExpand(subject.id)}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Expanded Panel */}
              {isExpanded && (
                <div className="subject-expanded animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  {/* Task List */}
                  {subjectTasks.length > 0 && (
                    <div className="task-list">
                      {subjectTasks.map((task) => (
                        <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                          <button
                            className="task-toggle"
                            onClick={() => onToggleTask(task.id)}
                            style={{ color: task.completed ? 'var(--text-muted)' : subject.color }}
                          >
                            {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                          <span className="task-text">{task.text}</span>
                          <button className="task-delete" onClick={() => onDeleteTask(task.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {subjectTasks.length === 0 && (
                    <p className="task-empty">No tasks yet. Add one below!</p>
                  )}

                  {/* Inline Add Task Form */}
                  <form className="add-task-form" onSubmit={(e) => handleAddTask(e, subject.id)}>
                    <input
                      type="text"
                      placeholder="New task..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="input-field"
                      autoFocus
                    />
                    <button type="submit" className="btn-primary btn-sm" disabled={!newTaskText.trim()}>
                      <Plus size={16} />
                    </button>
                  </form>

                  {/* Delete Subject */}
                  <button
                    className="btn-delete-subject"
                    onClick={() => onDeleteSubject(subject.id)}
                  >
                    <Trash2 size={14} /> Delete Subject
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isAdding && (
          <form className="add-subject-form glass-panel" onSubmit={handleAdd}>
            <input
              type="text"
              placeholder="Subject name..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="input-field"
              autoFocus
            />
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="form-actions">
              <button type="button" className="btn-icon" onClick={() => setIsAdding(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary btn-sm">
                Save
              </button>
            </div>
          </form>
        )}

        {subjects.length === 0 && !isAdding && (
          <div className="empty-subjects">
            <p>No subjects yet. Create one to start studying!</p>
          </div>
        )}
      </div>
    </div>
  );
}
