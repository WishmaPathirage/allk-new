import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../../services/firebase';

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'sinhala',    name: 'Pathum Sandanuwan',       subject: 'Sinhala',                stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',        subject: 'Media',                  stream: 'Arts'       },
];

const streamColor = (s) =>
  s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';

/* Secondary Firebase app — creates accounts without signing out the admin */
function getSecondaryAuth() {
  const existing = getApps().find(a => a.name === 'teacher-creator');
  const app = existing || initializeApp(firebaseConfig, 'teacher-creator');
  return getAuth(app);
}

const inputStyle = {
  width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333',
  background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10,
  padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .2s',
};
const labelStyle = {
  fontSize: 11.5, fontWeight: 700, color: '#666', letterSpacing: '.07em',
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
};

export default function TeacherAccountsPage({ toast }) {
  const [teacherDocs, setTeacherDocs] = useState([]);
  const [createFor, setCreateFor]     = useState(null); // teacher id being created
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [saving, setSaving]           = useState(false);
  const [resetSending, setResetSending] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* Listen to teachers collection */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'teachers'),
      snap => setTeacherDocs(snap.docs.map(d => ({ docId: d.id, ...d.data() }))),
      () => {}
    );
    return unsub;
  }, []);

  const getDoc = (teacherId) =>
    teacherDocs.find(d => d.id === teacherId) || null;

  const openCreate = (teacher) => {
    setCreateFor(teacher.id);
    setEmail('');
    setPassword('');
    setShowPw(false);
  };

  const handleCreate = async (teacher) => {
    const em = email.trim().toLowerCase();
    if (!em)            { toast('Please enter an email address', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast('Please enter a valid email', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }

    setSaving(true);
    try {
      const secondaryAuth = getSecondaryAuth();

      /* Create Firebase Auth account using secondary app — admin stays signed in */
      const { user: newUser } = await createUserWithEmailAndPassword(secondaryAuth, em, password);
      const teacherUid = newUser.uid;

      /* Sign out of secondary app immediately */
      await secondaryAuth.signOut();

      /* Write Firestore teacher profile — use Firebase Auth UID as document ID
         so security rules can verify teacher identity via request.auth.uid */
      await setDoc(doc(db, 'teachers', teacherUid), {
        id:      teacher.id,
        name:    teacher.name,
        subject: teacher.subject,
        stream:  teacher.stream,
        email:   em,
        createdAt: serverTimestamp(),
      });

      toast(`Account created for ${teacher.name}`, 'success');
      setCreateFor(null);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast(
          `${em} already has a Firebase Auth account. Delete it in the Firebase Console first, then recreate.`,
          'error'
        );
      } else if (err.code === 'auth/invalid-email') {
        toast('Invalid email address', 'error');
      } else if (err.code === 'auth/weak-password') {
        toast('Password must be at least 6 characters', 'error');
      } else {
        toast('Failed: ' + (err.message || 'Unknown error'), 'error');
      }
    }
    setSaving(false);
  };

  const handleSendReset = async (teacherDoc) => {
    setResetSending(teacherDoc.id);
    try {
      await sendPasswordResetEmail(getSecondaryAuth(), teacherDoc.email);
      toast(`Password reset email sent to ${teacherDoc.email}`, 'success');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        toast('No Firebase Auth account found for this email. Try recreating the account.', 'error');
      } else {
        toast('Failed to send reset email: ' + err.message, 'error');
      }
    }
    setResetSending(null);
  };

  const handleDelete = async (teacher) => {
    const tDoc = getDoc(teacher.id);
    if (!tDoc) return;
    try {
      /* Use the actual Firestore document ID (the teacher's Firebase Auth UID) */
      await deleteDoc(doc(db, 'teachers', tDoc.docId));
      toast(`${teacher.name}'s portal access removed`, 'info');
      setConfirmDelete(null);
    } catch (err) {
      toast('Failed to remove access: ' + err.message, 'error');
    }
  };

  const streams = ['Technology', 'Commerce', 'Arts'];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #16181f, #2d3347)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(255,60,46,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Teacher Portal Accounts</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>
            {teacherDocs.length} of {ALL_TEACHERS.length} teachers have portal access
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ff3c2e', lineHeight: 1 }}>
            {ALL_TEACHERS.length - teacherDocs.length}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 3 }}>
            no access yet
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#e8f4fd', border: '1.5px solid #b8d9f5',
        borderRadius: 12, padding: '14px 18px', marginBottom: 22,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div style={{ fontSize: 13, color: '#1a5fa0', lineHeight: 1.6 }}>
          <strong>How it works:</strong> Click <strong>Create Access</strong> on any teacher card to set their email and password.
          They can then log in using those credentials.
          Use <strong>Send Reset Email</strong> to let them change their own password.
        </div>
      </div>

      {/* Teacher cards by stream */}
      {streams.map(stream => {
        const teachers = ALL_TEACHERS.filter(t => t.stream === stream);
        if (!teachers.length) return null;
        const sc = streamColor(stream);
        return (
          <div key={stream} style={{ marginBottom: 28 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc }} />
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: sc }}>
                {stream} Stream
              </div>
              <div style={{ flex: 1, height: 1, background: '#eee' }} />
              <div style={{ fontSize: 12, color: '#bbb' }}>
                {teachers.filter(t => getDoc(t.id)).length}/{teachers.length} active
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {teachers.map(teacher => {
                const tDoc    = getDoc(teacher.id);
                const hasAccess = !!tDoc;
                const isCreating = createFor === teacher.id;

                return (
                  <div
                    key={teacher.id}
                    style={{
                      background: '#fff', borderRadius: 14,
                      boxShadow: '0 1px 5px rgba(0,0,0,.06)',
                      border: hasAccess ? `2px solid ${sc}33` : '2px solid #f0f0f0',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Card header */}
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: hasAccess ? sc : '#e0e0e0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 17, fontWeight: 800, color: '#fff',
                      }}>
                        {teacher.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {teacher.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{teacher.subject}</div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99, flexShrink: 0,
                        background: hasAccess ? `${sc}18` : '#f4f4f4',
                        color: hasAccess ? sc : '#aaa',
                      }}>
                        {hasAccess ? '● Active' : 'No Access'}
                      </span>
                    </div>

                    {/* Account info */}
                    {hasAccess && !isCreating && (
                      <div style={{ padding: '0 20px 14px', borderTop: '1px solid #f8f8f8' }}>
                        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          <span style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>{tDoc.email}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleSendReset(tDoc)}
                            disabled={resetSending === teacher.id}
                            style={{
                              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                              color: '#2680c7', background: '#e8f4fd',
                              border: 'none', borderRadius: 8, padding: '7px 14px',
                              cursor: resetSending === teacher.id ? 'not-allowed' : 'pointer',
                              opacity: resetSending === teacher.id ? .6 : 1,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                            {resetSending === teacher.id ? 'Sending…' : 'Send Reset Email'}
                          </button>
                          <button
                            onClick={() => openCreate(teacher)}
                            style={{
                              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                              color: '#bf7a00', background: '#fff8e6',
                              border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Change Email
                          </button>
                          <button
                            onClick={() => setConfirmDelete(teacher)}
                            style={{
                              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                              color: '#cc2a1e', background: '#fff0f0',
                              border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            </svg>
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    )}

                    {/* No access — show create button */}
                    {!hasAccess && !isCreating && (
                      <div style={{ padding: '0 20px 16px' }}>
                        <button
                          onClick={() => openCreate(teacher)}
                          style={{
                            width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                            color: '#fff', background: sc,
                            border: 'none', borderRadius: 10, padding: '11px 0', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Create Portal Access
                        </button>
                      </div>
                    )}

                    {/* Create / Edit form */}
                    {isCreating && (
                      <div style={{ padding: '0 20px 18px', borderTop: '1px solid #f4f4f4' }}>
                        <div style={{ paddingTop: 14, marginBottom: 12 }}>
                          <label style={labelStyle}>Login Email *</label>
                          <input
                            style={inputStyle}
                            type="email"
                            placeholder={`e.g. ${teacher.id}@al.lk`}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                          />
                        </div>

                        {hasAccess ? (
                          <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fff8e6', borderRadius: 10, fontSize: 12.5, color: '#bf7a00' }}>
                            Updating email only updates the portal profile. The teacher's existing password stays the same. Use <strong>Send Reset Email</strong> to change the password.
                          </div>
                        ) : (
                          <div style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>Password * (min. 6 chars)</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                style={inputStyle}
                                type={showPw ? 'text' : 'password'}
                                placeholder="Set a password for this teacher"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPw(p => !p)}
                                style={{
                                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                  background: 'none', border: 'none', cursor: 'pointer', color: '#aaa',
                                  display: 'flex', alignItems: 'center',
                                }}
                              >
                                {showPw
                                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                }
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleCreate(teacher)}
                            disabled={saving}
                            style={{
                              flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                              color: '#fff', background: sc, border: 'none', borderRadius: 9,
                              padding: '11px 0', cursor: saving ? 'not-allowed' : 'pointer',
                              opacity: saving ? .7 : 1,
                            }}
                          >
                            {saving ? 'Saving…' : hasAccess ? 'Update Email' : 'Create Account'}
                          </button>
                          <button
                            onClick={() => setCreateFor(null)}
                            style={{
                              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                              color: '#666', background: '#f4f4f4', border: 'none',
                              borderRadius: 9, padding: '11px 18px', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Confirm revoke modal */}
      {confirmDelete && (
        <div
          onClick={() => setConfirmDelete(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, padding: 32,
              width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cc2a1e" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 10 }}>
              Revoke Portal Access?
            </div>
            <div style={{ fontSize: 13.5, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: '#111' }}>{confirmDelete.name}</strong> will no longer be able to log in to the teacher portal.
              Their Firebase Auth account is not deleted — only the portal profile is removed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                  color: '#fff', background: '#cc2a1e', border: 'none',
                  borderRadius: 10, padding: 13, cursor: 'pointer',
                }}
              >
                Yes, Revoke Access
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
                  color: '#666', background: '#f4f4f4', border: 'none',
                  borderRadius: 10, padding: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
