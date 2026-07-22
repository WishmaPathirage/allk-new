import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .tl-page {
    min-height: 100vh; display: flex;
    font-family: 'Inter', sans-serif; background: #080b12;
  }

  .tl-left {
    width: 45%; min-height: 100vh;
    background: linear-gradient(145deg, #0f1322 0%, #0d1020 50%, #080b12 100%);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 48px; position: relative; overflow: hidden;
  }
  .tl-left::before {
    content: ''; position: absolute;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(38,128,199,.14) 0%, transparent 65%);
    top: -100px; left: -100px; pointer-events: none;
  }
  .tl-left::after {
    content: ''; position: absolute;
    width: 350px; height: 350px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,.08) 0%, transparent 65%);
    bottom: -60px; right: -60px; pointer-events: none;
  }

  .tl-logo { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
  .tl-logo-mark {
    width: 44px; height: 44px; border-radius: 13px; overflow: hidden;
    box-shadow: 0 8px 24px rgba(38,128,199,.35); flex-shrink: 0;
    display: block; object-fit: cover;
  }
  .tl-logo-text { line-height: 1.25; }
  .tl-logo-name { font-size: 14px; font-weight: 800; color: #fff; }
  .tl-logo-tagline { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 2px; }

  .tl-hero { position: relative; z-index: 1; }
  .tl-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(38,128,199,.12); border: 1px solid rgba(38,128,199,.2);
    border-radius: 99px; padding: 6px 14px;
    font-size: 11.5px; font-weight: 600; color: #6ab4f0;
    letter-spacing: .04em; margin-bottom: 24px;
  }
  .tl-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #2680c7; }
  .tl-hero-title {
    font-size: 40px; font-weight: 900; color: #fff;
    line-height: 1.15; margin-bottom: 16px; letter-spacing: -.02em;
  }
  .tl-hero-title span {
    background: linear-gradient(135deg, #2680c7, #6ab4f0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .tl-hero-desc { font-size: 14px; color: rgba(255,255,255,.35); line-height: 1.7; max-width: 340px; }

  .tl-features { display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 1; }
  .tl-feature { display: flex; align-items: center; gap: 13px; }
  .tl-feature-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tl-feature-text { font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.4; }
  .tl-feature-text strong { color: rgba(255,255,255,.75); font-weight: 600; display: block; font-size: 13px; }

  .tl-right {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 48px 40px; background: #080b12; position: relative;
  }
  .tl-right::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(38,128,199,.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .tl-form-wrap { width: 100%; max-width: 400px; position: relative; z-index: 1; }

  .tl-form-header { margin-bottom: 36px; }
  .tl-form-title { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -.02em; margin-bottom: 8px; }
  .tl-form-subtitle { font-size: 13.5px; color: rgba(255,255,255,.3); line-height: 1.6; }

  .tl-field { margin-bottom: 18px; }
  .tl-label {
    display: block; font-size: 11.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase;
    color: rgba(255,255,255,.35); margin-bottom: 8px;
  }
  .tl-input-wrap { position: relative; }
  .tl-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: rgba(255,255,255,.2); display: flex; align-items: center; pointer-events: none;
  }
  .tl-input {
    width: 100%; font-family: 'Inter', sans-serif; font-size: 14px;
    color: #e8eaf0; background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.08); border-radius: 12px;
    padding: 14px 16px 14px 44px; outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .tl-input::placeholder { color: rgba(255,255,255,.18); }
  .tl-input:focus {
    border-color: rgba(38,128,199,.5); background: rgba(255,255,255,.05);
    box-shadow: 0 0 0 4px rgba(38,128,199,.08);
  }
  .tl-pw-toggle {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,.2); display: flex; align-items: center; padding: 4px;
    transition: color .2s;
  }
  .tl-pw-toggle:hover { color: rgba(255,255,255,.5); }

  .tl-btn {
    width: 100%; margin-top: 8px; font-family: 'Inter', sans-serif;
    font-size: 14.5px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #2680c7 0%, #1a5fa0 100%);
    border: none; border-radius: 12px; padding: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 8px 28px rgba(38,128,199,.3); letter-spacing: .01em;
  }
  .tl-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 12px 36px rgba(38,128,199,.38); }
  .tl-btn:active:not(:disabled) { transform: translateY(0); }
  .tl-btn:disabled { background: rgba(255,255,255,.06); color: rgba(255,255,255,.2); cursor: not-allowed; box-shadow: none; }

  .tl-error {
    margin-top: 16px; display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,60,46,.08); border: 1px solid rgba(255,60,46,.2);
    border-radius: 11px; padding: 13px 15px; font-size: 13px; color: #ff7a70; line-height: 1.5;
  }
  .tl-error svg { flex-shrink: 0; margin-top: 1px; }

  .tl-back {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; padding: 0;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    color: rgba(255,255,255,.3); cursor: pointer; margin-bottom: 28px;
    transition: color .2s; text-decoration: none;
  }
  .tl-back:hover { color: rgba(255,255,255,.65); }

  .tl-pw-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .tl-pw-row .tl-label { margin-bottom: 0; }

  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.2);
    border-top-color: #fff; border-radius: 50%;
    animation: tl-spin .6s linear infinite; flex-shrink: 0;
  }

  @media (max-width: 900px) { .tl-left { display: none; } }
  @media (max-width: 480px) { .tl-right { padding: 32px 20px; } .tl-form-title { font-size: 24px; } }
