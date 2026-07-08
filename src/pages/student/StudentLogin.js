import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .al-login-page {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', sans-serif;
    background: #080b12;
  }

  /* ── Left Panel ── */
  .al-login-left {
    width: 45%;
    min-height: 100vh;
    background: linear-gradient(145deg, #0f1322 0%, #0d1020 50%, #080b12 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
  }
  .al-login-left::before {
    content: '';
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,.12) 0%, transparent 65%);
    top: -100px; left: -100px;
    pointer-events: none;
  }
  .al-login-left::after {
    content: '';
    position: absolute;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(38,128,199,.08) 0%, transparent 65%);
    bottom: -60px; right: -60px;
    pointer-events: none;
  }

  .al-logo {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }
  .al-logo-mark {
    width: 44px; height: 44px;
    border-radius: 13px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(255,60,46,.35);
    flex-shrink: 0;
    display: block;
    object-fit: cover;
  }
  .al-logo-text { line-height: 1.25; }
  .al-logo-name { font-size: 14px; font-weight: 800; color: #fff; }
  .al-logo-tagline { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 2px; }

  .al-hero {
    position: relative;
    z-index: 1;
  }
  .al-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,60,46,.12);
    border: 1px solid rgba(255,60,46,.2);
    border-radius: 99px;
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 600;
    color: #ff7a70;
    letter-spacing: .04em;
    margin-bottom: 24px;
  }
  .al-hero-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #ff3c2e;
  }
  .al-hero-title {
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 1.15;
    margin-bottom: 16px;
    letter-spacing: -.02em;
  }
  .al-hero-title span {
    background: linear-gradient(135deg, #ff3c2e, #ff7a6e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .al-hero-desc {
    font-size: 14px;
    color: rgba(255,255,255,.35);
    line-height: 1.7;
    max-width: 340px;
  }

  .al-features {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 1;
  }
  .al-feature {
    display: flex;
    align-items: center;
    gap: 13px;
  }
  .al-feature-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .al-feature-text { font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.4; }
  .al-feature-text strong { color: rgba(255,255,255,.75); font-weight: 600; display: block; font-size: 13px; }

  /* ── Right Panel ── */
  .al-login-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    background: #080b12;
    position: relative;
  }
  .al-login-right::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(255,60,46,.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .al-form-wrap {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 1;
  }

  .al-form-header { margin-bottom: 36px; }
  .al-form-title {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -.02em;
    margin-bottom: 8px;
  }
  .al-form-subtitle {
    font-size: 13.5px;
    color: rgba(255,255,255,.3);
    line-height: 1.6;
  }

  .al-field { margin-bottom: 18px; }
  .al-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin-bottom: 8px;
  }
  .al-input-wrap { position: relative; }
  .al-input-icon {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,.2);
    display: flex; align-items: center;
    pointer-events: none;
  }
  .al-input {
    width: 100%;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #e8eaf0;
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px;
    padding: 14px 16px 14px 44px;
    outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .al-input::placeholder { color: rgba(255,255,255,.18); }
  .al-input:focus {
    border-color: rgba(255,60,46,.5);
    background: rgba(255,255,255,.05);
    box-shadow: 0 0 0 4px rgba(255,60,46,.08);
  }
  .al-input.no-icon { padding-left: 16px; }

  .al-pw-toggle {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: rgba(255,255,255,.2);
    display: flex; align-items: center; padding: 4px;
    transition: color .2s;
  }
  .al-pw-toggle:hover { color: rgba(255,255,255,.5); }

  .al-btn {
    width: 100%;
    margin-top: 8px;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #ff3c2e 0%, #d92d20 100%);
    border: none;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 8px 28px rgba(255,60,46,.3);
    letter-spacing: .01em;
  }
  .al-btn:hover:not(:disabled) {
    opacity: .9;
    transform: translateY(-1px);
    box-shadow: 0 12px 36px rgba(255,60,46,.38);
  }
  .al-btn:active:not(:disabled) { transform: translateY(0); }
  .al-btn:disabled {
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.2);
    cursor: not-allowed;
    box-shadow: none;
  }

  .al-error {
    margin-top: 16px;
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,60,46,.08);
    border: 1px solid rgba(255,60,46,.2);
    border-radius: 11px;
    padding: 13px 15px;
    font-size: 13px;
    color: #ff7a70;
    line-height: 1.5;
  }
  .al-error svg { flex-shrink: 0; margin-top: 1px; }

  .al-divider {
    display: flex; align-items: center; gap: 14px;
    margin: 24px 0;
  }
  .al-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,.06); }
  .al-divider-text { font-size: 12px; color: rgba(255,255,255,.2); }

  .al-signup-row {
    text-align: center;
    font-size: 13.5px;
    color: rgba(255,255,255,.3);
  }
  .al-signup-row a {
    color: #ff6a60;
    font-weight: 600;
    text-decoration: none;
    transition: color .2s;
  }
  .al-signup-row a:hover { color: #ff3c2e; }

  .al-hint {
    margin-top: 16px;
    text-align: center;
    font-size: 12px;
    color: rgba(255,255,255,.15);
    line-height: 1.65;
  }

  @keyframes al-spin { to { transform: rotate(360deg); } }
  .al-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: al-spin .6s linear infinite;
    flex-shrink: 0;
  }

  /* ── Forgot-password link ── */
  .al-pw-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .al-pw-row .al-label { margin-bottom: 0; }
  .al-forgot-link {
    background: none; border: none; padding: 0;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,.3);
    cursor: pointer;
    transition: color .2s;
    text-decoration: none;
  }
  .al-forgot-link:hover { color: #ff6a60; }

  /* ── Forgot-password view ── */
  .al-fp-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; padding: 0;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.3);
    cursor: pointer; margin-bottom: 28px;
    transition: color .2s; text-decoration: none;
  }
  .al-fp-back:hover { color: rgba(255,255,255,.65); }

  .al-fp-icon {
    width: 52px; height: 52px;
    border-radius: 16px;
    background: rgba(255,60,46,.1);
    border: 1px solid rgba(255,60,46,.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
  }

  /* ── Reset-sent success view ── */
  .al-rs-ring {
    width: 68px; height: 68px;
    border-radius: 50%;
    background: rgba(38,128,199,.1);
    border: 2px solid rgba(38,128,199,.25);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px;
  }
  .al-rs-title {
    font-size: 24px; font-weight: 800; color: #fff;
    letter-spacing: -.02em; margin-bottom: 10px;
    text-align: center;
  }
  .al-rs-body {
    font-size: 13.5px; color: rgba(255,255,255,.35);
    line-height: 1.7; text-align: center; margin-bottom: 8px;
  }
  .al-rs-email {
    display: inline-block;
    font-weight: 600; color: rgba(255,255,255,.65);
    word-break: break-all;
  }
  .al-rs-note {
    margin-top: 18px;
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(38,128,199,.07);
    border: 1px solid rgba(38,128,199,.18);
    border-radius: 11px; padding: 13px 15px;
    font-size: 12.5px; color: rgba(255,255,255,.35); line-height: 1.6;
  }
  .al-rs-note svg { flex-shrink: 0; margin-top: 1px; color: rgba(38,128,199,.7); }
  .al-rs-back-btn {
    width: 100%; margin-top: 24px;
    font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 700; color: #fff;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 12px; padding: 14px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .2s, border-color .2s;
  }
  .al-rs-back-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.16); }

  /* ── Success / info message ── */
  .al-success {
    margin-top: 16px;
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(39,149,107,.08);
    border: 1px solid rgba(39,149,107,.2);
    border-radius: 11px; padding: 13px 15px;
    font-size: 13px; color: #4fc99a; line-height: 1.5;
  }
  .al-success svg { flex-shrink: 0; margin-top: 1px; }

  @media (max-width: 900px) {
    .al-login-left { display: none; }
  }
  @media (max-width: 480px) {
    .al-login-right { padding: 32px 20px; }
    .al-form-title { font-size: 24px; }
  }
