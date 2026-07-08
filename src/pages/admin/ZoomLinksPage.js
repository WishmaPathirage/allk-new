import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, query, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ALL_TEACHERS = [
  { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Harsha Amarakon',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',        subject: 'Media',                  stream: 'Arts'       },
  { id: 'sinhala',    name: 'Pathum Sandanuwan',       subject: 'Sinhala',                stream: 'Arts'       },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STREAMS = ['Technology', 'Commerce', 'Arts'];

const streamColor = (s) => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';

function isLiveNow(item) {
  const now = new Date();
  const day = now.getDay();
  if (!item.days?.includes(day)) return false;
  const [sh, sm] = (item.startTime || '00:00').split(':').map(Number);
  const [eh, em] = (item.endTime   || '00:00').split(':').map(Number);
  const cur   = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end   = eh * 60 + em;
  return cur >= start && cur <= end;
}

function isValidZoomLink(url) {
  return url && (url.includes('zoom.us') || url.includes('meet.google.com'));
}

function fmtDateTime(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const inputStyle = {
  width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333',
  background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10,
  padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em',
  textTransform: 'uppercase', marginBottom: 6, display: 'block',
};
const cardStyle = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', overflow: 'hidden',
};

/* ── Toggle switch ── */
function ToggleSwitch({ checked, onChange, label, offLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
          background: checked ? '#27956b' : '#e0e0e0', position: 'relative', transition: 'background .2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        }} />
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? '#1a7a4a' : '#aaa' }}>
        {checked ? label : (offLabel || label)}
      </span>
    </div>
  );
}

