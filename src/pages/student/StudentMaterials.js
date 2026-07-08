import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Harsha Amarakon',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',    stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts'       },
];

const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getFileType = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'img';
  return 'other';
};

const getEnrolledIds = (raw) =>
  (raw || []).map(t => (typeof t === 'object' && t !== null ? t.id : t)).filter(Boolean);

const streamColor = (s) => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = (s) => s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';

const matCss = `
  .sm-folder-grid {
    display: flex; flex-wrap: wrap; gap: 16px;
    padding: 18px 24px 22px;
  }
  .sm-folder-card {
    width: 260px; flex-shrink: 0;
    border-radius: 14px; overflow: hidden; cursor: pointer;
    background: #fff; border: 1.5px solid #eee;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }
  .sm-folder-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 14px 36px rgba(255,60,46,.2);
    border-color: #ff3c2e;
  }
  .sm-folder-thumb { position: relative; aspect-ratio: 4/3; overflow: hidden; }
  .sm-folder-thumb img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .3s ease;
  }
  .sm-folder-card:hover .sm-folder-thumb img { transform: scale(1.06); }
  .sm-folder-thumb-bg {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    transition: background .28s ease;
  }
  .sm-folder-thumb-bg.gold { background: linear-gradient(135deg, #fff8e1 0%, #ffe58a 100%); }
  .sm-folder-card:hover .sm-folder-thumb-bg.gold { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); }
  .sm-folder-thumb-bg.grey { background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
  .sm-folder-card:hover .sm-folder-thumb-bg.grey { background: linear-gradient(135deg, #111 0%, #222 100%); }
  .sm-folder-thumb-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.38));
    opacity: 0; transition: opacity .22s ease;
  }
  .sm-folder-card:hover .sm-folder-thumb-overlay { opacity: 1; }
  .sm-folder-badge {
    position: absolute; top: 8px; right: 10px;
    background: rgba(0,0,0,.52); color: #fff; backdrop-filter: blur(3px);
    font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 99px;
  }
  .sm-folder-body { padding: 16px 18px 18px; transition: background .22s ease; }
  .sm-folder-card:hover .sm-folder-body { background: #ff3c2e; }
  .sm-folder-name {
    font-size: 15px; font-weight: 700; color: #111; margin-bottom: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: color .22s ease;
  }
  .sm-folder-card:hover .sm-folder-name { color: #fff; }
  /* Horizontal file strips */
  .sm-file-strip {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 24px; border-bottom: 1px solid #f4f4f4;
    transition: background .15s;
  }
  .sm-file-strip:last-child { border-bottom: none; }
  .sm-file-strip:hover { background: #fafafa; }
  .sm-file-info { flex: 1; min-width: 0; }
  .sm-file-title { font-size: 13.5px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sm-file-meta  { font-size: 11.5px; color: #bbb; margin-top: 3px; }
  .sm-file-btn   {
    flex-shrink: 0; font-family: inherit; font-size: 12px; font-weight: 700;
    color: #fff; background: #ff3c2e; border: none; border-radius: 8px;
    padding: 7px 18px; cursor: pointer; transition: background .15s;
  }
  .sm-file-btn:hover { background: #e03325; }
  @media (max-width: 768px) {
    .sm-folder-grid { gap: 12px; padding: 14px 16px 18px; }
    .sm-folder-card { width: 170px; }
    .sm-file-strip { padding: 12px 16px; }
  }
`;