`;

// view: 'login' | 'forgot' | 'reset-sent'
export default function StudentLogin() {
  const navigate = useNavigate();

  // login state
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // forgot-password state
  const [view,         setView]         = useState('login');
  const [resetEmail,   setResetEmail]   = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError,   setResetError]   = useState('');

  // Open forgot-password view, pre-filling email if the user typed one
  const openForgot = () => {
    const pre = identifier.trim().includes('@') ? identifier.trim() : '';
    setResetEmail(pre);
    setResetError('');
    setView('forgot');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    const em = resetEmail.trim().toLowerCase();

    if (!em) { setResetError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, em);
      // Always show success — avoids exposing whether the email exists (security best practice)
      setView('reset-sent');
    } catch (err) {
      if (err.code === 'auth/invalid-email') {
        setResetError('That doesn\'t look like a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setResetError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        // Covers auth/user-not-found and anything else — show generic success
        // to avoid email enumeration, but still unblock the user
        setView('reset-sent');
      }
    }
    setResetLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const raw = identifier.trim();
    const pw  = password;
    if (!raw) { setError('Please enter your email or Student ID.'); return; }
    if (!pw)  { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      let emailToUse = raw;

      if (!raw.includes('@')) {
        const sid  = raw.toUpperCase();
        const snap = await getDocs(
          query(collection(db, 'registrations'), where('studentId', '==', sid))
        );
        if (snap.empty) {
          setError('Student ID not found. Please check and try again.');
          setLoading(false); return;
        }
        const data = snap.docs[0].data();
        if (data.status !== 'approved') {
          setError('Your registration is not yet approved. Please contact the administrator.');
          setLoading(false); return;
        }
        emailToUse = data.email;
      }

      if (emailToUse === 'admin@al.lk') {
        await signInWithEmailAndPassword(auth, emailToUse, pw);
        sessionStorage.setItem('al_admin', '1');
        setLoading(false);
        navigate('/admin');
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, emailToUse, pw);

      const snap2 = await getDocs(
        query(collection(db, 'registrations'), where('email', '==', cred.user.email))
      );
      if (!snap2.empty) {
        localStorage.setItem('slk_student', JSON.stringify({
          ...snap2.docs[0].data(),
          docId: snap2.docs[0].id
        }));
      }

      navigate('/student');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Incorrect email/Student ID or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a moment and try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Your account has been disabled. Please contact the administrator.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="al-login-page">

        {/* Left branding panel */}
        <div className="al-login-left">
          <div className="al-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/AL.lk%20Logo.webp" alt="AL.LK" className="al-logo-mark" />
            <div className="al-logo-text">
              <div className="al-logo-name">AL.LK</div>
              <div className="al-logo-tagline">Student Learning Portal</div>
            </div>
          </div>

          <div className="al-hero">
            <div className="al-hero-badge">
              <span className="al-hero-badge-dot" />
              Sri Lanka A/L Platform
            </div>
            <div className="al-hero-title">
              Learn smarter,<br />achieve <span>more</span>.
            </div>
            <div className="al-hero-desc">
              Access your class recordings, live sessions, study materials,
              and payment history — all in one place.
            </div>
          </div>

          <div className="al-features">
            <div className="al-feature">
              <div className="al-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
              </div>
              <div className="al-feature-text">
                <strong>Class Recordings</strong>
                Revisit lessons anytime, on any device.
              </div>
            </div>
            <div className="al-feature">
              <div className="al-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="al-feature-text">
                <strong>Live Sessions</strong>
                Join Zoom classes with one click.
              </div>
            </div>
            <div className="al-feature">
              <div className="al-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div className="al-feature-text">
                <strong>Study Materials</strong>
                Download notes, papers &amp; resources.
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="al-login-right">
          <div className="al-form-wrap">

            <Link to="/" className="al-fp-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Home
            </Link>

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <>
                <div className="al-form-header">
                  <div className="al-form-title">Welcome back</div>
                  <div className="al-form-subtitle">
                    Sign in with your email or Student ID to continue.
                  </div>
                </div>

                <form onSubmit={handleLogin} autoComplete="off">
                  <div className="al-field">
                    <label className="al-label">Email or Student ID</label>
                    <div className="al-input-wrap">
                      <span className="al-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      <input
                        className="al-input"
                        placeholder="you@email.com  or  ALLK20250001"
                        value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="al-field">
                    <div className="al-pw-row">
                      <label className="al-label">Password</label>
                      <button type="button" className="al-forgot-link" onClick={openForgot}>
                        Forgot password?
                      </button>
                    </div>
                    <div className="al-input-wrap">
                      <span className="al-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        className="al-input"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" className="al-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                        {showPw
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="al-error">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}

                  <button className="al-btn" type="submit" disabled={loading}>
                    {loading
                      ? <><span className="al-spinner" /> Signing in…</>
                      : <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                    }
                  </button>
                </form>

                <div className="al-divider">
                  <div className="al-divider-line" />
                  <span className="al-divider-text">New here?</span>
                  <div className="al-divider-line" />
                </div>

                {/* Already have a Student ID — create account */}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '13px 0', borderRadius: 12, marginTop: 2,
                    fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, letterSpacing: '.01em',
                    color: '#fff', background: '#ff3c2e',
                    border: 'none', cursor: 'pointer',
                    transition: 'background .18s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e03325'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ff3c2e'}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                  Create Account
                </button>

                {/* Don't have a Student ID yet — register for a class */}
                <Link
                  to="/?register=1"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', padding: '13px 0', borderRadius: 12, marginTop: 10,
                    fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, letterSpacing: '.01em',
                    color: '#ff3c2e', background: 'rgba(255,60,46,.08)',
                    border: '1.5px solid rgba(255,60,46,.25)', textDecoration: 'none',
                    transition: 'background .18s, border-color .18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,60,46,.15)'; e.currentTarget.style.borderColor = 'rgba(255,60,46,.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,60,46,.08)';  e.currentTarget.style.borderColor = 'rgba(255,60,46,.25)'; }}
                >
                  Register for a Class
                </Link>
                <div className="al-hint">
                  Already approved? Use <strong style={{ color: 'rgba(255,255,255,.4)' }}>Create Account</strong> to set your password.<br />
                  Not registered yet? Click <strong style={{ color: 'rgba(255,255,255,.4)' }}>Register for a Class</strong>.
                </div>

                <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.2)' }}>
                  Are you a teacher?{' '}
                  <Link to="/teacher-login" style={{ color: 'rgba(38,128,199,.7)', fontWeight: 600, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#2680c7'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(38,128,199,.7)'}
                  >
                    Sign in here →
                  </Link>
                </div>
              </>
            )}

            {/* ── FORGOT PASSWORD VIEW ── */}
            {view === 'forgot' && (
              <>
                <button type="button" className="al-fp-back" onClick={() => setView('login')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to Sign In
                </button>

                <div className="al-fp-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    <circle cx="12" cy="16" r="1" fill="#ff6a60"/>
                  </svg>
                </div>

                <div className="al-form-header" style={{ marginBottom: 24 }}>
                  <div className="al-form-title">Reset Password</div>
                  <div className="al-form-subtitle">
                    Enter the email address linked to your student account and we'll send you a reset link.
                  </div>
                </div>

                <form onSubmit={handleReset} autoComplete="off">
                  <div className="al-field">
                    <label className="al-label">Email Address</label>
                    <div className="al-input-wrap">
                      <span className="al-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input
                        className="al-input"
                        type="email"
                        placeholder="you@email.com"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="al-error">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {resetError}
                    </div>
                  )}

                  <button className="al-btn" type="submit" disabled={resetLoading}>
                    {resetLoading
                      ? <><span className="al-spinner" /> Sending…</>
                      : <>Send Reset Link <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></>
                    }
                  </button>
                </form>
              </>
            )}

            {/* ── RESET EMAIL SENT VIEW ── */}
            {view === 'reset-sent' && (
              <>
                <div className="al-rs-ring">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(38,128,199,.9)" strokeWidth="2.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>

                <div className="al-rs-title">Check your inbox</div>
                <div className="al-rs-body">
                  If an account exists for{' '}
                  <span className="al-rs-email">{resetEmail}</span>
                  , a password reset link has been sent. It expires in 1 hour.
                </div>

                <div className="al-rs-note">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>
                    Don't see it? Check your <strong>spam or junk folder</strong>. Make sure you used the same email address you registered with.
                  </span>
                </div>

                <button
                  type="button"
                  className="al-rs-back-btn"
                  onClick={() => { setView('login'); setResetEmail(''); }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to Sign In
                </button>
              </>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
