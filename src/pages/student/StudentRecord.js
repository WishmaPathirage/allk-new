import { useState, useEffect, useRef } from 'react';
import {
  collection, query, orderBy, where, getDocs,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const sortByUploadedAt = (docs) =>
  docs.sort((a, b) => (b.uploadedAt?.seconds ?? 0) - (a.uploadedAt?.seconds ?? 0));

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi',                      subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',                           subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',                         subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',                               subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',                         subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',                              subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',                            subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',                        subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',                  stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala',              stream: 'Arts'       },
];
const TEACHER_MAP = Object.fromEntries(ALL_TEACHERS.map(t => [t.id, t]));

const streamColor = s => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = s => s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';

const fmtDate = ts => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = s => {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
};

/* ─── CSS ─── */
const css = `
  .sr-wrap { width: 100%; }

  /* ── Header row ── */
  .sr-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
  }
  .sr-title { font-size: 14.5px; font-weight: 700; color: #111; }
  .sr-badge {
    font-size: 11px; font-weight: 700; color: #aaa;
    background: #f4f4f4; padding: 3px 10px; border-radius: 99px;
  }

  /* ── Subject filter pills ── */
  .sr-pill-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .sr-pill {
    font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 99px;
    border: 1.5px solid #eee; background: #fafafa; color: #888;
    cursor: pointer; font-family: inherit; transition: all .18s;
  }
  .sr-pill:hover { border-color: #ddd; color: #555; }
  .sr-pill.on { background: #ff3c2e; border-color: #ff3c2e; color: #fff; }

  /* ── Teacher section ── */
  .sr-section { margin-bottom: 28px; }
  .sr-section-hdr {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1.5px solid #f0f0f0;
  }
  .sr-section-stream { font-size: 10.5px; font-weight: 700; padding: 2px 9px; border-radius: 99px; }
  .sr-section-name   { font-size: 14px; font-weight: 700; color: #111; }
  .sr-section-teacher{ font-size: 12.5px; color: #bbb; }
  .sr-section-count  {
    margin-left: auto; font-size: 11px; font-weight: 700; color: #bbb;
    background: #f4f4f4; padding: 2px 9px; border-radius: 99px;
  }

  /* ── Recording item ── */
  .sr-item {
    border: 1.5px solid #eee; border-radius: 13px; overflow: hidden;
    margin-bottom: 10px; transition: border-color .2s, box-shadow .15s; background: #fff;
  }
  .sr-item:hover { border-color: #e0e0e0; box-shadow: 0 2px 12px rgba(0,0,0,.05); }
  .sr-item-hdr {
    display: flex; align-items: center; gap: 13px;
    padding: 15px 18px; cursor: pointer; user-select: none;
  }
  .sr-item-ico {
    width: 40px; height: 40px; border-radius: 11px;
    background: #fff0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sr-item-info { flex: 1; min-width: 0; }
  .sr-item-title {
    font-size: 13.5px; font-weight: 700; color: #111;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sr-item-meta { font-size: 12px; color: #bbb; margin-top: 3px; }
  .sr-item-meta strong { color: #888; font-weight: 600; }
  .sr-play-btn {
    flex-shrink: 0; display: flex; align-items: center; gap: 7px;
    font-family: inherit; font-size: 12.5px; font-weight: 700;
    color: #2680c7; background: #e8f0fd;
    border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer;
    transition: background .18s, color .18s;
  }
  .sr-play-btn.active { background: #ff3c2e; color: #fff; }
  .sr-play-btn:hover:not(.active) { background: #2680c7; color: #fff; }

  /* ── Video embed area ── */
  .sr-embed { padding: 0 18px 18px; }

  /* ═══════════════════════════════════════════
     VIDEO PLAYER
  ═══════════════════════════════════════════ */
  .sr-video-wrap {
    position: relative; border-radius: 11px; overflow: hidden;
    aspect-ratio: 16/9; background: #000;
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
    outline: none;
  }
  .sr-video-wrap.sr-ctrl-vis { cursor: default; }
  .sr-video-wrap:not(.sr-ctrl-vis) { cursor: none; }

  .sr-video-wrap iframe {
    width: 100%; height: 100%; border: none; display: block;
    pointer-events: none; /* always non-interactive — shield handles all clicks */
  }

  /* ── Fullscreen ── */
  .sr-video-wrap:fullscreen,
  .sr-video-wrap:-webkit-full-screen {
    border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: unset;
  }
  .sr-video-wrap:fullscreen iframe,
  .sr-video-wrap:-webkit-full-screen iframe { width: 100%; height: 100%; }

  /* ── Shield: blocks ALL pointer events, handles clicks for play/pause ── */
  .sr-shield {
    position: absolute; inset: 0; z-index: 5;
    background: transparent; cursor: inherit;
  }

  /* ── Permanent overlays: solid black ribbons top + bottom ── */
  /* Top ribbon: covers YouTube title / Copy link button */
  .sr-vblock-top {
    position: absolute; top: 0; left: 0; right: 0; height: 60px; z-index: 10;
    background: #000; pointer-events: none;
  }
  /* Bottom ribbon: covers YouTube's native control bar */
  .sr-vblock-bottom {
    position: absolute; bottom: 0; left: 0; right: 0; height: 55px; z-index: 10;
    background: #000; pointer-events: none;
  }
  /* Pause overlay: hides YouTube suggested video thumbnails when paused */
  .sr-pause-overlay {
    position: absolute; inset: 0; z-index: 6;
    background: rgba(0,0,0,.78); pointer-events: none;
  }

  /* ── Big play overlay (unstarted / cued state) ── */
  .sr-play-overlay {
    position: absolute; inset: 0; z-index: 15;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.35); cursor: pointer;
  }
  .sr-play-circle {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,.15); border: 2.5px solid rgba(255,255,255,.7);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(6px); transition: background .2s, transform .15s;
  }
  .sr-play-overlay:hover .sr-play-circle {
    background: rgba(255,60,46,.85); border-color: transparent; transform: scale(1.07);
  }

  /* ── Buffering spinner ── */
  .sr-buf {
    position: absolute; inset: 0; z-index: 15;
    display: flex; align-items: center; justify-content: center; pointer-events: none;
  }
  @keyframes sr-spin { to { transform: rotate(360deg); } }
  .sr-buf-spin {
    width: 42px; height: 42px;
    border: 3px solid rgba(255,255,255,.2); border-top-color: rgba(255,255,255,.85);
    border-radius: 50%; animation: sr-spin .75s linear infinite;
  }

  /* ── End screen ── */
  .sr-ended {
    position: absolute; inset: 0; z-index: 22;
    background: rgba(0,0,0,.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  }
  .sr-ended-lbl { font-size: 13px; color: rgba(255,255,255,.4); letter-spacing: .04em; }
  .sr-replay-btn {
    display: flex; align-items: center; gap: 8px;
    background: #ff3c2e; color: #fff; border: none; border-radius: 10px;
    padding: 11px 24px; font-family: inherit; font-size: 13.5px; font-weight: 700;
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .sr-replay-btn:hover { background: #e03325; transform: translateY(-1px); }

  /* ════════════════════════════════════
     CUSTOM CONTROL BAR
  ════════════════════════════════════ */
  .sr-controls {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 20;
    padding: 36px 10px 6px;
    background: linear-gradient(transparent, rgba(0,0,0,.6) 55%);
    display: flex; flex-direction: column; gap: 5px;
    transition: opacity .3s ease;
  }
  .sr-controls.sr-hidden { opacity: 0; pointer-events: none; }

  /* Progress row */
  .sr-progress { display: flex; align-items: center; gap: 9px; }
  .sr-bar-track {
    flex: 1; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,.22); cursor: pointer; position: relative;
    transition: height .12s; touch-action: none;
  }
  .sr-bar-track:hover,
  .sr-bar-track.seeking { height: 5px; }
  .sr-bar-fill {
    height: 100%; border-radius: inherit; background: #ff3c2e; pointer-events: none;
  }
  .sr-bar-dot {
    position: absolute; top: 50%; width: 13px; height: 13px; border-radius: 50%;
    background: #ff3c2e; transform: translate(-50%, -50%);
    opacity: 0; transition: opacity .12s; pointer-events: none;
  }
  .sr-bar-track:hover .sr-bar-dot,
  .sr-bar-track.seeking .sr-bar-dot { opacity: 1; }
  .sr-time-lbl {
    font-size: 11px; color: rgba(255,255,255,.72); white-space: nowrap;
    font-variant-numeric: tabular-nums; letter-spacing: .01em;
  }

  /* Button row */
  .sr-btn-row { display: flex; align-items: center; gap: 2px; }

  /* Icon button */
  .sr-ibtn {
    width: 32px; height: 32px; border-radius: 7px;
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,.82); transition: background .15s, color .15s;
    flex-shrink: 0;
  }
  .sr-ibtn:hover { background: rgba(255,255,255,.12); color: #fff; }
  .sr-ibtn svg { pointer-events: none; }

  /* Volume group */
  .sr-vol-group { display: flex; align-items: center; gap: 2px; }
  .sr-vol-slider-wrap {
    width: 0; overflow: hidden; transition: width .22s;
    display: flex; align-items: center;
  }
  .sr-vol-group:hover .sr-vol-slider-wrap,
  .sr-vol-group:focus-within .sr-vol-slider-wrap { width: 62px; }
  .sr-vol-input {
    -webkit-appearance: none; appearance: none;
    width: 62px; height: 3px; border-radius: 2px;
    background: rgba(255,255,255,.3); cursor: pointer; accent-color: #fff;
    outline: none;
  }
  .sr-vol-input::-webkit-slider-thumb {
    -webkit-appearance: none; width: 12px; height: 12px;
    border-radius: 50%; background: #fff; cursor: pointer;
  }

  /* Spacer */
  .sr-spacer { flex: 1; min-width: 0; }

  /* Menu button (Speed / Quality) */
  .sr-mbtn {
    height: 26px; padding: 0 9px; border-radius: 5px;
    background: rgba(255,255,255,.1); border: none;
    color: rgba(255,255,255,.75); font-size: 11px; font-weight: 600; font-family: inherit;
    cursor: pointer; display: flex; align-items: center; gap: 4px;
    transition: background .15s; flex-shrink: 0;
  }
  .sr-mbtn:hover { background: rgba(255,255,255,.2); color: #fff; }

  /* Pop-up menus */
  .sr-menu-wrap { position: relative; }
  .sr-menu {
    position: absolute; bottom: calc(100% + 8px); right: 0;
    background: rgba(14,14,14,.97); border-radius: 9px; overflow: hidden;
    min-width: 92px; box-shadow: 0 8px 30px rgba(0,0,0,.65);
    border: 1px solid rgba(255,255,255,.07); z-index: 30;
  }
  .sr-menu-title {
    font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.28); padding: 9px 13px 5px; pointer-events: none;
  }
  .sr-menu-opt {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 8px 13px; background: none; border: none;
    color: rgba(255,255,255,.62); font-size: 12.5px; font-weight: 500;
    font-family: inherit; cursor: pointer; text-align: left; transition: background .12s;
  }
  .sr-menu-opt:hover { background: rgba(255,255,255,.08); color: #fff; }
  .sr-menu-opt.on { color: #ff3c2e; font-weight: 700; }
  .sr-menu-opt.on::after { content: '✓'; font-size: 11px; }

  /* ── States ── */
  .sr-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 20px; gap: 14px;
  }
  .sr-spinner {
    width: 36px; height: 36px; border: 3px solid #f0f0f0;
    border-top-color: #ff3c2e; border-radius: 50%; animation: sr-spin .7s linear infinite;
  }
  .sr-loading-text { font-size: 13px; color: #ccc; font-weight: 500; }
  .sr-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 20px; text-align: center; gap: 14px;
  }
  .sr-empty-title { font-size: 15px; font-weight: 700; color: #bbb; }
  .sr-empty-sub   { font-size: 13px; color: #d5d5d5; line-height: 1.6; max-width: 320px; }
  .sr-error {
    margin: 20px; padding: 16px 18px; border-radius: 12px;
    background: rgba(255,60,46,.06); border: 1px solid rgba(255,60,46,.15);
    font-size: 13px; color: #e05550; line-height: 1.6; display: flex; gap: 10px; align-items: flex-start;
  }
  .sr-error svg { flex-shrink: 0; margin-top: 1px; }
  .sr-notice {
    display: flex; gap: 12px; align-items: flex-start;
    background: #fffbf0; border: 1.5px solid #f0dda0; border-radius: 12px;
    padding: 16px 18px; margin-bottom: 22px;
    font-size: 13px; color: #8a6a00; line-height: 1.6;
  }
  .sr-notice svg { flex-shrink: 0; margin-top: 1px; color: #c9920c; }
  .sr-notice strong { color: #6a4f00; }
  .sr-no-recs {
    padding: 22px 18px; text-align: center;
    font-size: 12.5px; color: #ccc;
    border: 1.5px dashed #eee; border-radius: 11px; margin-bottom: 10px;
  }

  /* ── Folder grid ── */
  .sr-folder-grid {
    display: flex; flex-wrap: wrap;
    gap: 16px; margin-bottom: 22px;
  }
  .sr-folder-card {
    width: 260px; flex-shrink: 0;
    border-radius: 14px; overflow: hidden; cursor: pointer;
    background: #fff; border: 1.5px solid #eee;
    box-shadow: 0 1px 4px rgba(0,0,0,.05);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }
  .sr-folder-card:hover {
    transform: translateY(-5px) scale(1.015);
    box-shadow: 0 14px 36px rgba(255,60,46,.18);
    border-color: #ff3c2e;
  }
  .sr-folder-card.sr-folder-gold { border-color: #f0d060; background: #fffdf5; }
  .sr-folder-card.sr-folder-gold:hover {
    border-color: #ff3c2e;
    box-shadow: 0 14px 36px rgba(255,60,46,.22);
  }
  .sr-folder-thumb { position: relative; aspect-ratio: 4/3; overflow: hidden; }
  .sr-folder-thumb img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .3s ease;
  }
  .sr-folder-card:hover .sr-folder-thumb img { transform: scale(1.06); }
  .sr-folder-thumb-bg {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    transition: background .28s ease;
  }
  .sr-folder-thumb-bg.gold { background: linear-gradient(135deg, #fff8e1 0%, #ffe58a 100%); }
  .sr-folder-card:hover .sr-folder-thumb-bg.gold { background: linear-gradient(135deg, #ffeaa7 0%, #f9c822 100%); }
  .sr-folder-thumb-bg.grey { background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
  .sr-folder-card:hover .sr-folder-thumb-bg.grey { background: linear-gradient(135deg, #ebebeb 0%, #d5d5d5 100%); }
  .sr-folder-thumb-overlay {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.32));
    opacity: 0; transition: opacity .22s ease;
  }
  .sr-folder-card:hover .sr-folder-thumb-overlay { opacity: 1; }
  .sr-folder-badge {
    position: absolute; top: 8px; right: 10px;
    background: rgba(0,0,0,.52); color: #fff; backdrop-filter: blur(3px);
    font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 99px;
  }
  .sr-folder-body { padding: 16px 18px 18px; transition: background .22s ease; }
  .sr-folder-card:hover .sr-folder-body { background: #ff3c2e; }
  .sr-folder-name {
    font-size: 16px; font-weight: 700; color: #111; margin-bottom: 6px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    transition: color .22s ease;
  }
  .sr-folder-card:hover .sr-folder-name { color: #fff; }

  /* ── Recording card grid (inside folder) ── */
  .sr-card-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
    gap: 16px; margin-bottom: 22px;
  }
  .sr-card {
    border: 1.5px solid #eee; border-radius: 12px; overflow: hidden;
    cursor: pointer; background: #fff; transition: border-color .2s, box-shadow .15s;
  }
  .sr-card:hover { border-color: #ddd; box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .sr-card.active { border-color: #ff3c2e; box-shadow: 0 4px 16px rgba(255,60,46,.15); }
  .sr-card-thumb {
    position: relative; aspect-ratio: 16/9; background: #111; overflow: hidden;
  }
  .sr-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sr-card-play-ico {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.3); opacity: 0; transition: opacity .2s;
  }
  .sr-card:hover .sr-card-play-ico,
  .sr-card.active .sr-card-play-ico { opacity: 1; }
  .sr-card-body { padding: 11px 13px 13px; }
  .sr-card-title {
    font-size: 13px; font-weight: 700; color: #111; margin-bottom: 5px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; line-height: 1.4;
  }
  .sr-card-meta { font-size: 11.5px; color: #aaa; }

  /* ── Player section (above card grid) ── */
  .sr-player-section {
    border: 1.5px solid #ff3c2e; border-radius: 14px; overflow: hidden;
    background: #000; margin-bottom: 20px;
  }
  .sr-player-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 16px; background: #fff; border-bottom: 1px solid #f0f0f0;
  }
  .sr-player-hdr-title { font-size: 13.5px; font-weight: 700; color: #111; }
  .sr-player-close {
    width: 28px; height: 28px; border-radius: 7px; background: #f5f5f5;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #888; transition: background .18s, color .18s; flex-shrink: 0;
  }
  .sr-player-close:hover { background: #ff3c2e; color: #fff; }

  @media (max-width: 768px) {
    .sr-item-hdr  { padding: 12px 14px; gap: 10px; }
    .sr-item-title{ font-size: 13px; }
    .sr-item-meta { font-size: 11px; }
    .sr-play-btn  { padding: 7px 11px; font-size: 11.5px; }
    .sr-embed     { padding: 0 12px 14px; }
    .sr-pill-bar  { gap: 6px; }
    .sr-pill      { font-size: 11.5px; padding: 5px 11px; }
    .sr-controls  { padding: 36px 8px 6px; gap: 4px; }
    .sr-time-lbl  { font-size: 10px; }
    .sr-ibtn      { width: 28px; height: 28px; }
    .sr-mbtn      { height: 24px; font-size: 10.5px; padding: 0 7px; }
    .sr-folder-grid { gap: 12px; }
    .sr-folder-card { width: 170px; }
    .sr-folder-body { padding: 13px 15px 15px; }
    .sr-folder-name { font-size: 14px; }
    .sr-card-grid { grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px; }
    .sr-card-body { padding: 9px 11px 11px; }
    .sr-card-title{ font-size: 12px; }

    /* Always show a compact volume slider on mobile (hover doesn't work on touch) */
    .sr-vol-slider-wrap { width: 50px; }
    /* Cursor none for hidden controls is confusing on touch — always use default */
    .sr-video-wrap:not(.sr-ctrl-vis) { cursor: default; }
    /* Larger hit targets for touch */
    .sr-bar-track { height: 5px; }
    .sr-bar-dot   { opacity: 1; }
    /* Player section header stacks on small screens */
    .sr-player-hdr { flex-wrap: wrap; gap: 8px; }
    .sr-player-hdr-title { font-size: 12.5px; }
  }

  @media (max-width: 420px) {
    .sr-folder-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .sr-card-grid   { grid-template-columns: 1fr; gap: 10px; }
    .sr-mbtn        { display: none; }
    .sr-vol-slider-wrap { width: 40px; }
  }
`;

