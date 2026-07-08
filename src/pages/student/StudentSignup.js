import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .al-su-page {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', sans-serif;
    background: #080b12;
  }

  /* ── Left Panel ── */
  .al-su-left {
    width: 45%;
    min-height: 100vh;
    background: linear-gradient(145deg, #0a1420 0%, #0d1320 50%, #080b12 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
  }
  .al-su-left::before {
    content: '';
    position: absolute;
    width: 520px; height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(39,149,107,.1) 0%, transparent 65%);
    top: -100px; right: -80px;
    pointer-events: none;
  }
  .al-su-left::after {
    content: '';
    position: absolute;
    width: 350px; height: 350px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,.07) 0%, transparent 65%);
    bottom: -60px; left: -60px;
    pointer-events: none;
  }

  .al-su-logo {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }
  .al-su-logo-mark {
    width: 44px; height: 44px;
    border-radius: 13px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(255,60,46,.35);
    flex-shrink: 0;
    display: block;
    object-fit: cover;
  }
  .al-su-logo-text { line-height: 1.25; }
  .al-su-logo-name { font-size: 14px; font-weight: 800; color: #fff; }
  .al-su-logo-tagline { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 2px; }

  .al-su-hero {
    position: relative;
    z-index: 1;
  }
  .al-su-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(39,149,107,.12);
    border: 1px solid rgba(39,149,107,.2);
    border-radius: 99px;
    padding: 6px 14px;
    font-size: 11.5px; font-weight: 600; color: #4fc99a;
    letter-spacing: .04em;
    margin-bottom: 24px;
  }
  .al-su-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #27956b;
  }
  .al-su-title {
    font-size: 40px;
    font-weight: 900;
    color: #fff;
    line-height: 1.15;
    margin-bottom: 16px;
    letter-spacing: -.02em;
  }
  .al-su-title span {
    background: linear-gradient(135deg, #4fc99a, #27956b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .al-su-desc {
    font-size: 14px;
    color: rgba(255,255,255,.35);
    line-height: 1.7;
    max-width: 340px;
  }

  .al-su-steps {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .al-su-step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 20px;
    position: relative;
  }
  .al-su-step:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 32px;
    bottom: 0;
    width: 1px;
    background: rgba(255,255,255,.07);
  }
  .al-su-step-num {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,.5);
    flex-shrink: 0;
  }
  .al-su-step-content { padding-top: 6px; }
  .al-su-step-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.65); margin-bottom: 2px; }
  .al-su-step-desc  { font-size: 12px; color: rgba(255,255,255,.25); line-height: 1.5; }

  /* ── Right Panel ── */
  .al-su-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    background: #080b12;
    position: relative;
  }
  .al-su-right::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 30%, rgba(39,149,107,.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .al-su-form-wrap {
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
  }

  .al-su-form-header { margin-bottom: 28px; }
  .al-su-form-title {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -.02em;
    margin-bottom: 8px;
  }
  .al-su-form-subtitle {
    font-size: 13.5px;
    color: rgba(255,255,255,.3);
    line-height: 1.6;
  }

  .al-su-notice {
    display: flex; gap: 10px; align-items: flex-start;
    background: rgba(39,149,107,.08);
    border: 1px solid rgba(39,149,107,.18);
    border-radius: 11px;
    padding: 13px 15px;
    margin-bottom: 24px;
    font-size: 12.5px;
    color: rgba(79,201,154,.8);
    line-height: 1.6;
  }
  .al-su-notice svg { flex-shrink: 0; margin-top: 1px; }

  .al-su-field { margin-bottom: 16px; }
  .al-su-label {
    display: block;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: rgba(255,255,255,.35);
    margin-bottom: 8px;
  }
  .al-su-input-wrap { position: relative; }
  .al-su-input-icon {
    position: absolute;
    left: 14px; top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,.2);
    display: flex; align-items: center;
    pointer-events: none;
  }
  .al-su-input {
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
  .al-su-input::placeholder { color: rgba(255,255,255,.18); }
  .al-su-input:focus {
    border-color: rgba(39,149,107,.5);
    background: rgba(255,255,255,.05);
    box-shadow: 0 0 0 4px rgba(39,149,107,.08);
  }
  .al-su-input.valid {
    border-color: rgba(39,149,107,.5);
  }

  .al-su-pw-toggle {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    cursor: pointer; color: rgba(255,255,255,.2);
    display: flex; align-items: center; padding: 4px;
    transition: color .2s;
  }
  .al-su-pw-toggle:hover { color: rgba(255,255,255,.5); }

  .al-su-strength-bar-bg {
    margin-top: 8px; height: 3px;
    border-radius: 99px;
    background: rgba(255,255,255,.06); overflow: hidden;
  }
  .al-su-strength-bar {
    height: 100%; border-radius: 99px;
    transition: width .3s, background .3s;
  }
  .al-su-strength-label {
    font-size: 11px; margin-top: 4px;
    transition: color .3s;
  }

  .al-su-btn {
    width: 100%;
    margin-top: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #27956b 0%, #1d7455 100%);
    border: none;
    border-radius: 12px;
    padding: 15px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 8px 28px rgba(39,149,107,.28);
    letter-spacing: .01em;
  }
  .al-su-btn:hover:not(:disabled) {
    opacity: .9;
    transform: translateY(-1px);
    box-shadow: 0 12px 36px rgba(39,149,107,.36);
  }
  .al-su-btn:active:not(:disabled) { transform: translateY(0); }
  .al-su-btn:disabled {
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.2);
    cursor: not-allowed;
    box-shadow: none;
  }

  .al-su-error {
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
  .al-su-error svg { flex-shrink: 0; margin-top: 1px; }

  .al-su-footer {
    margin-top: 22px;
    text-align: center;
    font-size: 13.5px;
    color: rgba(255,255,255,.3);
  }
  .al-su-footer a {
    color: #ff6a60;
    font-weight: 600;
    text-decoration: none;
    transition: color .2s;
  }
  .al-su-footer a:hover { color: #ff3c2e; }

  /* Success state */
  .al-su-success {
    text-align: center;
    padding: 16px 0;
  }
  .al-su-success-ring {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: rgba(39,149,107,.1);
    border: 2px solid rgba(39,149,107,.25);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 22px;
  }
  .al-su-success h2 {
    font-size: 26px; font-weight: 800; color: #fff;
    letter-spacing: -.02em; margin-bottom: 12px;
  }
  .al-su-success p {
    font-size: 14px; color: rgba(255,255,255,.35); line-height: 1.7;
  }
  .al-su-success-btn {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 28px;
    font-family: 'Inter', sans-serif;
    font-size: 14.5px; font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #27956b, #1d7455);
    border: none; border-radius: 12px;
    padding: 14px 32px;
    cursor: pointer; text-decoration: none;
    transition: opacity .2s, transform .15s;
    box-shadow: 0 8px 24px rgba(39,149,107,.3);
  }
  .al-su-success-btn:hover { opacity: .9; transform: translateY(-1px); }

  @keyframes al-su-spin { to { transform: rotate(360deg); } }
  .al-su-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: al-su-spin .6s linear infinite;
    flex-shrink: 0;
  }

  .al-su-back {
    display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none;
    font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.3);
    margin-bottom: 28px;
    transition: color .2s;
  }
  .al-su-back:hover { color: rgba(255,255,255,.65); }

  @media (max-width: 900px) {
    .al-su-left { display: none; }
  }
  @media (max-width: 480px) {
    .al-su-right { padding: 32px 20px; }
    .al-su-form-title { font-size: 24px; }
  }
