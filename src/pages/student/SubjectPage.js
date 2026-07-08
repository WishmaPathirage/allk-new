import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

// import ImgET         from '../../assets/ET.webp';
// import ImgSFT        from '../../assets/SFT.webp';
// import ImgICT        from '../../assets/ICT.webp';
// import ImgBS         from '../../assets/BS.webp';
// import ImgAccounting from '../../assets/ACCOUNTING.webp';
import ImgEcon       from '../../assets/ECON.webp';
import ImgGeo        from '../../assets/GEOGRAPHY.webp';
import ImgPolitical  from '../../assets/POLITICAL.webp';
import ImgMedia      from '../../assets/MEDIA.webp';

const TEACHER_IMG = {
  // et: ImgET, sft: ImgSFT, ict: ImgICT, bs: ImgBS,
  // accounting: ImgAccounting,
  econ: ImgEcon, geo: ImgGeo,
  political: ImgPolitical, media: ImgMedia,
};

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

const streamColor = s => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = s => s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';
const streamGrad  = s => s === 'Technology'
  ? 'linear-gradient(135deg,#1a2c42 0%,#1e3a5c 100%)'
  : s === 'Commerce'
  ? 'linear-gradient(135deg,#1a2e24 0%,#1e3a2c 100%)'
  : 'linear-gradient(135deg,#2e1f0e 0%,#3d2a12 100%)';

