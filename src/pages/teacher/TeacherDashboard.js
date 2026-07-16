import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, query, getDocs, where, onSnapshot, orderBy,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import TeacherMaterialsPage from './TeacherMaterialsPage';
import TeacherRecordsPage   from './TeacherRecordsPage';
import TeacherZoomLinksPage from './TeacherZoomLinksPage';
import TeacherStudentsPage  from './TeacherStudentsPage';

/* ─── helpers ─────────────────────────────────────── */

const streamColor = (s) =>
  s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg = (s) =>
  s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';

/* ─── CSS ─────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .td-root { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f2f3f7; }

  .td-sidebar {
    width: 230px; background: #16181f;
    display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
  }
  .td-brand {
    padding: 22px 20px 18px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 12px;
  }
  .td-brand-icon {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 15px; color: #fff;
  }
  .td-brand-title { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.35; }
  .td-brand-sub   { font-size: 10.5px; color: #555; margin-top: 1px; }

  .td-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
  .td-nav-lbl {
    font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #3a3d4a; padding: 6px 12px 8px;
  }
  .td-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 11px;
    padding: 10px 13px; border-radius: 9px; cursor: pointer; margin-bottom: 3px;
    font-size: 13px; font-weight: 500; color: #6e7282;
    border: none; background: none; font-family: inherit; text-align: left;
    transition: background .18s, color .18s;
  }
  .td-nav-btn:hover { background: rgba(255,255,255,.05); color: #ccc; }
  .td-nav-btn.on    { background: rgba(255,60,46,.14); color: #ff3c2e; font-weight: 600; }
  .td-nav-divider { height: 1px; background: rgba(255,255,255,.06); margin: 8px 10px; }

  .td-user {
    padding: 14px 16px; border-top: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 11px;
  }
  .td-user-av {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff;
  }
  .td-user-name { font-size: 12.5px; font-weight: 600; color: #ddd; }
  .td-user-role { font-size: 11px; color: #555; margin-top: 1px; }
  .td-logout-btn {
    margin-left: auto; background: none; border: none; cursor: pointer;
    color: #444; padding: 6px; border-radius: 6px; display: flex; align-items: center;
    transition: color .18s, background .18s;
  }
  .td-logout-btn:hover { color: #ff3c2e; background: rgba(255,60,46,.1); }

  .td-main { margin-left: 230px; flex: 1; display: flex; flex-direction: column; }
  .td-topbar {
    background: #fff; padding: 16px 30px;
    border-bottom: 1px solid #ebebeb;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50;
  }
  .td-page-title { font-size: 20px; font-weight: 800; color: #111; }
  .td-topbar-right { text-align: right; }
  .td-topbar-day  { font-size: 13px; font-weight: 600; color: #333; }
  .td-topbar-date { font-size: 12px; color: #aaa; margin-top: 1px; }
  .td-body { padding: 26px 30px 48px; }

  /* Toast */
  .td-toast-wrap {
    position: fixed; bottom: 26px; right: 26px; z-index: 9999;
    display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .td-toast {
    min-width: 260px; max-width: 360px;
    background: #fff; border-radius: 12px; padding: 13px 16px;
    box-shadow: 0 6px 24px rgba(0,0,0,.14); display: flex; align-items: center; gap: 11px;
    font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; color: #222;
    border-left: 4px solid #ccc;
    animation: td-slide-in .25s ease;
  }
  .td-toast.success { border-left-color: #27956b; }
  .td-toast.error   { border-left-color: #ff3c2e; }
  .td-toast.info    { border-left-color: #2680c7; }
  .td-toast-ico { width: 18px; height: 18px; flex-shrink: 0; }
  @keyframes td-slide-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
  @keyframes td-spin { to { transform: rotate(360deg); } }

  /* Stats grid */
  .td-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 18px; margin-bottom: 26px; }
  .td-stat {
    background: #fff; border-radius: 14px; padding: 20px 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06);
    display: flex; align-items: center; justify-content: space-between;
  }
  .td-stat-lbl { font-size: 11.5px; color: #aaa; font-weight: 500; margin-bottom: 6px; }
  .td-stat-val { font-size: 36px; font-weight: 800; color: #111; line-height: 1; }
  .td-stat-sub { font-size: 11px; color: #ccc; margin-top: 5px; }
  .td-stat-ico { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
`;

/* ─── Toast helper ────────────────────────────────── */
let _toastId = 0;

function ToastContainer({ toasts }) {
  return (
    <div className="td-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`td-toast ${t.type}`}>
          {t.type === 'success' && (
            <svg className="td-toast-ico" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
          )}
          {t.type === 'error' && (
            <svg className="td-toast-ico" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          {t.type === 'info' && (
            <svg className="td-toast-ico" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Overview page ───────────────────────────────── */
function OverviewPage({ teacher, statsData }) {
  const sc = streamColor(teacher.stream);
  const sb = streamBg(teacher.stream);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Welcome banner */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}22, ${sc}0a)`,
        border: `1px solid ${sc}33`,
        borderRadius: 18, padding: '28px 32px', marginBottom: 26,
        display: 'flex', alignItems: 'center', gap: 22,
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: sc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>
          {teacher.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: sc, marginBottom: 4 }}>
            Teacher Dashboard
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 4 }}>
            Welcome, {teacher.name.split(' ')[0]}
          </div>
          <div style={{ fontSize: 13.5, color: '#888' }}>
            {teacher.subject} · <span style={{ color: sc, fontWeight: 600 }}>{teacher.stream} Stream</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#bbb', marginBottom: 4 }}>Teacher ID</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#555', fontFamily: 'monospace', background: '#f4f4f4', padding: '4px 10px', borderRadius: 7 }}>
            {teacher.id?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="td-stats">
        {[
          {
            label: 'Enrolled Students',
            val: statsData.students,
            sub: `${statsData.approvedStudents} approved`,
            bg: sb,
            ico: sc,
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ),
          },
          {
            label: 'Study Materials',
            val: statsData.materials,
            sub: `in ${statsData.materialFolders} folder${statsData.materialFolders !== 1 ? 's' : ''}`,
            bg: '#e8f8f0',
            ico: '#27956b',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            ),
          },
          {
            label: 'Class Recordings',
            val: statsData.records,
            sub: `in ${statsData.recordFolders} folder${statsData.recordFolders !== 1 ? 's' : ''}`,
            bg: '#fff8e6',
            ico: '#bf7a00',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bf7a00" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            ),
          },
          {
            label: 'Zoom Sessions',
            val: statsData.zoomLinks,
            sub: statsData.liveSessions > 0 ? `${statsData.liveSessions} live now` : 'scheduled sessions',
            bg: '#f0f4ff',
            ico: '#2680c7',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2">
                <path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/>
              </svg>
            ),
          },
        ].map(({ label, val, sub, bg, ico, icon }) => (
          <div key={label} className="td-stat">
            <div>
              <div className="td-stat-lbl">{label}</div>
              <div className="td-stat-val">{val}</div>
              <div className="td-stat-sub">{sub}</div>
            </div>
            <div className="td-stat-ico" style={{ background: bg }}>{icon}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111', marginBottom: 16 }}>Quick Overview</div>
          {[
            { label: 'Your Subject',  val: teacher.subject },
            { label: 'Stream',        val: teacher.stream  },
            { label: 'Materials',     val: `${statsData.materials} file${statsData.materials !== 1 ? 's' : ''}` },
            { label: 'Recordings',    val: `${statsData.records} video${statsData.records !== 1 ? 's' : ''}` },
            { label: 'Zoom Sessions', val: `${statsData.zoomLinks} session${statsData.zoomLinks !== 1 ? 's' : ''}` },
            { label: 'Students',      val: `${statsData.students} enrolled` },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f8f8f8' }}>
              <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111', marginBottom: 16 }}>Getting Started</div>
          {[
            {
              title: 'Upload Study Materials',
              desc: 'Add notes, papers and resources for your students.',
              ico: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              ),
              bg: '#e8f8f0',
            },
            {
              title: 'Add Class Recordings',
              desc: 'Paste YouTube links and organise into topic folders.',
              ico: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bf7a00" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              ),
              bg: '#fff8e6',
            },
            {
              title: 'Schedule Live Sessions',
              desc: 'Set recurring Zoom class times and share links.',
              ico: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2"><path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
              ),
              bg: '#f0f4ff',
            },
            {
              title: 'View Your Students',
              desc: 'See who\'s enrolled in your subject by batch and status.',
              ico: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={sc} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              ),
              bg: sb,
            },
          ].map(({ title, desc, ico, bg }) => (
            <div key={title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8f8f8' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ico}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{title}</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Nav items ────────────────────────────────────── */
const NAV = [
  {
    id: 'overview', label: 'Overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'materials', label: 'Study Materials',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
  {
    id: 'recordings', label: 'Class Recordings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    id: 'zoom', label: 'Zoom Sessions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/>
      </svg>
    ),
  },
  {
    id: 'students', label: 'My Students',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const PAGE_TITLES = {
  overview:   'Overview',
  materials:  'Study Materials',
  recordings: 'Class Recordings',
  zoom:       'Zoom Sessions',
  students:   'My Students',
};

/* ─── Main Dashboard ──────────────────────────────── */
export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [teacher, setTeacher]       = useState(null);
  const [authed, setAuthed]         = useState(false);
  const [checking, setChecking]     = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [toasts, setToasts]         = useState([]);

  const [statsData, setStatsData] = useState({
    students: 0, approvedStudents: 0,
    materials: 0, materialFolders: 0,
    records: 0, recordFolders: 0,
    zoomLinks: 0, liveSessions: 0,
  });

  /* ── auth check ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setChecking(false); return; }

      const stored = localStorage.getItem('slk_teacher');
      if (stored) {
        try {
          const t = JSON.parse(stored);
          if (t.email?.toLowerCase() === user.email?.toLowerCase()) {
            setTeacher(t);
            setAuthed(true);
            setChecking(false);
            return;
          }
        } catch (_) {}
      }

      const snap = await getDocs(
        query(collection(db, 'teachers'), where('email', '==', user.email.toLowerCase()))
      );
      if (!snap.empty) {
        const t = { ...snap.docs[0].data(), docId: snap.docs[0].id };
        localStorage.setItem('slk_teacher', JSON.stringify(t));
        setTeacher(t);
        setAuthed(true);
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  /* ── redirect if not authed ── */
  useEffect(() => {
    if (!checking && !authed) navigate('/teacher-login');
  }, [checking, authed, navigate]);

  /* ── live stats ── */
  useEffect(() => {
    if (!teacher) return;
    const subs = [];

    subs.push(onSnapshot(
      query(collection(db, 'registrations'), where('teacherUids', 'array-contains', teacher.docId)),
      snap => {
        const docs = snap.docs.map(d => d.data());
        setStatsData(s => ({
          ...s,
          students: docs.length,
          approvedStudents: docs.filter(d => d.status === 'approved').length,
        }));
      }
    ));

    subs.push(onSnapshot(
      query(collection(db, 'materials'), orderBy('uploadedAt', 'desc')),
      snap => {
        const mine = snap.docs.filter(d => d.data().teacherId === teacher.id);
        setStatsData(s => ({ ...s, materials: mine.length }));
      }
    ));

    subs.push(onSnapshot(
      query(collection(db, 'material_folders'), orderBy('createdAt', 'desc')),
      snap => {
        const mine = snap.docs.filter(d => d.data().teacherId === teacher.id);
        setStatsData(s => ({ ...s, materialFolders: mine.length }));
      }
    ));

    subs.push(onSnapshot(
      query(collection(db, 'records'), orderBy('uploadedAt', 'desc')),
      snap => {
        const mine = snap.docs.filter(d => d.data().teacherId === teacher.id);
        setStatsData(s => ({ ...s, records: mine.length }));
      }
    ));

    subs.push(onSnapshot(
      query(collection(db, 'record_folders'), orderBy('createdAt', 'desc')),
      snap => {
        const mine = snap.docs.filter(d => d.data().teacherId === teacher.id);
        setStatsData(s => ({ ...s, recordFolders: mine.length }));
      }
    ));

    subs.push(onSnapshot(
      query(collection(db, 'zoom_links'), orderBy('updatedAt', 'desc')),
      snap => {
        const mine = snap.docs.filter(d => {
          const ids = d.data().teacherIds;
          return Array.isArray(ids) && ids.includes(teacher.id);
        });
        const now  = new Date();
        const live = mine.filter(d => {
          const item = d.data();
          if (!item.visible || !item.days?.includes(now.getDay())) return false;
          const [sh, sm] = (item.startTime || '00:00').split(':').map(Number);
          const [eh, em] = (item.endTime   || '00:00').split(':').map(Number);
          const cur = now.getHours() * 60 + now.getMinutes();
          return cur >= sh * 60 + sm && cur <= eh * 60 + em;
        });
        setStatsData(s => ({ ...s, zoomLinks: mine.length, liveSessions: live.length }));
      }
    ));

    return () => subs.forEach(u => u());
  }, [teacher]);

  /* ── toast helper ── */
  const addToast = (msg, type = 'info') => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  /* ── logout ── */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('slk_teacher');
    navigate('/teacher-login');
  };

  /* ── loading screen ── */
  if (checking) return (
    <>
      <style>{css}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f3f7', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #f0f0f0', borderTopColor: '#ff3c2e', borderRadius: '50%', animation: 'td-spin .7s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes td-spin { to{transform:rotate(360deg)} }`}</style>
          <div style={{ fontSize: 14, color: '#aaa' }}>Loading…</div>
        </div>
      </div>
    </>
  );

  if (!authed || !teacher) return null;

  const sc = streamColor(teacher.stream);

  return (
    <>
      <style>{css}</style>
      <div className="td-root">

        {/* ── Sidebar ── */}
        <aside className="td-sidebar">
          <div className="td-brand">
            <div className="td-brand-icon" style={{ background: sc }}>
              {teacher.name[0]}
            </div>
            <div>
              <div className="td-brand-title">Teacher Portal</div>
              <div className="td-brand-sub">AL.LK</div>
            </div>
          </div>

          <nav className="td-nav">
            <div className="td-nav-lbl">Menu</div>
            {NAV.map(n => (
              <button
                key={n.id}
                className={`td-nav-btn${activePage === n.id ? ' on' : ''}`}
                onClick={() => setActivePage(n.id)}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
            <div className="td-nav-divider" />
            <div className="td-nav-lbl" style={{ marginTop: 4 }}>Subject</div>
            <div style={{ padding: '8px 13px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: sc }}>{teacher.subject}</div>
              <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{teacher.stream} Stream</div>
            </div>
          </nav>

          <div className="td-user">
            <div className="td-user-av" style={{ background: sc }}>
              {teacher.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div className="td-user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {teacher.name}
              </div>
              <div className="td-user-role">Teacher</div>
            </div>
            <button
              className="td-logout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <main className="td-main">
          <div className="td-topbar">
            <div className="td-page-title">{PAGE_TITLES[activePage]}</div>
            <div className="td-topbar-right">
              <div className="td-topbar-day">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
              <div className="td-topbar-date">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <div className="td-body">
            {activePage === 'overview'   && <OverviewPage teacher={teacher} statsData={statsData} />}
            {activePage === 'materials'  && <TeacherMaterialsPage teacher={teacher} toast={addToast} />}
            {activePage === 'recordings' && <TeacherRecordsPage   teacher={teacher} toast={addToast} />}
            {activePage === 'zoom'       && <TeacherZoomLinksPage teacher={teacher} toast={addToast} />}
            {activePage === 'students'   && <TeacherStudentsPage  teacher={teacher} toast={addToast} />}
          </div>
        </main>

        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
