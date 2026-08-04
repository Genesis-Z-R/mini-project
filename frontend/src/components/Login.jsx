import { useState, useEffect } from 'react';
import { 
  auth, 
  DatabaseService, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  confirmPasswordReset
} from '../utils/db';
import { Warning, CheckCircle, EnvelopeOpen, Eye, EyeSlash } from '@phosphor-icons/react';

export function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotPasswordView, setForgotPasswordView] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (token) {
      setForgotPasswordView('confirm');
      setResetToken(token.trim());
      if (email) setResetEmail(email.trim());
    }
  }, []);

  useEffect(() => {
    if (forgotPasswordView !== 'confirm') return;
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl && !resetToken) {
      setResetToken(tokenFromUrl.trim());
    }
  }, [forgotPasswordView, resetToken]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await DatabaseService.seedUserData(user.email, fullName.trim());
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetSuccess('Password reset link sent to your email.');
      setForgotPasswordView('sent');
    } catch (err) {
      setResetError('Failed to send reset link. Please try again.');
    }
    setResetLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      const token = (resetToken || '').trim();
      if (!token) {
        throw new Error('Reset token is required.');
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }
      await confirmPasswordReset(token, newPassword);
      setResetSuccess('Password has been reset successfully! You can now sign in with your new password.');
      setForgotPasswordView('done');
      if (window.history.replaceState) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        cleanUrl.searchParams.delete('email');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset password. Please try again.');
    }
    setResetLoading(false);
  };

  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/user-disabled': return 'This user account has been disabled.';
      case 'auth/user-not-found': return 'No account found with this email.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use': return 'An account already exists with this email.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      default: return 'An unexpected login error occurred. Please try again.';
    }
  };

  if (forgotPasswordView === 'sent' || forgotPasswordView === 'done') {
    const isDone = forgotPasswordView === 'done';
    return (
      <div className="login-bg-overlay">
        <div className="login-split-layout">
          <div className="login-visual-panel" />
          <div className="login-auth-card nm-out">
            <div className="login-brand-header">
              <div className="login-brand-row">
                <div className="login-brand-icon">E</div>
                <div className="login-brand-text">
                  <h2 className="login-brand-title">Estudy</h2>
                  <p className="login-brand-tagline">Learn From Home</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <EnvelopeOpen size={48} weight="duotone" style={{ color: 'var(--accent)', marginBottom: '20px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                {isDone ? 'Password Reset Complete' : 'Check Your Email'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.6' }}>
                {isDone
                  ? 'Your password has been reset successfully. You can now sign in with your new password.'
                  : 'We sent a password reset link to your email. Please check your inbox and follow the instructions to set a new password.'}
              </p>

              {resetError && (
                <div className="alert-box" style={{ marginBottom: '16px' }}>
                  <Warning size={15} />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="success-box" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={15} />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <button
                className="cohort-btn cohort-btn-primary"
                onClick={() => {
                  setForgotPasswordView(null);
                  setResetEmail('');
                  setResetToken('');
                  setNewPassword('');
                  setResetError('');
                  setResetSuccess('');
                  setIsRegister(false);
                }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>Back to Login</span>
              </button>

              {!isDone && (
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
                  <button
                    className="start-quiz-link"
                    onClick={() => {
                      setForgotPasswordView('confirm');
                      setResetError('');
                      setResetSuccess('');
                    }}
                    style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                  >
                    Use a reset token
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (forgotPasswordView === 'request') {
    return (
      <div className="login-bg-overlay">
        <div className="login-split-layout">
          <div className="login-visual-panel" />
          <div className="login-auth-card nm-out">
            <div className="login-brand-header">
              <div className="login-brand-icon">E</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#000000' }}>Reset Password</h2>
              <p style={{ fontSize: '12.5px', color: '#000000' }}>Enter your email to receive a reset link</p>
            </div>

            {resetError && (
              <div className="alert-box" style={{ marginBottom: '20px' }}>
                <Warning size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSendResetEmail}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#000000' }}>Email Address</label>
                <input
                  type="email"
                  className="cohort-input"
                  placeholder="name@gmail.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="cohort-btn cohort-btn-primary"
                disabled={resetLoading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px', fontWeight: 700, color: '#ffffff' }}
              >
                <span>{resetLoading ? 'Sending...' : 'Send Reset Link'}</span>
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#000000' }}>Remember your password?{' '}</span>
              <button
                className="start-quiz-link"
                onClick={() => {
                  setForgotPasswordView(null);
                  setResetError('');
                  setResetSuccess('');
                }}
                style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px' }}>
              <button
                className="start-quiz-link"
                onClick={() => {
                  setForgotPasswordView('confirm');
                  setResetToken('');
                  setNewPassword('');
                  setResetError('');
                }}
                style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
              >
                Use a reset token
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (forgotPasswordView === 'confirm') {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('token');
    return (
      <div className="login-bg-overlay">
        <div className="login-split-layout">
          <div className="login-visual-panel" />
          <div className="login-auth-card nm-out">
            <div className="login-brand-header">
              <div className="login-brand-icon">E</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#000000' }}>Set New Password</h2>
              <p style={{ fontSize: '12.5px', color: '#000000' }}>
                {tokenFromUrl ? 'Enter your new password' : 'Enter the reset token and your new password'}
              </p>
            </div>

            {resetError && (
              <div className="alert-box" style={{ marginBottom: '20px' }}>
                <Warning size={16} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              {!tokenFromUrl && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#000000' }}>Reset Token</label>
                  <input
                    type="text"
                    className="cohort-input"
                    placeholder="Enter reset token from email"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ color: '#000000' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="cohort-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'oklch(0.52 0.02 260)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="cohort-btn cohort-btn-primary"
                disabled={resetLoading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px', fontWeight: 700, color: '#ffffff' }}
              >
                <span>{resetLoading ? 'Resetting...' : 'Reset Password'}</span>
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
              <span style={{ color: '#000000' }}>Back to login?{' '}</span>
              <button
                className="start-quiz-link"
                onClick={() => {
                  setForgotPasswordView(null);
                  setResetError('');
                  setResetSuccess('');
                }}
                style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg-overlay">
      <div className="login-split-layout">
        <div className="login-visual-panel" />
        <div className="login-auth-card nm-out">
          <div className="login-brand-header">
            <div className="login-brand-row">
              <div className="login-brand-icon">E</div>
              <div className="login-brand-text">
                <h2 className="login-brand-title">Estudy</h2>
                <p className="login-brand-tagline">Learn From Home</p>
              </div>
            </div>
          </div>

        {error && (
          <div className="alert-box" style={{ marginBottom: '20px' }}>
            <Warning size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleSignIn}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="cohort-input" 
                placeholder="Kwame Asare" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="cohort-input" 
              placeholder="name@gmail.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                className="cohort-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: 'oklch(0.52 0.02 260)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
               </button>
             </div>
           </div>

           <button 
             type="submit" 
             className="cohort-btn cohort-btn-primary" 
             disabled={loading}
             style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }}
           >
             <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}</span>
           </button>
         </form>

          {!isRegister ? (
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '700', color: '#000000' }}>
                Don't have an account?
              </div>
              <div>
                <button
                  className="start-quiz-link"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                >
                  Register Now
                </button>
              </div>
              <div style={{ marginTop: '14px' }}>
                <button
                  className="start-quiz-link"
                  onClick={() => {
                    setForgotPasswordView('request');
                    setResetEmail(email || '');
                    setResetError('');
                    setResetSuccess('');
                  }}
                  style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: '700', color: '#000000' }}>
                Already have an account?
              </div>
              <div>
                <button
                  className="start-quiz-link"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}