`;

export default function TeacherLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === 'admin@al.lk') {
          navigate('/admin', { replace: true });
        } else {
          // Check if teacher
          const teacherSnap = await getDocs(
            query(collection(db, 'teachers'), where('email', '==', user.email.toLowerCase()))
          );
          if (!teacherSnap.empty) {
            navigate('/teacher', { replace: true });
          } else {
            navigate('/student', { replace: true });
          }
        }
      }
    });
    return unsub;
  }, [navigate]);

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const em = email.trim().toLowerCase();
    if (!em)       { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, em, password);

      const snap = await getDocs(
        query(collection(db, 'teachers'), where('email', '==', cred.user.email.toLowerCase()))
      );

      if (snap.empty) {
        await auth.signOut();
        setError('This email is not registered as a teacher account. Please contact the administrator.');
        setLoading(false);
        return;
      }

      const teacherData = { ...snap.docs[0].data(), docId: snap.docs[0].id };
      localStorage.setItem('slk_teacher', JSON.stringify(teacherData));
      navigate('/teacher');
    } catch (err) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Incorrect email or password. Please try again.');
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
      <div className="tl-page">

        <div className="tl-left">
          <div className="tl-logo">
            <img src="/AL.lk%20Logo.webp" alt="AL.LK" className="tl-logo-mark" />
            <div className="tl-logo-text">
              <div className="tl-logo-name">AL.LK</div>
              <div className="tl-logo-tagline">Teacher Portal</div>
            </div>
          </div>

          <div className="tl-hero">
            <div className="tl-hero-badge">
              <span className="tl-hero-badge-dot" />
              Teacher Dashboard
            </div>
            <div className="tl-hero-title">
              Teach smarter,<br />inspire <span>better</span>.
            </div>
            <div className="tl-hero-desc">
              Upload materials, manage recordings, schedule live sessions,
              and track your enrolled students — all from one place.
            </div>
          </div>

          <div className="tl-features">
            <div className="tl-feature">
              <div className="tl-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div className="tl-feature-text">
                <strong>Study Materials</strong>
                Upload notes, papers &amp; resources for your students.
              </div>
            </div>
            <div className="tl-feature">
              <div className="tl-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              </div>
              <div className="tl-feature-text">
                <strong>Class Recordings</strong>
                Add YouTube recordings organised in folders.
              </div>
            </div>
            <div className="tl-feature">
              <div className="tl-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
              </div>
              <div className="tl-feature-text">
                <strong>My Students</strong>
                View all students enrolled in your subject.
              </div>
            </div>
          </div>
        </div>

        <div className="tl-right">
          <div className="tl-form-wrap">

            <Link to="/" className="tl-back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Home
            </Link>

            <div className="tl-form-header">
              <div className="tl-form-title">Teacher Sign In</div>
              <div className="tl-form-subtitle">
                Sign in with your teacher account to manage your classes.
              </div>
            </div>

            <form onSubmit={handleLogin} autoComplete="off">
              <div className="tl-field">
                <label className="tl-label">Email Address</label>
                <div className="tl-input-wrap">
                  <span className="tl-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    className="tl-input"
                    type="email"
                    placeholder="teacher@al.lk"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
              </div>

              <div className="tl-field">
                <div className="tl-pw-row">
                  <label className="tl-label">Password</label>
                </div>
                <div className="tl-input-wrap">
                  <span className="tl-input-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    className="tl-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="tl-pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="tl-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button className="tl-btn" type="submit" disabled={loading}>
                {loading
                  ? <><span className="tl-spinner" /> Signing in…</>
                  : <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                }
              </button>
            </form>

            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.15)', lineHeight: 1.6 }}>
              Teacher accounts are created by the administrator.<br />
              Contact admin if you don't have access.
            </p>

          </div>
        </div>

      </div>
    </>
  );
}
