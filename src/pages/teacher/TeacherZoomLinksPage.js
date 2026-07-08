import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, deleteDoc, doc,
  addDoc, updateDoc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function fmtDateTime(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
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

export default function TeacherZoomLinksPage({ teacher, toast }) {
  const [links, setLinks]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);

  const emptyForm = {
    title: '', zoomLink: '', youtubeLink: '',
    days: [], startTime: '08:00', endTime: '10:00', visible: true,
  };
  const [form, setForm] = useState(emptyForm);


  useEffect(() => {
    const q = query(collection(db, 'zoom_links'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLinks(all.filter(l => Array.isArray(l.teacherIds) && l.teacherIds.includes(teacher.id)));
    }, () => {});
    return unsub;
  }, [teacher.id]);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const toggleDay = (d) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim())    { toast('Please enter a session title', 'error'); return; }
    if (!form.zoomLink.trim() && !form.youtubeLink.trim()) {
      toast('Please enter at least one link (Zoom or YouTube)', 'error'); return;
    }
    if (form.days.length === 0) { toast('Please select at least one day', 'error'); return; }
    if (!form.startTime)        { toast('Please set a start time', 'error'); return; }
    if (!form.endTime)          { toast('Please set an end time', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        teacherIds:      [teacher.id],
        teacherNames:    [teacher.name],
        teacherSubjects: [teacher.subject],
        streams:         [teacher.stream],
        title:           form.title.trim(),
        zoomLink:        form.zoomLink.trim(),
        youtubeLink:     form.youtubeLink.trim(),
        days:            [...form.days].sort(),
        startTime:       form.startTime,
        endTime:         form.endTime,
        visible:         form.visible,
        updatedAt:       Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'zoom_links', editingId), payload);
        toast('Session updated', 'success');
      } else {
        await addDoc(collection(db, 'zoom_links'), payload);
        toast('Session added', 'success');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast('Failed to save. Please try again.', 'error');
    }
    setSaving(false);
  };

  const handleEdit = (link) => {
    setForm({
      title:       link.title       || '',
      zoomLink:    link.zoomLink    || '',
      youtubeLink: link.youtubeLink || '',
      days:        link.days        || [],
      startTime:   link.startTime   || '08:00',
      endTime:     link.endTime     || '10:00',
      visible:     link.visible !== false,
    });
    setEditingId(link.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`Delete session "${link.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'zoom_links', link.id));
      toast('Session deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const handleToggleVisible = async (link) => {
    try {
      await updateDoc(doc(db, 'zoom_links', link.id), { visible: !link.visible, updatedAt: Timestamp.now() });
      toast(link.visible ? 'Session hidden from students' : 'Session visible to students', 'info');
    } catch { toast('Update failed', 'error'); }
  };

  const liveCount = links.filter(l => l.visible && isLiveNow(l)).length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a2a3a, #2680c7)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Zoom & Live Sessions</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
              {links.length} session{links.length !== 1 ? 's' : ''}
              {liveCount > 0 && <span style={{ marginLeft: 8, background: '#ff3c2e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>● {liveCount} LIVE</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(s => !s); }}
          style={{
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff',
            background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.25)',
            borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7, transition: 'background .18s',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {showForm && !editingId ? 'Cancel' : 'Add Session'}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)', border: `2px solid ${editingId ? '#2680c7' : '#eee'}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 20 }}>
            {editingId ? 'Edit Session' : 'New Live Session'}
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Session Title *</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Weekly Class — Engineering Technology"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Zoom Link</label>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={form.zoomLink}
                  onChange={e => setForm(f => ({ ...f, zoomLink: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>YouTube / Stream Link</label>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://youtube.com/live/..."
                  value={form.youtubeLink}
                  onChange={e => setForm(f => ({ ...f, youtubeLink: e.target.value }))}
                />
              </div>
            </div>

            {/* Day picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Class Days *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DAY_NAMES.map((name, d) => {
                  const on = form.days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      style={{
                        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
                        borderRadius: 8, padding: '7px 14px', cursor: 'pointer', transition: 'all .15s',
                        ...(on
                          ? { background: '#2680c7', color: '#fff', border: '1.5px solid #2680c7' }
                          : { background: '#fafafa', color: '#777', border: '1.5px solid #eee' }
                        ),
                      }}
                    >{name}</button>
                  );
                })}
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Start Time *</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label style={labelStyle}>End Time *</label>
                <input
                  style={inputStyle}
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                <ToggleSwitch
                  checked={form.visible}
                  onChange={v => setForm(f => ({ ...f, visible: v }))}
                  label="Visible to students"
                  offLabel="Hidden from students"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#fff',
                  background: '#2680c7', border: 'none', borderRadius: 10, padding: '12px 24px',
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Session'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#666',
                  background: '#f4f4f4', border: 'none', borderRadius: 10, padding: '12px 20px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session list */}
      {links.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 10 }}>
            <path d="M15 10l-4 4-4-4"/><rect x="3" y="3" width="18" height="18" rx="3"/>
          </svg>
          <p style={{ fontSize: 14, marginTop: 8 }}>No sessions yet. Add your first Zoom session above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {links.map(link => {
            const live = isLiveNow(link);
            return (
              <div
                key={link.id}
                style={{
                  background: '#fff', borderRadius: 14,
                  boxShadow: live ? '0 0 0 2px #ff3c2e, 0 4px 18px rgba(255,60,46,.1)' : '0 1px 5px rgba(0,0,0,.06)',
                  padding: '20px 24px',
                  borderLeft: `4px solid ${link.visible ? '#2680c7' : '#ddd'}`,
                  opacity: link.visible ? 1 : .75,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{link.title}</span>
                      {live && (
                        <span style={{ background: '#ff3c2e', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, letterSpacing: '.04em' }}>● LIVE</span>
                      )}
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
                        background: link.visible ? '#e8f4fd' : '#f4f4f4',
                        color: link.visible ? '#2680c7' : '#aaa',
                      }}>
                        {link.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#666', marginBottom: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {link.startTime} – {link.endTime}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {(link.days || []).map(d => DAY_NAMES[d]).join(', ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {link.zoomLink && (
                        <a
                          href={link.zoomLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12.5, fontWeight: 700, color: '#2680c7',
                            background: '#e8f4fd', padding: '5px 12px', borderRadius: 8,
                            textDecoration: 'none',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          Zoom Link
                        </a>
                      )}
                      {link.youtubeLink && (
                        <a
                          href={link.youtubeLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12.5, fontWeight: 700, color: '#cc2a1e',
                            background: '#fff0f0', padding: '5px 12px', borderRadius: 8,
                            textDecoration: 'none',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          Stream Link
                        </a>
                      )}
                    </div>

                    <div style={{ marginTop: 8, fontSize: 11.5, color: '#ccc' }}>
                      Updated {fmtDateTime(link.updatedAt)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={() => handleToggleVisible(link)}
                      title={link.visible ? 'Hide from students' : 'Show to students'}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: link.visible ? '#e8f8f0' : '#f4f4f4',
                        color: link.visible ? '#1a7a4a' : '#aaa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {link.visible
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      }
                    </button>
                    <button
                      onClick={() => handleEdit(link)}
                      title="Edit"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#f0f4ff', color: '#2680c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(link)}
                      title="Delete"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#fff0f0', color: '#cc2a1e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
