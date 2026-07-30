import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';

const ALL_TEACHERS = [
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',    stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts'       },
];

const ACCENT = '#6d28d9';

const fmtBytes = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const fmtDate  = (ts) => { if (!ts?.toDate) return '—'; return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

function PaperIcon({ item }) {
  if (item?.itemType === 'quiz') return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3effc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    </div>
  );
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff0ef', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>
  );
}

export default function ExamPapersPage({ toast }) {
  const [teacherId, setTeacherId]     = useState(ALL_TEACHERS[0].id);
  const [itemType, setItemType]       = useState('pdf'); // 'pdf' | 'quiz'
  const [matTitle, setMatTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [quizUrl, setQuizUrl]         = useState('');
  const [file, setFile]               = useState(null);
  const [drag, setDrag]               = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [items, setItems]             = useState([]);
  const fileRef = useRef();

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
    const q = query(collection(db, 'exam_papers'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'exam_folders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  const filtered       = items.filter(i => i.teacherId === teacherId);
  const teacherFolders = folders.filter(f => f.teacherId === teacherId);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast('File must be under 50 MB', 'error'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

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
        const path = `folder-thumbnails/exam_folders/${teacherId}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, newFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }
      await addDoc(collection(db, 'exam_folders'), {
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
      if (!window.confirm(`Folder "${folder.name}" has items. Delete folder and all its contents?`)) return;
    } else {
      if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    }
    try {
      const folderMats = filtered.filter(i => i.folderId === folder.id);
      for (const mat of folderMats) {
        await deleteDoc(doc(db, 'exam_papers', mat.id));
        if (mat.storagePath) { try { await deleteObject(ref(storage, mat.storagePath)); } catch (_) {} }
      }
      if (folder.thumbnailStoragePath) {
        try { await deleteObject(ref(storage, folder.thumbnailStoragePath)); } catch (_) {}
      }
      await deleteDoc(doc(db, 'exam_folders', folder.id));
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
        const path = `folder-thumbnails/exam_folders/${folder.teacherId}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, editFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }

      await updateDoc(doc(db, 'exam_folders', folder.id), {
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

  const resetUploadForm = () => {
    setMatTitle(''); setDescription(''); setQuizUrl(''); setFile(null);
  };

  const handleUpload = async () => {
    if (!matTitle.trim()) { toast('Please enter a title', 'error'); return; }
    const folderObj = teacherFolders.find(f => f.id === selectedFolder);

    if (itemType === 'quiz') {
      const url = quizUrl.trim();
      if (!url) { toast('Please paste the quiz (Google Form) link', 'error'); return; }
      if (!/^https?:\/\//i.test(url)) { toast('Quiz link must start with http:// or https://', 'error'); return; }
      setUploading(true);
      try {
        await addDoc(collection(db, 'exam_papers'), {
          teacherId, teacherName: teacher.name, teacherSubject: teacher.subject,
          itemType: 'quiz',
          title: matTitle.trim(), description: description.trim(),
          quizUrl: url,
          folderId: selectedFolder || null,
          folderName: folderObj?.name || null,
          uploadedAt: serverTimestamp(),
        });
        toast(`Quiz "${matTitle}" added`, 'success');
        resetUploadForm();
      } catch (err) {
        console.error(err);
        toast('Failed to add quiz. Please try again.', 'error');
      }
      setUploading(false);
      return;
    }

    if (!file) { toast('Please select a PDF / file', 'error'); return; }
    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const folderPath = selectedFolder ? `folder_${selectedFolder}` : 'uncategorized';
      const sRef = ref(storage, `exam-papers/${teacherId}/${folderPath}/${fileName}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await addDoc(collection(db, 'exam_papers'), {
        teacherId, teacherName: teacher.name, teacherSubject: teacher.subject,
        itemType: 'pdf',
        title: matTitle.trim(), description: description.trim(),
        fileName: file.name, fileSize: file.size,
        fileUrl: url, storagePath: `exam-papers/${teacherId}/${folderPath}/${fileName}`,
        folderId: selectedFolder || null,
        folderName: folderObj?.name || null,
        uploadedAt: serverTimestamp(),
      });
      toast(`"${matTitle}" uploaded`, 'success');
      resetUploadForm();
    } catch (err) {
      console.error(err);
      toast('Upload failed. Please try again.', 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'exam_papers', item.id));
      if (item.storagePath) { try { await deleteObject(ref(storage, item.storagePath)); } catch (_) {} }
      toast('Item deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const streamColor  = teacher?.stream === 'Technology' ? '#2680c7' : teacher?.stream === 'Commerce' ? '#27956b' : '#c9720c';
  const displayedMats = viewFolder === null
    ? filtered.filter(i => !i.folderId)
    : filtered.filter(i => i.folderId === viewFolder);
  const editingFolder = teacherFolders.find(f => f.id === editingFolderId);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* page header banner */}
      <div style={{ background: 'linear-gradient(135deg,#2a1a4a,#6d28d9)', borderRadius: 16, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Exam Papers</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
            Organize past papers into folders and share online quizzes. Students access their enrolled subjects.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{items.length}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>total items</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, alignItems: 'start' }}>

        {/* ── Left: form ── */}
        <div>
          {/* teacher picker */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 12 }}>Select Teacher</div>
            <select
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#111', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 14px', outline: 'none', cursor: 'pointer', appearance: 'none', marginBottom: 10, boxSizing: 'border-box' }}
              value={teacherId} onChange={e => { setTeacherId(e.target.value); setSelectedFolder(''); setViewFolder(null); handleCancelEdit(); }}>
              {ALL_TEACHERS.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}
            </select>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', background: streamColor, borderRadius: 99, padding: '3px 10px' }}>{teacher?.stream} Stream</span>
          </div>

          {/* folders management */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Folders</div>
              <button
                onClick={() => setShowFolderForm(v => !v)}
                style={{ fontSize: 12, fontWeight: 700, color: ACCENT, background: '#f3effc', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Folder
              </button>
            </div>

            {showFolderForm && (
              <div style={{ marginBottom: 14, background: '#fafafa', borderRadius: 10, padding: 14, border: '1.5px solid #eee' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, color: '#333', background: '#fff', border: '1.5px solid #eee', borderRadius: 9, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Folder name (e.g. 2024 Past Papers)"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
                  />
                  <button
                    onClick={handleCreateFolder}
                    disabled={creatingFolder}
                    style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#fff', background: creatingFolder ? '#ccc' : ACCENT, border: 'none', borderRadius: 9, padding: '9px 14px', cursor: creatingFolder ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
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
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#ccc', fontSize: 12.5 }}>No folders yet. Create one to organise exam papers.</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {teacherFolders.map(folder => {
                    const count = filtered.filter(i => i.folderId === folder.id).length;
                    const isEditing = editingFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        style={{ borderRadius: 10, border: `1.5px solid ${isEditing ? ACCENT : '#eee'}`, overflow: 'hidden', background: isEditing ? '#f6f2fd' : '#fafafa', cursor: isEditing ? 'default' : 'pointer', transition: 'box-shadow .15s' }}
                        onClick={() => !isEditing && setViewFolder(folder.id)}
                        onMouseEnter={e => !isEditing && (e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,.1)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                      >
                        <div style={{ height: 72, background: folder.thumbnailUrl ? 'transparent' : '#f3effc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {folder.thumbnailUrl ? (
                            <img src={folder.thumbnailUrl} alt={folder.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.parentNode.style.background = '#f3effc'; e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#c4b5fd" stroke={ACCENT} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          )}
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#222', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10.5, color: '#aaa' }}>{count} item{count !== 1 ? 's' : ''}</span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                onClick={e => { e.stopPropagation(); isEditing ? handleCancelEdit() : handleStartEdit(folder); }}
                                title={isEditing ? 'Cancel edit' : 'Edit folder'}
                                style={{ width: 22, height: 22, borderRadius: 5, background: isEditing ? '#e6dbfb' : '#e8f0fd', color: isEditing ? ACCENT : '#2680c7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

                {/* Inline edit form */}
                {editingFolder && (
                  <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: '#f6f2fd', border: '1.5px solid #c4b5fd' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
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
                        style={{ flex: 1, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, color: '#fff', background: editSaving ? '#ccc' : ACCENT, border: 'none', borderRadius: 8, padding: '9px 14px', cursor: editSaving ? 'not-allowed' : 'pointer' }}>
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

          {/* upload form */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Add New Exam Item</div>

            {/* type toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: '#f4f4f6', borderRadius: 10, padding: 4 }}>
              {[{ id: 'pdf', label: 'PDF Paper' }, { id: 'quiz', label: 'Quiz Link' }].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setItemType(opt.id)}
                  style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: itemType === opt.id ? '#fff' : 'transparent', color: itemType === opt.id ? ACCENT : '#888', boxShadow: itemType === opt.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none', transition: 'all .15s' }}>
                  {opt.label}
                </button>
              ))}
            </div>

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
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Title *</label>
              <input
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' }}
                placeholder={itemType === 'quiz' ? 'e.g. Unit 3 Online Quiz' : 'e.g. 2023 A/L Model Paper'}
                value={matTitle}
                onChange={e => setMatTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Description</label>
              <textarea
                style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', outline: 'none', resize: 'vertical', minHeight: 90, boxSizing: 'border-box' }}
                placeholder="What does this exam item cover?…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {itemType === 'quiz' ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Quiz Link (Google Form) *</label>
                <input
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 10, padding: '11px 14px', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="https://forms.gle/…"
                  value={quizUrl}
                  onChange={e => setQuizUrl(e.target.value)}
                />
                <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 6 }}>Paste the shareable Google Form link. Students will open it in a new tab.</div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#666', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>PDF / File *</label>
                <div
                  style={{ border: `2px dashed ${file ? ACCENT : drag ? '#ff3c2e' : '#e0e0e0'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: file ? '#f6f2fd' : drag ? '#fff5f5' : '#fafafa', transition: 'all .2s' }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                >
                  <div style={{ color: file ? ACCENT : '#ccc', marginBottom: 10 }}>
                    {file
                      ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    }
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: file ? ACCENT : '#aaa' }}>{file ? file.name : 'Click or drag & drop PDF / file'}</div>
                  <div style={{ fontSize: 11.5, color: '#ccc', marginTop: 4 }}>{file ? fmtBytes(file.size) : 'PDF, Images — max 50 MB'}</div>
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            )}

            <button
              style={{ width: '100%', marginTop: 16, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, color: '#fff', background: uploading ? '#ccc' : ACCENT, border: 'none', borderRadius: 11, padding: 14, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={handleUpload} disabled={uploading}
            >
              {uploading
                ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ad-spin .6s linear infinite', display: 'inline-block' }} /> {itemType === 'quiz' ? 'Adding…' : 'Uploading…'}</>
                : itemType === 'quiz'
                  ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Quiz Link</>
                  : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Paper</>
              }
            </button>
          </div>
        </div>

        {/* ── Right: folder navigation + item cards ── */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Exam Papers by {teacher?.name}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', background: '#f4f4f4', borderRadius: 99, padding: '3px 10px' }}>{filtered.length}</span>
          </div>

          {/* Folder navigation — card grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setViewFolder(null)}
              style={{ fontFamily: 'inherit', textAlign: 'left', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${viewFolder === null ? ACCENT : '#eee'}`, background: viewFolder === null ? ACCENT : '#fafafa', overflow: 'hidden', padding: 0, transition: 'all .15s' }}>
              <div style={{ height: 56, background: viewFolder === null ? '#5b21b6' : '#f3effc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={viewFolder === null ? '#fff' : ACCENT} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: viewFolder === null ? '#fff' : '#666' }}>
                Uncategorized
                <div style={{ fontSize: 10, fontWeight: 500, color: viewFolder === null ? 'rgba(255,255,255,.7)' : '#bbb', marginTop: 1 }}>{filtered.filter(i => !i.folderId).length} items</div>
              </div>
            </button>
            {teacherFolders.map(f => {
              const on    = viewFolder === f.id;
              const count = filtered.filter(i => i.folderId === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setViewFolder(f.id)}
                  style={{ fontFamily: 'inherit', textAlign: 'left', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${on ? ACCENT : '#eee'}`, background: on ? '#f6f2fd' : '#fafafa', overflow: 'hidden', padding: 0, transition: 'all .15s' }}>
                  <div style={{ height: 56, background: '#f3effc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {f.thumbnailUrl
                      ? <img src={f.thumbnailUrl} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="#c4b5fd" stroke={ACCENT} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    }
                  </div>
                  <div style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 600, color: on ? ACCENT : '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                    <div style={{ fontSize: 10, fontWeight: 500, color: on ? '#7c3aed' : '#bbb', marginTop: 1 }}>{count} item{count !== 1 ? 's' : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Item cards */}
          {displayedMats.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p style={{ fontSize: 14, marginTop: 10 }}>No exam items here yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {displayedMats.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 5px rgba(0,0,0,.06)', border: '1.5px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <PaperIcon item={item} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111', marginBottom: 3 }}>{item.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: item.itemType === 'quiz' ? ACCENT : '#ff3c2e', background: item.itemType === 'quiz' ? '#f3effc' : '#fff0ef', borderRadius: 99, padding: '2px 8px' }}>
                          {item.itemType === 'quiz' ? 'QUIZ' : 'PDF'}
                        </span>
                        {item.folderName && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: ACCENT, background: '#f3effc', borderRadius: 99, padding: '2px 8px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#c4b5fd" stroke={ACCENT} strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {item.folderName}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 12.5, color: '#777', marginBottom: 6, lineHeight: 1.5 }}>{item.description}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: '#bbb' }}>
                        {item.itemType === 'quiz'
                          ? <>Online quiz · {fmtDate(item.uploadedAt)}</>
                          : <>{item.fileName} · {fmtBytes(item.fileSize || 0)} · {fmtDate(item.uploadedAt)}</>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <a href={item.itemType === 'quiz' ? item.quizUrl : item.fileUrl} target="_blank" rel="noreferrer"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 12, fontWeight: 700, color: item.itemType === 'quiz' ? ACCENT : '#2680c7', background: item.itemType === 'quiz' ? '#f3effc' : '#e8f0fd', border: 'none', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {item.itemType === 'quiz'
                        ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> Open Quiz</>
                        : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download</>}
                    </a>
                    <button onClick={() => handleDelete(item)}
                      style={{ width: 30, height: 30, borderRadius: 7, background: '#fff0f0', color: '#cc2a1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
