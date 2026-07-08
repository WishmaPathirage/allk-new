import { useState, useEffect, useRef } from 'react';
import {
  collection, onSnapshot, deleteDoc, doc,
  addDoc, updateDoc, query, orderBy, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../services/firebase';

const fmtBytes = (b) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff0ef', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>
  );
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f4fd', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
  );
  return (
    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e8f8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    </div>
  );
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

export default function TeacherMaterialsPage({ teacher, toast }) {
  const [matTitle, setMatTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile]               = useState(null);
  const [drag, setDrag]               = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [items, setItems]             = useState([]);
  const fileRef = useRef();

  const [folders, setFolders]                 = useState([]);
  const [selectedFolder, setSelectedFolder]   = useState('');
  const [newFolderName, setNewFolderName]     = useState('');
  const [newFolderThumbFile, setNewFolderThumbFile]       = useState(null);
  const [newFolderThumbPreview, setNewFolderThumbPreview] = useState('');
  const [creatingFolder, setCreatingFolder]   = useState(false);
  const [showFolderForm, setShowFolderForm]   = useState(false);
  const [viewFolder, setViewFolder]           = useState(null);
  const newFolderThumbRef = useRef();

  const [editingFolderId, setEditingFolderId]                       = useState(null);
  const [editFolderName, setEditFolderName]                         = useState('');
  const [editFolderCurrentThumb, setEditFolderCurrentThumb]         = useState('');
  const [editFolderCurrentThumbPath, setEditFolderCurrentThumbPath] = useState('');
  const [editFolderThumbFile, setEditFolderThumbFile]               = useState(null);
  const [editFolderThumbPreview, setEditFolderThumbPreview]         = useState('');
  const [editFolderRemoveThumb, setEditFolderRemoveThumb]           = useState(false);
  const [editSaving, setEditSaving]                                 = useState(false);
  const editFolderThumbRef = useRef();

  const streamColor = teacher.stream === 'Technology' ? '#2680c7' : teacher.stream === 'Commerce' ? '#27956b' : '#c9720c';
  const gradientBg  = teacher.stream === 'Technology'
    ? 'linear-gradient(135deg, #1a2a3a, #2680c7)'
    : teacher.stream === 'Commerce'
    ? 'linear-gradient(135deg, #1a3a2a, #27956b)'
    : 'linear-gradient(135deg, #3a1a10, #c9720c)';

  useEffect(() => {
    const q = query(collection(db, 'materials'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(all.filter(i => i.teacherId === teacher.id));
    }, () => {});
    return unsub;
  }, [teacher.id]);

  useEffect(() => {
    const q = query(collection(db, 'material_folders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFolders(all.filter(f => f.teacherId === teacher.id));
    }, () => {});
    return unsub;
  }, [teacher.id]);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast('File must be under 50 MB', 'error'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleThumbChange = (f, isEdit) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (f.size > 5 * 1024 * 1024)    { toast('Image must be under 5 MB', 'error'); return; }
    if (isEdit) {
      if (editFolderThumbPreview) URL.revokeObjectURL(editFolderThumbPreview);
      setEditFolderThumbFile(f);
      setEditFolderThumbPreview(URL.createObjectURL(f));
      setEditFolderRemoveThumb(false);
    } else {
      if (newFolderThumbPreview) URL.revokeObjectURL(newFolderThumbPreview);
      setNewFolderThumbFile(f);
      setNewFolderThumbPreview(URL.createObjectURL(f));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { toast('Please enter a folder name', 'error'); return; }
    setCreatingFolder(true);
    try {
      let thumbnailUrl = null, thumbnailStoragePath = null;
      if (newFolderThumbFile) {
        const ext  = newFolderThumbFile.name.split('.').pop().toLowerCase();
        const path = `folder-thumbnails/material_folders/${teacher.id}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, newFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }
      await addDoc(collection(db, 'material_folders'), {
        teacherId: teacher.id, teacherName: teacher.name,
        teacherSubject: teacher.subject, stream: teacher.stream,
        name: newFolderName.trim(), thumbnailUrl, thumbnailStoragePath,
        createdAt: Timestamp.now(),
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
    const hasFiles = items.some(i => i.folderId === folder.id);
    if (!window.confirm(
      hasFiles
        ? `Folder "${folder.name}" has files. Delete folder and all its contents?`
        : `Delete folder "${folder.name}"?`
    )) return;
    try {
      const folderMats = items.filter(i => i.folderId === folder.id);
      for (const mat of folderMats) {
        await deleteDoc(doc(db, 'materials', mat.id));
        if (mat.storagePath) {
          try { await deleteObject(ref(storage, mat.storagePath)); } catch (_) {}
        }
      }
      if (folder.thumbnailStoragePath) {
        try { await deleteObject(ref(storage, folder.thumbnailStoragePath)); } catch (_) {}
      }
      await deleteDoc(doc(db, 'material_folders', folder.id));
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
    setEditingFolderId(null); setEditFolderName('');
    setEditFolderCurrentThumb(''); setEditFolderCurrentThumbPath('');
    setEditFolderThumbFile(null);
    if (editFolderThumbPreview) URL.revokeObjectURL(editFolderThumbPreview);
    setEditFolderThumbPreview(''); setEditFolderRemoveThumb(false);
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
        thumbnailUrl = null; thumbnailStoragePath = null;
      }

      if (editFolderThumbFile) {
        const ext  = editFolderThumbFile.name.split('.').pop().toLowerCase();
        const path = `folder-thumbnails/material_folders/${teacher.id}_${Date.now()}.${ext}`;
        const sRef = ref(storage, path);
        await uploadBytes(sRef, editFolderThumbFile);
        thumbnailUrl = await getDownloadURL(sRef);
        thumbnailStoragePath = path;
      }

      await updateDoc(doc(db, 'material_folders', folder.id), { name: editFolderName.trim(), thumbnailUrl, thumbnailStoragePath });
      toast('Folder updated', 'success');
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      toast('Failed to update folder', 'error');
    }
    setEditSaving(false);
  };

  const handleUpload = async () => {
    if (!matTitle.trim()) { toast('Please enter a title', 'error'); return; }
    if (!file)            { toast('Please select a file', 'error'); return; }
    setUploading(true);
    try {
      const fileName   = `${Date.now()}_${file.name}`;
      const folderPath = selectedFolder ? `folder_${selectedFolder}` : 'uncategorized';
      const sRef       = ref(storage, `study-materials/${teacher.id}/${folderPath}/${fileName}`);
      await uploadBytes(sRef, file);
      const url       = await getDownloadURL(sRef);
      const folderObj = folders.find(f => f.id === selectedFolder);
      await addDoc(collection(db, 'materials'), {
        teacherId: teacher.id, teacherName: teacher.name, teacherSubject: teacher.subject,
        title: matTitle.trim(), description: description.trim(),
        fileName: file.name, fileSize: file.size,
        fileUrl: url, storagePath: `study-materials/${teacher.id}/${folderPath}/${fileName}`,
        folderId: selectedFolder || null,
        folderName: folderObj?.name || null,
        uploadedAt: Timestamp.now(),
      });
      toast(`"${matTitle}" uploaded`, 'success');
      setMatTitle(''); setDescription(''); setFile(null);
    } catch (err) {
      console.error(err);
      toast('Upload failed. Please try again.', 'error');
    }
    setUploading(false);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'materials', item.id));
      if (item.storagePath) {
        try { await deleteObject(ref(storage, item.storagePath)); } catch (_) {}
      }
      toast('Material deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
  };

  const displayedMats  = viewFolder === null
    ? items.filter(i => !i.folderId)
    : items.filter(i => i.folderId === viewFolder);
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Page header */}
      <div style={{ background: gradientBg, borderRadius: 16, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Study Materials</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>
            {items.length} file{items.length !== 1 ? 's' : ''} · {folders.length} folder{folders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 22, alignItems: 'start' }}>

        {/* Left: Upload form + Folder management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload form */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>Upload Material</div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Title *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Chapter 3 Notes"
                value={matTitle}
                onChange={e => setMatTitle(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description (Optional)</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                placeholder="Brief description of this material…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Add to Folder (Optional)</label>
              <select
                value={selectedFolder}
                onChange={e => setSelectedFolder(e.target.value)}
                style={inputStyle}
              >
                <option value="">— No folder (uncategorized) —</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>

            {/* Dropzone */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>File * (max 50 MB)</label>
              <div
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${drag ? streamColor : '#ddd'}`,
                  borderRadius: 10, padding: '20px 16px', cursor: 'pointer',
                  textAlign: 'center', background: drag ? `${streamColor}08` : '#fafafa',
                  transition: 'all .2s',
                }}
              >
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <FileIcon name={file.name} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', wordBreak: 'break-all' }}>{file.name}</div>
                      <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>{fmtBytes(file.size)}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" style={{ marginBottom: 8 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <div style={{ fontSize: 13, color: '#aaa' }}>Drop file here or <span style={{ color: streamColor, fontWeight: 700 }}>browse</span></div>
                    <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>PDF, images, documents — up to 50 MB</div>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />
              {file && (
                <button
                  onClick={() => setFile(null)}
                  style={{ marginTop: 6, fontFamily: 'inherit', fontSize: 12, color: '#cc2a1e', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ✕ Remove file
                </button>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                width: '100%', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
                color: '#fff', background: streamColor, border: 'none', borderRadius: 10,
                padding: '12px 0', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? .7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {uploading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'tm-spin .6s linear infinite' }} />
                  Uploading…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload File
                </>
              )}
            </button>
            <style>{`@keyframes tm-spin { to{transform:rotate(360deg)} }`}</style>
          </div>

          {/* Folder panel */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Folders</div>
              <button
                onClick={() => setShowFolderForm(s => !s)}
                style={{
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: streamColor,
                  background: `${streamColor}11`, border: `1.5px solid ${streamColor}33`,
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                }}
              >
                {showFolderForm ? 'Cancel' : '+ New Folder'}
              </button>
            </div>

            {showFolderForm && (
              <div style={{ marginBottom: 14, padding: 14, background: '#fafafa', borderRadius: 10, border: '1px solid #eee' }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Folder Name *</label>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Term 1 Notes"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Thumbnail (Optional)</label>
                  <div
                    onClick={() => newFolderThumbRef.current?.click()}
                    style={{ border: '2px dashed #ddd', borderRadius: 10, padding: '16px 12px', cursor: 'pointer', textAlign: 'center', background: '#fafafa' }}
                  >
                    {newFolderThumbPreview
                      ? <img src={newFolderThumbPreview} alt="" style={{ maxHeight: 80, borderRadius: 6, maxWidth: '100%' }} />
                      : <span style={{ fontSize: 12, color: '#aaa' }}>Click to upload image</span>
                    }
                  </div>
                  <input ref={newFolderThumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleThumbChange(e.target.files[0], false)} />
                </div>
                <button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder}
                  style={{
                    width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    color: '#fff', background: streamColor, border: 'none', borderRadius: 8,
                    padding: '10px 0', cursor: creatingFolder ? 'not-allowed' : 'pointer', opacity: creatingFolder ? .7 : 1,
                  }}
                >
                  {creatingFolder ? 'Creating…' : 'Create Folder'}
                </button>
              </div>
            )}

            {folders.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#ccc', textAlign: 'center', padding: '12px 0' }}>No folders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => setViewFolder(null)}
                  style={{
                    width: '100%', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textAlign: 'left',
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
                    background: viewFolder === null ? `${streamColor}15` : 'transparent',
                    color: viewFolder === null ? streamColor : '#555',
                  }}
                >
                  All / Uncategorized ({items.filter(i => !i.folderId).length})
                </button>

                {folders.map(folder => {
                  const count  = items.filter(i => i.folderId === folder.id).length;
                  const isView = viewFolder === folder.id;
                  const isEdit = editingFolderId === folder.id;

                  return (
                    <div key={folder.id}>
                      {isEdit ? (
                        <div style={{ padding: 12, background: '#fafafa', borderRadius: 10, border: '1px solid #eee' }}>
                          <input
                            style={{ ...inputStyle, marginBottom: 8 }}
                            value={editFolderName}
                            onChange={e => setEditFolderName(e.target.value)}
                          />
                          <div style={{ marginBottom: 8 }}>
                            {editFolderCurrentThumb && !editFolderRemoveThumb && !editFolderThumbFile && (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                <img src={editFolderCurrentThumb} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                                <button type="button" onClick={() => setEditFolderRemoveThumb(true)}
                                  style={{ fontSize: 11, color: '#cc2a1e', background: 'none', border: 'none', cursor: 'pointer' }}>
                                  Remove
                                </button>
                              </div>
                            )}
                            {editFolderThumbPreview && (
                              <img src={editFolderThumbPreview} alt="" style={{ width: 60, height: 40, borderRadius: 6, objectFit: 'cover', marginBottom: 6 }} />
                            )}
                            <button type="button" onClick={() => editFolderThumbRef.current?.click()}
                              style={{ fontSize: 11.5, color: '#666', background: '#eee', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                              Change thumbnail
                            </button>
                            <input ref={editFolderThumbRef} type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={e => handleThumbChange(e.target.files[0], true)} />
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleSaveEdit(folder)} disabled={editSaving}
                              style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#fff', background: streamColor, border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}
                            >{editSaving ? 'Saving…' : 'Save'}</button>
                            <button
                              onClick={handleCancelEdit}
                              style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#666', background: '#eee', border: 'none', borderRadius: 7, padding: '7px 10px', cursor: 'pointer' }}
                            >Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            background: isView ? `${streamColor}15` : 'transparent',
                            transition: 'background .15s',
                          }}
                          onClick={() => setViewFolder(folder.id)}
                        >
                          {folder.thumbnailUrl
                            ? <img src={folder.thumbnailUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                            : (
                              <div style={{ width: 32, height: 32, borderRadius: 6, background: `${streamColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={streamColor} strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                              </div>
                            )
                          }
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: isView ? streamColor : '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>{count} file{count !== 1 ? 's' : ''}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={e => { e.stopPropagation(); handleStartEdit(folder); }}
                              style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#f0f4ff', color: '#2680c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteFolder(folder); }}
                              style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#fff0f0', color: '#cc2a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Materials list */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                {viewFolder === null
                  ? 'All / Uncategorized'
                  : folders.find(f => f.id === viewFolder)?.name || 'Folder'}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{displayedMats.length} file{displayedMats.length !== 1 ? 's' : ''}</div>
            </div>
            {viewFolder !== null && (
              <button
                onClick={() => setViewFolder(null)}
                style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#666', background: '#f4f4f4', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
              >← All</button>
            )}
          </div>

          {displayedMats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#ccc' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 10 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <p style={{ fontSize: 13.5 }}>No files here yet.</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {displayedMats.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px', borderBottom: '1px solid #f8f8f8',
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fcfcfc'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <FileIcon name={item.fileName} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 3 }}>
                      {item.fileName} · {fmtBytes(item.fileSize || 0)} · {fmtDate(item.uploadedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: 30, height: 30, borderRadius: 7, background: '#e8f8f0', color: '#27956b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
                      }}
                      title="Download"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </a>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#fff0f0', color: '#cc2a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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
