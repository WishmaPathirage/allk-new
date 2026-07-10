import { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Link } from 'react-router-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',        subject: 'Media',                  stream: 'Arts'       },
];

const STREAMS = ['Technology', 'Commerce', 'Arts'];
const streamColor = (s) => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = (s) => s === 'Technology' ? 'rgba(38,128,199,.12)' : s === 'Commerce' ? 'rgba(39,149,107,.12)' : 'rgba(201,114,12,.12)';
const streamBorder= (s) => s === 'Technology' ? 'rgba(38,128,199,.25)' : s === 'Commerce' ? 'rgba(39,149,107,.25)' : 'rgba(201,114,12,.25)';

const BATCHES = ['2025', '2028'];


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ar-page {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', sans-serif;
    background: #080b12;
  }

  /* ── Left Panel ── */
  .ar-left {
    width: 40%;
    min-height: 100vh;
    background: linear-gradient(145deg, #0a1220 0%, #0d1220 50%, #080b12 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .ar-left::before {
    content: '';
    position: absolute;
    width: 520px; height: 520px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,.1) 0%, transparent 65%);
    top: -100px; right: -100px;
    pointer-events: none;
  }
  .ar-left::after {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(38,128,199,.07) 0%, transparent 65%);
    bottom: -60px; left: -40px;
    pointer-events: none;
  }

  .ar-logo {
    display: flex; align-items: center; gap: 14px;
    position: relative; z-index: 1;
  }
  .ar-logo-mark {
    width: 44px; height: 44px; border-radius: 13px;
    background: linear-gradient(135deg, #ff3c2e, #c92d21);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 900; color: #fff;
    box-shadow: 0 8px 24px rgba(255,60,46,.35);
    flex-shrink: 0;
  }
  .ar-logo-name    { font-size: 14px; font-weight: 800; color: #fff; }
  .ar-logo-tagline { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 2px; }

  .ar-hero { position: relative; z-index: 1; }
  .ar-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,60,46,.12); border: 1px solid rgba(255,60,46,.22);
    border-radius: 99px; padding: 6px 14px;
    font-size: 11.5px; font-weight: 600; color: #ff7a70;
    letter-spacing: .04em; margin-bottom: 22px;
  }
  .ar-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff3c2e; }
  .ar-title {
    font-size: 36px; font-weight: 900; color: #fff;
    line-height: 1.15; margin-bottom: 14px; letter-spacing: -.02em;
  }
  .ar-title span {
    background: linear-gradient(135deg, #ff7a6e, #ff3c2e);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .ar-desc {
    font-size: 13.5px; color: rgba(255,255,255,.35); line-height: 1.7; max-width: 320px;
  }

  .ar-steps { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 0; }
  .ar-step  { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 20px; position: relative; }
  .ar-step:not(:last-child)::before {
    content: ''; position: absolute;
    left: 15px; top: 32px; bottom: 0;
    width: 1px; background: rgba(255,255,255,.07);
  }
  .ar-step-num {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: rgba(255,255,255,.5); flex-shrink: 0;
  }
  .ar-step-content { padding-top: 6px; }
  .ar-step-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,.65); margin-bottom: 2px; }
  .ar-step-desc  { font-size: 12px; color: rgba(255,255,255,.25); line-height: 1.5; }

  /* ── Right Panel ── */
  .ar-right {
    flex: 1; display: flex; align-items: flex-start; justify-content: center;
    padding: 48px 40px; background: #080b12;
    position: relative; overflow-y: auto;
  }
  .ar-right::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 30% 20%, rgba(255,60,46,.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .ar-form-wrap {
    width: 100%; max-width: 480px;
    position: relative; z-index: 1;
    padding-top: 8px; padding-bottom: 40px;
  }

  .ar-form-header { margin-bottom: 28px; }
  .ar-form-title {
    font-size: 26px; font-weight: 800; color: #fff;
    letter-spacing: -.02em; margin-bottom: 8px;
  }
  .ar-form-subtitle { font-size: 13.5px; color: rgba(255,255,255,.3); line-height: 1.6; }

  .ar-field { margin-bottom: 16px; }
  .ar-label {
    display: block; font-size: 11.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase;
    color: rgba(255,255,255,.35); margin-bottom: 8px;
  }
  .ar-label-req { color: #ff3c2e; margin-left: 2px; }
  .ar-input-wrap { position: relative; }
  .ar-input-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%);
    color: rgba(255,255,255,.2); display: flex; align-items: center;
    pointer-events: none;
  }
  .ar-input {
    width: 100%; font-family: 'Inter', sans-serif; font-size: 14px; color: #e8eaf0;
    background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: 13px 16px 13px 44px; outline: none;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .ar-input.no-icon { padding-left: 16px; }
  .ar-input::placeholder { color: rgba(255,255,255,.18); }
  .ar-input:focus {
    border-color: rgba(255,60,46,.5); background: rgba(255,255,255,.05);
    box-shadow: 0 0 0 4px rgba(255,60,46,.08);
  }
  .ar-select {
    width: 100%; font-family: 'Inter', sans-serif; font-size: 14px; color: #e8eaf0;
    background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08);
    border-radius: 12px; padding: 13px 16px; outline: none; cursor: pointer;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,.3)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 16px center;
    transition: border-color .2s, box-shadow .2s;
  }
  .ar-select:focus { border-color: rgba(255,60,46,.5); box-shadow: 0 0 0 4px rgba(255,60,46,.08); }
  .ar-select option { background: #1a1d28; color: #e8eaf0; }

  /* Subject checkboxes */
  .ar-stream-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
    color: rgba(255,255,255,.25); margin: 14px 0 8px;
  }
  .ar-stream-label:first-child { margin-top: 0; }
  .ar-subj-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .ar-subj-check {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,.03); border: 1.5px solid rgba(255,255,255,.07);
    border-radius: 10px; padding: 11px 14px; cursor: pointer;
    transition: all .18s; user-select: none;
  }
  .ar-subj-check:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); }
  .ar-subj-check.selected { border-color: rgba(255,60,46,.4); background: rgba(255,60,46,.08); }
  .ar-subj-check input[type=checkbox] { display: none; }
  .ar-check-box {
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    border: 1.5px solid rgba(255,255,255,.18);
    display: flex; align-items: center; justify-content: center;
    transition: all .18s; background: transparent;
  }
  .ar-subj-check.selected .ar-check-box {
    background: #ff3c2e; border-color: #ff3c2e;
  }
  .ar-check-mark { display: none; }
  .ar-subj-check.selected .ar-check-mark { display: block; }
  .ar-subj-info { min-width: 0; }
  .ar-subj-name    { font-size: 12.5px; font-weight: 600; color: #ddd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ar-subj-teacher { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 1px; }

  /* File upload */
  .ar-dropzone {
    border: 1.5px dashed rgba(255,255,255,.1); border-radius: 12px;
    padding: 24px 20px; text-align: center; cursor: pointer;
    transition: all .2s; background: rgba(255,255,255,.02);
  }
  .ar-dropzone:hover { border-color: rgba(255,60,46,.35); background: rgba(255,60,46,.04); }
  .ar-dropzone.has-file { border-color: rgba(39,149,107,.4); background: rgba(39,149,107,.05); }
  .ar-dropzone-text { font-size: 13px; font-weight: 500; color: rgba(255,255,255,.35); margin-top: 8px; }
  .ar-dropzone.has-file .ar-dropzone-text { color: #4fc99a; }
  .ar-dropzone-sub { font-size: 11.5px; color: rgba(255,255,255,.18); margin-top: 4px; }
  .ar-optional {
    font-size: 10.5px; font-weight: 600; color: rgba(255,255,255,.22);
    background: rgba(255,255,255,.05); border-radius: 99px;
    padding: 2px 8px; margin-left: 6px; letter-spacing: .04em; text-transform: none;
  }

  /* Submit btn */
  .ar-btn {
    width: 100%; margin-top: 8px;
    font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #ff3c2e 0%, #d92d20 100%);
    border: none; border-radius: 12px; padding: 15px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 8px 28px rgba(255,60,46,.3); letter-spacing: .01em;
  }
  .ar-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); box-shadow: 0 12px 36px rgba(255,60,46,.38); }
  .ar-btn:active:not(:disabled) { transform: translateY(0); }
  .ar-btn:disabled { background: rgba(255,255,255,.06); color: rgba(255,255,255,.2); cursor: not-allowed; box-shadow: none; }

  .ar-error {
    margin-top: 14px; display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,60,46,.08); border: 1px solid rgba(255,60,46,.2);
    border-radius: 11px; padding: 13px 15px;
    font-size: 13px; color: #ff7a70; line-height: 1.5;
  }
  .ar-error svg { flex-shrink: 0; margin-top: 1px; }

  .ar-footer {
    margin-top: 22px; text-align: center;
    font-size: 13.5px; color: rgba(255,255,255,.3);
  }
  .ar-footer a { color: #ff6a60; font-weight: 600; text-decoration: none; transition: color .2s; }
  .ar-footer a:hover { color: #ff3c2e; }

  /* Success */
  .ar-success { text-align: center; padding: 20px 0; }
  .ar-success-ring {
    width: 76px; height: 76px; border-radius: 50%;
    background: rgba(39,149,107,.1); border: 2px solid rgba(39,149,107,.25);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
  }
  .ar-success h2 { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.02em; margin-bottom: 14px; }
  .ar-success-body { font-size: 14px; color: rgba(255,255,255,.35); line-height: 1.75; }
  .ar-success-body strong { color: rgba(255,255,255,.7); }
  .ar-success-note {
    margin-top: 24px; background: rgba(255,60,46,.08);
    border: 1px solid rgba(255,60,46,.18); border-radius: 12px;
    padding: 14px 18px; font-size: 13px; color: rgba(255,255,255,.5); line-height: 1.65; text-align: left;
  }
  .ar-success-link {
    display: inline-flex; align-items: center; gap: 8px; margin-top: 28px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    color: rgba(255,255,255,.5); background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
    padding: 12px 26px; cursor: pointer; text-decoration: none;
    transition: all .2s;
  }
  .ar-success-link:hover { background: rgba(255,255,255,.1); color: rgba(255,255,255,.8); }

  @keyframes ar-spin { to { transform: rotate(360deg); } }
  .ar-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.2);
    border-top-color: #fff; border-radius: 50%;
    animation: ar-spin .6s linear infinite; flex-shrink: 0;
  }

  @media (max-width: 900px) { .ar-left { display: none; } }
  @media (max-width: 480px) {
    .ar-right { padding: 28px 16px; }
    .ar-form-title { font-size: 22px; }
    .ar-subj-grid { grid-template-columns: 1fr; }
  }
