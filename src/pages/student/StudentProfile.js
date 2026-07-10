import { useState, useRef, useEffect } from 'react';
import { db, storage } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',    stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts'       },
];

const streamColor = (s) => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = (s) => s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';

const css = `
  .sp-wrap { max-width: 860px; }

  /* ── Hero card ── */
  .sp-hero {
    background: #fff; border-radius: 16px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06);
    padding: 32px 30px 26px;
    display: flex; align-items: flex-start; gap: 28px;
    margin-bottom: 20px;
  }

  /* Avatar */
  .sp-av-wrap { position: relative; flex-shrink: 0; cursor: pointer; }
  .sp-av {
    width: 96px; height: 96px; border-radius: 50%;
    background: #ff3c2e; display: flex; align-items: center; justify-content: center;
    font-size: 34px; font-weight: 800; color: #fff;
    overflow: hidden; border: 3px solid #f0f0f0;
  }
  .sp-av img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-av-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(0,0,0,.5);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .2s; cursor: pointer;
  }
  .sp-av-wrap:hover .sp-av-overlay { opacity: 1; }
  .sp-av-hint {
    font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,.9);
    text-align: center; line-height: 1.35; pointer-events: none;
  }

  /* Hero text */
  .sp-hero-name { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 5px; }
  .sp-hero-id   {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 700; color: #ff3c2e;
    background: #fff0f0; border: 1px solid #ffd5d5;
    border-radius: 99px; padding: 3px 12px; margin-bottom: 10px;
  }
  .sp-hero-meta { font-size: 13px; color: #aaa; display: flex; gap: 16px; flex-wrap: wrap; }
  .sp-hero-meta span { display: flex; align-items: center; gap: 5px; }

  /* Photo action buttons row */
  .sp-photo-actions {
    display: flex; align-items: center; gap: 8px;
    margin-top: 14px; flex-wrap: wrap;
  }
  .sp-photo-btn {
    font-size: 11.5px; font-weight: 700;
    border: none; border-radius: 8px;
    padding: 7px 14px; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 6px;
    transition: background .18s, color .18s;
  }
  .sp-photo-btn-view   { color: #2680c7; background: #e8f4fd; }
  .sp-photo-btn-view:hover   { background: #d4eaf8; }
  .sp-photo-btn-change { color: #555; background: #f5f5f5; }
  .sp-photo-btn-change:hover { background: #eee; color: #111; }
  .sp-photo-btn-remove { color: #c0392b; background: #fdf0ee; }
  .sp-photo-btn-remove:hover { background: #fde0dc; }
  .sp-photo-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── Photo viewer modal ── */
  .sp-modal-bg {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,.88);
    display: flex; align-items: center; justify-content: center;
    animation: sp-fadein .18s ease;
  }
  .sp-modal-inner {
    position: relative; max-width: 90vw; max-height: 90vh;
  }
  .sp-modal-img {
    max-width: 90vw; max-height: 85vh;
    border-radius: 14px; display: block;
    box-shadow: 0 24px 80px rgba(0,0,0,.6);
  }
  .sp-modal-close {
    position: absolute; top: -14px; right: -14px;
    width: 34px; height: 34px; border-radius: 50%;
    background: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,.3);
    transition: background .18s;
    font-size: 0;
  }
  .sp-modal-close:hover { background: #f0f0f0; }

  /* ── Section card ── */
  .sp-card {
    background: #fff; border-radius: 14px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06);
    overflow: hidden; margin-bottom: 20px;
  }
  .sp-card-hdr {
    padding: 16px 24px 13px;
    border-bottom: 1px solid #f4f4f4;
    display: flex; align-items: center; justify-content: space-between;
  }
  .sp-card-title { font-size: 14px; font-weight: 700; color: #111; }

  /* Edit / Save / Cancel buttons */
  .sp-edit-btn {
    font-size: 12px; font-weight: 700; color: #555;
    background: #f4f4f4; border: none; border-radius: 8px;
    padding: 7px 16px; cursor: pointer; font-family: inherit;
    transition: all .18s; display: flex; align-items: center; gap: 6px;
  }
  .sp-edit-btn:hover { background: #eee; color: #111; }
  .sp-save-btn {
    font-size: 12px; font-weight: 700; color: #fff;
    background: #ff3c2e; border: none; border-radius: 8px;
    padding: 7px 16px; cursor: pointer; font-family: inherit;
    transition: background .18s; display: flex; align-items: center; gap: 6px;
  }
  .sp-save-btn:hover { background: #e03325; }
  .sp-cancel-btn {
    font-size: 12px; font-weight: 700; color: #888;
    background: none; border: 1.5px solid #e8e8e8; border-radius: 8px;
    padding: 6px 14px; cursor: pointer; font-family: inherit;
    transition: all .18s;
  }
  .sp-cancel-btn:hover { border-color: #ccc; color: #555; }
  .sp-btn-row { display: flex; gap: 8px; align-items: center; }

  /* Info grid */
  .sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 18px 24px 22px; }
  .sp-field {
    background: #fafafa; border: 1.5px solid #eee; border-radius: 11px; padding: 13px 16px;
  }
  .sp-field-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
    color: #bbb; margin-bottom: 5px;
  }
  .sp-field-val { font-size: 14px; font-weight: 600; color: #222; word-break: break-word; }
  .sp-field-val.muted { color: #bbb; font-weight: 400; font-style: italic; }

  /* Editable input */
  .sp-input {
    width: 100%; font-family: inherit; font-size: 14px; font-weight: 600; color: #222;
    background: #fff; border: 1.5px solid #eee; border-radius: 9px;
    padding: 10px 13px; outline: none; transition: border-color .2s, box-shadow .2s;
  }
  .sp-input:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.07); }
  .sp-input::placeholder { color: #ccc; font-weight: 400; }

  /* Enrolled subjects */
  .sp-subjects { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 16px 24px 22px; }
  .sp-subj {
    border: 1.5px solid #eee; border-radius: 12px; padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
    transition: border-color .2s, box-shadow .2s;
  }
  .sp-subj:hover { border-color: #ddd; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .sp-subj-ico {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .sp-subj-name    { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 2px; }
  .sp-subj-teacher { font-size: 11.5px; color: #aaa; }
  .sp-stream-pill  {
    display: inline-block; font-size: 10px; font-weight: 700;
    padding: 2px 8px; border-radius: 99px; margin-top: 5px;
  }

  /* Toast */
  .sp-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    background: #222; color: #fff; font-size: 13px; font-weight: 600;
    padding: 10px 22px; border-radius: 99px;
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
    display: flex; align-items: center; gap: 8px;
    z-index: 9999;
    animation: sp-fadein .2s ease;
  }
  .sp-toast-err { background: #c0392b; }
  @keyframes sp-fadein { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* Empty enrolled */
  .sp-empty { text-align: center; padding: 40px 20px; color: #ccc; font-size: 13.5px; }

  @media (max-width: 600px) {
    .sp-hero { flex-direction: column; align-items: center; text-align: center; }
    .sp-grid { grid-template-columns: 1fr; }
    .sp-hero-meta { justify-content: center; }
    .sp-photo-actions { justify-content: center; }
  }
`;