/* ─── Player constants ─── */
const SPEEDS    = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const QUALITIES = [
  { val: 'hd1080', label: '1080p' },
  { val: 'hd720',  label: '720p'  },
  { val: 'large',  label: '480p'  },
  { val: 'medium', label: '360p'  },
  { val: 'small',  label: '240p'  },
  { val: 'auto',   label: 'Auto'  },
];

const YT_UNSTARTED = -1;
const YT_ENDED     =  0;
const YT_PLAYING   =  1;
const YT_PAUSED    =  2;
const YT_BUFFERING =  3;
const YT_CUED      =  5;

const sendCmd = (iframe, func, args = []) =>
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');

/* ════════════════════════════════════════════════════════════
   VIDEO PLAYER
   · controls=0  — YouTube's own UI completely hidden
   · Full custom control bar: play/pause, seek, volume, speed, quality, FS
   · RAF interpolation for smooth progress bar
   · Auto-hide controls after 3 s during playback
   · Shield blocks right-click and all direct YouTube interaction
   · Permanent top + corner overlays cover branding / watermarks
   · Keyboard: Space/K play·pause, ←/→ seek 10 s, M mute, F fullscreen
════════════════════════════════════════════════════════════ */
function VideoPlayer({ videoId, title }) {
  const iframeRef  = useRef(null);
  const wrapRef    = useRef(null);
  const barRef     = useRef(null);
  const rafRef     = useRef(null);
  const hideTimer  = useRef(null);

  /* Refs for values needed inside stable callbacks */
  const ytTimeRef      = useRef({ t: 0, ts: 0 }); // last known YT time + wall-clock
  const speedRef       = useRef(1);
  const durationRef    = useRef(0);
  const seekingRef     = useRef(false);
  const playerStateRef = useRef(YT_UNSTARTED);
  const menuOpenRef    = useRef(false);

  const [iframeKey,     setIframeKey]     = useState(0);
  const [playerState,   setPlayerState]   = useState(YT_UNSTARTED);
  const [isFS,          setIsFS]          = useState(false);
  const [speed,         setSpeed]         = useState(1);
  const [quality,       setQuality]       = useState('auto');
  const [volume,        setVolume]        = useState(100);
  const [muted,         setMuted]         = useState(false);
  const [duration,      setDuration]      = useState(0);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [showControls,  setShowControls]  = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualMenu,  setShowQualMenu]  = useState(false);
  const [seeking,       setSeeking]       = useState(false);
  const [buffering,     setBuffering]     = useState(false);

  /* keep refs in sync */
  useEffect(() => { playerStateRef.current = playerState; }, [playerState]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { menuOpenRef.current = showSpeedMenu || showQualMenu; }, [showSpeedMenu, showQualMenu]);

  /* ─ postMessage listener ─
     With controls=0 YouTube won't send infoDelivery automatically (no native UI
     to drive them). We subscribe via addEventListener after iframe load AND
     handle both infoDelivery and onStateChange formats.
     Origin check is relaxed to match both youtube.com and youtube-nocookie.com. */
  useEffect(() => {
    const handle = e => {
      const from = e.origin || '';
      if (!from.includes('youtube')) return;
      if (!e.data) return;
      let data;
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }

      if (data.event === 'infoDelivery' && data.info) {
        const { playerState: ps, currentTime: ct, duration: dur,
                playbackQuality: pq, playbackRate: pr, volume: vol, muted: mu } = data.info;
        if (ps !== undefined) {
          setPlayerState(ps); playerStateRef.current = ps;
          setBuffering(ps === YT_BUFFERING);
        }
        if (ct !== undefined) {
          setCurrentTime(ct);
          ytTimeRef.current = { t: ct, ts: performance.now() };
        }
        if (dur)  { setDuration(dur); durationRef.current = dur; }
        if (pq)   setQuality(pq);
        if (pr)   { setSpeed(pr); speedRef.current = pr; }
        if (vol !== undefined) setVolume(vol);
        if (mu  !== undefined) setMuted(mu);
      }

      /* onStateChange — sent after our addEventListener subscription */
      if (data.event === 'onStateChange') {
        const ps = typeof data.info === 'number' ? data.info : data.info?.playerState;
        if (typeof ps === 'number') {
          setPlayerState(ps); playerStateRef.current = ps;
          setBuffering(ps === YT_BUFFERING);
        }
      }

      /* initialDelivery — fired once when the player is ready, contains duration */
      if (data.event === 'initialDelivery' && data.info) {
        if (data.info.duration) { setDuration(data.info.duration); durationRef.current = data.info.duration; }
        if (data.info.volume !== undefined) setVolume(data.info.volume);
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  /* ─ RAF: smooth progress interpolation between YT updates ─ */
  useEffect(() => {
    if (playerState === YT_PLAYING) {
      const tick = () => {
        if (!seekingRef.current) {
          const elapsed = (performance.now() - ytTimeRef.current.ts) / 1000;
          const est = ytTimeRef.current.t + elapsed * speedRef.current;
          const capped = Math.min(est, durationRef.current || Infinity);
          setCurrentTime(prev => Math.abs(capped - prev) > 0.04 ? capped : prev);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [playerState]);

  /* ─ Fullscreen tracker ─ */
  useEffect(() => {
    const onChange = () => {
      setIsFS((document.fullscreenElement || document.webkitFullscreenElement) === wrapRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  /* ─ Close menus on outside pointer-down ─ */
  useEffect(() => {
    if (!showSpeedMenu && !showQualMenu) return;
    const close = e => {
      if (!e.target.closest('.sr-menu-wrap')) {
        setShowSpeedMenu(false);
        setShowQualMenu(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [showSpeedMenu, showQualMenu]);

  /* ─ Reset on new video ─ */
  useEffect(() => {
    setPlayerState(YT_UNSTARTED);
    setCurrentTime(0); setDuration(0);
    setSpeed(1); setQuality('auto');
    setShowControls(true); setBuffering(false);
    ytTimeRef.current = { t: 0, ts: 0 };
    speedRef.current = 1; durationRef.current = 0;
  }, [iframeKey]);

  /* ─ Auto-hide controls ─ */
  const resetHideTimer = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (playerStateRef.current === YT_PLAYING) {
      hideTimer.current = setTimeout(() => {
        if (!menuOpenRef.current) setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (playerState !== YT_PLAYING) {
      clearTimeout(hideTimer.current);
      setShowControls(true);
    } else {
      resetHideTimer();
    }
    return () => clearTimeout(hideTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerState]);

  /* ─ Seeking via progress bar ─ */
  const getSeekTime = clientX => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return durationRef.current > 0 ? frac * durationRef.current : frac * currentTime * 2;
  };

  const startSeek = e => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.preventDefault();
    seekingRef.current = true;
    setSeeking(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const t = getSeekTime(clientX);
    setCurrentTime(t);
    ytTimeRef.current = { t, ts: performance.now() };
  };

  useEffect(() => {
    if (!seeking) return;
    const onMove = e => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const t = getSeekTime(clientX);
      setCurrentTime(t);
      ytTimeRef.current = { t, ts: performance.now() };
    };
    const onUp = e => {
      const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const t = getSeekTime(clientX);
      setCurrentTime(t);
      sendCmd(iframeRef.current, 'seekTo', [t, true]);
      ytTimeRef.current = { t, ts: performance.now() };
      seekingRef.current = false;
      setSeeking(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [seeking]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─ Actions ─ */
  const togglePlay = () => {
    const state = playerStateRef.current;
    if (state === YT_PLAYING) {
      sendCmd(iframeRef.current, 'pauseVideo');
      /* Optimistic update — don't wait for YouTube to echo the state back */
      setPlayerState(YT_PAUSED); playerStateRef.current = YT_PAUSED;
    } else {
      sendCmd(iframeRef.current, 'playVideo');
      /* Optimistic: treat as playing immediately so the overlay disappears */
      ytTimeRef.current = { t: currentTime, ts: performance.now() };
      setPlayerState(YT_PLAYING); playerStateRef.current = YT_PLAYING;
    }
    resetHideTimer();
  };

  const toggleMute = () => {
    if (muted) { sendCmd(iframeRef.current, 'unMute'); setMuted(false); }
    else        { sendCmd(iframeRef.current, 'mute');   setMuted(true);  }
  };

  const changeVol = v => {
    setVolume(v);
    if (v === 0) { sendCmd(iframeRef.current, 'mute');   setMuted(true);  }
    else         { sendCmd(iframeRef.current, 'unMute'); setMuted(false); }
    sendCmd(iframeRef.current, 'setVolume', [v]);
  };

  const changeSpeed = s => {
    setSpeed(s); speedRef.current = s;
    setShowSpeedMenu(false);
    sendCmd(iframeRef.current, 'setPlaybackRate', [s]);
  };

  const changeQual = q => {
    setQuality(q);
    setShowQualMenu(false);
    sendCmd(iframeRef.current, 'setPlaybackQuality', [q]);
  };

  const toggleFS = () => {
    if (!isFS) {
      const el = wrapRef.current;
      (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)?.call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    }
  };

  const seek = delta => {
    const dur = durationRef.current;
    /* Only clamp upper bound when we actually know the duration */
    const t = Math.max(0, dur > 0 ? Math.min(dur, currentTime + delta) : currentTime + delta);
    setCurrentTime(t);
    ytTimeRef.current = { t, ts: performance.now() };
    sendCmd(iframeRef.current, 'seekTo', [t, true]);
  };

  const handleKeyDown = e => {
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft':   e.preventDefault(); seek(-10);   break;
      case 'ArrowRight':  e.preventDefault(); seek(+10);   break;
      case 'ArrowUp':     e.preventDefault(); changeVol(Math.min(100, volume + 10)); break;
      case 'ArrowDown':   e.preventDefault(); changeVol(Math.max(0,   volume - 10)); break;
      case 'm': case 'M': toggleMute(); break;
      case 'f': case 'F': toggleFS();   break;
      default: break;
    }
  };

  /* ─ Derived ─ */
  const isPlaying  = playerState === YT_PLAYING;
  const isEnded    = playerState === YT_ENDED;
  const isStarted  = playerState !== YT_UNSTARTED && playerState !== YT_CUED;
  const progress   = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volDisplay = muted ? 0 : volume;

  const iframeSrc = [
    `https://www.youtube-nocookie.com/embed/${videoId}`,
    `?rel=0`,
    `&modestbranding=1`,
    `&showinfo=0`,
    `&iv_load_policy=3`,
    `&controls=0`,           // hide all YouTube controls
    `&disablekb=1`,          // disable YouTube keyboard (we handle keyboard)
    `&enablejsapi=1`,        // required for postMessage API
    `&fs=0`,                 // disable YouTube's own fullscreen button
    `&playsinline=1`,        // prevent iOS auto-fullscreen
    `&cc_load_policy=0`,     // hide captions by default
    `&origin=${encodeURIComponent(window.location.origin)}`,
    iframeKey > 0 ? `&autoplay=1` : '',
  ].join('');

  return (
    <div
      ref={wrapRef}
      className={`sr-video-wrap${showControls || !isPlaying ? ' sr-ctrl-vis' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={e => e.preventDefault()}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchStart={resetHideTimer}
    >
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={iframeSrc}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope"
        allowFullScreen={false}
        onLoad={() => {
          /* Send the YouTube IFrame "listening" handshake.
             This makes the player emit an initialDelivery message containing
             duration, volume, and current state — even with controls=0.
             Then subscribe to ongoing state-change events. */
          const init = () => {
            const win = iframeRef.current?.contentWindow;
            if (!win) return;
            win.postMessage(
              JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'
            );
            ['onStateChange', 'onPlaybackRateChange', 'onPlaybackQualityChange']
              .forEach(evt => sendCmd(iframeRef.current, 'addEventListener', [evt]));
          };
          /* Run immediately and again after a short delay in case YouTube's
             player JS hasn't fully initialised at the onLoad moment. */
          init();
          setTimeout(init, 600);
        }}
      />

      {/* ── Shield: blocks right-click; taps toggle play/pause ── */}
      <div
        className="sr-shield"
        onContextMenu={e => e.preventDefault()}
        onClick={togglePlay}
        onTouchEnd={e => { e.preventDefault(); togglePlay(); }}
      />

      {/* ── Permanent branding blockers ── */}
      <div className="sr-vblock-top" />
      <div className="sr-vblock-bottom" />

      {/* ── Pause overlay: hides YouTube suggested videos ── */}
      {isStarted && !isPlaying && !isEnded && (
        <div className="sr-pause-overlay" />
      )}

      {/* ── Initial play overlay ── */}
      {!isStarted && !isEnded && (
        <div className="sr-play-overlay" onClick={() => {
          sendCmd(iframeRef.current, 'playVideo');
          ytTimeRef.current = { t: 0, ts: performance.now() };
          setPlayerState(YT_PLAYING); playerStateRef.current = YT_PLAYING;
        }}>
          <div className="sr-play-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Buffering spinner ── */}
      {buffering && !isEnded && (
        <div className="sr-buf"><div className="sr-buf-spin" /></div>
      )}

      {/* ── End screen ── */}
      {isEnded && (
        <div className="sr-ended">
          <span className="sr-ended-lbl">Video finished</span>
          <button className="sr-replay-btn" onClick={() => setIframeKey(k => k + 1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
            </svg>
            Replay
          </button>
        </div>
      )}

      {/* ══════════════════════════════════
          CUSTOM CONTROL BAR
      ══════════════════════════════════ */}
      <div
        className={`sr-controls${(!showControls && isPlaying) ? ' sr-hidden' : ''}`}
        onClick={e => e.stopPropagation()}
        onMouseMove={e => { e.stopPropagation(); resetHideTimer(); }}
        onTouchStart={e => { e.stopPropagation(); resetHideTimer(); }}
      >
        {/* ── Progress bar ── */}
        <div className="sr-progress">
          <div
            ref={barRef}
            className={`sr-bar-track${seeking ? ' seeking' : ''}`}
            onMouseDown={startSeek}
            onTouchStart={startSeek}
          >
            <div className="sr-bar-fill" style={{ width: `${progress}%` }} />
            <div className="sr-bar-dot"  style={{ left:  `${progress}%` }} />
          </div>
          <span className="sr-time-lbl">
            {fmtTime(currentTime)}{duration > 0 ? ` / ${fmtTime(duration)}` : ''}
          </span>
        </div>

        {/* ── Button row ── */}
        <div className="sr-btn-row">

          {/* Play / Pause */}
          <button className="sr-ibtn" onClick={togglePlay} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
            {isPlaying
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            }
          </button>

          {/* Skip back 10 s */}
          <button className="sr-ibtn" onClick={() => seek(-10)} title="Back 10 s (←)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 17a6 6 0 1 0 0-10H3"/><polyline points="3 3 3 7 7 7"/>
              <text x="7" y="15" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">10</text>
            </svg>
          </button>

          {/* Skip forward 10 s */}
          <button className="sr-ibtn" onClick={() => seek(+10)} title="Forward 10 s (→)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M13 17a6 6 0 1 1 0-10h8"/><polyline points="21 3 21 7 17 7"/>
              <text x="7" y="15" fontSize="5" fill="currentColor" stroke="none" fontWeight="700">10</text>
            </svg>
          </button>

          {/* Volume */}
          <div className="sr-vol-group">
            <button className="sr-ibtn" onClick={toggleMute} title="Mute (m)">
              {(muted || volDisplay === 0)
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                : volDisplay < 50
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
              }
            </button>
            <div className="sr-vol-slider-wrap">
              <input
                type="range" min="0" max="100" value={volDisplay}
                className="sr-vol-input"
                onChange={e => changeVol(Number(e.target.value))}
                title={`Volume: ${volDisplay}%`}
              />
            </div>
          </div>

          <div className="sr-spacer" />

          {/* Speed */}
          <div className="sr-menu-wrap">
            <button
              className="sr-mbtn"
              onClick={e => { e.stopPropagation(); setShowSpeedMenu(v => !v); setShowQualMenu(false); }}
              title="Playback speed"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              {speed === 1 ? '1×' : `${speed}×`}
            </button>
            {showSpeedMenu && (
              <div className="sr-menu" onClick={e => e.stopPropagation()}>
                <div className="sr-menu-title">Speed</div>
                {SPEEDS.map(s => (
                  <button key={s} className={`sr-menu-opt${speed === s ? ' on' : ''}`} onClick={() => changeSpeed(s)}>
                    {s === 1 ? 'Normal' : `${s}×`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality */}
          <div className="sr-menu-wrap">
            <button
              className="sr-mbtn"
              onClick={e => { e.stopPropagation(); setShowQualMenu(v => !v); setShowSpeedMenu(false); }}
              title="Video quality"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              {QUALITIES.find(q => q.val === quality)?.label ?? 'Auto'}
            </button>
            {showQualMenu && (
              <div className="sr-menu" onClick={e => e.stopPropagation()}>
                <div className="sr-menu-title">Quality</div>
                {QUALITIES.map(q => (
                  <button key={q.val} className={`sr-menu-opt${quality === q.val ? ' on' : ''}`} onClick={() => changeQual(q.val)}>
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button className="sr-ibtn" onClick={toggleFS} title={isFS ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}>
            {isFS
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                  <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                </svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                  <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                </svg>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Thumbnail card (inside folder) ─── */
function RecordCard({ rec, teacher, isActive, onSelect }) {
  const hasVideo = Boolean(rec.videoId);
  const thumbUrl = rec.videoId
    ? `https://img.youtube.com/vi/${rec.videoId}/hqdefault.jpg`
    : null;
  return (
    <div
      className={`sr-card${isActive ? ' active' : ''}`}
      onClick={hasVideo ? onSelect : undefined}
      style={!hasVideo ? { cursor: 'default', opacity: 0.65 } : {}}
    >
      <div className="sr-card-thumb">
        {thumbUrl
          ? <img src={thumbUrl} alt={rec.title || 'Recording'} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#333">
                <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/>
              </svg>
            </div>
        }
        {hasVideo && (
          <div className="sr-card-play-ico">
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: isActive ? 'rgba(255,60,46,.9)' : 'rgba(0,0,0,.55)',
              border: '2.5px solid rgba(255,255,255,.75)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              {isActive
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 3 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }
            </div>
          </div>
        )}
      </div>
      <div className="sr-card-body">
        <div className="sr-card-title">{rec.title || 'Untitled Recording'}</div>
        <div className="sr-card-meta">
          {teacher?.subject ?? rec.teacherSubject ?? 'Unknown'} · {fmtDate(rec.uploadedAt)}
          {!hasVideo && <span style={{ color: '#f0a040' }}> · No video</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function StudentRecord({ student }) {
  const [records,      setRecords]      = useState([]);
  const [folders,      setFolders]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [playId,       setPlayId]       = useState(null);
  const [activeSubj,   setActiveSubj]   = useState('all');
  const [activeFolder, setActiveFolder] = useState(null); // null = folder grid, string = folder id, 'uncategorized'

  const enrolled = (student?.selectedTeachers ?? [])
    .map(t => (typeof t === 'object' && t !== null ? t.id : t))
    .filter(Boolean);

  useEffect(() => {
    setRecords([]); setFolders([]); setError(''); setPlayId(null); setActiveSubj('all'); setActiveFolder(null);
    if (!student) return;
    if (enrolled.length === 0) { setLoading(false); return; }
    setLoading(true);
    let cancelled = false;

    const enrolledSet = new Set(enrolled);

    Promise.all([
      getDocs(query(collection(db, 'records'), where('teacherId', 'in', enrolled))),
      getDocs(query(collection(db, 'record_folders'), where('teacherId', 'in', enrolled))),
    ]).then(([recsSnap, foldersSnap]) => {
      if (cancelled) return;
      setRecords(sortByUploadedAt(recsSnap.docs.map(d => ({ id: d.id, ...d.data() }))));
      setFolders(foldersSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setLoading(false);
      setError('');
    }).catch(err => {
      if (cancelled) return;
      if (err.code === 'permission-denied') {
        setError('Access denied. Please sign out and sign back in.');
      } else {
        // Fallback: fetch all and filter client-side
        getDocs(query(collection(db, 'records'), orderBy('uploadedAt', 'desc')))
          .then(snap => {
            if (cancelled) return;
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => enrolledSet.has(r.teacherId)));
            setLoading(false);
          })
          .catch(() => { if (!cancelled) { setError('Failed to load recordings. Check your connection and refresh.'); setLoading(false); } });
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.email, enrolled.join(',')]);

  const enrolledSet      = new Set(enrolled);
  const enrolledTeachers = ALL_TEACHERS.filter(t => enrolledSet.has(t.id));

  // Subject filter
  const subjRecords = activeSubj === 'all' ? records : records.filter(r => r.teacherId === activeSubj);
  const subjFolders = activeSubj === 'all' ? folders : folders.filter(f => f.teacherId === activeSubj);

  const teachersWithContent = enrolledTeachers.filter(t =>
    records.some(r => r.teacherId === t.id) || folders.some(f => f.teacherId === t.id)
  );

  // Folder filter
  const displayedRecs = activeFolder === null
    ? subjRecords  // show folder overview (but still used for counts)
    : activeFolder === 'uncategorized'
      ? subjRecords.filter(r => !r.folderId)
      : subjRecords.filter(r => r.folderId === activeFolder);

  const currentFolderName = activeFolder && activeFolder !== 'uncategorized'
    ? subjFolders.find(f => f.id === activeFolder)?.name
    : activeFolder === 'uncategorized' ? 'Uncategorized' : null;

  if (loading) return (
    <>
      <style>{css}</style>
      <div className="sr-loading"><div className="sr-spinner" /><div className="sr-loading-text">Loading your recordings…</div></div>
    </>
  );

  if (enrolled.length === 0) return (
    <>
      <style>{css}</style>
      <div className="sr-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
        <div className="sr-empty-title">No subjects enrolled</div>
        <div className="sr-empty-sub">Your enrolled subjects will appear here once your registration has been approved.</div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="sr-wrap">

        {error && (
          <div className="sr-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Header */}
        <div className="sr-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeFolder !== null && (
              <button
                onClick={() => { setActiveFolder(null); setPlayId(null); }}
                style={{ width: 28, height: 28, borderRadius: 7, background: '#f0f0f0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <span className="sr-title">
              {activeFolder === null ? 'Class Recordings' : currentFolderName || 'Videos'}
            </span>
          </div>
          <span className="sr-badge">
            {activeFolder === null
              ? `${subjFolders.length} folder${subjFolders.length !== 1 ? 's' : ''}`
              : `${displayedRecs.length} video${displayedRecs.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Subject filter pills */}
        {(records.length > 0 || folders.length > 0) && (
          <div className="sr-pill-bar">
            <button
              className={`sr-pill${activeSubj === 'all' ? ' on' : ''}`}
              onClick={() => { setActiveSubj('all'); setActiveFolder(null); setPlayId(null); }}
            >
              All Subjects
            </button>
            {teachersWithContent.map(t => (
              <button
                key={t.id}
                className={`sr-pill${activeSubj === t.id ? ' on' : ''}`}
                style={activeSubj !== t.id ? { borderColor: streamColor(t.stream) + '55', color: streamColor(t.stream) } : {}}
                onClick={() => { setActiveSubj(t.id); setActiveFolder(null); setPlayId(null); }}
              >
                {t.subject}
              </button>
            ))}
          </div>
        )}

        {activeFolder === null ? (
          /* ── Folder grid view ── */
          subjFolders.length === 0 && subjRecords.filter(r => !r.folderId).length === 0 ? (
            <div className="sr-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round">
                <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/>
              </svg>
              <div className="sr-empty-title">No recordings available yet</div>
              <div className="sr-empty-sub">Recordings will appear here as your teachers upload class sessions.</div>
            </div>
          ) : (() => {
            const renderFolderCard = (folder) => {
              const count = subjRecords.filter(r => r.folderId === folder.id).length;
              const firstRec = subjRecords.find(r => r.folderId === folder.id && r.videoId);
              const thumbUrl = folder.thumbnailUrl || (firstRec ? `https://img.youtube.com/vi/${firstRec.videoId}/hqdefault.jpg` : null);
              return (
                <div key={folder.id} className="sr-folder-card" onClick={() => { setActiveFolder(folder.id); setPlayId(null); }}>
                  <div className="sr-folder-thumb">
                    {thumbUrl
                      ? <img src={thumbUrl} alt={folder.name} />
                      : <div className="sr-folder-thumb-bg gold">
                          <svg width="58" height="58" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" strokeWidth="1.1" opacity=".85">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                          </svg>
                        </div>
                    }
                    <div className="sr-folder-thumb-overlay" />
                    <span className="sr-folder-badge">{count} video{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="sr-folder-body">
                    <div className="sr-folder-name">{folder.name}</div>
                  </div>
                </div>
              );
            };

            // Group by subject (teacher)
            const byTeacher = {};
            subjFolders.forEach(f => {
              if (!byTeacher[f.teacherId]) byTeacher[f.teacherId] = [];
              byTeacher[f.teacherId].push(f);
            });
            const teacherSections = enrolled.filter(id => byTeacher[id]?.length > 0);
            const uncatCount = subjRecords.filter(r => !r.folderId).length;

            return (
              <div>
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
                      <div className="sr-folder-grid" style={{ marginBottom: 0 }}>
                        {byTeacher[tid].map(renderFolderCard)}
                      </div>
                    </div>
                  );
                })}

                {uncatCount > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #f4f4f4',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#999' }}>Other</span>
                    </div>
                    <div className="sr-folder-grid" style={{ marginBottom: 0 }}>
                      <div className="sr-folder-card" onClick={() => { setActiveFolder('uncategorized'); setPlayId(null); }}>
                        <div className="sr-folder-thumb">
                          <div className="sr-folder-thumb-bg grey">
                            <svg width="58" height="58" viewBox="0 0 24 24" fill="#ccc" stroke="#bbb" strokeWidth="1.1" opacity=".85">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <div className="sr-folder-thumb-overlay" />
                          <span className="sr-folder-badge">{uncatCount} video{uncatCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="sr-folder-body">
                          <div className="sr-folder-name" style={{ color: '#666' }}>Other Videos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          /* ── Videos inside folder — card grid ── */
          displayedRecs.length === 0 ? (
            <div className="sr-no-recs">No recordings in this folder yet.</div>
          ) : (
            <>
              {/* Player section — shown above the grid when a card is selected */}
              {playId && (() => {
                const playing = displayedRecs.find(r => r.id === playId);
                if (!playing) return null;
                return (
                  <div className="sr-player-section">
                    <div className="sr-player-hdr">
                      <div className="sr-player-hdr-title">{playing.title || 'Untitled Recording'}</div>
                      <button className="sr-player-close" onClick={() => setPlayId(null)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <VideoPlayer videoId={playing.videoId} title={playing.title} />
                  </div>
                );
              })()}

              {/* Card grid */}
              <div className="sr-card-grid">
                {displayedRecs.map(rec => (
                  <RecordCard
                    key={rec.id}
                    rec={rec}
                    teacher={TEACHER_MAP[rec.teacherId] ?? null}
                    isActive={playId === rec.id}
                    onSelect={() => setPlayId(playId === rec.id ? null : rec.id)}
                  />
                ))}
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