function MatIcon({ type }) {
  if (type === 'pdf') return (
    <div className="sd-mat-ico pdf">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#cc2a1e">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline fill="none" stroke="#fff" strokeWidth="1.5" points="14 2 14 8 20 8"/>
      </svg>
    </div>
  );
  if (type === 'img') return (
    <div className="sd-mat-ico img">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="#2680c7"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
  return (
    <div className="sd-mat-ico other">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  );
}

export default function StudentMaterials({ student }) {
  const [materials, setMaterials]   = useState([]);
  const [folders, setFolders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSubj, setActiveSubj] = useState('all');
  const [activeFolder, setActiveFolder] = useState(null);
  const [viewMat, setViewMat]       = useState(null);

  const enrolled = getEnrolledIds(student?.selectedTeachers);

  useEffect(() => {
    if (!student || enrolled.length === 0) {
      setMaterials([]); setFolders([]); setLoading(false); return;
    }
    setLoading(true);
    let cancelled = false;
    Promise.all([
      getDocs(query(collection(db, 'materials'), where('teacherId', 'in', enrolled))),
      getDocs(query(collection(db, 'material_folders'), where('teacherId', 'in', enrolled))),
    ]).then(([matsSnap, foldersSnap]) => {
      if (cancelled) return;
      setMaterials(matsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0)));
      setFolders(foldersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.email, enrolled.join(',')]);

  const TEACHER_MAP = Object.fromEntries(ALL_TEACHERS.map(t => [t.id, t]));

  const teachersWithContent = ALL_TEACHERS.filter(t =>
    enrolled.includes(t.id) && (
      materials.some(m => m.teacherId === t.id) ||
      folders.some(f => f.teacherId === t.id)
    )
  );

  const subjMaterials = activeSubj === 'all' ? materials : materials.filter(m => m.teacherId === activeSubj);
  const subjFolders   = activeSubj === 'all' ? folders   : folders.filter(f => f.teacherId === activeSubj);

  const displayedMats = activeFolder === null
    ? subjMaterials
    : activeFolder === 'uncategorized'
      ? subjMaterials.filter(m => !m.folderId)
      : subjMaterials.filter(m => m.folderId === activeFolder);

  const currentFolderName = activeFolder && activeFolder !== 'uncategorized'
    ? subjFolders.find(f => f.id === activeFolder)?.name
    : activeFolder === 'uncategorized' ? 'Uncategorized' : null;

  const renderFolderCard = (folder) => {
    const count = subjMaterials.filter(m => m.folderId === folder.id).length;
    return (
      <div key={folder.id} className="sm-folder-card" onClick={() => setActiveFolder(folder.id)}>
        <div className="sm-folder-thumb">
          {folder.thumbnailUrl ? (
            <img src={folder.thumbnailUrl} alt={folder.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="sm-folder-thumb-bg gold">
              <svg width="58" height="58" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" strokeWidth="1.1" opacity=".85">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          )}
          <div className="sm-folder-thumb-overlay" />
          <span className="sm-folder-badge">{count} file{count !== 1 ? 's' : ''}</span>
        </div>
        <div className="sm-folder-body">
          <div className="sm-folder-name">{folder.name}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{matCss}</style>
      <div className="sd-card">
        <div className="sd-card-hdr">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeFolder !== null && (
              <button
                onClick={() => setActiveFolder(null)}
                style={{ width: 28, height: 28, borderRadius: 7, background: '#f0f0f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <span className="sd-card-title">
              {activeFolder === null ? 'Study Materials' : currentFolderName || 'Files'}
            </span>
          </div>
          <span className="sd-card-badge">
            {activeFolder === null
              ? `${subjFolders.length} folder${subjFolders.length !== 1 ? 's' : ''}`
              : `${displayedMats.length} file${displayedMats.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Subject filter pills */}
        {(materials.length > 0 || folders.length > 0) && (
          <div className="sd-subject-bar">
            <button
              className={`sd-spill${activeSubj === 'all' ? ' on' : ''}`}
              onClick={() => { setActiveSubj('all'); setActiveFolder(null); }}
            >
              All Subjects
            </button>
            {teachersWithContent.map(t => (
              <button
                key={t.id}
                className={`sd-spill${activeSubj === t.id ? ' on' : ''}`}
                style={activeSubj === t.id ? {} : { borderColor: streamColor(t.stream) + '44', color: streamColor(t.stream) }}
                onClick={() => { setActiveSubj(t.id); setActiveFolder(null); }}
              >
                {t.subject}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="sd-spinner-wrap"><div className="sd-spinner" /></div>

        ) : activeFolder === null ? (
          /* ── Folder list view ── */
          subjFolders.length === 0 && subjMaterials.filter(m => !m.folderId).length === 0 ? (
            <div className="sd-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>No study materials available yet.</p>
            </div>
          ) : (() => {
            // Group by subject (teacher)
            const byTeacher = {};
            subjFolders.forEach(f => {
              if (!byTeacher[f.teacherId]) byTeacher[f.teacherId] = [];
              byTeacher[f.teacherId].push(f);
            });
            const teacherSections = enrolled.filter(id => byTeacher[id]?.length > 0);
            const uncatMats = subjMaterials.filter(m => !m.folderId);

            return (
              <div style={{ padding: '18px 24px 22px' }}>
                {teacherSections.map(tid => {
                  const teacher = TEACHER_MAP[tid];
                  return (
                    <div key={tid} style={{ marginBottom: 28 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: 14, paddingBottom: 10,
                        borderBottom: `2px solid ${streamBg(teacher?.stream)}`,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: streamColor(teacher?.stream) }}>
                          {teacher?.subject || tid}
                        </span>
                        <span style={{ fontSize: 11.5, color: '#bbb', fontWeight: 600 }}>
                          {byTeacher[tid].length} folder{byTeacher[tid].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="sm-folder-grid" style={{ padding: 0 }}>
                        {byTeacher[tid].map(renderFolderCard)}
                      </div>
                    </div>
                  );
                })}

                {uncatMats.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #f4f4f4',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#999' }}>Other</span>
                    </div>
                    <div className="sm-folder-grid" style={{ padding: 0 }}>
                      <div className="sm-folder-card" onClick={() => setActiveFolder('uncategorized')}>
                        <div className="sm-folder-thumb">
                          <div className="sm-folder-thumb-bg grey">
                            <svg width="58" height="58" viewBox="0 0 24 24" fill="#ccc" stroke="#bbb" strokeWidth="1.1" opacity=".85">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <div className="sm-folder-thumb-overlay" />
                          <span className="sm-folder-badge">{uncatMats.length} file{uncatMats.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="sm-folder-body">
                          <div className="sm-folder-name" style={{ color: '#666' }}>Other Files</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()

        ) : (
          /* ── Files inside folder — horizontal strips ── */
          displayedMats.length === 0 ? (
            <div className="sd-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <p>This folder is empty.</p>
            </div>
          ) : (
            <div>
              {displayedMats.map(mat => (
                <div key={mat.id} className="sm-file-strip">
                  <MatIcon type={getFileType(mat.fileName)} />
                  <div className="sm-file-info">
                    <div className="sm-file-title">{mat.title || mat.fileName || 'Untitled'}</div>
                    <div className="sm-file-meta">
                      {mat.teacherSubject && `${mat.teacherSubject} · `}{fmtDate(mat.uploadedAt)}{mat.fileSize ? ` · ${(mat.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                    </div>
                  </div>
                  {(mat.fileUrl || mat.url) && (
                    <button className="sm-file-btn" onClick={() => setViewMat(mat)}>View</button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ── File viewer modal ── */}
      {viewMat && (
        <div className="sd-viewer-bd" onClick={e => { if (e.target === e.currentTarget) setViewMat(null); }}>
          <div className="sd-viewer-box">
            <div className="sd-viewer-hdr">
              <span className="sd-viewer-title">{viewMat.title}</span>
              <button className="sd-viewer-close" onClick={() => setViewMat(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="sd-viewer-body">
              {getFileType(viewMat.fileName) === 'img'
                ? <img src={viewMat.fileUrl} alt={viewMat.title} />
                : <iframe src={`${viewMat.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} title={viewMat.title} />
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
