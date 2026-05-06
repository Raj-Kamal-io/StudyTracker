import { useAuth } from '../context/AuthContext';
import { Clock, ArrowRight } from 'lucide-react';
import './GuestBanner.css';

export function GuestBanner({ onLoginClick }) {
  const { guestTimeLeft, guestExpired } = useAuth();

  const mins = Math.floor(guestTimeLeft / 60);
  const secs = guestTimeLeft % 60;
  const progress = (guestTimeLeft / (15 * 60)) * 100;

  return (
    <>
      {/* Top banner */}
      <div className="guest-banner">
        <div className="guest-banner-inner">
          <div className="guest-banner-left">
            <Clock size={16} />
            <span className="guest-banner-label">Guest Mode</span>
            <span className="guest-banner-time">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
          <button className="guest-banner-cta" onClick={onLoginClick}>
            Sign up to save
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="guest-banner-progress">
          <div 
            className="guest-banner-progress-fill" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Expiry overlay */}
      {guestExpired && (
        <div className="guest-expired-overlay">
          <div className="guest-expired-card glass-panel animate-slide-up">
            <div className="guest-expired-icon">
              <Clock size={48} />
            </div>
            <h2>Guest Session Expired</h2>
            <p>Your 15-minute trial has ended. Sign up to keep your data and unlock all features.</p>
            <button className="auth-submit-btn" onClick={onLoginClick} style={{ maxWidth: '300px' }}>
              Create Free Account
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
