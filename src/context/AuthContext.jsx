import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

const USERS_KEY = 'study-tracker-users';
const CURRENT_USER_KEY = 'study-tracker-current-user';
const GUEST_START_KEY = 'study-tracker-guest-start';
const GUEST_DURATION = 15 * 60; // 15 minutes in seconds

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Simple hash for demo purposes (NOT secure)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredCurrentUser());
  const [isGuest, setIsGuest] = useState(() => {
    const guestStart = localStorage.getItem(GUEST_START_KEY);
    if (guestStart && !getStoredCurrentUser()) {
      const elapsed = Math.floor((Date.now() - parseInt(guestStart)) / 1000);
      return elapsed < GUEST_DURATION;
    }
    return false;
  });
  const [guestTimeLeft, setGuestTimeLeft] = useState(() => {
    const guestStart = localStorage.getItem(GUEST_START_KEY);
    if (guestStart) {
      const elapsed = Math.floor((Date.now() - parseInt(guestStart)) / 1000);
      return Math.max(0, GUEST_DURATION - elapsed);
    }
    return GUEST_DURATION;
  });
  const [guestExpired, setGuestExpired] = useState(false);

  const timerRef = useRef(null);

  // Guest countdown timer
  useEffect(() => {
    if (isGuest && guestTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setGuestTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGuestExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isGuest]);

  const signup = useCallback((name, email, password) => {
    const users = getStoredUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: simpleHash(password),
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    setIsGuest(false);
    setGuestExpired(false);
    localStorage.removeItem(GUEST_START_KEY);
    return { success: true };
  }, []);

  const login = useCallback((email, password) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email.toLowerCase().trim());
    if (!found) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (found.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Incorrect password.' };
    }
    const safeUser = { id: found.id, name: found.name, email: found.email };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    setUser(safeUser);
    setIsGuest(false);
    setGuestExpired(false);
    localStorage.removeItem(GUEST_START_KEY);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(GUEST_START_KEY);
    setUser(null);
    setIsGuest(false);
    setGuestExpired(false);
    setGuestTimeLeft(GUEST_DURATION);
    clearInterval(timerRef.current);
  }, []);

  const startGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_START_KEY, Date.now().toString());
    setIsGuest(true);
    setGuestExpired(false);
    setGuestTimeLeft(GUEST_DURATION);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isGuest,
      guestTimeLeft,
      guestExpired,
      login,
      signup,
      logout,
      startGuestMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
