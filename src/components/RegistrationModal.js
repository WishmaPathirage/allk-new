import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';

const BATCHES = ['2028', '2029', '2030'];

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
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts' },
];

const STREAMS = ['All Streams', 'Technology', 'Commerce', 'Arts'];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes rm-bd-in     { from{opacity:0}                                          to{opacity:1} }
  @keyframes rm-modal-in  { from{opacity:0;transform:translateY(28px) scale(.96)}   to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes rm-ok-in     { from{opacity:0;transform:scale(.88)}                    to{opacity:1;transform:scale(1)} }
  @keyframes rm-spin      { to{transform:rotate(360deg)} }

  .rm-bd {
    position:fixed; inset:0; z-index:2000;
    background:rgba(0,0,0,.6);
    backdrop-filter:blur(5px);
    display:flex; align-items:center; justify-content:center;
    padding:20px;
    animation:rm-bd-in .2s ease;
    overflow-y:auto;
  }

  .rm-modal {
    background:#fff; border-radius:24px;
    width:100%; max-width:600px;
    max-height:88vh; overflow-y:auto;
    box-shadow:0 32px 90px rgba(0,0,0,.25);
    animation:rm-modal-in .32s cubic-bezier(.22,1,.36,1);
    font-family:'DM Sans',sans-serif;
    position:relative;
  }
  .rm-modal::-webkit-scrollbar { width:5px; }
  .rm-modal::-webkit-scrollbar-track { background:#f5f5f5; }
  .rm-modal::-webkit-scrollbar-thumb { background:#e0e0e0; border-radius:3px; }

  /* ── Header ── */
  .rm-hdr {
    padding:26px 32px 18px;
    border-bottom:1px solid #f0f0f0;
    display:flex; align-items:flex-start; gap:14px;
    position:sticky; top:0; background:#fff; z-index:5;
    border-radius:24px 24px 0 0;
  }
  .rm-hdr-icon {
    width:46px; height:46px; border-radius:14px;
    background:#fff5f5; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
  }
  .rm-hdr-text { flex:1; }
  .rm-hdr-title { font-family:'DM Serif Display',serif; font-size:20px; color:#111; line-height:1.2; margin-bottom:3px; }
  .rm-hdr-sub   { font-size:13px; color:#aaa; }
  .rm-hdr-close {
    width:36px; height:36px; border-radius:10px;
    background:#f5f5f5; border:none; cursor:pointer; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; color:#888;
    transition:background .2s, color .2s, transform .2s;
  }
  .rm-hdr-close:hover { background:#ff3c2e; color:#fff; transform:rotate(90deg); }

  /* ── Class banner ── */
  .rm-banner {
    margin:18px 32px 0;
    background:#fff5f5; border:1.5px solid #ffd0cd; border-radius:14px;
    padding:14px 18px; display:flex; gap:12px; align-items:flex-start;
  }
  .rm-banner-dot {
    width:8px; height:8px; border-radius:50%; background:#ff3c2e;
    margin-top:5px; flex-shrink:0;
  }
  .rm-banner-title { font-size:14px; font-weight:700; color:#111; margin-bottom:5px; }
  .rm-banner-meta  { font-size:12.5px; color:#888; display:flex; gap:12px; flex-wrap:wrap; }

  /* ── Body ── */
  .rm-body { padding:22px 32px 32px; }

  .rm-sec-lbl {
    font-size:10px; font-weight:700; letter-spacing:.26em; text-transform:uppercase;
    color:#bbb; margin-bottom:14px; margin-top:26px;
  }
  .rm-sec-lbl:first-child { margin-top:0; }

  .rm-lang-notice {
    margin: 14px 32px 0;
    background: #fffbe6; border: 1.5px solid #f0d080; border-radius: 12px;
    padding: 12px 16px; display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: #7a5a00; line-height: 1.55;
  }
  .rm-lang-notice svg { flex-shrink: 0; margin-top: 1px; }

  .rm-row2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  .rm-field { margin-bottom:14px; }
  .rm-lbl   { display:block; font-size:12.5px; font-weight:600; color:#555; margin-bottom:7px; }
  .rm-req   { color:#ff3c2e; margin-left:2px; }
  .rm-input {
    width:100%; font-family:'DM Sans',sans-serif; font-size:14px; color:#111;
    background:#fafafa; border:1.5px solid #eee; border-radius:12px;
    padding:13px 16px; outline:none;
    transition:border-color .2s, box-shadow .2s, background .2s;
  }
  .rm-input::placeholder { color:#ccc; }
  .rm-input:focus  { border-color:#ff3c2e; background:#fff; box-shadow:0 0 0 4px rgba(255,60,46,.07); }
  .rm-input.err    { border-color:#ff3c2e; background:#fff9f9; }
  .rm-err { font-size:12px; color:#ff3c2e; margin-top:5px; display:flex; align-items:center; gap:4px; }

  /* ── Stream filter chips ── */
  .rm-chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .rm-chip {
    font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
    padding:7px 16px; border-radius:99px; cursor:pointer;
    border:1.5px solid #eee; background:#fafafa; color:#777;
    transition:all .2s;
  }
  .rm-chip.on  { background:#ff3c2e; color:#fff; border-color:#ff3c2e; }
  .rm-chip:hover:not(.on) { border-color:#ff3c2e; color:#ff3c2e; }

  /* ── Teacher list ── */
  .rm-tlist {
    display:flex; flex-direction:column; gap:9px;
    max-height:230px; overflow-y:auto; padding-right:3px;
  }
  .rm-tlist::-webkit-scrollbar { width:4px; }
  .rm-tlist::-webkit-scrollbar-track { background:#f5f5f5; border-radius:2px; }
  .rm-tlist::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }

  .rm-titem {
    display:flex; align-items:center; gap:13px;
    padding:11px 15px; border-radius:13px; border:1.5px solid #eee;
    cursor:pointer; transition:all .2s; user-select:none;
  }
  .rm-titem:hover   { border-color:#ffd0cd; background:#fffaf9; }
  .rm-titem.checked { border-color:#ff3c2e; background:#fff5f5; }

  .rm-chk {
    width:20px; height:20px; border-radius:6px;
    border:2px solid #ddd; background:#fff; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    transition:all .2s;
  }
  .rm-titem.checked .rm-chk { background:#ff3c2e; border-color:#ff3c2e; }

  .rm-tname { font-size:13.5px; font-weight:600; color:#222; }
  .rm-tsub  { font-size:12px; color:#aaa; margin-top:2px; }
  .rm-tbadge {
    margin-left:auto; font-size:11px; font-weight:700; letter-spacing:.04em;
    padding:3px 10px; border-radius:99px; white-space:nowrap; flex-shrink:0;
  }
  .rm-tbadge.Technology { background:#e8f4fd; color:#2680c7; }
  .rm-tbadge.Commerce   { background:#e8f8f0; color:#27956b; }
  .rm-tbadge.Arts       { background:#fdf0e8; color:#c9720c; }

  /* ── File upload ── */
  .rm-upload {
    border:2px dashed #e0e0e0; border-radius:14px;
    padding:28px 20px; text-align:center; cursor:pointer;
    transition:all .25s; background:#fafafa; position:relative;
  }
  .rm-upload:hover, .rm-upload.drag { border-color:#ff3c2e; background:#fff5f5; }
  .rm-upload.filled { border-color:#ff3c2e; background:#fff5f5; border-style:solid; }
  .rm-upload input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .rm-upload-ico   { color:#ccc; margin-bottom:10px; transition:color .2s; }
  .rm-upload.filled .rm-upload-ico { color:#ff3c2e; }
  .rm-upload-txt   { font-size:14px; color:#888; }
  .rm-upload-txt strong { color:#ff3c2e; cursor:pointer; }
  .rm-upload-hint  { font-size:12px; color:#ccc; margin-top:5px; }
  .rm-file-name    { font-size:13px; font-weight:600; color:#ff3c2e; margin-top:8px; word-break:break-all; }

  /* ── Submit ── */
  .rm-submit {
    width:100%; margin-top:26px;
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; letter-spacing:.07em;
    text-transform:uppercase; color:#fff;
    background:#ff3c2e; border:none; border-radius:14px;
    padding:16px 20px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:10px;
    transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s;
    box-shadow:0 6px 22px rgba(255,60,46,.32);
  }
  .rm-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 32px rgba(255,60,46,.32); }
  .rm-submit:active:not(:disabled) { transform:translateY(0); }
  .rm-submit:disabled { opacity:.6; cursor:not-allowed; }
  .rm-spinner {
    width:18px; height:18px; border:2.5px solid rgba(255,255,255,.35);
    border-top-color:#fff; border-radius:50%; animation:rm-spin .7s linear infinite;
  }

  /* ── Error banner ── */
  .rm-errbanner {
    margin-top:14px; background:#fff5f5; border:1.5px solid #ffd0cd;
    border-radius:12px; padding:12px 16px;
    font-size:13px; color:#cc2a1e; display:flex; align-items:center; gap:9px;
  }

  /* ── Success ── */
  .rm-ok {
    padding:64px 40px; text-align:center;
    animation:rm-ok-in .4s cubic-bezier(.22,1,.36,1);
  }
  .rm-ok-circle {
    width:76px; height:76px; border-radius:50%; background:#e8f8f0;
    display:flex; align-items:center; justify-content:center; margin:0 auto 20px;
  }
  .rm-ok-title { font-family:'DM Serif Display',serif; font-size:27px; color:#111; margin-bottom:12px; }
  .rm-ok-msg   { font-size:14.5px; color:#888; line-height:1.85; max-width:330px; margin:0 auto 28px; }
  .rm-ok-btn   {
    font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:700; letter-spacing:.05em;
    text-transform:uppercase; color:#fff; background:#ff3c2e; border:none; border-radius:12px;
    padding:14px 36px; cursor:pointer; transition:transform .2s, box-shadow .2s;
    box-shadow:0 6px 18px rgba(255,60,46,.32);
  }
  .rm-ok-btn:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(255,60,46,.3); }

  @media (max-width:540px) {
    .rm-hdr, .rm-body { padding-left:20px; padding-right:20px; }
    .rm-banner { margin-left:20px; margin-right:20px; }
    .rm-row2 { grid-template-columns:1fr; }
  }
`;

function ErrMsg({ msg }) {
  if (!msg) return null;
  return (
    <p className="rm-err">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {msg}
    </p>
  );
}

export default function RegistrationModal({ classInfo, onClose }) {
  const [form, setForm] = useState({ studentName: '', email: '', address: '', phone: '', batch: '', month: '' });
  const [selectedTeachers, setSelectedTeachers] = useState(
    classInfo?.teacher ? [classInfo.teacher.id] : []
  );
  const [streamFilter, setStreamFilter] = useState('All Streams');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const fileInputRef = useRef(null);

  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const visibleTeachers = ALL_TEACHERS.filter(t =>
    streamFilter === 'All Streams'
    || t.stream === streamFilter
    || (t.id === 'econ' && streamFilter === 'Arts')
  );

  const toggleTeacher = (id) => {
    setSelectedTeachers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) {
      setErrors(e => ({ ...e, file: 'Only PDF or image files (JPG, PNG, WEBP) are allowed.' }));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrors(e => ({ ...e, file: 'File must be smaller than 10 MB.' }));
      return;
    }
    setFile(f);
    setErrors(e => ({ ...e, file: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.studentName.trim())  errs.studentName = 'Full name is required.';
    else if (!/^[a-zA-Z0-9\s'.\-,]+$/.test(form.studentName.trim())) errs.studentName = 'Name must be in English characters only.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.address.trim())      errs.address = 'Address is required.';
    else if (!/^[a-zA-Z0-9\s'.,\-/#&()]+$/.test(form.address.trim())) errs.address = 'Address must be in English characters only.';
    if (!form.phone.trim())        errs.phone = 'Phone number is required.';
    if (!form.batch)               errs.batch = 'Please select your A/L batch.';
    if (!form.month)               errs.month = 'Please select your registration month.';
    if (selectedTeachers.length === 0) errs.teachers = 'Please select at least one teacher.';
    if (!file)                     errs.file = 'Please upload your payment slip.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus('loading');
    try {
      // 0. Block duplicate email via registered_emails (publicly readable — no auth needed)
      const emailLower = form.email.trim().toLowerCase();
      const emailKey   = emailLower.replace(/[.#$[\]/]/g, '_');
      try {
        const regEmailSnap = await getDoc(doc(db, 'registered_emails', emailKey));
        if (regEmailSnap.exists()) {
          setErrors(e => ({ ...e, email: 'This email is already registered. Each student can only have one registration.' }));
          setStatus('idle');
          return;
        }
      } catch (_dupErr) {
        // Rules not deployed yet — skip duplicate check and proceed
      }

      // 1. Upload payment slip to Firebase Storage
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `payment-slips/${Date.now()}_${form.studentName.replace(/\s+/g,'_')}.${ext}`);
      const snapshot = await uploadBytes(storageRef, file);
      const paymentSlipUrl = await getDownloadURL(snapshot.ref);

      // 2. Build selected teacher objects
      const teachers = ALL_TEACHERS.filter(t => selectedTeachers.includes(t.id));

      // 2b. Map short teacher ids -> their Firebase Auth UID (= teachers/{uid} doc id)
      //     so Firestore rules can grant read access via array-contains(request.auth.uid)
      //     without a get() lookup, which Firestore disallows for list queries
      const teachersSnap = await getDocs(collection(db, 'teachers'));
      const uidByShortId = {};
      teachersSnap.docs.forEach(d => { uidByShortId[d.data().id] = d.id; });
      const teacherUids = teachers.map(t => uidByShortId[t.id]).filter(Boolean);

      // 3. Build month key YYYY-MM
      const monthIdx = MONTHS.indexOf(form.month) + 1;
      const year     = new Date().getFullYear();
      const monthKey = `${year}-${String(monthIdx).padStart(2, '0')}`;

      // 4. Save registration to Firestore
      await addDoc(collection(db, 'registrations'), {
        studentName:           form.studentName.trim(),
        email:                 form.email.trim(),
        address:               form.address.trim(),
        phone:                 form.phone.trim(),
        batch:                 form.batch,
        registrationMonth:     form.month,
        registrationMonthKey:  monthKey,
        primaryTeacher:        classInfo?.teacher || null,
        classInfo: classInfo ? {
          title:    classInfo.title,
          grade:    classInfo.grade,
          time:     classInfo.time,
          days:     classInfo.days,
          location: classInfo.location,
        } : null,
        selectedTeachers: teachers,
        teacherIds: teachers.map(t => t.id),
        teacherUids,
        paymentSlipUrl,
        paymentSlipFileName: file.name,
        submittedAt:   serverTimestamp(),
        registeredAt:  serverTimestamp(),
        status: 'pending',
      });

      // 5. Mark email as registered (enables duplicate check on next attempt)
      try { await setDoc(doc(db, 'registered_emails', emailKey), { email: emailLower }); } catch (_) {}

      // 6. Auto-create monthly payment record
      await addDoc(collection(db, 'monthly_payments'), {
        studentName:      form.studentName.trim(),
        email:            form.email.trim(),
        phone:            form.phone.trim(),
        selectedTeachers: teachers,
        month:            monthKey,
        slipUrl:          paymentSlipUrl,
        slipFileName:     file.name,
        status:           'pending',
        source:           'registration',
        submittedAt:      serverTimestamp(),
      });

      setStatus('success');
    } catch (err) {
      console.error('Registration error:', err);
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <>
      <style>{css}</style>
      <div className="rm-bd" onClick={(e) => { if (e.target === e.currentTarget && status !== 'loading') onClose(); }}>
        <div className="rm-modal">

          {status === 'success' ? (
            <div className="rm-ok">
              <div className="rm-ok-circle">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="rm-ok-title">Registration Submitted!</h2>
              <p className="rm-ok-msg">
                Your registration has been received. Our team will review your payment slip and confirm your enrollment shortly.
              </p>
              <button className="rm-ok-btn" onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="rm-hdr">
                <div className="rm-hdr-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="rm-hdr-text">
                  <h2 className="rm-hdr-title">Class Registration</h2>
                  <p className="rm-hdr-sub">Fill in your details to register for this class</p>
                </div>
                <button className="rm-hdr-close" onClick={onClose} disabled={status === 'loading'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Class banner */}
              {classInfo && (
                <div className="rm-banner">
                  <div className="rm-banner-dot" />
                  <div>
                    <div className="rm-banner-title">{classInfo.title} - {classInfo.grade}</div>
                    <div className="rm-banner-meta">
                      {classInfo.teacher && <span style={{fontWeight:600,color:'#ff3c2e'}}>{classInfo.teacher.name}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Language notice */}
              <div className="rm-lang-notice">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bf7a00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><strong>Important:</strong> Please fill in all details using <strong>English characters only</strong>. Forms submitted in other languages may not be processed.</span>
              </div>

              {/* Form body */}
              <form className="rm-body" onSubmit={handleSubmit} noValidate>

                {/* Personal Info */}
                <p className="rm-sec-lbl">Personal Information</p>

                <div className="rm-field">
                  <label className="rm-lbl">Full Name <span className="rm-req">*</span></label>
                  <input
                    className={`rm-input${errors.studentName ? ' err' : ''}`}
                    placeholder="e.g. Kavindu Perera"
                    value={form.studentName}
                    onChange={e => { setForm(f => ({...f, studentName: e.target.value})); setErrors(er => ({...er, studentName: null})); }}
                  />
                  <ErrMsg msg={errors.studentName} />
                </div>

                <div className="rm-row2">
                  <div className="rm-field">
                    <label className="rm-lbl">Email Address <span className="rm-req">*</span></label>
                    <input
                      type="email"
                      className={`rm-input${errors.email ? ' err' : ''}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => { setForm(f => ({...f, email: e.target.value})); setErrors(er => ({...er, email: null})); }}
                    />
                    <ErrMsg msg={errors.email} />
                  </div>
                  <div className="rm-field">
                    <label className="rm-lbl">Phone Number <span className="rm-req">*</span></label>
                    <input
                      type="tel"
                      className={`rm-input${errors.phone ? ' err' : ''}`}
                      placeholder="07X XXX XXXX"
                      value={form.phone}
                      onChange={e => { setForm(f => ({...f, phone: e.target.value})); setErrors(er => ({...er, phone: null})); }}
                    />
                    <ErrMsg msg={errors.phone} />
                  </div>
                </div>

                <div className="rm-row2">
                  <div className="rm-field">
                    <label className="rm-lbl">Address <span className="rm-req">*</span></label>
                    <input
                      className={`rm-input${errors.address ? ' err' : ''}`}
                      placeholder="No. 12, Galle Road, Colombo 03"
                      value={form.address}
                      onChange={e => { setForm(f => ({...f, address: e.target.value})); setErrors(er => ({...er, address: null})); }}
                    />
                    <ErrMsg msg={errors.address} />
                  </div>
                  <div className="rm-field">
                    <label className="rm-lbl">A/L Batch <span className="rm-req">*</span></label>
                    <select
                      className={`rm-input${errors.batch ? ' err' : ''}`}
                      style={{cursor:'pointer'}}
                      value={form.batch}
                      onChange={e => { setForm(f => ({...f, batch: e.target.value})); setErrors(er => ({...er, batch: null})); }}
                    >
                      <option value="">Select batch…</option>
                      {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <ErrMsg msg={errors.batch} />
                  </div>
                </div>

                {/* Registration Month */}
                <div className="rm-field">
                  <label className="rm-lbl">Registration Month <span className="rm-req">*</span></label>
                  <select
                    className={`rm-input${errors.month ? ' err' : ''}`}
                    style={{cursor:'pointer'}}
                    value={form.month}
                    onChange={e => { setForm(f => ({...f, month: e.target.value})); setErrors(er => ({...er, month: null})); }}
                  >
                    <option value="">Select month…</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ErrMsg msg={errors.month} />
                </div>

                {/* Teacher Selection */}
                <p className="rm-sec-lbl">Select Teacher(s) <span style={{color:'#ff3c2e'}}>*</span></p>

                <div className="rm-chips">
                  {STREAMS.filter(s => s === 'All Streams' || ALL_TEACHERS.some(t => t.stream === s)).map(s => (
                    <button
                      key={s} type="button"
                      className={`rm-chip${streamFilter === s ? ' on' : ''}`}
                      onClick={() => setStreamFilter(s)}
                    >{s}</button>
                  ))}
                </div>

                <div className="rm-tlist">
                  {visibleTeachers.map(t => (
                    <div
                      key={t.id}
                      className={`rm-titem${selectedTeachers.includes(t.id) ? ' checked' : ''}`}
                      onClick={() => { toggleTeacher(t.id); setErrors(er => ({...er, teachers: null})); }}
                    >
                      <div className="rm-chk">
                        {selectedTeachers.includes(t.id) && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      <div style={{flex:1}}>
                        <div className="rm-tname">{t.name}</div>
                        <div className="rm-tsub">{t.subject}</div>
                      </div>
                      <span className={`rm-tbadge ${t.stream}`}>{t.stream}</span>
                    </div>
                  ))}
                </div>
                <ErrMsg msg={errors.teachers} />

                {/* Payment Slip */}
                <p className="rm-sec-lbl" style={{marginTop:26}}>Payment Slip <span style={{color:'#ff3c2e'}}>*</span></p>

                <div
                  className={`rm-upload${drag ? ' drag' : ''}${file ? ' filled' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={e => handleFile(e.target.files[0])}
                    style={{display:'none'}}
                  />
                  <div className="rm-upload-ico">
                    {file ? (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    )}
                  </div>
                  {file ? (
                    <p className="rm-file-name">{file.name}</p>
                  ) : (
                    <>
                      <p className="rm-upload-txt">Drag & drop or <strong>click to browse</strong></p>
                      <p className="rm-upload-hint">PDF, JPG, PNG, WEBP · Max 10 MB</p>
                    </>
                  )}
                </div>
                <ErrMsg msg={errors.file} />

                {/* Error banner */}
                {status === 'error' && (
                  <div className="rm-errbanner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Something went wrong. Please check your connection and try again.
                  </div>
                )}

                {/* Submit */}
                <button className="rm-submit" type="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? (
                    <><div className="rm-spinner" /> Submitting...</>
                  ) : (
                    <>
                      Submit Registration
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
