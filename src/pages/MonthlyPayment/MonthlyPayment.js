import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Harsha Amarakon',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',        subject: 'Media',                  stream: 'Arts'       },
];

const STREAM_COLORS = { Technology: '#2680c7', Commerce: '#27956b', Arts: '#c9720c' };

/* Generate month options: all 12 months of the current year.
   Past months are marked so they can be rendered as disabled. */
const getMonthOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    const value = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long' }); // no year shown
    return { value, label, past: i < currentMonth };
  });
};

const fmtBytes = (b) => b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mp-page {
    min-height: 100vh; background: #f2f3f7;
    font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column;
  }

  /* ── Top bar ── */
  .mp-topbar {
    background: #16181f; padding: 16px 32px;
    display: flex; align-items: center; gap: 14px;
  }
  .mp-logo {
    width: 38px; height: 38px; border-radius: 11px; background: #ff3c2e;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 800; color: #fff; flex-shrink: 0;
  }
  .mp-brand { font-size: 14px; font-weight: 700; color: #fff; }
  .mp-brand-sub { font-size: 11px; color: #555; margin-top: 1px; }
  .mp-topbar-right { margin-left: auto; }
  .mp-back-btn {
    font-family: inherit; font-size: 12.5px; font-weight: 600; color: #aaa;
    background: none; border: 1.5px solid #333; border-radius: 8px;
    padding: 7px 16px; cursor: pointer; text-decoration: none; display: inline-block;
    transition: all .2s;
  }
  .mp-back-btn:hover { border-color: #ff3c2e; color: #ff3c2e; }

  /* ── Hero ── */
  .mp-hero {
    background: linear-gradient(135deg, #16181f 0%, #1e2130 100%);
    padding: 48px 32px 44px; text-align: center;
  }
  .mp-hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,60,46,.15); border: 1px solid rgba(255,60,46,.3);
    border-radius: 99px; padding: 5px 14px; margin-bottom: 18px;
    font-size: 11.5px; font-weight: 700; color: #ff7a72; letter-spacing: .06em; text-transform: uppercase;
  }
  .mp-hero-title {
    font-size: 36px; font-weight: 800; color: #fff; line-height: 1.15; margin-bottom: 12px;
  }
  .mp-hero-title span { color: #ff3c2e; }
  .mp-hero-sub { font-size: 14px; color: #777; max-width: 480px; margin: 0 auto; line-height: 1.6; }

  /* ── Steps ── */
  .mp-steps {
    display: flex; align-items: center; justify-content: center; gap: 0;
    padding: 22px 32px; background: #fff; border-bottom: 1px solid #f0f0f0;
  }
  .mp-step { display: flex; align-items: center; gap: 8px; }
  .mp-step-num {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800;
  }
  .mp-step-num.active { background: #ff3c2e; color: #fff; }
  .mp-step-num.done   { background: #27956b; color: #fff; }
  .mp-step-num.idle   { background: #f0f0f0; color: #aaa; }
  .mp-step-label { font-size: 12px; font-weight: 600; color: #aaa; white-space: nowrap; }
  .mp-step-label.active { color: #111; }
  .mp-step-line { width: 40px; height: 1.5px; background: #eee; margin: 0 6px; }

  /* ── Body ── */
  .mp-body { flex: 1; padding: 36px 20px 60px; display: flex; justify-content: center; }
  .mp-form-wrap { width: 100%; max-width: 680px; }

  /* ── Info box ── */
  .mp-info-box {
    background: #fff; border: 1.5px solid #e8f0fd; border-radius: 14px;
    padding: 16px 20px; margin-bottom: 22px;
    display: flex; align-items: flex-start; gap: 12;
  }
  .mp-info-icon { color: #2680c7; flex-shrink: 0; margin-top: 1px; }
  .mp-info-text { font-size: 13px; color: #555; line-height: 1.6; }
  .mp-info-text strong { color: #111; }

  /* ── Card ── */
  .mp-card {
    background: #fff; border-radius: 16px;
    box-shadow: 0 1px 6px rgba(0,0,0,.07); margin-bottom: 18px; overflow: hidden;
  }
  .mp-card-hdr {
    padding: 16px 22px 14px; border-bottom: 1px solid #f5f5f5;
    display: flex; align-items: center; gap: 10px;
  }
  .mp-card-hdr-icon {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .mp-card-hdr-title { font-size: 14px; font-weight: 700; color: #111; }
  .mp-card-body { padding: 20px 22px; }

  /* ── Fields ── */
  .mp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .mp-field { margin-bottom: 14px; }
  .mp-field:last-child { margin-bottom: 0; }
  .mp-label {
    font-size: 11.5px; font-weight: 700; color: #666;
    letter-spacing: .08em; text-transform: uppercase; margin-bottom: 7px; display: block;
  }
  .mp-input {
    width: 100%; font-family: inherit; font-size: 13.5px; color: #222;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 10px;
    padding: 11px 14px; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .mp-input:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.07); }
  .mp-input::placeholder { color: #ccc; }
  .mp-select {
    width: 100%; font-family: inherit; font-size: 13.5px; font-weight: 600; color: #222;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 10px;
    padding: 11px 14px; outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 13px center;
    transition: border-color .2s;
  }
  .mp-select:focus { border-color: #ff3c2e; }

  /* student-id field highlight */
  .mp-input.id-field {
    font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; background: #fff8f8; border-color: #ffd0cd;
  }
  .mp-input.id-field:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.09); }

  /* ── Teacher checkboxes ── */
  .mp-teacher-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .mp-teacher-cb {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 10px; cursor: pointer;
    border: 1.5px solid #eee; background: #fafafa;
    transition: all .18s; user-select: none;
  }
  .mp-teacher-cb.checked { border-color: #ff3c2e; background: #fff8f8; }
  .mp-teacher-cb-box {
    width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
    border: 2px solid #ddd; display: flex; align-items: center; justify-content: center;
    transition: all .18s;
  }
  .mp-teacher-cb.checked .mp-teacher-cb-box { background: #ff3c2e; border-color: #ff3c2e; }
  .mp-teacher-cb-name { font-size: 12.5px; font-weight: 600; color: #333; line-height: 1.3; }
  .mp-teacher-cb-sub  { font-size: 11px; color: #aaa; }

  /* ── Dropzone ── */
  .mp-dropzone {
    border: 2px dashed #e0e0e0; border-radius: 12px; padding: 30px 20px;
    text-align: center; cursor: pointer; background: #fafafa; transition: all .2s;
  }
  .mp-dropzone:hover, .mp-dropzone.drag { border-color: #ff3c2e; background: #fff5f5; }
  .mp-dropzone.has-file { border-color: #27956b; background: #f0faf5; }
  .mp-dz-icon { margin-bottom: 10px; }
  .mp-dz-text { font-size: 13.5px; font-weight: 600; color: #aaa; }
  .mp-dropzone.has-file .mp-dz-text { color: #27956b; }
  .mp-dz-sub { font-size: 11.5px; color: #ccc; margin-top: 4px; }
  .mp-dropzone.has-file .mp-dz-sub { color: #27956b; }

  /* ── Submit button ── */
  .mp-submit {
    width: 100%; font-family: inherit; font-size: 14px; font-weight: 800;
    letter-spacing: .05em; text-transform: uppercase;
    color: #fff; background: #ff3c2e; border: none; border-radius: 13px;
    padding: 16px; cursor: pointer; margin-top: 6px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background .2s, transform .2s, box-shadow .2s;
    box-shadow: 0 4px 18px rgba(255,60,46,.25);
  }
  .mp-submit:hover:not(:disabled) { background: #e03325; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,60,46,.32); }
  .mp-submit:disabled { opacity: .6; cursor: not-allowed; }

  @keyframes mp-spin { to { transform: rotate(360deg); } }
  .mp-spinner {
    width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,.4);
    border-top-color: #fff; border-radius: 50%;
    animation: mp-spin .7s linear infinite;
  }

  /* ── Success screen ── */
  @keyframes mp-ok-pop { from { opacity:0; transform: scale(.88); } to { opacity:1; transform: scale(1); } }
  .mp-success {
    max-width: 480px; margin: 0 auto; text-align: center;
    padding: 60px 20px; animation: mp-ok-pop .4s cubic-bezier(.22,1,.36,1);
  }
  .mp-success-icon {
    width: 72px; height: 72px; border-radius: 50%; background: #e8f8f0;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 22px;
  }
  .mp-success-title { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 10px; }
  .mp-success-sub   { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 28px; }
  .mp-success-id {
    display: inline-block; background: #fff; border: 1.5px solid #e0e0e0; border-radius: 12px;
    padding: 14px 24px; margin-bottom: 30px;
  }
  .mp-success-id-lbl  { font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #aaa; margin-bottom: 4px; }
  .mp-success-id-val  { font-size: 20px; font-weight: 800; color: #111; font-family: monospace; letter-spacing: .06em; }
  .mp-success-back {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: inherit; font-size: 13px; font-weight: 700; color: #fff;
    background: #ff3c2e; border: none; border-radius: 10px; padding: 12px 24px; cursor: pointer;
    text-decoration: none; transition: background .2s;
  }
  .mp-success-back:hover { background: #e03325; }

  /* ── Error ── */
  .mp-error-banner {
    background: #fff0f0; border: 1.5px solid #ffb0aa; border-radius: 11px;
    padding: 13px 18px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; color: #cc2a1e;
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .mp-grid-2 { grid-template-columns: 1fr; }
    .mp-teacher-grid { grid-template-columns: 1fr; }
    .mp-hero-title { font-size: 26px; }
    .mp-steps { display: none; }
  }
`;

export default function MonthlyPayment({ embedded = false }) {
  const MONTH_OPTIONS = getMonthOptions();
  const currentMonthValue = MONTH_OPTIONS.find(o => !o.past)?.value || MONTH_OPTIONS[0].value;

  const [studentId,        setStudentId]        = useState('');
  const [studentName,      setStudentName]       = useState('');
  const [email,            setEmail]             = useState('');
  const [phone,            setPhone]             = useState('');
  const [address,          setAddress]           = useState('');
  const [month,            setMonth]             = useState(currentMonthValue);
  const [selectedTeachers, setSelectedTeachers]  = useState([]);
  const [file,             setFile]              = useState(null);
  const [drag,             setDrag]              = useState(false);
  const [status,           setStatus]            = useState('idle'); // idle | submitting | success | error
  const fileRef = useRef();

  /* Auto-fill from student profile (localStorage first, then Firestore if logged in) */
  useEffect(() => {
    const fillFromData = (data) => {
      if (data.studentId)   setStudentId(data.studentId);
      if (data.studentName) setStudentName(data.studentName);
      if (data.email)       setEmail(data.email);
      if (data.phone)       setPhone(data.phone);
      if (data.address)     setAddress(data.address);
      if (data.selectedTeachers?.length) setSelectedTeachers(data.selectedTeachers);
      // Never restore a past month from cache — keep the current-month default
    };

    const cached = localStorage.getItem('slk_student');
    if (cached) {
      try { fillFromData(JSON.parse(cached)); } catch {}
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || cached) return;
      try {
        const snap = await getDocs(
          query(collection(db, 'registrations'), where('email', '==', user.email), where('status', '==', 'approved'))
        );
        if (!snap.empty) fillFromData(snap.docs[0].data());
      } catch {}
    });
    return unsub;
  }, []);

  const toggleTeacher = (t) => {
    setSelectedTeachers(prev =>
      prev.some(x => x.id === t.id) ? prev.filter(x => x.id !== t.id) : [...prev, t]
    );
  };

  const handleFile = (f) => {
    if (!f) return;
    const ok = ['application/pdf','image/jpeg','image/png','image/webp'];
    if (!ok.includes(f.type)) { alert('Only PDF, JPG, PNG or WEBP files allowed'); return; }
    if (f.size > 10 * 1024 * 1024) { alert('File must be under 10 MB'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!studentId.trim())          { alert('Please enter your Student ID'); return; }
    if (!studentName.trim())        { alert('Please enter your full name'); return; }
    if (!email.trim())              { alert('Please enter your email'); return; }
    if (!phone.trim())              { alert('Please enter your phone number'); return; }
    if (!address.trim())            { alert('Please enter your address'); return; }
    if (selectedTeachers.length === 0) { alert('Please select at least one teacher'); return; }
    if (!file)                      { alert('Please upload your payment slip'); return; }

    setStatus('submitting');
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${studentId.trim().replace(/\s+/g,'_')}.${ext}`;
      const sRef = ref(storage, `monthly-payments/${fileName}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);

      await addDoc(collection(db, 'monthly_payments'), {
        studentId:           studentId.trim().toUpperCase(),
        studentName:         studentName.trim(),
        email:               email.trim().toLowerCase(),
        phone:               phone.trim(),
        address:             address.trim(),
        month,
        selectedTeachers,
        paymentSlipUrl:      url,
        paymentSlipFileName: file.name,
        storagePath:         `monthly-payments/${fileName}`,
        status:              'pending',
        submittedAt:         serverTimestamp(),
      });

      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  /* ── Success screen ── */
  if (status === 'success') {
    return (
      <>
        <style>{css}</style>
        <div className="mp-page">
          <div className="mp-topbar">
            <div className="mp-logo">A</div>
            <div>
              <div className="mp-brand">AL.LK</div>
              <div className="mp-brand-sub">Student Platform</div>
            </div>
          </div>
          <div className="mp-body">
            <div className="mp-success">
              <div className="mp-success-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="mp-success-title">Payment Submitted!</div>
              <div className="mp-success-sub">
                Your monthly payment slip has been submitted successfully.<br />
                The admin will review and approve it shortly. Your Student ID remains the same.
              </div>
              <div className="mp-success-id">
                <div className="mp-success-id-lbl">Your Student ID</div>
                <div className="mp-success-id-val">{studentId.toUpperCase()}</div>
              </div>
              <br />
              <a href="/" className="mp-success-back">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="mp-page">

        {/* Top bar — hidden when embedded in dashboard */}
        {!embedded && (
          <div className="mp-topbar">
            <div className="mp-logo">A</div>
            <div>
              <div className="mp-brand">AL.LK</div>
              <div className="mp-brand-sub">Student Platform</div>
            </div>
            <div className="mp-topbar-right">
              <a href="/" className="mp-back-btn">← Back to Home</a>
            </div>
          </div>
        )}

        {/* Hero — hidden when embedded in dashboard */}
        {!embedded && (
          <div className="mp-hero">
            <div className="mp-hero-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Monthly Payment
            </div>
            <div className="mp-hero-title">Submit Your <span>Payment Slip</span></div>
            <div className="mp-hero-sub">
              Already a registered student? Submit your monthly payment slip here. Your Student ID stays the same — no new registration needed.
            </div>
          </div>
        )}

        {/* Steps indicator */}
        <div className="mp-steps">
          {['Your Details','Select Month & Teachers','Upload Slip'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="mp-step">
                <div className="mp-step-num active">{i + 1}</div>
                <span className="mp-step-label active">{s}</span>
              </div>
              {i < 2 && <div className="mp-step-line" />}
            </div>
          ))}
        </div>

        {/* Form body */}
        <div className="mp-body">
          <div className="mp-form-wrap">

            {/* Info */}
            <div className="mp-info-box" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div className="mp-info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="mp-info-text">
                <strong>This is for monthly renewal only.</strong> If you are a new student, please use the{' '}
                <a href="/" style={{ color: '#ff3c2e', fontWeight: 700 }}>Register Now</a> button on the home page instead.
              </div>
            </div>

            {status === 'error' && (
              <div className="mp-error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Something went wrong. Please check your connection and try again.
              </div>
            )}

            {/* Student details */}
            <div className="mp-card">
              <div className="mp-card-hdr">
                <div className="mp-card-hdr-icon" style={{ background: '#fff0ef' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span className="mp-card-hdr-title">Your Details</span>
              </div>
              <div className="mp-card-body">
                <div className="mp-field">
                  <label className="mp-label">Student ID *</label>
                  <input
                    className="mp-input id-field"
                    placeholder="ALLK20260001"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="mp-grid-2">
                  <div className="mp-field">
                    <label className="mp-label">Full Name *</label>
                    <input className="mp-input" placeholder="Your full name" value={studentName} onChange={e => setStudentName(e.target.value)} />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Email *</label>
                    <input className="mp-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="mp-field">
                    <label className="mp-label">Phone Number *</label>
                    <input className="mp-input" type="tel" placeholder="07X XXX XXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="mp-field" style={{ gridColumn: 'span 1' }}>
                    <label className="mp-label">Address *</label>
                    <input className="mp-input" placeholder="No. 12, Main Street, Colombo" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Month & Teachers */}
            <div className="mp-card">
              <div className="mp-card-hdr">
                <div className="mp-card-hdr-icon" style={{ background: '#e8f0fd' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <span className="mp-card-hdr-title">Payment Month</span>
              </div>
              <div className="mp-card-body">
                <div className="mp-field">
                  <label className="mp-label">Select Month *</label>
                  <select className="mp-select" value={month} onChange={e => setMonth(e.target.value)}>
                    {MONTH_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} disabled={o.past} style={o.past ? { color: '#bbb' } : {}}>
                        {o.past ? `${o.label} (past)` : o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mp-field" style={{ marginBottom: 0 }}>
                  <label className="mp-label">Teachers You Are Paying For *</label>
                  <div className="mp-teacher-grid">
                    {ALL_TEACHERS.map(t => {
                      const checked = selectedTeachers.some(x => x.id === t.id);
                      return (
                        <div key={t.id} className={`mp-teacher-cb${checked ? ' checked' : ''}`} onClick={() => toggleTeacher(t)}>
                          <div className="mp-teacher-cb-box">
                            {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div>
                            <div className="mp-teacher-cb-name">{t.name}</div>
                            <div className="mp-teacher-cb-sub" style={{ color: STREAM_COLORS[t.stream] }}>{t.subject}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment slip upload */}
            <div className="mp-card">
              <div className="mp-card-hdr">
                <div className="mp-card-hdr-icon" style={{ background: '#e8f8f0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span className="mp-card-hdr-title">Payment Slip</span>
              </div>
              <div className="mp-card-body">
                <div
                  className={`mp-dropzone${drag ? ' drag' : ''}${file ? ' has-file' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                >
                  <div className="mp-dz-icon">
                    {file
                      ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    }
                  </div>
                  <div className="mp-dz-text">{file ? file.name : 'Click or drag & drop your payment slip'}</div>
                  <div className="mp-dz-sub">{file ? fmtBytes(file.size) : 'PDF, JPG, PNG or WEBP — max 10 MB'}</div>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            </div>

            {/* Submit */}
            <button className="mp-submit" onClick={handleSubmit} disabled={status === 'submitting'}>
              {status === 'submitting'
                ? <><div className="mp-spinner" /> Submitting payment…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg> Submit Payment Slip</>
              }
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