/* ── Multi-select teacher chips ── */
function TeacherMultiSelect({ selected, onChange }) {
  return (
    <div>
      {STREAMS.map(stream => {
        const teachers = ALL_TEACHERS.filter(t => t.stream === stream);
        return (
          <div key={stream} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: streamColor(stream), marginBottom: 6 }}>
              {stream} Stream
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teachers.map(t => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChange(on ? selected.filter(x => x !== t.id) : [...selected, t.id])}
                    style={{
                      fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, borderRadius: 99,
                      padding: '5px 11px', cursor: 'pointer', transition: 'all .15s',
                      ...(on
                        ? { background: streamColor(stream), color: '#fff', border: `1.5px solid ${streamColor(stream)}` }
                        : { background: '#fafafa', color: '#777', border: '1.5px solid #eee' }
                      ),
                    }}
                  >
                    {t.subject}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onChange(ALL_TEACHERS.map(t => t.id))}
          style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: '#2680c7', background: '#e8f0fd', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          style={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: '#888', background: '#f4f4f4', border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function ZoomLinksPage({ toast }) {
  /* form state */
  const [title, setTitle]           = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [teacherIds, setTeacherIds] = useState([]);
  const [zoomLink, setZoomLink]     = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [days, setDays]             = useState([]);
  const [startTime, setStartTime]   = useState('');
  const [endTime, setEndTime]       = useState('');
  const [visible, setVisible]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [editId, setEditId]         = useState(null);

  /* list state */
  const [items, setItems]           = useState([]);
  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterVisible, setFilterVisible] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'zoom_links'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  const resetForm = () => {
    setTitle(''); setSessionDate(''); setTeacherIds([]);
    setZoomLink(''); setYoutubeLink('');
    setDays([]); setStartTime(''); setEndTime('');
    setVisible(true); setEditId(null);
  };

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = async () => {
    if (!title.trim())           { toast('Please enter a session title', 'error'); return; }
    if (!sessionDate)            { toast('Please select a session date', 'error'); return; }
    if (teacherIds.length === 0) { toast('Please assign at least one teacher', 'error'); return; }
    if (!zoomLink.trim())        { toast('Please enter a Zoom/Meet link', 'error'); return; }
    if (days.length === 0)       { toast('Please select at least one day', 'error'); return; }
    if (!startTime)              { toast('Please enter a start time', 'error'); return; }
    if (!endTime)                { toast('Please enter an end time', 'error'); return; }

    setSaving(true);

    const selectedTeacherObjects = ALL_TEACHERS.filter(t => teacherIds.includes(t.id));

    const data = {
      title: title.trim(),
      sessionDate: Timestamp.fromDate(new Date(sessionDate)),
      teacherIds,
      teacherNames:    selectedTeacherObjects.map(t => t.name),
      teacherSubjects: selectedTeacherObjects.map(t => t.subject),
      streams:         [...new Set(selectedTeacherObjects.map(t => t.stream))],
      /* keep backward-compat fields for single-teacher views */
      teacherId:       teacherIds[0] || '',
      teacherName:     selectedTeacherObjects[0]?.name || '',
      teacherSubject:  selectedTeacherObjects[0]?.subject || '',
      stream:          selectedTeacherObjects[0]?.stream || '',
      zoomLink: zoomLink.trim(),
      youtubeLink: youtubeLink.trim(),
      days,
      startTime,
      endTime,
      visible,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, 'zoom_links', editId), data);
        toast('Zoom link updated', 'success');
      } else {
        await addDoc(collection(db, 'zoom_links'), data);
        toast('Zoom link added', 'success');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast('Failed to save. Please try again.', 'error');
    }
    setSaving(false);
  };

  const handleEdit = (item) => {
    setTitle(item.title || '');
    setSessionDate(item.sessionDate?.toDate ? item.sessionDate.toDate().toISOString().slice(0, 16) : '');
    setTeacherIds(item.teacherIds || (item.teacherId ? [item.teacherId] : []));
    setZoomLink(item.zoomLink || '');
    setYoutubeLink(item.youtubeLink || '');
    setDays(item.days || []);
    setStartTime(item.startTime || '');
    setEndTime(item.endTime || '');
    setVisible(item.visible !== false);
    setEditId(item.id);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this Zoom link?')) return;
    try {
      await deleteDoc(doc(db, 'zoom_links', item.id));
      if (editId === item.id) resetForm();
      toast('Zoom link deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const toggleVisibility = async (item) => {
    const next = item.visible === false;
    await updateDoc(doc(db, 'zoom_links', item.id), { visible: next, updatedAt: Timestamp.now() });
    toast(next ? 'Link is now visible to students' : 'Link hidden from students', next ? 'success' : 'info');
  };

  /* filtered list */
  const filtered = items.filter(item => {
    if (filterTeacher !== 'all') {
      const ids = item.teacherIds || (item.teacherId ? [item.teacherId] : []);
      if (!ids.includes(filterTeacher)) return false;
    }
    if (filterVisible === 'visible' && item.visible === false) return false;
    if (filterVisible === 'hidden'  && item.visible !== false) return false;
    return true;
  });

  const linkValid = isValidZoomLink(zoomLink);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Banner ── */}
      <div style={{ background: 'linear-gradient(135deg,#0f1e2e,#2680c7)', borderRadius: 16, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/>
            <rect x="1" y="6" width="14" height="12" rx="2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Zoom Links</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
            Manage live class links — assign multiple teachers, set visibility, and schedule by date &amp; time
          </div>
        </div>
        <div className="zl-banner-count" style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{items.length}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>total links</div>
        </div>
      </div>

      <div className="zl-grid">

        {/* ── Left: form ── */}
        <div>
          <div style={{ ...cardStyle, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>
              {editId ? 'Edit Zoom Link' : 'Add New Zoom Link'}
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Session Title <span style={{ color: '#ff3c2e' }}>*</span></label>
              <input
                style={inputStyle}
                placeholder="e.g. ICT Chapter 5 — Networking"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Session Date */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Session Date &amp; Time <span style={{ color: '#ff3c2e' }}>*</span></label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
              />
            </div>

            {/* Visibility */}
            <div style={{ marginBottom: 14, background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Visibility</label>
              <ToggleSwitch
                checked={visible}
                onChange={setVisible}
                label="Visible to students"
                offLabel="Hidden from students"
              />
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
                {visible
                  ? 'This link will appear on enrolled students\' dashboards.'
                  : 'This link is hidden. Students will not see it.'}
              </div>
            </div>

            {/* Multi-teacher selection */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Assign Teachers <span style={{ color: '#ff3c2e' }}>*</span>
                {teacherIds.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: '#2680c7', borderRadius: 99, padding: '2px 8px', marginLeft: 8, letterSpacing: 0, textTransform: 'none' }}>
                    {teacherIds.length} selected
                  </span>
                )}
              </label>
              <div style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
                <TeacherMultiSelect selected={teacherIds} onChange={setTeacherIds} />
              </div>
            </div>

            {/* Zoom Link */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Zoom / Meet Link <span style={{ color: '#ff3c2e' }}>*</span></label>
              <input
                style={{ ...inputStyle, border: `1.5px solid ${zoomLink ? (linkValid ? '#27956b' : '#e05a00') : '#eee'}` }}
                placeholder="https://zoom.us/j/... or meet.google.com/..."
                value={zoomLink}
                onChange={e => setZoomLink(e.target.value)}
              />
              {zoomLink && linkValid   && <div style={{ fontSize: 11.5, color: '#27956b', marginTop: 5 }}>✓ Valid Zoom/Meet link</div>}
              {zoomLink && !linkValid  && <div style={{ fontSize: 11.5, color: '#e05a00', marginTop: 5 }}>⚠ Should contain zoom.us or meet.google.com</div>}
            </div>

            {/* YouTube Live Link */}
            {(() => {
              const ytValid   = youtubeLink && (youtubeLink.includes('youtube.com') || youtubeLink.includes('youtu.be'));
              const ytInvalid = youtubeLink && !ytValid;
              return (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>
                    YouTube Live Link
                    <span style={{ fontSize: 10.5, fontWeight: 500, color: '#aaa', textTransform: 'none', letterSpacing: 0, marginLeft: 6 }}>(optional)</span>
                  </label>
                  <input
                    style={{ ...inputStyle, border: `1.5px solid ${ytValid ? '#27956b' : ytInvalid ? '#e05a00' : '#eee'}` }}
                    placeholder="https://youtube.com/live/..."
                    value={youtubeLink}
                    onChange={e => setYoutubeLink(e.target.value)}
                  />
                  {ytValid   && <div style={{ fontSize: 11.5, color: '#27956b', marginTop: 5 }}>✓ Valid YouTube link</div>}
                  {ytInvalid && <div style={{ fontSize: 11.5, color: '#e05a00', marginTop: 5 }}>⚠ Link should contain youtube.com or youtu.be</div>}
                </div>
              );
            })()}

            {/* Days */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Recurring Days <span style={{ color: '#ff3c2e' }}>*</span></label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                      borderRadius: 99, padding: '6px 12px', cursor: 'pointer', transition: 'all .15s',
                      ...(days.includes(idx)
                        ? { background: '#ff3c2e', color: '#fff', border: '1.5px solid #ff3c2e' }
                        : { background: '#fafafa', color: '#888', border: '1.5px solid #eee' }
                      ),
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Start Time <span style={{ color: '#ff3c2e' }}>*</span></label>
                <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>End Time <span style={{ color: '#ff3c2e' }}>*</span></label>
                <input type="time" style={inputStyle} value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#fff',
                  background: saving ? '#ccc' : '#ff3c2e', border: 'none', borderRadius: 11,
                  padding: 14, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'zl-spin .6s linear infinite', display: 'inline-block' }} /> Saving…</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {editId ? 'Update Link' : 'Save Link'}</>
                }
              </button>
              {editId && (
                <button
                  type="button"
                  style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: '#888', background: '#f5f5f5', border: 'none', borderRadius: 11, padding: '14px 18px', cursor: 'pointer' }}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: list ── */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', flex: 1 }}>
              All Links
              <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', background: '#f4f4f4', borderRadius: 99, padding: '3px 10px', marginLeft: 8 }}>
                {filtered.length}
              </span>
            </div>
            <select
              value={filterTeacher}
              onChange={e => setFilterTeacher(e.target.value)}
              style={{ fontFamily: 'inherit', fontSize: 12.5, color: '#555', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 8, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Teachers</option>
              {ALL_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.subject}</option>)}
            </select>
            <select
              value={filterVisible}
              onChange={e => setFilterVisible(e.target.value)}
              style={{ fontFamily: 'inherit', fontSize: 12.5, color: '#555', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 8, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all">All Visibility</option>
              <option value="visible">Visible Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5">
                <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/>
                <rect x="1" y="6" width="14" height="12" rx="2"/>
              </svg>
              <p style={{ fontSize: 14, marginTop: 10 }}>No Zoom links found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(item => {
                const live    = isLiveNow(item);
                const ids     = item.teacherIds || (item.teacherId ? [item.teacherId] : []);
                const isHidden = item.visible === false;
                return (
                  <div key={item.id} style={{ ...cardStyle, padding: '16px 20px', border: `1.5px solid ${isHidden ? '#f0f0f0' : 'transparent'}`, opacity: isHidden ? 0.75 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: '#fff0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2">
                          <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/>
                          <rect x="1" y="6" width="14" height="12" rx="2"/>
                        </svg>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{item.title || 'Untitled'}</span>
                          {live && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#1a7a4a', background: '#e8f8f0', borderRadius: 99, padding: '3px 10px', border: '1.5px solid #a8dfc4' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#27956b', display: 'inline-block' }} />
                              Live Now
                            </span>
                          )}
                          {isHidden
                            ? <span style={{ fontSize: 10.5, fontWeight: 700, color: '#888', background: '#f0f0f0', borderRadius: 99, padding: '2px 8px' }}>Hidden</span>
                            : <span style={{ fontSize: 10.5, fontWeight: 700, color: '#27956b', background: '#e8f8f0', borderRadius: 99, padding: '2px 8px' }}>Visible</span>
                          }
                        </div>

                        {/* Date */}
                        {item.sessionDate && (
                          <div style={{ fontSize: 11.5, color: '#888', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            {fmtDateTime(item.sessionDate)}
                          </div>
                        )}

                        {/* Teachers */}
                        {ids.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                            {ids.map(id => {
                              const t = ALL_TEACHERS.find(x => x.id === id);
                              if (!t) return null;
                              return (
                                <span key={id} style={{ fontSize: 10.5, fontWeight: 600, color: streamColor(t.stream), background: t.stream === 'Technology' ? '#e8f4fd' : t.stream === 'Commerce' ? '#e8f8f0' : '#fdf0e8', borderRadius: 99, padding: '2px 8px' }}>
                                  {t.subject}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Zoom link */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>
                          <span style={{ fontSize: 12, color: '#2680c7', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.zoomLink}</span>
                        </div>

                        {/* YouTube link */}
                        {item.youtubeLink && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="#cc2a1e"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                            <span style={{ fontSize: 12, color: '#cc2a1e', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.youtubeLink}</span>
                          </div>
                        )}

                        {/* Days + time */}
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                          {item.days?.map(d => (
                            <span key={d} style={{ fontSize: 10.5, fontWeight: 700, background: '#f4f4f4', color: '#555', borderRadius: 99, padding: '2px 7px' }}>
                              {DAY_NAMES[d]}
                            </span>
                          ))}
                          {(item.startTime && item.endTime) && (
                            <span style={{ fontSize: 11.5, color: '#aaa', marginLeft: 4 }}>
                              {item.startTime} – {item.endTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end', marginLeft: 8 }}>
                        {/* Visibility toggle — directly in the card */}
                        <button
                          onClick={() => toggleVisibility(item)}
                          title={isHidden ? 'Show to students' : 'Hide from students'}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700,
                            padding: '5px 11px', borderRadius: 99, cursor: 'pointer', border: 'none',
                            background: isHidden ? '#f0f0f0' : '#e8f8f0',
                            color: isHidden ? '#888' : '#1a7a4a',
                            transition: 'all .18s',
                          }}
                        >
                          {/* pill toggle track */}
                          <span style={{
                            width: 30, height: 16, borderRadius: 99, position: 'relative', flexShrink: 0,
                            background: isHidden ? '#d0d0d0' : '#27956b', transition: 'background .2s',
                            display: 'inline-block',
                          }}>
                            <span style={{
                              position: 'absolute', top: 2,
                              left: isHidden ? 2 : 14,
                              width: 12, height: 12, borderRadius: '50%', background: '#fff',
                              transition: 'left .2s', boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                            }} />
                          </span>
                          {isHidden ? 'Hidden' : 'Visible'}
                        </button>

                        <div style={{ display: 'flex', gap: 7 }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{ fontSize: 12, fontWeight: 700, color: '#2680c7', background: '#e8f0fd', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            style={{ width: 30, height: 30, borderRadius: 7, background: '#fff0f0', color: '#cc2a1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes zl-spin { to { transform: rotate(360deg); } }
        .zl-grid { display: grid; grid-template-columns: 420px 1fr; gap: 22px; align-items: start; }
        .zl-banner-count { display: block; }
        @media (max-width: 1024px) { .zl-grid { grid-template-columns: 360px 1fr; } }
        @media (max-width: 900px)  { .zl-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px)  { .zl-banner-count { display: none; } }
      `}</style>
    </div>
  );
}
