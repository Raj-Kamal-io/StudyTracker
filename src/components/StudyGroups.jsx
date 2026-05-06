import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from './AuthScreen';
import { GuestBanner } from './GuestBanner';
import { 
  Users, Plus, Copy, Check, ArrowLeft, LogIn, 
  Sparkles, UserPlus, Link2, Crown, BookOpen,
  Trash2, X
} from 'lucide-react';
import './StudyGroups.css';

const SIMULATED_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'];
const SIMULATED_AVATARS = ['🧑‍🎓', '👩‍💻', '🧑‍🔬', '👨‍🎨', '👩‍🏫', '🧑‍💼', '👨‍🔧', '👩‍⚕️'];
const STUDY_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'History', 'English', 'Biology', 'CS'];
const GROUPS_KEY = 'study-tracker-groups';
const GROUP_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
];

function getStoredGroups() {
  try { return JSON.parse(localStorage.getItem(GROUPS_KEY)) || []; } catch { return []; }
}
function saveGroups(g) { localStorage.setItem(GROUPS_KEY, JSON.stringify(g)); }

function generateInviteCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += c[Math.floor(Math.random() * c.length)];
  return code.slice(0, 4) + '-' + code.slice(4);
}

function generateMembers(count) {
  const shuffled = [...SIMULATED_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((name, i) => ({
    id: crypto.randomUUID(), name, avatar: SIMULATED_AVATARS[i],
    isStudying: Math.random() > 0.5,
    studyingSubject: STUDY_SUBJECTS[Math.floor(Math.random() * STUDY_SUBJECTS.length)],
    minutesStudied: Math.floor(Math.random() * 120),
  }));
}

function generateActivity(members) {
  const actions = [
    m => `${m.name} started studying ${m.studyingSubject}`,
    m => `${m.name} completed a 25-min session`,
    m => `${m.name} joined the group`,
    m => `${m.name} is on a break ☕`,
  ];
  const times = [2, 5, 12, 18, 25, 35];
  return Array.from({ length: Math.min(6, members.length * 2) }, (_, i) => {
    const m = members[i % members.length];
    return { id: i, text: actions[Math.floor(Math.random() * actions.length)](m), avatar: m.avatar, timeAgo: `${times[i] || i * 10}m ago` };
  });
}

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(GROUP_COLORS[0].value);
  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ id: crypto.randomUUID(), name: name.trim(), description: desc.trim(), color, inviteCode: generateInviteCode(), createdAt: new Date().toISOString(), members: generateMembers(Math.floor(Math.random() * 3) + 1) });
    onClose();
  };
  return (
    <div className="sg-modal-backdrop">
      <div className="sg-modal glass-panel animate-slide-up">
        <div className="sg-modal-header">
          <h3>Create Study Group</h3>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="sg-modal-body">
          <div className="sg-field">
            <label>Group Name</label>
            <input type="text" className="input-field" placeholder="e.g., Physics Study Squad" value={name} onChange={e => setName(e.target.value)} maxLength={40} autoFocus />
          </div>
          <div className="sg-field">
            <label>Description <span style={{opacity:0.5,fontSize:'0.75rem'}}>(optional)</span></label>
            <input type="text" className="input-field" placeholder="What's this group about?" value={desc} onChange={e => setDesc(e.target.value)} maxLength={80} />
          </div>
          <div className="sg-field">
            <label>Color</label>
            <div className="sg-color-picker">
              {GROUP_COLORS.map(c => (
                <button key={c.value} className={`sg-color-dot ${color === c.value ? 'selected' : ''}`} style={{ background: c.value }} onClick={() => setColor(c.value)} title={c.name} />
              ))}
            </div>
          </div>
        </div>
        <div className="sg-modal-footer">
          <button className="sg-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={!name.trim()} style={{opacity:name.trim()?1:0.5}}>
            <Sparkles size={16}/>Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinGroupModal({ onClose, onJoin, existingGroups }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const handleJoin = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    if (existingGroups.find(g => g.inviteCode === c)) { setError('Already in this group!'); return; }
    onJoin({ id: crypto.randomUUID(), name: `Study Group ${c.slice(0,4)}`, description: 'Joined via invite', color: GROUP_COLORS[Math.floor(Math.random()*GROUP_COLORS.length)].value, inviteCode: c, createdAt: new Date().toISOString(), members: generateMembers(Math.floor(Math.random()*4)+2), joined: true });
    onClose();
  };
  return (
    <div className="sg-modal-backdrop">
      <div className="sg-modal glass-panel animate-slide-up">
        <div className="sg-modal-header">
          <h3>Join Study Group</h3>
          <button className="btn-icon" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="sg-modal-body">
          <div className="sg-field">
            <label>Invite Code</label>
            <input type="text" className="input-field" placeholder="XXXX-XXXX" value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setError('');}} maxLength={9} autoFocus style={{textAlign:'center',fontFamily:"'Roboto Mono',monospace",fontSize:'1.2rem',letterSpacing:'0.15em'}}/>
          </div>
          {error && <p className="sg-error">{error}</p>}
          <p className="sg-hint">Ask your friend to share their group's invite code</p>
        </div>
        <div className="sg-modal-footer">
          <button className="sg-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleJoin} disabled={code.trim().length<4} style={{opacity:code.trim().length>=4?1:0.5}}>
            <UserPlus size={16}/>Join Group
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupDetail({ group, onBack, onDelete }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const { user } = useAuth();
  const activity = useMemo(() => generateActivity(group.members), [group.id]);
  const studyingCount = group.members.filter(m => m.isStudying).length;
  const handleCopy = () => { navigator.clipboard.writeText(group.inviteCode).catch(()=>{}); setCopiedCode(true); setTimeout(()=>setCopiedCode(false),2000); };
  const ownerName = user?.name || 'You';

  return (
    <div className="sg-detail animate-fade-in">
      <div className="sg-detail-header">
        <button className="sg-back-btn" onClick={onBack}><ArrowLeft size={18}/>Back</button>
        <button className="sg-delete-btn" onClick={()=>onDelete(group.id)} title="Leave Group"><Trash2 size={16}/></button>
      </div>

      <div className="sg-detail-info">
        <div className="sg-detail-color-bar" style={{background:group.color}}/>
        <h2 className="sg-detail-name">{group.name}</h2>
        {group.description && <p className="sg-detail-desc">{group.description}</p>}
      </div>

      <div className="sg-invite-section glass-panel">
        <div className="sg-invite-label"><Link2 size={16}/>Invite Code</div>
        <div className="sg-invite-code-row">
          <code className="sg-invite-code">{group.inviteCode}</code>
          <button className="sg-copy-btn" onClick={handleCopy}>
            {copiedCode ? <Check size={16}/> : <Copy size={16}/>}
            {copiedCode ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="sg-invite-hint">Share this code with friends to invite them</p>
      </div>

      <div className="sg-members-section">
        <h3 className="sg-section-title">
          <Users size={18}/>Members ({group.members.length+1})
          {studyingCount > 0 && <span className="sg-studying-badge">{studyingCount} studying now</span>}
        </h3>
        <div className="sg-members-list">
          <div className="sg-member-card">
            <div className="sg-member-avatar" style={{background:`${group.color}22`,color:group.color}}><Crown size={18}/></div>
            <div className="sg-member-info">
              <span className="sg-member-name">{ownerName} <span className="sg-you-badge">You</span></span>
              <span className="sg-member-status online">Online</span>
            </div>
          </div>
          {group.members.map(m => (
            <div key={m.id} className="sg-member-card">
              <div className={`sg-member-avatar ${m.isStudying ? 'studying' : ''}`}>
                <span>{m.avatar}</span>
                <div className={`sg-status-dot ${m.isStudying ? 'active' : 'offline'}`}/>
              </div>
              <div className="sg-member-info">
                <span className="sg-member-name">{m.name}</span>
                <span className={`sg-member-status ${m.isStudying ? 'studying' : 'offline'}`}>
                  {m.isStudying ? `Studying ${m.studyingSubject}` : 'Offline'}
                </span>
              </div>
              {m.isStudying && <div className="sg-member-time">{m.minutesStudied}m</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="sg-activity-section">
        <h3 className="sg-section-title"><BookOpen size={18}/>Recent Activity</h3>
        <div className="sg-activity-feed">
          {activity.map((a, i) => (
            <div key={a.id} className="sg-activity-item" style={{animationDelay:`${i*0.05}s`}}>
              <span className="sg-activity-avatar">{a.avatar}</span>
              <span className="sg-activity-text">{a.text}</span>
              <span className="sg-activity-time">{a.timeAgo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Auth gate shown inside the Groups tab ──
function GroupsAuthGate() {
  const { login, signup, startGuestMode } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      let result;
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setIsLoading(false); return; }
        result = signup(name, email, password);
      } else {
        result = login(email, password);
      }
      if (!result.success) setError(result.error);
      setIsLoading(false);
    }, 300);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(''); setName(''); setEmail(''); setPassword('');
  };

  return (
    <div className="sg-auth-gate animate-fade-in">
      <div className="sg-auth-card glass-panel">
        <div className="sg-auth-icon-wrap">
          <Users size={32} />
        </div>
        <h3>Sign in to access Study Groups</h3>
        <p className="sg-auth-desc">
          Create or join study groups, collaborate with friends, and track progress together.
        </p>

        {error && <div className="sg-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="sg-auth-form">
          {mode === 'signup' && (
            <input type="text" className="input-field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input type="email" className="input-field" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" className="input-field" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} />
          <button type="submit" className="btn-primary sg-auth-submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="sg-auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={switchMode} className="sg-auth-switch-btn">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        <div className="sg-auth-divider"><span>or</span></div>

        <button className="sg-auth-guest-btn" onClick={startGuestMode}>
          Try as Guest
          <span className="sg-auth-guest-badge">15 min preview</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Study Groups Component ──
export function StudyGroups() {
  const { isAuthenticated, isGuest, guestExpired, guestTimeLeft, logout } = useAuth();
  const [groups, setGroups] = useState(getStoredGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => { saveGroups(groups); }, [groups]);

  const handleCreate = (g) => setGroups(prev => [g, ...prev]);
  const handleJoin = (g) => setGroups(prev => [g, ...prev]);
  const handleDelete = (id) => { setGroups(prev => prev.filter(g => g.id !== id)); setSelectedGroup(null); };

  // Not authenticated and not guest → show inline auth
  if (!isAuthenticated && !isGuest) {
    return (
      <div className="sg-container">
        <GroupsAuthGate />
      </div>
    );
  }

  // Guest expired → show locked state
  if (isGuest && guestExpired) {
    return (
      <div className="sg-container" style={{ position: 'relative' }}>
        <div className="sg-locked-overlay">
          <div className="sg-locked-content animate-slide-up">
            <div className="sg-locked-icon"><LogIn size={40}/></div>
            <h3>Guest Session Expired</h3>
            <p>Sign up to keep access to Study Groups and all your data.</p>
            <button className="btn-primary" onClick={logout} style={{ marginTop: '1rem' }}>
              <LogIn size={16} /> Create Free Account
            </button>
          </div>
        </div>
        <div className="sg-blurred-preview">
          <div className="sg-empty-state">
            <div className="sg-empty-icon"><Users size={48}/></div>
            <h3>Study Groups</h3>
            <p>Create or join a group</p>
          </div>
        </div>
      </div>
    );
  }

  // Guest mode active — show banner + groups
  const guestBanner = isGuest ? (
    <div className="sg-guest-banner">
      <span>⏳ Guest preview: <strong>{Math.floor(guestTimeLeft/60)}:{String(guestTimeLeft%60).padStart(2,'0')}</strong> remaining</span>
      <button className="sg-guest-signup-btn" onClick={logout}>Sign up to save</button>
    </div>
  ) : null;

  if (selectedGroup) {
    const group = groups.find(g => g.id === selectedGroup);
    if (group) return (
      <div className="sg-container">
        {guestBanner}
        <GroupDetail group={group} onBack={()=>setSelectedGroup(null)} onDelete={handleDelete}/>
      </div>
    );
  }

  return (
    <div className="sg-container">
      {guestBanner}

      <div className="sg-header">
        <div>
          <h2 className="sg-title"><Users size={22}/>Study Groups</h2>
          <p className="sg-subtitle">Collaborate with friends and study together</p>
        </div>
        <div className="sg-header-actions">
          <button className="sg-btn-secondary" onClick={()=>setShowJoin(true)}>
            <UserPlus size={16}/>Join
          </button>
          <button className="btn-primary" onClick={()=>setShowCreate(true)} style={{padding:'0.6rem 1.2rem',fontSize:'0.85rem'}}>
            <Plus size={16}/>Create
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="sg-empty-state animate-fade-in">
          <div className="sg-empty-icon-wrap">
            <div className="sg-empty-icon"><Users size={48}/></div>
          </div>
          <h3>No Study Groups Yet</h3>
          <p>Create your first group or join one with an invite code.</p>
          <div className="sg-empty-actions">
            <button className="btn-primary" onClick={()=>setShowCreate(true)} style={{padding:'0.75rem 1.5rem'}}>
              <Sparkles size={16}/>Create Your First Group
            </button>
            <button className="sg-btn-secondary" onClick={()=>setShowJoin(true)}>
              <Link2 size={16}/>Join with Code
            </button>
          </div>
        </div>
      ) : (
        <div className="sg-grid">
          {groups.map(group => {
            const sc = group.members.filter(m => m.isStudying).length;
            return (
              <div key={group.id} className="sg-group-card glass-panel" onClick={()=>setSelectedGroup(group.id)}>
                <div className="sg-card-accent" style={{background:group.color}}/>
                <div className="sg-card-body">
                  <h4 className="sg-card-name">{group.name}</h4>
                  {group.description && <p className="sg-card-desc">{group.description}</p>}
                  <div className="sg-card-meta">
                    <span className="sg-card-members"><Users size={14}/>{group.members.length+1} members</span>
                    {sc > 0 && <span className="sg-card-active"><span className="sg-pulse-dot" style={{background:group.color}}/>{sc} studying</span>}
                  </div>
                  <div className="sg-card-avatars">
                    <div className="sg-mini-avatar" style={{background:`${group.color}33`,color:group.color,fontWeight:700,fontSize:'0.65rem'}}>You</div>
                    {group.members.slice(0,4).map((m,i) => (
                      <div key={m.id} className="sg-mini-avatar" style={{zIndex:5-i}}>{m.avatar}</div>
                    ))}
                    {group.members.length > 4 && <div className="sg-mini-avatar sg-mini-more">+{group.members.length-4}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={()=>setShowCreate(false)} onCreate={handleCreate}/>}
      {showJoin && <JoinGroupModal onClose={()=>setShowJoin(false)} onJoin={handleJoin} existingGroups={groups}/>}
    </div>
  );
}
