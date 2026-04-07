import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/security';
import './Auth.css';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special char', pass: /[!@#$%^&*()_+\-=\[\]{}|]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="pwd-strength">
      <div className="pwd-bars">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="pwd-bar"
            style={{ background: i < score ? colors[score - 1] : '#E5E7EB' }}
          />
        ))}
      </div>
      <div className="pwd-checks">
        {checks.map(c => (
          <span key={c.label} className={`pwd-check ${c.pass ? 'pass' : ''}`}>
            {c.pass ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { login, signup, legacyLogin, legacySignup, isLoggedIn } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRateLimitMsg('');

    const cleanEmail = sanitizeInput(email);
    const cleanName = sanitizeInput(name);

    // Client-side validation
    if (!cleanEmail) return setError('Please enter your email.');
    if (!validateEmail(cleanEmail)) return setError('Please enter a valid email address.');
    if (!password) return setError('Please enter your password.');

    const isTestAccount = cleanEmail === 'test@gmail.com';

    if (mode === 'signup' && !isTestAccount) {
      if (!cleanName) return setError('Please enter your name.');
      const pwCheck = validatePassword(password);
      if (!pwCheck.valid) return setError(`Password must have: ${pwCheck.errors.join(', ')}`);
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(cleanEmail, password);
        if (!result?.success) {
          if (result?.error?.includes('Too many')) {
            setRateLimitMsg(result.error);
          } else {
            setError(result?.error || 'Login failed unexpectedly. Please try again.');
          }
          setLoading(false);
          return;
        }
        setLoading(false);
        navigate('/dashboard');
      } else {
        const result = await signup(cleanName, cleanEmail, password);
        if (!result?.success) {
          setError(result?.error || 'Signup failed unexpectedly. Please try again.');
          setLoading(false);
          return;
        }
        setLoading(false);
        navigate('/link-bank');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'A critical error occurred while communicating with the server.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-container animate-scale">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <svg className="logo-icon-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10V90M10 50H90M22 22L78 78M22 78L78 22" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
          </svg>
        </Link>

        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome back 👋' : 'Lock your first goal 🎯'}
        </h2>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Track your goals. Own what you want, sooner.'
            : 'Join free — no credit card, no EMI, no regret.'}
        </p>

        {/* Trust badges */}
        <div className="auth-trust-row">
          <span className="trust-badge">🔐 Bank-grade security</span>
          <span className="trust-badge">💸 Withdraw anytime</span>
          <span className="trust-badge">✅ No hidden fees</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <input
                id="auth-name"
                className="input"
                type="text"
                placeholder="Priya Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="input-password-wrap">
              <input
                id="auth-password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                className="pwd-toggle"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {mode === 'signup' && <PasswordStrength password={password} />}
          </div>

          {error && <div className="auth-error" role="alert">{error}</div>}
          {rateLimitMsg && (
            <div className="auth-error auth-rate-limit" role="alert">
              🚫 {rateLimitMsg}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              mode === 'login' ? 'Sign In →' : 'Start Saving Free →'
            )}
          </button>
        </form>

        {/* Demo removed */}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button className="auth-link" onClick={() => { setMode('signup'); setError(''); setPassword(''); }}>
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="auth-link" onClick={() => { setMode('login'); setError(''); setPassword(''); }}>
                Sign in
              </button>
            </>
          )}
        </div>

        <p className="auth-legal">
          By continuing you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a>. Your data is encrypted and never shared.
        </p>
      </div>
    </div>
  );
}