const fmtDate = ts => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtTime = s => {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}`;
};
const sortByDate = arr => [...arr].sort((a,b) => (b.uploadedAt?.seconds??0)-(a.uploadedAt?.seconds??0));

/* ─── CSS ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sp-root { min-height: 100vh; font-family: 'Inter', sans-serif; background: #f2f3f7; display: flex; flex-direction: column; }

  /* Topbar */
  .sp-topbar {
    background: #fff; padding: 14px 28px;
    border-bottom: 1px solid #ebebeb;
    display: flex; align-items: center; gap: 14px;
    position: sticky; top: 0; z-index: 100;
  }
  .sp-back-btn {
    display: flex; align-items: center; gap: 7px;
    background: #f4f4f4; border: none; border-radius: 9px;
    padding: 8px 14px; font-size: 13px; font-weight: 600; color: #555;
    cursor: pointer; font-family: inherit; transition: all .18s; flex-shrink: 0;
  }
  .sp-back-btn:hover { background: #eaeaea; color: #111; }
  .sp-topbar-info { min-width: 0; }
  .sp-topbar-title { font-size: 15px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sp-topbar-sub   { font-size: 12px; color: #aaa; }

  /* Hero */
  .sp-hero { padding: 32px 32px 0; display: flex; align-items: flex-end; gap: 28px; flex-wrap: wrap; }
  .sp-hero-photo {
    width: 150px; height: 150px; border-radius: 20px; overflow: hidden; flex-shrink: 0;
    border: 4px solid rgba(255,255,255,.25); box-shadow: 0 8px 32px rgba(0,0,0,.3);
    background: rgba(255,255,255,.1);
  }
  .sp-hero-info { flex: 1; min-width: 180px; padding-bottom: 28px; }
  .sp-hero-subject { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 6px; line-height: 1.2; }
  .sp-hero-teacher { font-size: 16px; color: rgba(255,255,255,.65); margin-bottom: 18px; }
  .sp-hero-badges  { display: flex; gap: 10px; flex-wrap: wrap; }
  .sp-hero-badge   {
    font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 99px;
    background: rgba(255,255,255,.15); color: rgba(255,255,255,.9);
    border: 1px solid rgba(255,255,255,.2);
  }

  /* Tab bar */
  .sp-tab-bar {
    background: #fff; padding: 0 28px;
    border-bottom: 1px solid #ebebeb; display: flex;
  }
  .sp-tab {
    padding: 16px 20px; font-size: 13.5px; font-weight: 600; color: #999;
    border: none; background: none; cursor: pointer; font-family: inherit;
    border-bottom: 2.5px solid transparent; transition: all .18s;
    display: flex; align-items: center; gap: 8px;
  }
  .sp-tab:hover { color: #555; }
  .sp-tab.on { color: #ff3c2e; border-bottom-color: #ff3c2e; }
  .sp-tab-ct {
    font-size: 11px; font-weight: 700; background: #f4f4f4; color: #aaa;
    padding: 2px 8px; border-radius: 99px;
  }
  .sp-tab.on .sp-tab-ct { background: rgba(255,60,46,.1); color: #ff3c2e; }

  /* Body */
  .sp-body { padding: 24px 28px 56px; flex: 1; }

  /* Section title */
  .sp-section-title {
    font-size: 12px; font-weight: 700; color: #bbb; text-transform: uppercase; letter-spacing: .08em;
    display: flex; align-items: center; gap: 10px; margin: 0 0 14px;
  }
  .sp-section-line { flex: 1; height: 1px; background: #eee; }

  /* Folder grid */
  .sp-folder-grid {
    display: flex; flex-wrap: wrap;
    gap: 16px; margin-bottom: 24px;
  }
  .sp-folder-card {
    width: 260px; flex-shrink: 0;
    background: #fff; border-radius: 14px; overflow: hidden;
    border: 1.5px solid #eee; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }
  .sp-folder-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 14px 36px rgba(255,60,46,.18);
    border-color: #ff3c2e;
  }
  .sp-folder-thumb { aspect-ratio: 4/3; position: relative; overflow: hidden; }
  .sp-folder-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
  .sp-folder-card:hover .sp-folder-thumb img { transform: scale(1.06); }
  .sp-folder-body  { padding: 16px 18px 18px; transition: background .22s ease; }
  .sp-folder-card:hover .sp-folder-body { background: #ff3c2e; }
  .sp-folder-name  {
    font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: color .22s ease;
  }
  .sp-folder-card:hover .sp-folder-name { color: #fff; }
  .sp-folder-count { font-size: 12.5px; color: #aaa; transition: color .22s ease; }
  .sp-folder-card:hover .sp-folder-count { color: rgba(255,255,255,.7); }

  /* Breadcrumb */
  .sp-breadcrumb { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  .sp-bc-btn {
    display: flex; align-items: center; gap: 6px;
    background: none; border: none; font-size: 13px; font-weight: 600; color: #2680c7;
    cursor: pointer; font-family: inherit; padding: 0; transition: color .15s;
  }
  .sp-bc-btn:hover { color: #1a5fa0; }
  .sp-bc-sep     { color: #ccc; font-size: 13px; }
  .sp-bc-current { font-size: 13px; color: #999; }

  /* Recording item */
  .sp-rec-item {
    background: #fff; border: 1.5px solid #eee; border-radius: 13px; overflow: hidden;
    margin-bottom: 10px; transition: border-color .2s, box-shadow .15s;
  }
  .sp-rec-item:hover { border-color: #e0e0e0; box-shadow: 0 2px 12px rgba(0,0,0,.05); }
  .sp-rec-hdr  { display: flex; align-items: center; gap: 13px; padding: 15px 18px; cursor: pointer; user-select: none; }
  .sp-rec-ico  { width: 40px; height: 40px; border-radius: 11px; background: #fff0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sp-rec-info { flex: 1; min-width: 0; }
  .sp-rec-title { font-size: 13.5px; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sp-rec-meta  { font-size: 12px; color: #bbb; margin-top: 3px; }
  .sp-play-btn  {
    flex-shrink: 0; display: flex; align-items: center; gap: 7px;
    font-family: inherit; font-size: 12.5px; font-weight: 700;
    color: #2680c7; background: #e8f0fd; border: none; border-radius: 8px;
    padding: 8px 16px; cursor: pointer; transition: all .18s;
  }
  .sp-play-btn.on { background: #ff3c2e; color: #fff; }
  .sp-play-btn:hover:not(.on) { background: #2680c7; color: #fff; }
  .sp-rec-embed { padding: 0 18px 18px; }

  /* ── Video player ── */
  .sp-video-wrap {
    position: relative; border-radius: 11px; overflow: hidden;
    aspect-ratio: 16/9; background: #000;
    user-select: none; -webkit-user-select: none;
  }
  .sp-video-wrap iframe { width: 100%; height: 100%; border: none; display: block; pointer-events: none; }
  .sp-shield { position: absolute; inset: 0; z-index: 5; background: transparent; }
  .sp-vblock-top { position: absolute; top: 0; left: 0; right: 0; height: 60px; z-index: 10; background: #000; pointer-events: none; }
  .sp-vblock-bot { position: absolute; bottom: 0; left: 0; right: 0; height: 55px; z-index: 10; background: #000; pointer-events: none; }
  .sp-play-ov {
    position: absolute; inset: 0; z-index: 15;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.35); cursor: pointer;
  }
  .sp-play-circle {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,.15); border: 2.5px solid rgba(255,255,255,.7);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); transition: background .2s, transform .15s;
  }
  .sp-play-ov:hover .sp-play-circle { background: rgba(255,60,46,.85); border-color: transparent; transform: scale(1.07); }
  .sp-pause-ov  { position: absolute; inset: 0; z-index: 6; background: rgba(0,0,0,.78); pointer-events: none; }
  .sp-ended-ov  {
    position: absolute; inset: 0; z-index: 22; background: rgba(0,0,0,.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  }
  .sp-ended-lbl { font-size: 13px; color: rgba(255,255,255,.4); }
  .sp-replay-btn {
    display: flex; align-items: center; gap: 8px;
    background: #ff3c2e; color: #fff; border: none; border-radius: 10px;
    padding: 11px 24px; font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
  }
  .sp-replay-btn:hover { background: #e03325; }
  .sp-buf-ov { position: absolute; inset: 0; z-index: 15; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  @keyframes sp-spin { to { transform: rotate(360deg); } }
  .sp-buf-spin { width: 42px; height: 42px; border: 3px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.85); border-radius: 50%; animation: sp-spin .75s linear infinite; }
  .sp-video-wrap:fullscreen, .sp-video-wrap:-webkit-full-screen { border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: unset; }
  .sp-video-wrap:fullscreen iframe, .sp-video-wrap:-webkit-full-screen iframe { width: 100%; height: 100%; }

  /* Custom controls */
  .sp-ctrl-bar {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
    padding: 36px 10px 6px;
    background: linear-gradient(transparent, rgba(0,0,0,.65) 55%);
    display: flex; flex-direction: column; gap: 5px;
    transition: opacity .3s;
  }
  .sp-ctrl-bar.hide { opacity: 0; pointer-events: none; }
  .sp-progress { display: flex; align-items: center; gap: 9px; }
  .sp-bar-track {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,.22); cursor: pointer; position: relative; transition: height .12s;
  }
  .sp-bar-track:hover { height: 5px; }
  .sp-bar-fill { height: 100%; border-radius: inherit; background: #ff3c2e; pointer-events: none; }
  .sp-bar-dot  {
    position: absolute; top: 50%; width: 13px; height: 13px; border-radius: 50%;
    background: #ff3c2e; transform: translate(-50%,-50%);
    opacity: 0; transition: opacity .12s; pointer-events: none;
  }
  .sp-bar-track:hover .sp-bar-dot { opacity: 1; }
  .sp-time-lbl { font-size: 11px; color: rgba(255,255,255,.72); white-space: nowrap; }
  .sp-btn-row  { display: flex; align-items: center; gap: 2px; }
  .sp-ibtn {
    width: 32px; height: 32px; border-radius: 7px; background: none; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.82); transition: background .15s; flex-shrink: 0;
  }
  .sp-ibtn:hover { background: rgba(255,255,255,.12); color: #fff; }
  .sp-ibtn svg { pointer-events: none; }
  .sp-spacer { flex: 1; }

  /* Materials */
  .sp-mat-list { display: flex; flex-direction: column; gap: 8px; }
  .sp-mat-strip {
    background: #fff; border: 1.5px solid #eee; border-radius: 13px; padding: 14px 18px;
    display: flex; align-items: center; gap: 14px;
    transition: border-color .2s, box-shadow .2s;
  }
  .sp-mat-strip:hover { border-color: #ddd; box-shadow: 0 2px 10px rgba(0,0,0,.05); }
  .sp-mat-ico       { width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .sp-mat-info-wrap { flex: 1; min-width: 0; }
  .sp-mat-title     { font-size: 13.5px; font-weight: 700; color: #111; margin-bottom: 3px; word-break: break-word; }
  .sp-mat-desc      { font-size: 12px; color: #bbb; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  .sp-mat-date      { font-size: 11.5px; color: #ccc; margin-top: 2px; }
  .sp-mat-btn       { font-size: 12px; font-weight: 700; color: #fff; background: #ff3c2e; border: none; border-radius: 7px; padding: 8px 18px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
  .sp-mat-btn:hover { background: #e03325; }

  /* Recording thumbnail */
  .sp-rec-thumb {
    width: 150px; min-width: 150px; height: 88px; border-radius: 8px; overflow: hidden;
    background: #111; position: relative; flex-shrink: 0;
  }
  .sp-rec-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-rec-thumb-ico {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background: #f5f5f5;
  }
  .sp-rec-thumb-play {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.25); opacity: 0; transition: opacity .18s;
  }
  .sp-rec-hdr:hover .sp-rec-thumb-play { opacity: 1; }
  @media (max-width: 480px) {
    .sp-rec-thumb { width: 110px; min-width: 110px; height: 62px; }
  }

  /* Viewer modal */
  .sp-viewer-bd  { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.75); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .sp-viewer-box { background: #1c1f2a; border-radius: 16px; width: 100%; max-width: 860px; height: 90vh; display: flex; flex-direction: column; box-shadow: 0 32px 90px rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.08); overflow: hidden; }
  .sp-viewer-hdr { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.07); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .sp-viewer-ttl { font-size: 14px; font-weight: 700; color: #fff; }
  .sp-viewer-cls { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,.07); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #888; transition: all .2s; }
  .sp-viewer-cls:hover { background: #ff3c2e; color: #fff; transform: rotate(90deg); }
  .sp-viewer-body { flex: 1; overflow: hidden; background: #12151e; }
  .sp-viewer-body iframe { width: 100%; height: 100%; border: none; display: block; }
  .sp-viewer-body img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; height: 100%; }

  /* Empty / spinner */
  .sp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; text-align: center; }
  .sp-empty-title { font-size: 14px; font-weight: 700; color: #bbb; }
  .sp-empty-sub { font-size: 12.5px; color: #d0d0d0; line-height: 1.5; }
  .sp-spinner-wrap { display: flex; justify-content: center; padding: 80px 20px; }
  .sp-spinner { width: 36px; height: 36px; border: 3px solid #f0f0f0; border-top-color: #ff3c2e; border-radius: 50%; animation: sp-spin .7s linear infinite; }

  @media (max-width: 768px) {
    .sp-topbar { padding: 12px 14px; }
    .sp-hero { padding: 20px 14px 0; gap: 16px; }
    .sp-hero-photo { width: 90px; height: 90px; border-radius: 14px; }
    .sp-hero-subject { font-size: 20px; }
    .sp-hero-teacher { font-size: 13px; margin-bottom: 12px; }
    .sp-tab-bar { padding: 0 14px; }
    .sp-tab { padding: 14px 14px; font-size: 13px; }
    .sp-body { padding: 16px 14px 56px; }
    .sp-folder-grid { gap: 12px; }
    .sp-folder-card { width: 170px; }
    .sp-rec-hdr { padding: 12px 14px; }
    .sp-rec-embed { padding: 0 12px 12px; }
    .sp-vblock-top { height: 34px; }
    .sp-vblock-bot { height: 38px; }
    .sp-ctrl-bar   { padding: 28px 8px 4px; }
  }
`;

