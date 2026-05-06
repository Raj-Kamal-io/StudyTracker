import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Mail, Lock, User, Eye, EyeOff, ArrowRight, Clock } from 'lucide-react';
import './AuthScreen.css';

export function AuthScreen() {
  const { login, signup, startGuestMode } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      let result;
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setIsLoading(false);
          return;
        }
        result = signup(name, email, password);
      } else {
        result = login(email, password);
      }

      if (!result.success) {
        setError(result.error);
      }
      setIsLoading(false);
    }, 400); // Small delay for UX feel
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-screen">
      {/* Animated background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="auth-card glass-panel animate-slide-up">
        {/* Logo */}
        <div className="auth-logo">
          <BrainCircuit size={40} className="auth-logo-icon" />
          <h1>Study<span className="text-gradient">Tracker</span></h1>
        </div>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
        </p>

        {/* Error message */}
        {error && (
          <div className="auth-error animate-fade-in">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-input-group animate-fade-in">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="auth-input"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-input-group">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="auth-input"
              required
              minLength={4}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-spinner" />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={switchMode} className="auth-switch-btn">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Guest mode */}
        <button
          className="auth-guest-btn"
          onClick={startGuestMode}
        >
          <Clock size={16} />
          Continue as Guest
          <span className="auth-guest-badge">15 min trial</span>
        </button>
      </div>
    </div>
  );
}