`;

function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 20,  label: 'Weak',   color: '#e03325' };
  if (s === 2) return { score: 40,  label: 'Fair',   color: '#e59b00' };
  if (s === 3) return { score: 65,  label: 'Good',   color: '#2680c7' };
  return              { score: 100, label: 'Strong', color: '#27956b' };
}

function EyeIcon({ open }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

export default function StudentSignup() {
  const navigate = useNavigate();
  const [studentId,   setStudentId]   = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showCf,      setShowCf]      = useState(false);
  const [loading,       setLoading]     = useState(false);
  const [error,         setError]       = useState('');
  const [showResetBtn,  setShowResetBtn] = useState(false);
  const [resetSent,     setResetSent]   = useState(false);

  const strength = pwStrength(password);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setShowResetBtn(false);
    setResetSent(false);
    const sid = studentId.trim().toUpperCase();
    const em  = email.trim().toLowerCase();
    const pw  = password;
    const cf  = confirm;

    if (!sid) { setError('Please enter your Student ID.'); return; }
    if (!em)  { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { setError('Please enter a valid email address.'); return; }
    if (!pw)  { setError('Please create a password.'); return; }
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (pw !== cf) { setError('Passwords do not match. Please try again.'); return; }

    setLoading(true);
    try {
      // 1. Look up the registration by Student ID
      const snap = await getDocs(
        query(collection(db, 'registrations'), where('studentId', '==', sid))
      );
      if (snap.empty) {
        setError('Student ID not found. Check your approval email from AL.LK.');
        setLoading(false); return;
      }
      const regData  = snap.docs[0].data();
      const regDocId = snap.docs[0].id;

      // 2. Must be approved
      if (regData.status !== 'approved') {
        setError('Your registration is not yet approved. Please wait for admin approval.');
        setLoading(false); return;
      }

      // 3. Email must match the registration record
      if ((regData.email || '').trim().toLowerCase() !== em) {
        setError('Email does not match our records. Use the email you registered with.');
        setLoading(false); return;
      }

      // 4. Attempt to create the Firebase Auth account
      try {
        await createUserWithEmailAndPassword(auth, em, pw);
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          // An auth account already exists — try signing in with the provided password
          try {
            await signInWithEmailAndPassword(auth, em, pw);
            // Sign-in succeeded — delete old account and recreate fresh with same password
            await deleteUser(auth.currentUser);
            await createUserWithEmailAndPassword(auth, em, pw);
            // Fall through to activate below
          } catch (signInErr) {
            if (
              signInErr.code === 'auth/wrong-password' ||
              signInErr.code === 'auth/invalid-credential'
            ) {
              // Wrong password — auto-send reset so they can clear the old credential
              try { await sendPasswordResetEmail(auth, em); } catch (_) {}
              setResetSent(true);
              setError(
                'A password reset link has been sent to your email. ' +
                'Please reset your password, then come back here and enter your new password to complete setup.'
              );
            } else {
              setError('Could not verify your account. Please try again or contact support.');
            }
            setLoading(false); return;
          }
        } else if (authErr.code === 'auth/invalid-email') {
          setError('Invalid email address. Please check and try again.');
          setLoading(false); return;
        } else if (authErr.code === 'auth/weak-password') {
          setError('Password is too weak. Please use at least 6 characters.');
          setLoading(false); return;
        } else if (authErr.code === 'auth/operation-not-allowed') {
          setError('Email/password sign-in is not enabled. Please contact the administrator.');
          setLoading(false); return;
        } else {
          setError(`Something went wrong: ${authErr.code || authErr.message}`);
          setLoading(false); return;
        }
      }

      localStorage.setItem('slk_student', JSON.stringify({ ...regData, docId: regDocId }));
      navigate('/student');
    } catch (err) {
      setError(`Something went wrong: ${err.code || err.message}`);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="al-su-page">

        {/* Left branding panel */}
        <div className="al-su-left">
          <div className="al-su-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/AL.lk%20Logo.webp" alt="AL.LK" className="al-su-logo-mark" />
            <div className="al-su-logo-text">
              <div className="al-su-logo-name">AL.LK</div>
              <div className="al-su-logo-tagline">Student Learning Portal</div>
            </div>
          </div>

          <div className="al-su-hero">
            <div className="al-su-badge">
              <span className="al-su-badge-dot" />
              Student Registration
            </div>
            <div className="al-su-title">
              Start your<br /><span>learning journey</span>.
            </div>
            <div className="al-su-desc">
              Create your student account in minutes and unlock access to
              all your class materials, recordings, and live sessions.
            </div>
          </div>

          <div className="al-su-steps">
            <div className="al-su-step">
              <div className="al-su-step-num">1</div>
              <div className="al-su-step-content">
                <div className="al-su-step-title">Register on the main page</div>
                <div className="al-su-step-desc">Submit your registration form at AL.LK</div>
              </div>
            </div>
            <div className="al-su-step">
              <div className="al-su-step-num">2</div>
              <div className="al-su-step-content">
                <div className="al-su-step-title">Wait for admin approval</div>
                <div className="al-su-step-desc">You'll receive your Student ID by email</div>
              </div>
            </div>
            <div className="al-su-step">
              <div className="al-su-step-num">3</div>
              <div className="al-su-step-content">
                <div className="al-su-step-title">Create your account here</div>
                <div className="al-su-step-desc">Use your Student ID and registered email</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="al-su-right">
          <div className="al-su-form-wrap">

            <Link to="/" className="al-su-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Home
            </Link>

            <div className="al-su-form-header">
                  <div className="al-su-form-title">Create Account</div>
                  <div className="al-su-form-subtitle">
                    Use your approved Student ID and registered email to sign up.
                  </div>
                </div>

                <div className="al-su-notice">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Your Student ID was emailed to you after admin approval. Check your inbox for a message from AL.LK.
                </div>

                <form onSubmit={handleSignup} autoComplete="off">

                  {/* Student ID — most prominent field */}
                  <div className="al-su-field">
                    <label className="al-su-label">Student ID</label>
                    <div className="al-su-input-wrap">
                      <span className="al-su-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
                      </span>
                      <input
                        className={`al-su-input${studentId.length > 3 ? ' valid' : ''}`}
                        placeholder="e.g. ALLK20250001"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        autoCapitalize="characters"
                        spellCheck={false}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="al-su-field">
                    <label className="al-su-label">Email Address</label>
                    <div className="al-su-input-wrap">
                      <span className="al-su-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input
                        className="al-su-input"
                        type="email"
                        placeholder="The email you registered with"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="al-su-field">
                    <label className="al-su-label">Password</label>
                    <div className="al-su-input-wrap">
                      <span className="al-su-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        className="al-su-input"
                        type={showPw ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" className="al-su-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                        <EyeIcon open={showPw} />
                      </button>
                    </div>
                    {password && (
                      <>
                        <div className="al-su-strength-bar-bg">
                          <div className="al-su-strength-bar" style={{ width: `${strength.score}%`, background: strength.color }} />
                        </div>
                        <div className="al-su-strength-label" style={{ color: strength.color }}>{strength.label}</div>
                      </>
                    )}
                  </div>

                  <div className="al-su-field">
                    <label className="al-su-label">Confirm Password</label>
                    <div className="al-su-input-wrap">
                      <span className="al-su-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </span>
                      <input
                        className={`al-su-input${confirm && confirm === password ? ' valid' : ''}`}
                        type={showCf ? 'text' : 'password'}
                        placeholder="Repeat your password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                      />
                      <button type="button" className="al-su-pw-toggle" onClick={() => setShowCf(p => !p)} tabIndex={-1}>
                        <EyeIcon open={showCf} />
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="al-su-error">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{error}</span>
                    </div>
                  )}
                  {showResetBtn && !resetSent && (
                    <button
                      type="button"
                      onClick={async () => {
                        const em = email.trim().toLowerCase();
                        if (!em) { setError('Please enter your email address first.'); return; }
                        try {
                          await sendPasswordResetEmail(auth, em);
                          setResetSent(true);
                          setError('');
                        } catch {
                          setError('Failed to send reset email. Please try again.');
                        }
                      }}
                      style={{
                        width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                        color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd',
                        borderRadius: 10, padding: '11px', cursor: 'pointer', marginTop: 4,
                        transition: 'background .2s',
                      }}
                    >
                      Reset Password via Email
                    </button>
                  )}
                  {resetSent && (
                    <div style={{ background: '#e8f8f0', border: '1.5px solid #a8dfc4', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#1a7a4a', fontWeight: 600, marginTop: 4 }}>
                      Reset link sent! Check your inbox, reset your password, then try signing up again.
                    </div>
                  )}

                  <button className="al-su-btn" type="submit" disabled={loading}>
                    {loading
                      ? <><span className="al-su-spinner" /> Creating account…</>
                      : <>Create My Account <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                    }
                  </button>
                </form>

                <div className="al-su-footer">
                  Already have an account?{' '}
                  <Link to="/login">Sign in here</Link>
                </div>

          </div>
        </div>

      </div>
    </>
  );
}