/* ─── YT helpers ─── */
const YT_UNSTARTED = -1, YT_ENDED = 0, YT_PLAYING = 1, YT_BUFFERING = 3;
const sendCmd = (iframe, func, args = []) =>
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

/* ─── Video Player ─── */
function VideoPlayer({ videoId, title }) {
  const iframeRef  = useRef(null);
  const wrapRef    = useRef(null);
  const barRef     = useRef(null);
  const rafRef     = useRef(null);
  const hideTimer  = useRef(null);
  const ytTimeRef  = useRef({ t: 0, ts: 0 });
  const durRef     = useRef(0);
  const stateRef   = useRef(YT_UNSTARTED);
  const speedRef   = useRef(1);
  const seekingRef = useRef(false);

  const [iframeKey,   setIframeKey]   = useState(0);
  const [playerState, setPlayerState] = useState(YT_UNSTARTED);
  const [isFS,        setIsFS]        = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showCtrl,    setShowCtrl]    = useState(true);
  const [seeking,     setSeeking]     = useState(false);
  const [buffering,   setBuffering]   = useState(false);
  const [muted,       setMuted]       = useState(false);

  const isPlaying = playerState === YT_PLAYING;
  const isEnded   = playerState === YT_ENDED;
  const isStarted = playerState !== YT_UNSTARTED && playerState !== 5;
  const progress  = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  useEffect(() => {
    const handle = e => {
      if (!(e.origin || '').includes('youtube') || !e.data) return;
      let d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      if (d.event === 'infoDelivery' && d.info) {
        const { playerState: ps, currentTime: ct, duration: dur, muted: mu, playbackRate: pr } = d.info;
        if (ps !== undefined) { setPlayerState(ps); stateRef.current = ps; setBuffering(ps === YT_BUFFERING); }
        if (ct !== undefined) { setCurrentTime(ct); ytTimeRef.current = { t: ct, ts: performance.now() }; }
        if (dur) { setDuration(dur); durRef.current = dur; }
        if (mu !== undefined) setMuted(mu);
        if (pr) speedRef.current = pr;
      }
      if (d.event === 'onStateChange') {
        const ps = typeof d.info === 'number' ? d.info : d.info?.playerState;
        if (typeof ps === 'number') { setPlayerState(ps); stateRef.current = ps; setBuffering(ps === YT_BUFFERING); }
      }
      if (d.event === 'initialDelivery' && d.info?.duration) { setDuration(d.info.duration); durRef.current = d.info.duration; }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        const { t, ts } = ytTimeRef.current;
        setCurrentTime(Math.min(t + (performance.now() - ts) / 1000 * speedRef.current, durRef.current));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  const resetHide = () => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  };
  useEffect(() => {
    if (isPlaying) resetHide(); else { setShowCtrl(true); clearTimeout(hideTimer.current); }
  }, [isPlaying]);

  useEffect(() => {
    const cb = () => setIsFS(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', cb);
    document.addEventListener('webkitfullscreenchange', cb);
    return () => { document.removeEventListener('fullscreenchange', cb); document.removeEventListener('webkitfullscreenchange', cb); };
  }, []);

  const togglePlay = () => {
    if (playerState === YT_PLAYING) sendCmd(iframeRef.current, 'pauseVideo');
    else sendCmd(iframeRef.current, 'playVideo');
  };
  const toggleFS = () => {
    if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  const toggleMute = () => {
    if (muted) { sendCmd(iframeRef.current, 'unMute'); setMuted(false); }
    else        { sendCmd(iframeRef.current, 'mute');   setMuted(true); }
  };

  const startSeek = e => {
    e.preventDefault(); seekingRef.current = true; setSeeking(true);
    const doSeek = ev => {
      const rect = barRef.current?.getBoundingClientRect(); if (!rect) return;
      const t = Math.min(Math.max(0,(ev.clientX - rect.left) / rect.width), 1) * durRef.current;
      sendCmd(iframeRef.current, 'seekTo', [t, true]);
      setCurrentTime(t); ytTimeRef.current = { t, ts: performance.now() };
    };
    const up = () => { seekingRef.current = false; setSeeking(false); window.removeEventListener('mousemove', doSeek); window.removeEventListener('mouseup', up); };
    doSeek(e);
    window.addEventListener('mousemove', doSeek);
    window.addEventListener('mouseup', up);
  };

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&controls=0&rel=0&modestbranding=1&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`;

  return (
    <div ref={wrapRef} className="sp-video-wrap" onMouseMove={isPlaying ? resetHide : undefined}>
      <iframe key={iframeKey} ref={iframeRef} src={src} title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope" allowFullScreen={false}
        onLoad={() => {
          const init = () => {
            const w = iframeRef.current?.contentWindow; if (!w) return;
            w.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
            ['onStateChange','onPlaybackRateChange'].forEach(ev => sendCmd(iframeRef.current, 'addEventListener', [ev]));
          };
          init(); setTimeout(init, 600);
        }}
      />
      <div className="sp-shield" onContextMenu={e => e.preventDefault()} onClick={isStarted ? togglePlay : undefined} />
      <div className="sp-vblock-top" />
      <div className="sp-vblock-bot" />
      {isStarted && !isPlaying && !isEnded && <div className="sp-pause-ov" />}
      {!isStarted && !isEnded && (
        <div className="sp-play-ov" onClick={() => { sendCmd(iframeRef.current,'playVideo'); ytTimeRef.current={t:0,ts:performance.now()}; setPlayerState(YT_PLAYING); stateRef.current=YT_PLAYING; }}>
          <div className="sp-play-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}
      {buffering && !isEnded && <div className="sp-buf-ov"><div className="sp-buf-spin" /></div>}
      {isEnded && (
        <div className="sp-ended-ov">
          <span className="sp-ended-lbl">Video finished</span>
          <button className="sp-replay-btn" onClick={() => setIframeKey(k => k + 1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            Replay
          </button>
        </div>
      )}
      <div className={`sp-ctrl-bar${!showCtrl && isPlaying ? ' hide' : ''}`} onClick={e => e.stopPropagation()} onMouseMove={e => { e.stopPropagation(); resetHide(); }}>
        <div className="sp-progress">
          <div ref={barRef} className={`sp-bar-track${seeking ? ' seeking' : ''}`} onMouseDown={startSeek}>
            <div className="sp-bar-fill" style={{ width: `${progress}%` }} />
            <div className="sp-bar-dot"  style={{ left: `${progress}%` }} />
          </div>
          <span className="sp-time-lbl">{fmtTime(currentTime)}{duration > 0 ? ` / ${fmtTime(duration)}` : ''}</span>
        </div>
        <div className="sp-btn-row">
          <button className="sp-ibtn" onClick={togglePlay}>
            {isPlaying
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
          </button>
          <button className="sp-ibtn" onClick={toggleMute}>
            {muted
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            }
          </button>
          <div className="sp-spacer" />
          <button className="sp-ibtn" onClick={toggleFS}>
            {isFS
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── File type icon ─── */
function FileIcon({ name }) {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf') return (
    <div className="sp-mat-ico" style={{ background: '#fff0f0' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>
  );
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return (
    <div className="sp-mat-ico" style={{ background: '#e8f0fd' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
  );
  return (
    <div className="sp-mat-ico" style={{ background: '#f4f4f4' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>
  );
}

/* ─── Single recording row ─── */
function RecItem({ rec, playId, onToggle }) {
  const isOpen   = playId === rec.id;
  const thumbUrl = rec.videoId ? `https://img.youtube.com/vi/${rec.videoId}/hqdefault.jpg` : null;
  return (
    <div className="sp-rec-item">
      <div className="sp-rec-hdr" onClick={() => rec.videoId && onToggle(rec.id)}>
        <div className="sp-rec-thumb">
          {thumbUrl
            ? <img src={thumbUrl} alt={rec.title || 'Recording'} />
            : <div className="sp-rec-thumb-ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#e0e0e0">
                  <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/>
                </svg>
              </div>
          }
          {rec.videoId && (
            <div className="sp-rec-thumb-play">
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: isOpen ? 'rgba(255,60,46,.9)' : 'rgba(0,0,0,.55)', border: '2px solid rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isOpen
                  ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                }
              </div>
            </div>
          )}
        </div>
        <div className="sp-rec-info">
          <div className="sp-rec-title">{rec.title || 'Untitled Recording'}</div>
          <div className="sp-rec-meta">{fmtDate(rec.uploadedAt)}{!rec.videoId && <span style={{ marginLeft: 8, color: '#f0a040' }}>⚠ No video linked</span>}</div>
        </div>
        {rec.videoId && (
          <button className={`sp-play-btn${isOpen ? ' on' : ''}`} onClick={e => { e.stopPropagation(); onToggle(rec.id); }}>
            {isOpen
              ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Close</>
              : <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play</>
            }
          </button>
        )}
      </div>
      {isOpen && rec.videoId && (
        <div className="sp-rec-embed">
          <VideoPlayer videoId={rec.videoId} title={rec.title} />
        </div>
      )}
    </div>
  );
}

/* ─── Main export ─── */
export default function SubjectPage() {
  const { teacherId } = useParams();
  const navigate      = useNavigate();
  const teacher       = ALL_TEACHERS.find(t => t.id === teacherId);

  const [tab,        setTab]        = useState('videos');
  const [records,    setRecords]    = useState([]);
  const [recFolders, setRecFolders] = useState([]);
  const [materials,  setMaterials]  = useState([]);
  const [matFolders, setMatFolders] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [playId,     setPlayId]     = useState(null);
  const [recFolder,  setRecFolder]  = useState(null);
  const [matFolder,  setMatFolder]  = useState(null);
  const [viewer,     setViewer]     = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { if (!u) navigate('/login'); });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!teacher) { setLoading(false); return; }
    setLoading(true); setPlayId(null); setRecFolder(null); setMatFolder(null);

    Promise.all([
      getDocs(query(collection(db, 'records'),         where('teacherId', '==', teacherId))),
      getDocs(query(collection(db, 'record_folders'),  where('teacherId', '==', teacherId))),
      getDocs(query(collection(db, 'materials'),       where('teacherId', '==', teacherId))),
      getDocs(query(collection(db, 'material_folders'),where('teacherId', '==', teacherId))),
    ]).then(([r, rf, m, mf]) => {
      setRecords(sortByDate(r.docs.map(d => ({ id: d.id, ...d.data() }))));
      setRecFolders(rf.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds??0)-(a.createdAt?.seconds??0)));
      setMaterials(sortByDate(m.docs.map(d => ({ id: d.id, ...d.data() }))));
      setMatFolders(mf.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => {
      Promise.all([
        getDocs(query(collection(db, 'records'),          orderBy('uploadedAt','desc'))),
        getDocs(query(collection(db, 'record_folders'),   orderBy('createdAt','desc'))),
        getDocs(query(collection(db, 'materials'),        orderBy('uploadedAt','desc'))),
        getDocs(collection(db, 'material_folders')),
      ]).then(([r, rf, m, mf]) => {
        setRecords(r.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.teacherId===teacherId));
        setRecFolders(rf.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.teacherId===teacherId));
        setMaterials(m.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.teacherId===teacherId));
        setMatFolders(mf.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.teacherId===teacherId));
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, [teacherId, teacher]);

  const togglePlay = id => setPlayId(cur => cur === id ? null : id);

  /* ── Videos tab ── */
  const renderVideos = () => {
    if (records.length === 0 && recFolders.length === 0) return (
      <div className="sp-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
        <div className="sp-empty-title">No recordings yet</div>
        <div className="sp-empty-sub">Class recordings for {teacher?.subject} will appear here once uploaded.</div>
      </div>
    );

    if (recFolder) {
      const folderName = recFolder === 'uncategorized' ? 'Other Recordings' : recFolders.find(f => f.id === recFolder)?.name;
      const recs = recFolder === 'uncategorized' ? records.filter(r => !r.folderId) : records.filter(r => r.folderId === recFolder);
      return (
        <>
          <div className="sp-breadcrumb">
            <button className="sp-bc-btn" onClick={() => { setRecFolder(null); setPlayId(null); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              All Folders
            </button>
            <span className="sp-bc-sep">/</span>
            <span className="sp-bc-current">{folderName}</span>
          </div>
          {recs.length === 0
            ? <div className="sp-empty"><div className="sp-empty-title">No recordings in this folder</div></div>
            : recs.map(rec => <RecItem key={rec.id} rec={rec} playId={playId} onToggle={togglePlay} />)
          }
        </>
      );
    }

    const hasFolders = recFolders.length > 0;
    const uncatRecs  = records.filter(r => !r.folderId);

    if (hasFolders) return (
      <>
        <div className="sp-folder-grid">
          {recFolders.map(f => {
            const cnt = records.filter(r => r.folderId === f.id).length;
            const firstRec = records.find(r => r.folderId === f.id && r.videoId);
            const thumbUrl = f.thumbnailUrl || (firstRec ? `https://img.youtube.com/vi/${firstRec.videoId}/hqdefault.jpg` : null);
            return (
              <div key={f.id} className="sp-folder-card" onClick={() => { setRecFolder(f.id); setPlayId(null); }}>
                <div className="sp-folder-thumb" style={{ background: thumbUrl ? 'transparent' : 'linear-gradient(135deg,#fff0f0,#fff5f5)' }}>
                  {thumbUrl
                    ? <img src={thumbUrl} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="#ff3c2e" opacity=".2"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                      </div>
                  }
                  <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>{cnt} video{cnt!==1?'s':''}</span>
                </div>
                <div className="sp-folder-body">
                  <div className="sp-folder-name">{f.name}</div>
                  <div className="sp-folder-count">{cnt} recording{cnt!==1?'s':''}</div>
                </div>
              </div>
            );
          })}
          {uncatRecs.length > 0 && (
            <div className="sp-folder-card" onClick={() => { setRecFolder('uncategorized'); setPlayId(null); }}>
              <div className="sp-folder-thumb" style={{ background: '#f8f8f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.35)', color:'#fff', fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>{uncatRecs.length}</span>
              </div>
              <div className="sp-folder-body">
                <div className="sp-folder-name">Other Recordings</div>
                <div className="sp-folder-count">{uncatRecs.length} recording{uncatRecs.length!==1?'s':''}</div>
              </div>
            </div>
          )}
        </div>
      </>
    );

    return records.map(rec => <RecItem key={rec.id} rec={rec} playId={playId} onToggle={togglePlay} />);
  };

  /* ── Materials tab ── */
  const renderMaterials = () => {
    if (materials.length === 0 && matFolders.length === 0) return (
      <div className="sp-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <div className="sp-empty-title">No study materials yet</div>
        <div className="sp-empty-sub">Study materials for {teacher?.subject} will appear here once uploaded.</div>
      </div>
    );

    if (matFolder) {
      const folderName = matFolder === 'uncategorized' ? 'Other Files' : matFolders.find(f => f.id === matFolder)?.name;
      const files = matFolder === 'uncategorized' ? materials.filter(m => !m.folderId) : materials.filter(m => m.folderId === matFolder);
      return (
        <>
          <div className="sp-breadcrumb">
            <button className="sp-bc-btn" onClick={() => setMatFolder(null)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              All Folders
            </button>
            <span className="sp-bc-sep">/</span>
            <span className="sp-bc-current">{folderName}</span>
          </div>
          {files.length === 0
            ? <div className="sp-empty"><div className="sp-empty-title">No files in this folder</div></div>
            : <div className="sp-mat-list">{files.map(m => <MatCard key={m.id} mat={m} onView={setViewer} />)}</div>
          }
        </>
      );
    }

    const hasFolders = matFolders.length > 0;
    const uncatMats  = materials.filter(m => !m.folderId);

    if (hasFolders) return (
      <>
        <div className="sp-folder-grid">
          {matFolders.map(f => {
            const cnt = materials.filter(m => m.folderId === f.id).length;
            return (
              <div key={f.id} className="sp-folder-card" onClick={() => setMatFolder(f.id)}>
                <div className="sp-folder-thumb" style={{ background: f.thumbnailUrl ? 'transparent' : 'linear-gradient(135deg,#e8f4fd,#f0f7ff)' }}>
                  {f.thumbnailUrl
                    ? <img src={f.thumbnailUrl} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="1.5" strokeLinecap="round" opacity=".35"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      </div>
                  }
                  <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.5)', color:'#fff', fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>{cnt} file{cnt!==1?'s':''}</span>
                </div>
                <div className="sp-folder-body">
                  <div className="sp-folder-name">{f.name}</div>
                  <div className="sp-folder-count">{cnt} file{cnt!==1?'s':''}</div>
                </div>
              </div>
            );
          })}
          {uncatMats.length > 0 && (
            <div className="sp-folder-card" onClick={() => setMatFolder('uncategorized')}>
              <div className="sp-folder-thumb" style={{ background: '#f8f8f8', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.35)', color:'#fff', fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>{uncatMats.length}</span>
              </div>
              <div className="sp-folder-body">
                <div className="sp-folder-name">Other Files</div>
                <div className="sp-folder-count">{uncatMats.length} file{uncatMats.length!==1?'s':''}</div>
              </div>
            </div>
          )}
        </div>
      </>
    );

    return <div className="sp-mat-list">{materials.map(m => <MatCard key={m.id} mat={m} onView={setViewer} />)}</div>;
  };

  if (!teacher) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Inter,sans-serif', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:16, fontWeight:700, color:'#bbb' }}>Subject not found</div>
      <button onClick={() => navigate('/student')} style={{ background:'#ff3c2e', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>← Back to Dashboard</button>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="sp-root" onContextMenu={e => e.preventDefault()}>

        {/* Topbar */}
        <div className="sp-topbar">
          <button className="sp-back-btn" onClick={() => navigate('/student')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </button>
          <div className="sp-topbar-info">
            <div className="sp-topbar-title">{teacher.subject}</div>
            <div className="sp-topbar-sub">{teacher.name}</div>
          </div>
        </div>

        {/* Hero banner */}
        <div style={{ background: streamGrad(teacher.stream) }}>
          <div className="sp-hero">
            <div className="sp-hero-photo">
              {TEACHER_IMG[teacherId]
                ? <img src={TEACHER_IMG[teacherId]} alt={teacher.name} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
                : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
              }
            </div>
            <div className="sp-hero-info">
              <div className="sp-hero-subject">{teacher.subject}</div>
              <div className="sp-hero-teacher">{teacher.name}</div>
              <div className="sp-hero-badges">
                <span className="sp-hero-badge" style={{ background: streamBg(teacher.stream), color: streamColor(teacher.stream), border: 'none' }}>{teacher.stream}</span>
                <span className="sp-hero-badge">{records.length} video{records.length !== 1 ? 's' : ''}</span>
                <span className="sp-hero-badge">{materials.length} file{materials.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="sp-tab-bar">
          <button className={`sp-tab${tab === 'videos' ? ' on' : ''}`} onClick={() => setTab('videos')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
            Class Recordings
            <span className="sp-tab-ct">{records.length}</span>
          </button>
          <button className={`sp-tab${tab === 'materials' ? ' on' : ''}`} onClick={() => setTab('materials')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Study Materials
            <span className="sp-tab-ct">{materials.length}</span>
          </button>
        </div>

        {/* Content */}
        <div className="sp-body">
          {loading
            ? <div className="sp-spinner-wrap"><div className="sp-spinner" /></div>
            : tab === 'videos' ? renderVideos() : renderMaterials()
          }
        </div>

        {/* Material viewer modal */}
        {viewer && (
          <div className="sp-viewer-bd" onClick={() => setViewer(null)}>
            <div className="sp-viewer-box" onClick={e => e.stopPropagation()}>
              <div className="sp-viewer-hdr">
                <span className="sp-viewer-ttl">{viewer.title}</span>
                <button className="sp-viewer-cls" onClick={() => setViewer(null)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="sp-viewer-body">
                {viewer.url?.includes('drive.google.com') || viewer.url?.endsWith('.pdf')
                  ? <iframe src={viewer.url} title={viewer.title} />
                  : viewer.url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
                  ? <img src={viewer.url} alt={viewer.title} />
                  : <iframe src={viewer.url} title={viewer.title} />
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Material card (defined after SubjectPage to avoid hoisting issues) ─── */
function MatCard({ mat, onView }) {
  return (
    <div className="sp-mat-strip">
      <FileIcon name={mat.fileName || mat.title} />
      <div className="sp-mat-info-wrap">
        <div className="sp-mat-title">{mat.title || mat.fileName || 'Untitled'}</div>
        {mat.description && <div className="sp-mat-desc">{mat.description}</div>}
        <div className="sp-mat-date">{fmtDate(mat.uploadedAt)}</div>
      </div>
      {(mat.fileUrl || mat.url) && (
        <button className="sp-mat-btn" onClick={() => onView({ url: mat.fileUrl || mat.url, title: mat.title || mat.fileName || 'File' })}>
          View
        </button>
      )}
    </div>
  );
}
