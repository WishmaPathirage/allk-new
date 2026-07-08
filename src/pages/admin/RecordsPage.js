import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';

const ALL_TEACHERS = [
  { id: 'et',         name: 'Sandeepa Kathriarachchi',                      subject: 'Engineering Technology', stream: 'Technology' },
  { id: 'sft',        name: 'Shanaka Ranathunga',                           subject: 'Science for Technology', stream: 'Technology' },
  { id: 'ict',        name: 'Ranishan Dissanayake',                         subject: 'ICT',                    stream: 'Technology' },
  { id: 'bs',         name: 'Kasun Weligama',                               subject: 'Business Studies',       stream: 'Commerce'   },
  { id: 'accounting', name: 'Prabhath Ariyasinghe',                         subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Harsha Amarakon',                              subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',                            subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',                        subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',                  stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala',              stream: 'Arts'       },
];

const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|v|shorts|live)\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function RecordsPage({ toast }) {
  const [teacherId, setTeacherId]   = useState(ALL_TEACHERS[0].id);
  const [recTitle, setRecTitle]     = useState('');
  const [ytUrl, setYtUrl]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [items, setItems]           = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // Folder state
  const [folders, setFolders]               = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolderName, setNewFolderName]   = useState('');
  const [newFolderThumbFile, setNewFolderThumbFile]       = useState(null);
  const [newFolderThumbPreview, setNewFolderThumbPreview] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [viewFolder, setViewFolder]         = useState(null);
  const newFolderThumbRef = useRef();

  // Edit folder state
  const [editingFolderId, setEditingFolderId]                   = useState(null);
  const [editFolderName, setEditFolderName]                     = useState('');
  const [editFolderCurrentThumb, setEditFolderCurrentThumb]     = useState('');
  const [editFolderCurrentThumbPath, setEditFolderCurrentThumbPath] = useState('');
  const [editFolderThumbFile, setEditFolderThumbFile]           = useState(null);
  const [editFolderThumbPreview, setEditFolderThumbPreview]     = useState('');
  const [editFolderRemoveThumb, setEditFolderRemoveThumb]       = useState(false);
  const [editSaving, setEditSaving]                             = useState(false);
  const editFolderThumbRef = useRef();

  const teacher = ALL_TEACHERS.find(t => t.id === teacherId);

  useEffect(() => {
    const q = query(collection(db, 'records'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'record_folders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  const filtered       = items.filter(i => i.teacherId === teacherId);
  const teacherFolders = folders.filter(f => f.teacherId === teacherId);
  const videoIdPreview = extractVideoId(ytUrl);

  const handleNewThumbChange = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (f.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return; }
    if (newFolderThumbPreview) URL.revokeObjectURL(newFolderThumbPreview);
    setNewFolderThumbFile(f);
    setNewFolderThumbPreview(URL.createObjectURL(f));
  };

  const handleEditThumbChange = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (f.size > 5 * 1024 * 1024) { toast('Image must be under 5 MB', 'error'); return; }
    if (editFolderThumbPreview) URL.revokeObjectURL(editFolderThumbPreview);
    setEditFolderThumbFile(f);
    setEditFolderThumbPreview(URL.createObjectURL(f));
    setEditFolderRemoveThumb(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast('Please enter a folder name', 'error'); return; }
    setCreatingFolder(true);
    try {
      let thumbnailUrl = null;
      let thumbnailStoragePath = null;
      if (newFolderThumbFile) {
        const ext = newFolderThumbFile.name.split('.').pop().toLowerCase();
        const path = `folder-thumbnails/record_folders/${teacherId}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, newFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }
      await addDoc(collection(db, 'record_folders'), {
        teacherId,
        teacherName: teacher.name,
        teacherSubject: teacher.subject,
        stream: teacher.stream,
        name: newFolderName.trim(),
        thumbnailUrl,
        thumbnailStoragePath,
        createdAt: serverTimestamp(),
      });
      toast(`Folder "${newFolderName.trim()}" created`, 'success');
      setNewFolderName('');
      setNewFolderThumbFile(null);
      if (newFolderThumbPreview) URL.revokeObjectURL(newFolderThumbPreview);
      setNewFolderThumbPreview('');
      setShowFolderForm(false);
    } catch (err) {
      console.error(err);
      toast('Failed to create folder', 'error');
    }
    setCreatingFolder(false);
  };

  const handleDeleteFolder = async (folder) => {
    const hasFiles = filtered.some(i => i.folderId === folder.id);
    if (hasFiles) {
      if (!window.confirm(`Folder "${folder.name}" has videos. Delete folder and all its videos?`)) return;
    } else {
      if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    }
    try {
      const folderRecs = filtered.filter(i => i.folderId === folder.id);
      for (const rec of folderRecs) await deleteDoc(doc(db, 'records', rec.id));
      if (folder.thumbnailStoragePath) {
        try { await deleteObject(ref(storage, folder.thumbnailStoragePath)); } catch (_) {}
      }
      await deleteDoc(doc(db, 'record_folders', folder.id));
      if (viewFolder === folder.id) setViewFolder(null);
      if (editingFolderId === folder.id) handleCancelEdit();
      toast('Folder deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const handleStartEdit = (folder) => {
    setEditingFolderId(folder.id);
    setEditFolderName(folder.name);
    setEditFolderCurrentThumb(folder.thumbnailUrl || '');
    setEditFolderCurrentThumbPath(folder.thumbnailStoragePath || '');
    setEditFolderThumbFile(null);
    if (editFolderThumbPreview) URL.revokeObjectURL(editFolderThumbPreview);
    setEditFolderThumbPreview('');
    setEditFolderRemoveThumb(false);
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditFolderName('');
    setEditFolderCurrentThumb('');
    setEditFolderCurrentThumbPath('');
    setEditFolderThumbFile(null);
    if (editFolderThumbPreview) URL.revokeObjectURL(editFolderThumbPreview);
    setEditFolderThumbPreview('');
    setEditFolderRemoveThumb(false);
  };

  const handleSaveEdit = async (folder) => {
    if (!editFolderName.trim()) { toast('Please enter a folder name', 'error'); return; }
    setEditSaving(true);
    try {
      let thumbnailUrl = editFolderCurrentThumb || null;
      let thumbnailStoragePath = editFolderCurrentThumbPath || null;

      if (editFolderRemoveThumb || editFolderThumbFile) {
        if (editFolderCurrentThumbPath) {
          try { await deleteObject(ref(storage, editFolderCurrentThumbPath)); } catch (_) {}
        }
        thumbnailUrl = null;
        thumbnailStoragePath = null;
      }

      if (editFolderThumbFile) {
        const ext = editFolderThumbFile.name.split('.').pop().toLowerCase();
        const path = `folder-thumbnails/record_folders/${folder.teacherId}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, editFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }

      await updateDoc(doc(db, 'record_folders', folder.id), {
        name: editFolderName.trim(),
        thumbnailUrl,
        thumbnailStoragePath,
      });
      toast('Folder updated', 'success');
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      toast('Failed to update folder', 'error');
    }
    setEditSaving(false);
  };

  const handleSave = async () => {
    if (!recTitle.trim()) { toast('Please enter a title', 'error'); return; }
    if (!ytUrl.trim())    { toast('Please enter a YouTube URL', 'error'); return; }
    const vid = extractVideoId(ytUrl);
    if (!vid) { toast('Could not extract video ID — please check the URL', 'error'); return; }
    setSaving(true);
    try {
      const folderObj = teacherFolders.find(f => f.id === selectedFolder);
      await addDoc(collection(db, 'records'), {
        teacherId, teacherName: teacher.name, teacherSubject: teacher.subject,
        title: recTitle.trim(), youtubeUrl: ytUrl.trim(), videoId: vid,
        folderId: selectedFolder || null,
        folderName: folderObj?.name || null,
        uploadedAt: serverTimestamp(),
      });
      toast(`"${recTitle}" added`, 'success');
      setRecTitle(''); setYtUrl('');
    } catch (err) {
      console.error(err);
      toast('Failed to save. Please try again.', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'records', item.id));
      if (expandedId === item.id) setExpandedId(null);
      toast('Record deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const streamColor   = teacher?.stream === 'Technology' ? '#2680c7' : teacher?.stream === 'Commerce' ? '#27956b' : '#c9720c';
  const displayedRecs = viewFolder === null
    ? filtered.filter(i => !i.folderId)
    : filtered.filter(i => i.folderId === viewFolder);
  const editingFolder = teacherFolders.find(f => f.id === editingFolderId);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Page header banner ── */}
      <div className="rp-banner" style={{ background: 'linear-gradient(135deg,#2a0e0e,#cc2a1e)', borderRadius: 16, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Class Records</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>Organise recordings into folders. Students can only watch — no downloading or sharing.</div>
        </div>
        <div className="rp-banner-count" style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{items.length}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>total videos</div>
        </div>
      </div>

      <div className="rp-grid">

        {/* ── Left: add video panel ── */}
        <div>

          {/* teacher picker */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12 }}>Select Teacher</div>
            <select
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#111', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 36px 10px 14px', outline: 'none', cursor: 'pointer', appearance: 'none' }}
              value={teacherId} onChange={e => { setTeacherId(e.target.value); setSelectedFolder(''); setViewFolder(null); handleCancelEdit(); }}>
              {ALL_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
            </select>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: streamColor, borderRadius: 99, padding: '3px 10px' }}>{teacher?.stream}</span>
              <span style={{ fontSize: 12, color: '#aaa' }}>{teacher?.subject}</span>
            </div>
          </div>

          {/* folders management */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Folders</div>
              <button
                onClick={() => setShowFolderForm(v => !v)}
                style={{ fontSize: 12, fontWeight: 700, color: '#ff3c2e', background: '#fff0f0', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Folder
              </button>
            </div>

            {showFolderForm && (
              <div style={{ marginBottom: 14, background: '#fafafa', borderRadius: 10, padding: 14, border: '1.5px solid #eee' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, color: '#333', background: '#fff', border: '1.5px solid #eee', borderRadius: 9, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Folder name (e.g. Term 1)"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={creatingFolder}
                    style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#fff', background: creatingFolder ? '#ccc' : '#ff3c2e', border: 'none', borderRadius: 9, padding: '9px 14px', cursor: creatingFolder ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                    {creatingFolder ? '…' : 'Create'}
                  </button>
                </div>
                {/* Thumbnail upload for new folder */}
                {newFolderThumbPreview ? (
                  <div style={{ position: 'relative', height: 90, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={newFolderThumbPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      onClick={() => { setNewFolderThumbFile(null); URL.revokeObjectURL(newFolderThumbPreview); setNewFolderThumbPreview(''); }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 99, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => newFolderThumbRef.current?.click()}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#aaa', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Upload Thumbnail Image (optional)
                  </button>
                )}
                <input ref={newFolderThumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleNewThumbChange(e.target.files[0]); e.target.value = ''; }} />
              </div>
            )}

            {teacherFolders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#ccc', fontSize: 12.5 }}>No folders yet. Create one to organise recordings.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {teacherFolders.map(folder => {
                    const count = filtered.filter(i => i.folderId === folder.id).length;
                    const isEditing = editingFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        style={{ borderRadius: 10, border: `1.5px solid ${isEditing ? '#ff3c2e' : '#eee'}`, overflow: 'hidden', background: isEditing ? '#fff8f8' : '#fafafa', cursor: isEditing ? 'default' : 'pointer', transition: 'box-shadow .15s' }}
                        onClick={() => !isEditing && setViewFolder(folder.id)}
                        onMouseEnter={e => !isEditing && (e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,.1)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <div style={{ height: 72, background: folder.thumbnailUrl ? 'transparent' : '#fff0ef', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {folder.thumbnailUrl ? (
                            <img src={folder.thumbnailUrl} alt={folder.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentNode.style.background = '#fff0ef'; e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#ff3c2e" opacity=".5"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#222', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10.5, color: '#aaa' }}>{count} video{count !== 1 ? 's' : ''}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={e => { e.stopPropagation(); isEditing ? handleCancelEdit() : handleStartEdit(folder); }}
                                title={isEditing ? 'Cancel edit' : 'Edit folder'}
                                style={{ width: 22, height: 22, borderRadius: 5, background: isEditing ? '#ffe0e0' : '#e8f0fd', color: isEditing ? '#cc2a1e' : '#2680c7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {isEditing
                                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                }
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteFolder(folder); }}
                                title="Delete folder"
                                style={{ width: 22, height: 22, borderRadius: 5, background: '#fff0f0', color: '#cc2a1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inline edit form — shown below the card grid when a folder is selected for edit */}
                {editingFolder && (
                  <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: '#fff8f8', border: '1.5px solid #ffcdd2' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cc2a1e', marginBottom: 10 }}>
                      Edit: {editingFolder.name}
                    </div>
                    <input
                      style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, color: '#333', background: '#fff', border: '1.5px solid #eee', borderRadius: 8, padding: '8px 12px', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
                      placeholder="Folder name"
                      value={editFolderName}
                      onChange={e => setEditFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(editingFolder); }}
                    />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Thumbnail</div>
                    {(editFolderThumbPreview || (editFolderCurrentThumb && !editFolderRemoveThumb)) ? (
                      <div style={{ position: 'relative', height: 90, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                        <img
                          src={editFolderThumbPreview || editFolderCurrentThumb}
                          alt="Thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={() => {
                            if (editFolderThumbPreview) {
                              URL.revokeObjectURL(editFolderThumbPreview);
                              setEditFolderThumbFile(null);
                              setEditFolderThumbPreview('');
                            } else {
                              setEditFolderRemoveThumb(true);
                            }
                          }}
                          style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 99, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, lineHeight: 1 }}>
                          ×
                        </button>
                        {!editFolderThumbPreview && (
                          <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.5)', borderRadius: 4, padding: '2px 6px' }}>
                            Current thumbnail
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => editFolderThumbRef.current?.click()}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#aaa', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        {editFolderRemoveThumb ? 'Upload Replacement Thumbnail' : 'Upload Thumbnail (optional)'}
                      </button>
                    )}
                    <input ref={editFolderThumbRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleEditThumbChange(e.target.files[0]); e.target.value = ''; }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleSaveEdit(editingFolder)}
                        disabled={editSaving}
                        style={{ flex: 1, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#fff', background: editSaving ? '#ccc' : '#ff3c2e', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: editSaving ? 'not-allowed' : 'pointer' }}>
                        {editSaving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#888', background: '#f4f4f4', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* add video form */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Add New Video</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Add to Folder</label>
              <select
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                value={selectedFolder}
                onChange={e => setSelectedFolder(e.target.value)}>
                <option value="">No folder (uncategorized)</option>
                {teacherFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Video Title *</label>
              <input
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="e.g. Term 1 – Chapter 2 Theory…"
                value={recTitle}
                onChange={e => setRecTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>YouTube URL *</label>
              <input
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: `1.5px solid ${videoIdPreview ? '#27956b' : '#eee'}`, borderRadius: 10, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder="https://www.youtube.com/watch?v=…"
                value={ytUrl}
                onChange={e => setYtUrl(e.target.value)}
              />
              {ytUrl && !videoIdPreview && (
                <div style={{ fontSize: 11.5, color: '#e05a00', marginTop: 5 }}>⚠ Invalid YouTube URL — video ID not found</div>
              )}
              {videoIdPreview && (
                <div style={{ fontSize: 11.5, color: '#27956b', marginTop: 5 }}>✓ Video ID: <span style={{ fontFamily: 'monospace' }}>{videoIdPreview}</span></div>
              )}
            </div>

            {videoIdPreview && (
              <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoIdPreview}?rel=0&modestbranding=1&disablekb=0`}
                  title="Preview"
                  width="100%" height="100%"
                  style={{ border: 'none', display: 'block' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            )}

            <button
              style={{ width: '100%', marginTop: 16, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#fff', background: saving ? '#ccc' : '#ff3c2e', border: 'none', borderRadius: 11, padding: 14, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleSave} disabled={saving}
            >
              {saving
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ad-spin .6s linear infinite', display: 'inline-block' }} /> Saving…</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg> Add Video</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: folder navigation + video list ── */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Videos for {teacher?.name}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{filtered.length} video{filtered.length !== 1 ? 's' : ''} total</div>
          </div>

          {/* Folder navigation — card grid with thumbnails */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setViewFolder(null)}
              style={{ fontFamily: 'inherit', textAlign: 'left', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${viewFolder === null ? '#ff3c2e' : '#eee'}`, background: viewFolder === null ? '#ff3c2e' : '#fafafa', overflow: 'hidden', padding: 0, transition: 'all .15s' }}>
              <div style={{ height: 56, background: viewFolder === null ? '#cc2a1e' : '#fff0ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={viewFolder === null ? '#fff' : '#ff3c2e'}><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
              </div>
              <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: viewFolder === null ? '#fff' : '#666' }}>
                Uncategorized
                <div style={{ fontSize: 10, fontWeight: 500, color: viewFolder === null ? 'rgba(255,255,255,.7)' : '#bbb', marginTop: 1 }}>{filtered.filter(i => !i.folderId).length} videos</div>
              </div>
            </button>
            {teacherFolders.map(f => {
              const on    = viewFolder === f.id;
              const count = filtered.filter(i => i.folderId === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setViewFolder(f.id)}
                  style={{ fontFamily: 'inherit', textAlign: 'left', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${on ? '#d97706' : '#eee'}`, background: on ? '#fffbeb' : '#fafafa', overflow: 'hidden', padding: 0, transition: 'all .15s' }}>
                  <div style={{ height: 56, background: '#fff8e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {f.thumbnailUrl
                      ? <img src={f.thumbnailUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    }
                  </div>
                  <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: on ? '#d97706' : '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                    <div style={{ fontSize: 10, fontWeight: 500, color: on ? '#b45309' : '#bbb', marginTop: 1 }}>{count} video{count !== 1 ? 's' : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Video list */}
          {displayedRecs.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="#e8e8e8"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
              <p style={{ fontSize: 14, marginTop: 10 }}>No videos here yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayedRecs.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff0f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff3c2e"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <div style={{ fontSize: 11.5, color: '#aaa' }}>{fmtDate(item.uploadedAt)}</div>
                        {item.folderName && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600, color: '#d97706', background: '#fffbeb', borderRadius: 99, padding: '1px 7px' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {item.folderName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <button
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#2680c7', background: '#e8f0fd', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        {expandedId === item.id ? 'Hide' : 'Play'}
                      </button>
                      <button onClick={() => handleDelete(item)}
                        style={{ width: 30, height: 30, borderRadius: 7, background: '#fff0f0', color: '#cc2a1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {expandedId === item.id && item.videoId && (
                    <div style={{ padding: '0 18px 18px' }}>
                      <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${item.videoId}?rel=0&modestbranding=1&disablekb=0`}
                          title={item.title}
                          width="100%" height="100%"
                          style={{ border: 'none', display: 'block' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .rp-grid { display: grid; grid-template-columns: 380px 1fr; gap: 22px; align-items: start; }
        .rp-banner { padding: 22px 22px !important; }
        @media (max-width: 900px) {
          .rp-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .rp-banner { padding: 16px 16px !important; }
          .rp-banner-count { display: none; }
        }
      `}</style>
    </div>
  );
}
