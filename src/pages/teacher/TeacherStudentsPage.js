import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function TeacherStudentsPage({ teacher, toast }) {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [batchFilter, setBatch]     = useState('all');
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('teacherUids', 'array-contains', teacher.docId),
      orderBy('registeredAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [teacher.id, teacher.docId]);

  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))].sort();

  const filtered = students.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (batchFilter !== 'all' && s.batch !== batchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.studentId   || '').toLowerCase().includes(q) ||
        (s.batch       || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    total:    students.length,
    approved: students.filter(s => s.status === 'approved').length,
    pending:  students.filter(s => s.status === 'pending').length,
    rejected: students.filter(s => s.status === 'rejected').length,
  };

  const streamColor = teacher.stream === 'Technology' ? '#2680c7' : teacher.stream === 'Commerce' ? '#27956b' : '#c9720c';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div style={{
        background: `linear-gradient(135deg, ${streamColor}22, ${streamColor}11)`,
        border: `1px solid ${streamColor}33`,
        borderRadius: 16, padding: '24px 28px', marginBottom: 22,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `${streamColor}22`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={streamColor} strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>My Students</div>
          <div style={{ fontSize: 12.5, color: '#888', marginTop: 3 }}>
            Students enrolled in <strong style={{ color: streamColor }}>{teacher.subject}</strong> 
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 22 }}>
        {[
          { label: 'Total Enrolled', val: counts.total,    bg: '#f0f4ff', ico: '#2680c7' },
          { label: 'Approved',       val: counts.approved, bg: '#e8f8f0', ico: '#27956b' },
          { label: 'Pending',        val: counts.pending,  bg: '#fff8e6', ico: '#bf7a00' },
          { label: 'Rejected',       val: counts.rejected, bg: '#fff0f0', ico: '#cc2a1e' },
        ].map(({ label, val, bg, ico }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 1px 5px rgba(0,0,0,.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#aaa', fontWeight: 500, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#111', lineHeight: 1 }}>{val}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: ico }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f4f4f4', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111' }}>Student List</div>
            <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>{filtered.length} of {counts.total} students</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="Search by name or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontFamily: 'inherit', fontSize: 13, color: '#333',
                background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9,
                padding: '9px 14px', outline: 'none', minWidth: 200,
              }}
            />
            <select
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
              style={{
                fontFamily: 'inherit', fontSize: 13, color: '#555',
                background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9,
                padding: '9px 14px', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            {batches.length > 0 && (
              <select
                value={batchFilter}
                onChange={e => setBatch(e.target.value)}
                style={{
                  fontFamily: 'inherit', fontSize: 13, color: '#555',
                  background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9,
                  padding: '9px 14px', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="all">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid #f0f0f0',
              borderTopColor: streamColor, borderRadius: '50%',
              animation: 'td-spin .7s linear infinite', margin: '0 auto',
            }} />
            <style>{`@keyframes td-spin { to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 10 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              {search || statusFilter !== 'all' || batchFilter !== 'all'
                ? 'No students match your filters.'
                : 'No students enrolled yet.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Student ID', 'Name', 'Batch', 'Stream', 'Enrolled', 'Status', ''].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#bbb',
                      letterSpacing: '.07em', textTransform: 'uppercase',
                      padding: '10px 20px', borderBottom: '1px solid #f4f4f4', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} style={{ transition: 'background .12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fcfcfc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '13px 20px', fontSize: 12, fontWeight: 700, color: '#ddd' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#555', fontFamily: 'monospace' }}>
                        {s.studentId || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>{s.studentName || '—'}</div>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#555' }}>
                      {s.batch || '—'}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {(() => {
                        const st = s.selectedTeachers?.find(t => (t?.id ?? t) === teacher.id)?.stream;
                        return st ? (
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                            background: st === 'Technology' ? '#e8f4fd' : st === 'Commerce' ? '#e8f8f0' : '#fdf0e8',
                            color: st === 'Technology' ? '#2680c7' : st === 'Commerce' ? '#27956b' : '#c9720c',
                          }}>{st}</span>
                        ) : '—';
                      })()}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 12.5, color: '#888' }}>
                      {fmtDate(s.registeredAt)}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 99,
                        ...(s.status === 'approved'
                          ? { background: '#e8f8f0', color: '#1a7a4a' }
                          : s.status === 'rejected'
                          ? { background: '#fff0f0', color: '#cc2a1e' }
                          : { background: '#fff8e6', color: '#bf7a00' }),
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                        {s.status?.charAt(0).toUpperCase() + s.status?.slice(1) || 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <button
                        onClick={() => setViewStudent(s)}
                        title="View details"
                        style={{
                          width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
                          background: '#f0f0f0', color: '#555',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#111'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555'; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student detail modal — no sensitive data */}
      {viewStudent && (
        <div
          onClick={() => setViewStudent(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, padding: 32, width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#111' }}>Student Details</div>
              <button
                onClick={() => setViewStudent(null)}
                style={{ background: '#f4f4f4', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '16px 20px', background: '#f8f9fb', borderRadius: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                background: streamColor, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff',
              }}>
                {(viewStudent.studentName || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{viewStudent.studentName || '—'}</div>
                <div style={{ fontSize: 12.5, color: '#888', marginTop: 3, fontFamily: 'monospace' }}>
                  {viewStudent.studentId || 'No ID assigned'}
                </div>
              </div>
            </div>

            {[
              { label: 'Batch',       val: viewStudent.batch    || '—' },
              { label: 'Stream',      val: viewStudent.selectedTeachers?.find(t => (t?.id ?? t) === teacher.id)?.stream || '—' },
              { label: 'Status',      val: viewStudent.status   || '—' },
              { label: 'Enrolled On', val: fmtDate(viewStudent.registeredAt) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f4f4f4' }}>
                <span style={{ fontSize: 12.5, color: '#999', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#222', fontWeight: 600 }}>{val}</span>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8f9fb', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.55 }}>
                Contact information is hidden to protect student privacy.
              </span>
            </div>

            <button
              onClick={() => setViewStudent(null)}
              style={{
                width: '100%', marginTop: 20, fontFamily: 'inherit', fontSize: 14,
                fontWeight: 700, color: '#fff', background: streamColor, border: 'none',
                borderRadius: 10, padding: 13, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