`;

export default function StudentRegister() {
  const [form, setForm] = useState({
    studentName: '',
    email: '',
    phone: '',
    batch: '',
    month: '',
  });
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [slip, setSlip]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleTeacher = (id) => {
    setSelectedTeachers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSlip = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Payment slip must be under 10 MB.'); return; }
    setSlip(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name  = form.studentName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const batch = form.batch;
    const month = form.month;

    if (!name)                       { setError('Please enter your full name.');          return; }
    if (!email)                      { setError('Please enter your email address.');       return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!phone)                      { setError('Please enter your phone number.');        return; }
    if (!batch)                      { setError('Please select your batch year.');         return; }
    if (!month)                      { setError('Please select your registration month.'); return; }
    if (selectedTeachers.length === 0) { setError('Please select at least one subject.'); return; }

    setLoading(true);
    try {
      // Block duplicate email via registered_emails (publicly readable — no auth needed)
      const emailKey = email.replace(/[.#$[\]/]/g, '_');
      try {
        const regEmailSnap = await getDoc(doc(db, 'registered_emails', emailKey));
        if (regEmailSnap.exists()) {
          setError('This email is already registered. Each student can only have one registration.');
          setLoading(false); return;
        }
      } catch (_dupErr) {
        // Rules not deployed yet — skip duplicate check and proceed
      }

      let slipURL = null;
      if (slip) {
        const path = `payment-slips/${Date.now()}_${slip.name.replace(/\s/g, '_')}`;
        const sRef = storageRef(storage, path);
        await uploadBytes(sRef, slip);
        slipURL = await getDownloadURL(sRef);
      }

      /* build month key: YYYY-MM */
      const monthIdx   = MONTHS.indexOf(month) + 1;
      const year       = new Date().getFullYear();
      const monthKey   = `${year}-${String(monthIdx).padStart(2, '0')}`;

      /* persist registration */
      await addDoc(collection(db, 'registrations'), {
        studentName: name,
        email,
        phone,
        batch,
        registrationMonth: month,
        registrationMonthKey: monthKey,
        selectedTeachers,
        slipURL,
        status:      'pending',
        submittedAt: serverTimestamp(),
      });

      /* auto-create linked monthly payment record */
      await addDoc(collection(db, 'monthly_payments'), {
        studentName: name,
        email,
        phone,
        selectedTeachers,
        month:       monthKey,
        slipUrl:     slipURL || null,
        status:      'pending',
        source:      'registration',
        submittedAt: serverTimestamp(),
      });

      /* mark email as registered (enables duplicate prevention on future attempts) */
      try { await setDoc(doc(db, 'registered_emails', emailKey), { email }); } catch (_) {}

      setDone(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <style>{css}</style>
      <div className="ar-page">

        {/* Left branding panel */}
        <div className="ar-left">
          <div className="ar-logo">
            <div className="ar-logo-mark">A</div>
            <div>
              <div className="ar-logo-name">AL.LK</div>
              <div className="ar-logo-tagline">Student Learning Portal</div>
            </div>
          </div>

          <div className="ar-hero">
            <div className="ar-badge">
              <span className="ar-badge-dot" />
              New Student Registration
            </div>
            <div className="ar-title">
              Join Sri Lanka's<br /><span>#1 A/L Platform</span>.
            </div>
            <div className="ar-desc">
              Register to access class recordings, live Zoom sessions,
              and study materials — all managed by expert teachers.
            </div>
          </div>

          <div className="ar-steps">
            <div className="ar-step">
              <div className="ar-step-num">1</div>
              <div className="ar-step-content">
                <div className="ar-step-title">Submit this form</div>
                <div className="ar-step-desc">Fill your details and select your subjects</div>
              </div>
            </div>
            <div className="ar-step">
              <div className="ar-step-num">2</div>
              <div className="ar-step-content">
                <div className="ar-step-title">Admin reviews & approves</div>
                <div className="ar-step-desc">Usually within 1–2 business days</div>
              </div>
            </div>
            <div className="ar-step">
              <div className="ar-step-num">3</div>
              <div className="ar-step-content">
                <div className="ar-step-title">Receive your Student ID</div>
                <div className="ar-step-desc">Check your email and set up your account</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="ar-right">
          <div className="ar-form-wrap">

            {done ? (
              <div className="ar-success">
                <div className="ar-success-ring">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#4fc99a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2>Registration Submitted!</h2>
                <p className="ar-success-body">
                  Thanks, <strong>{form.studentName}</strong>!<br />
                  Your registration has been received and is now pending admin review.
                  We'll send your Student ID to <strong>{form.email}</strong> once approved.
                </p>
                <div className="ar-success-note">
                  📬 Keep an eye on your inbox (and spam folder). Once approved, you'll receive
                  an email with your Student ID and instructions to set up your account.
                </div>
                <Link to="/login" className="ar-success-link">
                  Already have an account? Sign in
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
              </div>
            ) : (
              <>
                <div className="ar-form-header">
                  <div className="ar-form-title">Student Registration</div>
                  <div className="ar-form-subtitle">
                    Fill in your details below. Admin will review and send your Student ID by email.
                  </div>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">

                  {/* Full Name */}
                  <div className="ar-field">
                    <label className="ar-label">Full Name <span className="ar-label-req">*</span></label>
                    <div className="ar-input-wrap">
                      <span className="ar-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </span>
                      <input
                        className="ar-input"
                        placeholder="Your full name"
                        value={form.studentName}
                        onChange={e => setField('studentName', e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="ar-field">
                    <label className="ar-label">Email Address <span className="ar-label-req">*</span></label>
                    <div className="ar-input-wrap">
                      <span className="ar-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </span>
                      <input
                        className="ar-input"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => setField('email', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="ar-field">
                    <label className="ar-label">Phone Number <span className="ar-label-req">*</span></label>
                    <div className="ar-input-wrap">
                      <span className="ar-input-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6.08 6.08l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </span>
                      <input
                        className="ar-input"
                        type="tel"
                        placeholder="07X XXX XXXX"
                        value={form.phone}
                        onChange={e => setField('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Batch */}
                  <div className="ar-field">
                    <label className="ar-label">Batch Year <span className="ar-label-req">*</span></label>
                    <select
                      className="ar-select"
                      value={form.batch}
                      onChange={e => setField('batch', e.target.value)}
                    >
                      <option value="">Select your batch year…</option>
                      {BATCHES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Registration Month */}
                  <div className="ar-field">
                    <label className="ar-label">Registration Month <span className="ar-label-req">*</span></label>
                    <select
                      className="ar-select"
                      value={form.month}
                      onChange={e => setField('month', e.target.value)}
                    >
                      <option value="">Select registration month…</option>
                      {MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subjects */}
                  <div className="ar-field">
                    <label className="ar-label">Select Subjects <span className="ar-label-req">*</span></label>
                    {STREAMS.map(stream => {
                      const teachers = ALL_TEACHERS.filter(t => t.stream === stream);
                      if (!teachers.length) return null;
                      return (
                        <div key={stream}>
                          <div className="ar-stream-label" style={{ color: streamColor(stream) }}>
                            — {stream} Stream
                          </div>
                          <div className="ar-subj-grid">
                            {teachers.map(t => {
                              const selected = selectedTeachers.includes(t.id);
                              return (
                                <label
                                  key={t.id}
                                  className={`ar-subj-check${selected ? ' selected' : ''}`}
                                  style={selected ? {
                                    borderColor: streamBorder(stream),
                                    background: streamBg(stream),
                                  } : {}}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleTeacher(t.id)}
                                  />
                                  <div className="ar-check-box" style={selected ? { background: streamColor(stream), borderColor: streamColor(stream) } : {}}>
                                    <svg className="ar-check-mark" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  </div>
                                  <div className="ar-subj-info">
                                    <div className="ar-subj-name">{t.subject}</div>
                                    <div className="ar-subj-teacher">{t.name}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Slip */}
                  <div className="ar-field">
                    <label className="ar-label">
                      Payment Slip
                      <span className="ar-optional">Optional</span>
                    </label>
                    <label
                      className={`ar-dropzone${slip ? ' has-file' : ''}`}
                      style={{ display: 'block', cursor: 'pointer' }}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={handleSlip}
                      />
                      {slip ? (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4fc99a" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <div className="ar-dropzone-text">{slip.name}</div>
                          <div className="ar-dropzone-sub" style={{ color: 'rgba(79,201,154,.5)' }}>Click to change</div>
                        </>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          <div className="ar-dropzone-text">Click to upload payment slip</div>
                          <div className="ar-dropzone-sub">JPG, PNG or PDF · Max 10 MB</div>
                        </>
                      )}
                    </label>
                  </div>

                  {error && (
                    <div className="ar-error">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </div>
                  )}

                  <button className="ar-btn" type="submit" disabled={loading} style={{ marginTop: 20 }}>
                    {loading
                      ? <><span className="ar-spinner" /> Submitting…</>
                      : <>Submit Registration <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>
                    }
                  </button>
                </form>

                <div className="ar-footer">
                  Already have an account? <Link to="/login">Sign in</Link>
                  {' · '}
                  Already approved? <Link to="/signup">Set up account</Link>
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
