import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('carrier@gmail.com');
  const [password, setPassword] = useState('admin@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [skipOnboarding, setSkipOnboarding] = useState(true);
  const [errorToast, setErrorToast] = useState(null);
  const [infoToast, setInfoToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorToast(null);

    const allowed = ['admin@veridex.com', 'carrier@gmail.com', 'mga@gmail.com', 'broker@gmail.com', 'insured@gmail.com', 'reinsurer@gmail.com'];
    const trimmed = email.trim().toLowerCase();

    if (!allowed.includes(trimmed) || password !== 'admin@123') {
      setErrorToast('Invalid email or password. Please use admin@123.');
      setTimeout(() => setErrorToast(null), 3500);
      return;
    }

    sessionStorage.setItem('login_email', trimmed);
    sessionStorage.setItem('login_remember', rememberMe ? '1' : '0');
    sessionStorage.setItem('skip_onboarding', skipOnboarding ? '1' : '0');

    await login(trimmed, password, rememberMe);
    navigate('/otp');
  };

  const handleForgotPassword = () => {
    setInfoToast('Password reset link sent (simulated)');
    setTimeout(() => setInfoToast(null), 3000);
  };

  return (
    <div className="auth-wrap">
      {errorToast && (
        <div className="veridex-toast veridex-toast-error">
          <span>✕</span>
          <span>{errorToast}</span>
        </div>
      )}
      {infoToast && (
        <div className="veridex-toast veridex-toast-info">
          <span>ⓘ</span>
          <span>{infoToast}</span>
        </div>
      )}

      <div className="auth-panel">
        {/* Left Brand Panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authVdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="6" fill="#22262E" />
              <path d="M7 10L13 22L17 14" stroke="url(#authVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#authVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFFFFF' }}>Veri</span>
                <span style={{ color: 'var(--color-brand)' }}>Dex</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '2px', marginTop: '4px' }}>
                PLATFORM ARCHITECTURE
              </div>
            </div>
            <div className="auth-left-tagline">Trusted Intelligence. Insurance Transformed.</div>
          </div>
        </div>

        {/* Right Sign-in Form */}
        <div className="auth-right">
          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">Sign in to your VeriDex workspace</div>

          {/* Quick Demo Credentials */}
          <div style={{
            margin: '12px 0 16px 0',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              QUICK DEMO USERS (Password: <code style={{ color: '#f97316' }}>admin@123</code>):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { label: '🛡️ Carrier', email: 'carrier@gmail.com' },
                { label: '📙 MGA', email: 'mga@gmail.com' },
                { label: '🏢 Broker', email: 'broker@gmail.com' }
              ].map(demo => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword('admin@123');
                  }}
                  style={{
                    background: email.toLowerCase() === demo.email ? '#f97316' : 'rgba(255, 255, 255, 0.08)',
                    color: email.toLowerCase() === demo.email ? '#fff' : '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          <form id="login-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="email">Email *</label>
              <input
                className="auth-input"
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-label" htmlFor="password">Password *</label>
              <input
                className="auth-input"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="auth-form-group" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                Remember me for 30 days
              </label>
            </div>

            <div className="auth-form-group" style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="skip-onboarding"
                checked={skipOnboarding}
                onChange={(e) => setSkipOnboarding(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand)', cursor: 'pointer' }}
              />
              <label htmlFor="skip-onboarding" style={{ color: 'var(--color-muted)', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                Don't show onboarding screen (Go directly to dashboard)
              </label>
            </div>

            <button type="submit" className="auth-btn">Sign In →</button>
          </form>

          <div className="auth-link" onClick={handleForgotPassword}>
            Forgot Password?
          </div>
        </div>
      </div>
    </div>
  );
}