/* ─── Icons ─── */
const IcoCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcoEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoSave = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function StudentProfile() {
  const fileInputRef = useRef(null);

  /* Read student session (populated once login is wired up) */
  const [session, setSession] = useState(null);
  useEffect(() => {
    try {
      const s = localStorage.getItem('slk_student');
      if (s) setSession(JSON.parse(s));
    } catch {}
  }, []);

  /* Editable profile fields */
  const [form, setForm] = useState({ displayName: '', phone: '', age: '', address: '' });
  useEffect(() => {
    try {
      const stored = localStorage.getItem('slk_student_profile');
      if (stored) {
        setForm(JSON.parse(stored));
      } else if (session) {
        setForm(f => ({
          ...f,
          displayName: session.studentName || '',
          phone:       session.phone       || '',
          address:     session.address     || '',
        }));
      }
    } catch {}
  }, [session]);

  /* Profile photo — URL (Firebase) or base64 (legacy local) */
  const [photo, setPhoto]           = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [viewOpen, setViewOpen]     = useState(false);

  useEffect(() => {
    // Prefer photoURL from session (Firebase), fall back to localStorage
    if (session?.photoURL) {
      setPhoto(session.photoURL);
    } else {
      const p = localStorage.getItem('slk_student_photo');
      if (p) setPhoto(p);
    }
  }, [session]);

  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({});
  const [toast,   setToast]   = useState({ msg: '', err: false });

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast({ msg: '', err: false }), 3000);
  };

  const startEdit  = () => { setDraft({ ...form }); setEditing(true); };
  const cancelEdit = () => setEditing(false);
  const saveEdit   = () => {
    const updated = { ...form, ...draft };
    setForm(updated);
    localStorage.setItem('slk_student_profile', JSON.stringify(updated));
    setEditing(false);
    showToast('Profile updated');
  };

  /* ── Photo: upload to Firebase Storage ── */
  const handlePhotoClick  = () => fileInputRef.current?.click();
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5 MB', true); return; }
    setPhotoLoading(true);
    try {
      const studentId = session?.studentId || 'guest';
      const path      = `profile-photos/${studentId}`;
      const sRef      = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      setPhoto(url);
      localStorage.setItem('slk_student_photo', url);

      // Save URL to Firestore if student is logged in
      if (session?.docId) {
        await updateDoc(doc(db, 'registrations', session.docId), { photoURL: url });
        // Update cached session
        const updated = { ...session, photoURL: url };
        localStorage.setItem('slk_student', JSON.stringify(updated));
        setSession(updated);
      }
      showToast('Profile photo updated');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload photo. Try again.', true);
    }
    setPhotoLoading(false);
  };

  /* ── Photo: remove from Firebase Storage ── */
  const handleRemovePhoto = async () => {
    if (!photo) return;
    setPhotoLoading(true);
    try {
      const studentId = session?.studentId || 'guest';
      const path      = `profile-photos/${studentId}`;
      try {
        await deleteObject(storageRef(storage, path));
      } catch (delErr) {
        // If file doesn't exist in storage, still clear locally
        if (delErr.code !== 'storage/object-not-found') throw delErr;
      }

      // Remove from Firestore if logged in
      if (session?.docId) {
        await updateDoc(doc(db, 'registrations', session.docId), { photoURL: '' });
        const updated = { ...session, photoURL: '' };
        localStorage.setItem('slk_student', JSON.stringify(updated));
        setSession(updated);
      }

      setPhoto(null);
      localStorage.removeItem('slk_student_photo');
      showToast('Profile photo removed');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove photo. Try again.', true);
    }
    setPhotoLoading(false);
  };

  /* Enrolled subjects — selectedTeachers may be objects {id,...} or plain ID strings */
  const enrolledIds      = (session?.selectedTeachers || [])
    .map(t => (typeof t === 'object' && t !== null ? t.id : t))
    .filter(Boolean);
  const enrolledTeachers = ALL_TEACHERS.filter(t => enrolledIds.includes(t.id));

  const displayName = form.displayName || session?.studentName || '';
  const initials    = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'S';

  return (
    <>
      <style>{css}</style>
      <div className="sp-wrap">

        {/* ── Hero ── */}
        <div className="sp-hero">
          {/* Avatar — click to view if photo exists, else change */}
          <div className="sp-av-wrap" onClick={photo ? () => setViewOpen(true) : handlePhotoClick}>
            <div className="sp-av">
              {photo ? <img src={photo} alt="profile" /> : initials}
            </div>
            <div className="sp-av-overlay">
              <div className="sp-av-hint">
                {photo
                  ? <>
                      <IcoEye />
                      <span style={{ display: 'block', marginTop: 3 }}>View</span>
                    </>
                  : <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 4px' }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Change
                    </>
                }
              </div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />

          {/* Name + meta */}
          <div style={{ flex: 1 }}>
            <div className="sp-hero-name">{displayName || 'Student Name'}</div>
            {session?.studentId && (
              <div className="sp-hero-id">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10" stroke="#fff" strokeWidth="2"/></svg>
                {session.studentId}
              </div>
            )}
            <div className="sp-hero-meta">
              {session?.batch && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Batch {session.batch}
                </span>
              )}
              {enrolledTeachers.length > 0 && (
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
                  {enrolledTeachers.length} subject{enrolledTeachers.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Photo action buttons */}
            <div className="sp-photo-actions">
              {photo && (
                <button
                  className="sp-photo-btn sp-photo-btn-view"
                  onClick={() => setViewOpen(true)}
                  disabled={photoLoading}
                >
                  <IcoEye /> View Photo
                </button>
              )}
              <button
                className="sp-photo-btn sp-photo-btn-change"
                onClick={handlePhotoClick}
                disabled={photoLoading}
              >
                <IcoCamera /> {photoLoading ? 'Uploading…' : 'Change Photo'}
              </button>
              {photo && (
                <button
                  className="sp-photo-btn sp-photo-btn-remove"
                  onClick={handleRemovePhoto}
                  disabled={photoLoading}
                >
                  <IcoTrash /> {photoLoading ? 'Removing…' : 'Remove Photo'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Information ── */}
        <div className="sp-card">
          <div className="sp-card-hdr">
            <span className="sp-card-title">Personal Information</span>
            {editing ? (
              <div className="sp-btn-row">
                <button className="sp-cancel-btn" onClick={cancelEdit}>Cancel</button>
                <button className="sp-save-btn" onClick={saveEdit}><IcoSave /> Save changes</button>
              </div>
            ) : (
              <button className="sp-edit-btn" onClick={startEdit}><IcoEdit /> Edit</button>
            )}
          </div>
          <div className="sp-grid">
            <div className="sp-field">
              <div className="sp-field-lbl">Full Name</div>
              {editing
                ? <input className="sp-input" placeholder="Your full name" value={draft.displayName ?? form.displayName} onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))} />
                : <div className={`sp-field-val${!form.displayName && !session?.studentName ? ' muted' : ''}`}>{form.displayName || session?.studentName || 'Not set'}</div>
              }
            </div>

            <div className="sp-field">
              <div className="sp-field-lbl">Phone Number</div>
              {editing
                ? <input className="sp-input" type="tel" placeholder="07X XXX XXXX" value={draft.phone ?? form.phone} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
                : <div className={`sp-field-val${!form.phone && !session?.phone ? ' muted' : ''}`}>{form.phone || session?.phone || 'Not set'}</div>
              }
            </div>

            <div className="sp-field">
              <div className="sp-field-lbl">Age</div>
              {editing
                ? <input className="sp-input" type="number" min="1" max="99" placeholder="e.g. 18" value={draft.age ?? form.age} onChange={e => setDraft(d => ({ ...d, age: e.target.value }))} />
                : <div className={`sp-field-val${!form.age ? ' muted' : ''}`}>{form.age || 'Not set'}</div>
              }
            </div>

            <div className="sp-field">
              <div className="sp-field-lbl">Email Address</div>
              <div className={`sp-field-val${!session?.email ? ' muted' : ''}`}>{session?.email || 'Not set'}</div>
            </div>

            <div className="sp-field" style={{ gridColumn: '1 / -1' }}>
              <div className="sp-field-lbl">Address</div>
              {editing
                ? <input className="sp-input" placeholder="Your address" value={draft.address ?? form.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
                : <div className={`sp-field-val${!form.address && !session?.address ? ' muted' : ''}`}>{form.address || session?.address || 'Not set'}</div>
              }
            </div>
          </div>
        </div>

        {/* ── Academic Information ── */}
        {session && (
          <div className="sp-card">
            <div className="sp-card-hdr">
              <span className="sp-card-title">Academic Information</span>
            </div>
            <div className="sp-grid">
              <div className="sp-field">
                <div className="sp-field-lbl">Student ID</div>
                <div className="sp-field-val" style={{ color: '#ff3c2e', letterSpacing: '.04em' }}>{session.studentId}</div>
              </div>
              <div className="sp-field">
                <div className="sp-field-lbl">Batch</div>
                <div className={`sp-field-val${!session.batch ? ' muted' : ''}`}>{session.batch || '—'}</div>
              </div>
              <div className="sp-field">
                <div className="sp-field-lbl">Registration Status</div>
                <div className="sp-field-val" style={{ color: '#1a7a4a' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#e8f8f0', borderRadius: 99, padding: '2px 10px', fontSize: 12 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#27956b', display: 'inline-block' }} />
                    Approved
                  </span>
                </div>
              </div>
              <div className="sp-field">
                <div className="sp-field-lbl">Enrolled Subjects</div>
                <div className="sp-field-val">{enrolledTeachers.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Enrolled Subjects ── */}
        <div className="sp-card">
          <div className="sp-card-hdr">
            <span className="sp-card-title">Enrolled Subjects</span>
            {enrolledTeachers.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', background: '#f4f4f4', padding: '3px 10px', borderRadius: 99 }}>
                {enrolledTeachers.length} subject{enrolledTeachers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {enrolledTeachers.length === 0 ? (
            <div className="sp-empty">
              No subjects enrolled yet.<br />
              <span style={{ fontSize: 12, color: '#ddd', marginTop: 4, display: 'block' }}>Subjects will appear here after registration is linked.</span>
            </div>
          ) : (
            <div className="sp-subjects">
              {enrolledTeachers.map(t => (
                <div key={t.id} className="sp-subj">
                  <div className="sp-subj-ico" style={{ background: streamBg(t.stream) }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={streamColor(t.stream)} strokeWidth="2" strokeLinecap="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sp-subj-name">{t.subject}</div>
                    <div className="sp-subj-teacher">{t.name}</div>
                    <span className="sp-stream-pill" style={{ background: streamBg(t.stream), color: streamColor(t.stream) }}>{t.stream}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Photo Viewer Modal ── */}
      {viewOpen && photo && (
        <div className="sp-modal-bg" onClick={() => setViewOpen(false)}>
          <div className="sp-modal-inner" onClick={e => e.stopPropagation()}>
            <img src={photo} alt="Profile" className="sp-modal-img" />
            <button className="sp-modal-close" onClick={() => setViewOpen(false)} aria-label="Close">
              <IcoX />
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast.msg && (
        <div className={`sp-toast${toast.err ? ' sp-toast-err' : ''}`}>
          {toast.err ? <IcoX /> : <IcoCheck />} {toast.msg}
        </div>
      )}
    </>
  );
}
