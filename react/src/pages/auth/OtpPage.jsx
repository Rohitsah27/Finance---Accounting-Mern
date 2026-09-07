import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function OtpPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [digits, setDigits] = useState(['8', '4', '9', '2', '1', '0']);
  const [toastMessage, setToastMessage] = useState(null);
  const inputRefs = useRef([]);

  const userEmail = sessionStorage.getItem('login_email') || currentUser?.email || 'carrier@gmail.com';

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDigitChange = (index, value) => {
    const val = value.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length < 6) {
      showToast('Please enter all 6 digits of the OTP code', 'error');
      return;
    }
    showToast('OTP verified successfully. Loading workspace...', 'success');
    const skipOnboarding = sessionStorage.getItem('skip_onboarding') !== '0';
    setTimeout(() => {
      navigate(skipOnboarding ? '/' : '/onboarding');
    }, 400);
  };

  const handleResend = () => {
    showToast('A new 6-digit code has been sent to ' + userEmail, 'info');
  };

  return (
    <div className="auth-wrap">
      {toastMessage && (
        <div className={`veridex-toast veridex-toast-${toastMessage.type}`}>
          <span>{toastMessage.type === 'error' ? '✕' : toastMessage.type === 'success' ? '✓' : 'ⓘ'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      <div className="auth-panel">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="otpVdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="6" fill="#22262E" />
              <path d="M7 10L13 22L17 14" stroke="url(#otpVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 10H21C23.76 10 26 12.24 26 15C26 17.76 23.76 20 21 20H17V10Z" stroke="url(#otpVdGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFFFFF' }}>Veri</span>
                <span style={{ color: 'var(--color-brand)' }}>Dex</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-muted)', letterSpacing: '2px', marginTop: '4px' }}>
                SECURITY & IDENTITY
              </div>
            </div>
            <div className="auth-left-tagline">Two-Factor Security Verification</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right">
          <div className="auth-title">Verify your OTP</div>
          <div className="auth-subtitle">Please enter your 6-digit access code.</div>

          <div className="otp-email-hint">
            Enter OTP sent to {userEmail}
          </div>

          <div className="otp-inputs">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="otp-digit"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button type="button" className="auth-btn" onClick={handleVerify}>
            Verify Code →
          </button>

          <div className="otp-resend">
            Didn't receive the OTP? &nbsp;
            <a onClick={handleResend}>Resend Code</a>
          </div>

          <div className="auth-link" style={{ marginTop: '24px' }} onClick={() => navigate('/login')}>
            ← Back to Sign In
          </div>
        </div>
      </div>
    </div>
  );
}
