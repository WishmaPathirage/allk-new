import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ALL_TEACHERS = [
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',    stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts'       },
];

const ACCENT = '#6d28d9';

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
  .ep-folder-grid { display: flex; flex-wrap: wrap; gap: 16px; padding: 18px 24px 22px; }
  .ep-folder-card {
    width: 260px; flex-shrink: 0;
    border-radius: 14px; overflow: hidden; cursor: pointer;
    background: #fff; border: 1.5px solid #eee;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }
  .ep-folder-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 14px 36px rgba(109,40,217,.22);
    border-color: ${ACCENT};
  }
  .ep-folder-thumb { position: relative; aspect-ratio: 4/3; overflow: hidden; }
  .ep-folder-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
  .ep-folder-card:hover .ep-folder-thumb img { transform: scale(1.06); }
  .ep-folder-thumb-bg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: background .28s ease; }
  .ep-folder-thumb-bg.violet { background: linear-gradient(135deg, #f3effc 0%, #ddd0fb 100%); }
  .ep-folder-card:hover .ep-folder-thumb-bg.violet { background: linear-gradient(135deg, #2a1a4a 0%, #4c1d95 100%); }
  .ep-folder-thumb-bg.grey { background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
  .ep-folder-card:hover .ep-folder-thumb-bg.grey { background: linear-gradient(135deg, #111 0%, #222 100%); }
  .ep-folder-thumb-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.38));
    opacity: 0; transition: opacity .22s ease;
  }
  .ep-folder-card:hover .ep-folder-thumb-overlay { opacity: 1; }
  .ep-folder-badge {
    position: absolute; top: 8px; right: 10px;
    background: rgba(0,0,0,.52); color: #fff; backdrop-filter: blur(3px);
    font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 99px;
  }
  .ep-folder-body { padding: 16px 18px 18px; transition: background .22s ease; }
  .ep-folder-card:hover .ep-folder-body { background: ${ACCENT}; }
  .ep-folder-name {
    font-size: 15px; font-weight: 700; color: #111; margin-bottom: 0;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .22s ease;
  }
  .ep-folder-card:hover .ep-folder-name { color: #fff; }
  .ep-file-strip {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 24px; border-bottom: 1px solid #f4f4f4; transition: background .15s;
  }
  .ep-file-strip:last-child { border-bottom: none; }
  .ep-file-strip:hover { background: #fafafa; }
  .ep-file-info { flex: 1; min-width: 0; }
  .ep-file-title { font-size: 13.5px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ep-file-meta  { font-size: 11.5px; color: #bbb; margin-top: 3px; }
  .ep-tag { font-size: 9.5px; font-weight: 800; letter-spacing: .04em; padding: 2px 7px; border-radius: 99px; margin-left: 8px; vertical-align: middle; }
  .ep-tag.pdf  { color: #ff3c2e; background: #fff0ef; }
  .ep-tag.quiz { color: ${ACCENT}; background: #f3effc; }
  .ep-file-btn {
    flex-shrink: 0; font-family: inherit; font-size: 12px; font-weight: 700;
    color: #fff; background: #ff3c2e; border: none; border-radius: 8px;
    padding: 7px 18px; cursor: pointer; transition: background .15s; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .ep-file-btn:hover { background: #e03325; }
  .ep-file-btn.quiz { background: ${ACCENT}; }
  .ep-file-btn.quiz:hover { background: #5b21b6; }
  .ep-ico { width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .ep-ico.pdf  { background: #fff0ef; }
  .ep-ico.img  { background: #e8f4fd; }
  .ep-ico.quiz { background: #f3effc; }
  @media (max-width: 768px) {
    .ep-folder-grid { gap: 12px; padding: 14px 16px 18px; }
    .ep-folder-card { width: 170px; }
    .ep-file-strip { padding: 12px 16px; }
  }
`;

function ItemIcon({ item }) {
  if (item.itemType === 'quiz') return (
    <div className="ep-ico quiz">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    </div>
  );
  const type = getFileType(item.fileName);
  if (type === 'img') return (
    <div className="ep-ico img">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#2680c7"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  );
  return (
    <div className="ep-ico pdf">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#cc2a1e">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline fill="none" stroke="#fff" strokeWidth="1.5" points="14 2 14 8 20 8"/>
      </svg>
    </div>
  );
}

export default function StudentExamPapers({ student }) {
  const [papers, setPapers]         = useState([]);
  const [folders, setFolders]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSubj, setActiveSubj] = useState('all');
  const [activeFolder, setActiveFolder] = useState(null);
  const [viewMat, setViewMat]       = useState(null);

  const enrolled = getEnrolledIds(student?.selectedTeachers);

  useEffect(() => {
    if (!student || enrolled.length === 0) {
      setPapers([]); setFolders([]); setLoading(false); return;
    }
    setLoading(true);
    let cancelled = false;
    Promise.all([
      getDocs(query(collection(db, 'exam_papers'), where('teacherId', 'in', enrolled))),
      getDocs(query(collection(db, 'exam_folders'), where('teacherId', 'in', enrolled))),
    ]).then(([papersSnap, foldersSnap]) => {
      if (cancelled) return;
      setPapers(papersSnap.docs.map(d => ({ id: d.id, ...d.data() }))
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
      papers.some(m => m.teacherId === t.id) ||
      folders.some(f => f.teacherId === t.id)
    )
  );

  const subjPapers  = activeSubj === 'all' ? papers  : papers.filter(m => m.teacherId === activeSubj);
  const subjFolders = activeSubj === 'all' ? folders : folders.filter(f => f.teacherId === activeSubj);

  const displayedMats = activeFolder === null
    ? subjPapers
    : activeFolder === 'uncategorized'
      ? subjPapers.filter(m => !m.folderId)
      : subjPapers.filter(m => m.folderId === activeFolder);

  const currentFolderName = activeFolder && activeFolder !== 'uncategorized'
    ? subjFolders.find(f => f.id === activeFolder)?.name
    : activeFolder === 'uncategorized' ? 'Uncategorized' : null;

  const renderFolderCard = (folder) => {
    const count = subjPapers.filter(m => m.folderId === folder.id).length;
    return (
      <div key={folder.id} className="ep-folder-card" onClick={() => setActiveFolder(folder.id)}>
        <div className="ep-folder-thumb">
          {folder.thumbnailUrl ? (
            <img src={folder.thumbnailUrl} alt={folder.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="ep-folder-thumb-bg violet">
              <svg width="58" height="58" viewBox="0 0 24 24" fill="#c4b5fd" stroke={ACCENT} strokeWidth="1.1" opacity=".85">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          )}
          <div className="ep-folder-thumb-overlay" />
          <span className="ep-folder-badge">{count} item{count !== 1 ? 's' : ''}</span>
        </div>
        <div className="ep-folder-body">
          <div className="ep-folder-name">{folder.name}</div>
        </div>
      </div>
    );
  };

  const renderFileStrip = (mat) => (
    <div key={mat.id} className="ep-file-strip">
      <ItemIcon item={mat} />
      <div className="ep-file-info">
        <div className="ep-file-title">
          {mat.title || mat.fileName || 'Untitled'}
          <span className={`ep-tag ${mat.itemType === 'quiz' ? 'quiz' : 'pdf'}`}>{mat.itemType === 'quiz' ? 'QUIZ' : 'PDF'}</span>
        </div>
        <div className="ep-file-meta">
          {mat.teacherSubject && `${mat.teacherSubject} · `}
          {mat.itemType === 'quiz' ? 'Online quiz' : (mat.fileSize ? `${(mat.fileSize / 1024 / 1024).toFixed(1)} MB` : 'File')}
          {' · '}{fmtDate(mat.uploadedAt)}
        </div>
      </div>
      {mat.itemType === 'quiz'
        ? (mat.quizUrl && (
            <a className="ep-file-btn quiz" href={mat.quizUrl} target="_blank" rel="noreferrer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Start Quiz
            </a>
          ))
        : ((mat.fileUrl || mat.url) && (
            <button className="ep-file-btn" onClick={() => setViewMat(mat)}>View</button>
          ))}
    </div>
  );

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
              {activeFolder === null ? 'Exam Papers' : currentFolderName || 'Items'}
            </span>
          </div>
          <span className="sd-card-badge">
            {activeFolder === null
              ? `${subjFolders.length} folder${subjFolders.length !== 1 ? 's' : ''}`
              : `${displayedMats.length} item${displayedMats.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Subject filter pills */}
        {(papers.length > 0 || folders.length > 0) && (
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
          subjFolders.length === 0 && subjPapers.filter(m => !m.folderId).length === 0 ? (
            <div className="sd-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              <p>No exam papers available yet.</p>
            </div>
          ) : (() => {
            const byTeacher = {};
            subjFolders.forEach(f => {
              if (!byTeacher[f.teacherId]) byTeacher[f.teacherId] = [];
              byTeacher[f.teacherId].push(f);
            });
            const teacherSections = enrolled.filter(id => byTeacher[id]?.length > 0);
            const uncatMats = subjPapers.filter(m => !m.folderId);

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
                      <div className="ep-folder-grid" style={{ padding: 0 }}>
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
                    <div className="ep-folder-grid" style={{ padding: 0 }}>
                      <div className="ep-folder-card" onClick={() => setActiveFolder('uncategorized')}>
                        <div className="ep-folder-thumb">
                          <div className="ep-folder-thumb-bg grey">
                            <svg width="58" height="58" viewBox="0 0 24 24" fill="#ccc" stroke="#bbb" strokeWidth="1.1" opacity=".85">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <div className="ep-folder-thumb-overlay" />
                          <span className="ep-folder-badge">{uncatMats.length} item{uncatMats.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="ep-folder-body">
                          <div className="ep-folder-name" style={{ color: '#666' }}>Other Items</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()

        ) : (
          /* ── Items inside folder ── */
          displayedMats.length === 0 ? (
            <div className="sd-empty">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <p>This folder is empty.</p>
            </div>
          ) : (
            <div>{displayedMats.map(renderFileStrip)}</div>
          )
        )}
      </div>

      {/* ── File viewer modal (PDF / image) ── */}
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
