import { useState } from 'react';
import { 
  auth, 
  DatabaseService, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from '../utils/db';
import { Warning, CheckCircle, EnvelopeOpen } from '@phosphor-icons/react';

export function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Verification check states
  const [verificationPending, setVerificationPending] = useState(false);
  const [resentStatus, setResentStatus] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        // Automatically dispatch verification if they haven't verified yet
        await sendEmailVerification(user);
        setVerificationPending(true);
        setLoading(false);
        return;
      }

      onLoginSuccess(user);
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
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

      // Seed mock records for this user in Firestore
      await DatabaseService.seedUserData(user.email, fullName.trim());

      // Send Verification Link
      await sendEmailVerification(user);
      setVerificationPending(true);
      setLoading(false);
    } catch (err) {
      setError(getFriendlyErrorMessage(err.code));
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    setError('');
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          onLoginSuccess(currentUser);
        } else {
          setError('Email is not verified yet. Please check your inbox.');
        }
      }
    } catch (err) {
      setError('Error refreshing authentication state.');
    }
    setLoading(false);
  };

  const resendVerification = async () => {
    setResentStatus('');
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setResentStatus('Verification link resent!');
        setTimeout(() => setResentStatus(''), 4000);
      }
    } catch (err) {
      setError('Failed to resend verification. Please try again later.');
    }
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

  if (verificationPending) {
    return (
      <div className="login-bg-overlay">
        <div className="login-auth-card nm-out">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <EnvelopeOpen size={48} weight="duotone" style={{ color: 'var(--accent)', marginBottom: '20px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Verify Your Email</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '24px', lineHeight: '1.6' }}>
              We sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
              Please click the link in your email to activate your account.
            </p>

            {error && (
              <div className="alert-box" style={{ marginBottom: '16px' }}>
                <Warning size={15} />
                <span>{error}</span>
              </div>
            )}

            {resentStatus && (
              <div className="success-box" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle size={15} />
                <span>{resentStatus}</span>
              </div>
            )}

            <button 
              className="cohort-btn cohort-btn-primary" 
              onClick={checkVerificationStatus}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }}
            >
              <span>I've verified my email</span>
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button 
                className="cohort-btn" 
                onClick={resendVerification}
                style={{ flex: 1, marginRight: '8px', justifyContent: 'center', fontSize: '12px' }}
              >
                Resend Link
              </button>
              <button 
                className="cohort-btn" 
                onClick={() => {
                  setVerificationPending(false);
                  setIsRegister(false);
                }}
                style={{ flex: 1, marginLeft: '8px', justifyContent: 'center', fontSize: '12px' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg-overlay">
      <div className="login-auth-card nm-out">
        <div className="login-brand-header">
          <div className="login-brand-icon">E</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Estudy</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>Learn From Home</p>
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
                placeholder="Martin Nel" 
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
              placeholder="name@university.edu" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="cohort-input" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
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

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          </span>
          <button 
            className="start-quiz-link"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{ border: 'none', background: 'none', fontWeight: '700', padding: 0, cursor: 'pointer' }}
          >
            {isRegister ? 'Sign In' : 'Register now'}
          </button>
        </div>
      </div>
    </div>
  );
}
