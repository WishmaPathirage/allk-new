import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

import StudentProfile from './StudentProfile';
import StudentRecord from './StudentRecord';
import StudentMaterials from './StudentMaterials';
import MonthlyPayment from '../MonthlyPayment/MonthlyPayment';

// import ImgET          from '../../assets/ET.webp';
// import ImgSFT         from '../../assets/SFT.webp';
// import ImgICT         from '../../assets/ICT.webp';
// import ImgBS          from '../../assets/BS.webp';
// import ImgAccounting  from '../../assets/ACCOUNTING.webp';
import ImgEcon        from '../../assets/ECON.webp';
import ImgGeo         from '../../assets/GEOGRAPHY.webp';
import ImgPolitical   from '../../assets/POLITICAL.webp';
import ImgMedia       from '../../assets/MEDIA.webp';

const TEACHER_IMG = {
  // et:         ImgET,
  // sft:        ImgSFT,
  // ict:        ImgICT,
  // bs:         ImgBS,
  // accounting: ImgAccounting,
  econ:       ImgEcon,
  geo:        ImgGeo,
  political:  ImgPolitical,
  media:      ImgMedia,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isLiveNow(item) {
  const now = new Date();
  const day = now.getDay(); // 0-6
  if (!item.days?.includes(day)) return false;
  const [sh, sm] = item.startTime.split(':').map(Number);
  const [eh, em] = item.endTime.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm;
  const end   = eh * 60 + em;
  return cur >= start && cur <= end;
}

function fmtSessionDate(ts) {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}


const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',                             subject: 'Media',    stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts'       },
];

const streamColor = (s) => s === 'Technology' ? '#2680c7' : s === 'Commerce' ? '#27956b' : '#c9720c';
const streamBg    = (s) => s === 'Technology' ? '#e8f4fd' : s === 'Commerce' ? '#e8f8f0' : '#fdf0e8';

/* ─── CSS ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-root { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f2f3f7; }
  .sd-root * { -webkit-user-drag: none; }
  .sd-video-wrap { user-select: none; -webkit-user-select: none; }

  /* ── Sidebar ── */
  .sd-sidebar {
    width: 230px; background: #16181f; display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
  }
  .sd-brand {
    padding: 22px 20px 18px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 12px;
  }
  .sd-brand-icon {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    overflow: hidden; display: block; object-fit: cover;
  }
  .sd-brand-title { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.35; }
  .sd-brand-sub   { font-size: 10.5px; color: #555; margin-top: 1px; }

  .sd-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
  .sd-nav-lbl {
    font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #3a3d4a; padding: 6px 12px 8px;
  }
  .sd-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 11px;
    padding: 10px 13px; border-radius: 9px; cursor: pointer; margin-bottom: 3px;
    font-size: 13px; font-weight: 500; color: #6e7282;
    border: none; background: none; font-family: inherit; text-align: left;
    transition: background .18s, color .18s;
  }
  .sd-nav-btn:hover { background: rgba(255,255,255,.05); color: #ccc; }
  .sd-nav-btn.on    { background: rgba(255,60,46,.14); color: #ff3c2e; font-weight: 600; }

  .sd-user {
    padding: 14px 16px; border-top: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 11px;
  }
  .sd-user-av {
    width: 36px; height: 36px; border-radius: 50%; background: #ff3c2e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: #fff;
  }
  .sd-user-name { font-size: 12.5px; font-weight: 600; color: #ddd; }
  .sd-user-role { font-size: 11px; color: #555; margin-top: 1px; }

  /* ── Main ── */
  .sd-main { margin-left: 230px; flex: 1; display: flex; flex-direction: column; }
  .sd-topbar {
    background: #fff; padding: 16px 30px;
    border-bottom: 1px solid #ebebeb;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50;
  }
  .sd-page-title { font-size: 20px; font-weight: 800; color: #111; }
  .sd-topbar-right { text-align: right; }
  .sd-topbar-day  { font-size: 13px; font-weight: 600; color: #333; }
  .sd-topbar-date { font-size: 12px; color: #aaa; margin-top: 1px; }

  .sd-body { padding: 26px 30px 48px; }

  /* ── Stat cards ── */
  .sd-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-bottom: 26px; }
  .sd-stat {
    background: #fff; border-radius: 14px; padding: 20px 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06);
    display: flex; align-items: center; justify-content: space-between;
  }
  .sd-stat-lbl { font-size: 11.5px; color: #aaa; font-weight: 500; margin-bottom: 6px; }
  .sd-stat-val { font-size: 38px; font-weight: 800; color: #111; line-height: 1; }
  .sd-stat-sub { font-size: 11px; color: #ccc; margin-top: 5px; }
  .sd-stat-ico {
    width: 52px; height: 52px; border-radius: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .sd-stat-ico.red   { background: #fff0f0; }
  .sd-stat-ico.blue  { background: #e8f0fd; }
  .sd-stat-ico.green { background: #e8f8f0; }

  /* ── Card ── */
  .sd-card {
    background: #fff; border-radius: 14px; overflow: hidden;
    box-shadow: 0 1px 5px rgba(0,0,0,.06); margin-bottom: 22px;
  }
  .sd-card-hdr {
    padding: 18px 24px 14px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #f4f4f4;
  }
  .sd-card-title { font-size: 14.5px; font-weight: 700; color: #111; }
  .sd-card-badge {
    font-size: 11px; font-weight: 700; color: #aaa;
    background: #f4f4f4; padding: 3px 10px; border-radius: 99px;
  }

  /* ── Subject filter pills ── */
  .sd-subject-bar { display: flex; gap: 8px; flex-wrap: wrap; padding: 16px 24px 0; }
  .sd-spill {
    font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 99px;
    border: 1.5px solid #eee; background: #fafafa; color: #888;
    cursor: pointer; font-family: inherit; transition: all .18s;
  }
  .sd-spill:hover { border-color: #ddd; color: #555; }
  .sd-spill.on { background: #ff3c2e; border-color: #ff3c2e; color: #fff; }

  /* ── Subject cards (dashboard) ── */
  .sd-subjects { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 16px; padding: 20px 24px 26px; }
  .sd-subj-card {
    border: 1.5px solid #eee; border-radius: 16px; overflow: hidden;
    display: flex; flex-direction: column;
    transition: border-color .2s, box-shadow .2s, transform .15s;
    background: #fff;
  }
  .sd-subj-card:hover { border-color: rgba(255,60,46,.4); box-shadow: 0 6px 24px rgba(255,60,46,.15); transform: translateY(-3px); }
  .sd-subj-img {
    width: 100%; height: 245px; overflow: hidden; flex-shrink: 0;
    background: #f5f5f5;
  }
  .sd-subj-img img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
  .sd-subj-body    { padding: 14px 16px 16px; transition: background .25s; }
  .sd-subj-card:hover .sd-subj-body { background: rgba(255,60,46,.05); }
  .sd-subj-name    { font-size: 15.5px; font-weight: 700; color: #111; margin-bottom: 5px; transition: color .25s; }
  .sd-subj-card:hover .sd-subj-name { color: #ff3c2e; }
  .sd-subj-teacher { font-size: 13px; color: #aaa; }
  .sd-stream-pill {
    display: inline-block; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 99px; margin-top: 6px;
  }

  /* ── Teacher section heading ── */
  .sd-teacher-section { margin-bottom: 26px; }
  .sd-teacher-hdr {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f4;
  }
  .sd-teacher-name { font-size: 13.5px; font-weight: 700; color: #111; }
  .sd-teacher-subj { font-size: 12px; color: #aaa; }

  /* ── Recording item ── */
  .sd-rec-item {
    border: 1.5px solid #eee; border-radius: 12px; overflow: hidden;
    margin-bottom: 12px; transition: border-color .2s;
  }
  .sd-rec-item:hover { border-color: #ddd; }
  .sd-rec-header {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; cursor: pointer;
  }
  .sd-rec-ico {
    width: 38px; height: 38px; border-radius: 10px; background: #fff0f0; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .sd-rec-title { font-size: 13.5px; font-weight: 700; color: #111; }
  .sd-rec-meta  { font-size: 12px; color: #aaa; margin-top: 2px; }
  .sd-rec-play {
    margin-left: auto; font-size: 12px; font-weight: 700; color: #2680c7;
    background: #e8f0fd; border: none; border-radius: 7px;
    padding: 7px 14px; cursor: pointer; display: flex; align-items: center; gap: 6px;
    font-family: inherit; flex-shrink: 0; transition: all .18s;
  }
  .sd-rec-play:hover { background: #2680c7; color: #fff; }
  .sd-rec-embed { padding: 0 18px 18px; }

  /* ── YouTube embed ── */
  .sd-video-wrap {
    position: relative; border-radius: 10px; overflow: hidden;
    aspect-ratio: 16/9; background: #000; user-select: none;
    -webkit-user-select: none; -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .sd-video-wrap iframe { width: 100%; height: 100%; border: none; display: block; pointer-events: auto; }

  /* Full transparent overlay — blocks right-click on iframe, passes left-clicks through */
  .sd-video-shield {
    position: absolute; inset: 0; z-index: 5;
    background: transparent; pointer-events: auto;
  }

  /* Fullscreen state — wrapper fills screen, overlays stay on top */
  .sd-video-wrap:fullscreen,
  .sd-video-wrap:-webkit-full-screen {
    border-radius: 0; width: 100vw; height: 100vh; aspect-ratio: unset;
  }
  .sd-video-wrap:fullscreen iframe,
  .sd-video-wrap:-webkit-full-screen iframe { width: 100%; height: 100%; }

  /* Overlays – block YouTube's title bar and control bar links */
  .sd-vblock {
    position: absolute; z-index: 10; pointer-events: auto; cursor: default;
    -webkit-touch-callout: none;
  }
  /* Full-width top bar: covers title row + Copy link – always visible */
  .sd-vblock-top {
    top: 0; left: 0; right: 0; height: 64px;
    background: linear-gradient(to bottom, rgba(0,0,0,.88) 55%, transparent);
  }
  /* Bottom-right: covers YouTube logo – always visible */
  .sd-vblock-br {
    bottom: 0; right: 0; width: 130px; height: 50px;
    background: linear-gradient(to top left, rgba(0,0,0,.92) 55%, transparent);
  }
  /* Bottom-left: covers Watch on YouTube – pre-play only */
  .sd-vblock-bl {
    bottom: 0; left: 0; width: 240px; height: 56px;
    background: linear-gradient(to top right, rgba(0,0,0,.92) 55%, transparent);
  }

  /* ── Custom control bar (speed, quality, fullscreen) ── */
  .sd-ctrl-bar {
    position: absolute; bottom: 8px; right: 8px; z-index: 20;
    display: flex; align-items: center; gap: 5px;
  }
  .sd-ctrl-wrap { position: relative; }
  .sd-ctrl-btn {
    height: 30px; padding: 0 10px; border-radius: 6px;
    background: rgba(0,0,0,.62); border: none; color: #fff;
    font-size: 11.5px; font-weight: 600; font-family: inherit;
    cursor: pointer; backdrop-filter: blur(4px);
    display: flex; align-items: center; gap: 5px; white-space: nowrap;
    transition: background .15s;
  }
  .sd-ctrl-btn:hover { background: rgba(0,0,0,.88); }
  .sd-ctrl-menu {
    position: absolute; bottom: calc(100% + 7px); right: 0;
    background: rgba(18,18,18,.97); border-radius: 9px; overflow: hidden;
    min-width: 88px; box-shadow: 0 6px 24px rgba(0,0,0,.55);
    backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.07);
  }
  .sd-ctrl-menu-title {
    font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.3); padding: 9px 13px 5px; pointer-events: none;
  }
  .sd-ctrl-opt {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 8px 13px; background: none; border: none;
    color: rgba(255,255,255,.7); font-size: 12.5px; font-weight: 500;
    font-family: inherit; cursor: pointer; text-align: left; transition: background .12s;
  }
  .sd-ctrl-opt:hover { background: rgba(255,255,255,.08); color: #fff; }
  .sd-ctrl-opt.on { color: #ff3c2e; font-weight: 700; }
  .sd-ctrl-opt.on::after { content: '✓'; font-size: 11px; }
  .sd-fs-btn {
    width: 30px; height: 30px; border-radius: 6px;
    background: rgba(0,0,0,.62); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px); transition: background .15s; flex-shrink: 0;
  }
  .sd-fs-btn:hover { background: rgba(0,0,0,.88); }
  @media (max-width: 768px) {
    .sd-ctrl-btn { height: 28px; font-size: 11px; padding: 0 8px; }
    .sd-fs-btn   { width: 28px; height: 28px; }
    .sd-ctrl-bar { bottom: 6px; right: 6px; gap: 4px; }
  }

  /* End-screen overlay: blocks YouTube's suggested videos grid */
  .sd-video-ended {
    position: absolute; inset: 0; z-index: 20;
    background: rgba(0,0,0,.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  }
  .sd-ended-label {
    font-size: 13px; font-weight: 500; color: rgba(255,255,255,.45);
    letter-spacing: .04em;
  }
  .sd-replay-btn {
    display: flex; align-items: center; gap: 8px;
    background: #ff3c2e; color: #fff; border: none; border-radius: 10px;
    padding: 12px 26px; font-family: inherit; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: background .2s, transform .15s;
  }
  .sd-replay-btn:hover { background: #e03325; transform: translateY(-1px); }

  /* ── Materials grid ── */
  .sd-mat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; padding: 18px 24px 22px; }
  .sd-mat-card {
    border: 1.5px solid #eee; border-radius: 12px; padding: 16px 18px;
    transition: border-color .2s, box-shadow .2s;
  }
  .sd-mat-card:hover { border-color: #ddd; box-shadow: 0 2px 10px rgba(0,0,0,.05); }
  .sd-mat-top { display: flex; align-items: flex-start; gap: 13px; margin-bottom: 12px; }
  .sd-mat-ico {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .sd-mat-ico.pdf   { background: #fff0f0; }
  .sd-mat-ico.img   { background: #e8f0fd; }
  .sd-mat-ico.other { background: #e8f8f0; }
  .sd-mat-title   { font-size: 13.5px; font-weight: 700; color: #111; margin-bottom: 3px; word-break: break-word; }
  .sd-mat-subject { font-size: 12px; color: #aaa; }
  .sd-mat-desc    { font-size: 12px; color: #bbb; margin-top: 4px; line-height: 1.4;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .sd-mat-footer { display: flex; align-items: center; justify-content: space-between; }
  .sd-mat-info   { font-size: 11.5px; color: #ccc; }
  .sd-mat-view {
    font-size: 12px; font-weight: 700; color: #fff; background: #ff3c2e;
    border: none; border-radius: 7px; padding: 7px 16px;
    cursor: pointer; font-family: inherit; transition: background .18s;
  }
  .sd-mat-view:hover { background: #e03325; }

  /* ── Material viewer modal ── */
  .sd-viewer-bd {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,.75); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .sd-viewer-box {
    background: #1c1f2a; border-radius: 16px; width: 100%; max-width: 860px;
    height: 90vh; display: flex; flex-direction: column;
    box-shadow: 0 32px 90px rgba(0,0,0,.5);
    border: 1px solid rgba(255,255,255,.08); overflow: hidden;
  }
  .sd-viewer-hdr {
    padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .sd-viewer-title { font-size: 14px; font-weight: 700; color: #fff; }
  .sd-viewer-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(255,255,255,.07); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; color: #888;
    transition: all .2s;
  }
  .sd-viewer-close:hover { background: #ff3c2e; color: #fff; transform: rotate(90deg); }
  .sd-viewer-body { flex: 1; overflow: hidden; background: #12151e; }
  .sd-viewer-body iframe { width: 100%; height: 100%; border: none; display: block; }
  .sd-viewer-body img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; height: 100%; }

  /* ── Empty / loading ── */
  .sd-empty { text-align: center; padding: 60px 20px; color: #ccc; }
  .sd-empty p { font-size: 14px; margin-top: 10px; }
  @keyframes sd-spin { to { transform: rotate(360deg); } }
  .sd-spinner-wrap { display: flex; justify-content: center; padding: 80px 20px; }
  .sd-spinner {
    width: 36px; height: 36px; border: 3px solid #f0f0f0;
    border-top-color: #ff3c2e; border-radius: 50%; animation: sd-spin .7s linear infinite;
  }

  /* ── Hamburger (hidden on desktop) ── */
  .sd-hamburger {
    display: none; flex-direction: column; justify-content: center; gap: 5px;
    width: 36px; height: 36px; background: none; border: none; cursor: pointer; padding: 4px;
  }
  .sd-hamburger span {
    display: block; height: 2px; background: #333; border-radius: 2px; transition: all .2s;
  }

  /* ── Sidebar overlay (mobile) ── */
  .sd-sidebar-overlay {
    display: none; position: fixed; inset: 0; z-index: 99;
    background: rgba(0,0,0,.5);
  }
  .sd-sidebar-overlay.open { display: block; }

  /* ── Tablet (≤ 1024px) ── */
  @media (max-width: 1024px) {
    .sd-sidebar { width: 200px; }
    .sd-main    { margin-left: 200px; }
    .sd-body    { padding: 20px 20px 40px; }
    .sd-topbar  { padding: 14px 20px; }
    .sd-stats   { gap: 14px; }
    .sd-subjects { grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); padding: 16px 18px 20px; }
    .sd-mat-grid { grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); padding: 14px 18px 18px; }
  }

  /* ── Mobile (≤ 768px) ── */
  @media (max-width: 768px) {
    /* Sidebar becomes slide-in drawer */
    .sd-sidebar {
      width: 240px;
      transform: translateX(-100%);
      transition: transform .25s ease;
      z-index: 200;
      box-shadow: 4px 0 24px rgba(0,0,0,.3);
    }
    .sd-sidebar.open { transform: translateX(0); }

    /* Main takes full width */
    .sd-main { margin-left: 0; }

    /* Topbar: show hamburger */
    .sd-topbar { padding: 12px 16px; gap: 12px; }
    .sd-hamburger { display: flex; }
    .sd-page-title { font-size: 16px; }
    .sd-topbar-day  { font-size: 12px; }
    .sd-topbar-date { font-size: 11px; }

    /* Body padding */
    .sd-body { padding: 16px 14px 60px; }

    /* Stats: stack to 1 column on small, 2 col on medium mobile */
    .sd-stats { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
    .sd-stats .sd-stat:last-child { grid-column: 1 / -1; }
    .sd-stat  { padding: 14px 16px; }
    .sd-stat-val { font-size: 28px; }
    .sd-stat-ico { width: 42px; height: 42px; }

    /* Cards */
    .sd-card-hdr { padding: 14px 16px 12px; }
    .sd-card-title { font-size: 13.5px; }

    /* Subject filter pills */
    .sd-subject-bar { padding: 12px 14px 0; gap: 6px; }
    .sd-spill { font-size: 11.5px; padding: 5px 11px; }

    /* Subject cards: horizontal strips on mobile */
    .sd-subjects  { grid-template-columns: 1fr; padding: 12px 14px 16px; gap: 10px; }
    .sd-subj-card { flex-direction: row; }
    .sd-subj-img  { width: 130px; height: 160px; flex-shrink: 0; }
    .sd-subj-body { padding: 12px 14px; display: flex; flex-direction: column; justify-content: center; }

    /* Recording items */
    .sd-rec-header { padding: 12px 14px; gap: 10px; }
    .sd-rec-title  { font-size: 13px; }
    .sd-rec-meta   { font-size: 11px; }
    .sd-rec-play   { padding: 6px 10px; font-size: 11.5px; }
    .sd-rec-embed  { padding: 0 12px 14px; }
    .sd-rec-ico    { width: 34px; height: 34px; }

    /* Materials: single column */
    .sd-mat-grid { grid-template-columns: 1fr; padding: 12px 14px 16px; gap: 10px; }

    /* Viewer modal */
    .sd-viewer-box { height: 95vh; border-radius: 12px; }
    .sd-viewer-hdr { padding: 12px 14px; }
    .sd-viewer-title { font-size: 13px; }

    /* Teacher section */
    .sd-teacher-section { margin-bottom: 20px; }
  }

  /* ── Small mobile (≤ 420px) ── */
  @media (max-width: 420px) {
    .sd-stats { grid-template-columns: 1fr; }
    .sd-stats .sd-stat:last-child { grid-column: auto; }
    .sd-topbar { padding: 10px 12px; }
    .sd-body   { padding: 12px 10px 60px; }
    .sd-subjects { grid-template-columns: 1fr; padding: 10px 10px 14px; }
    .sd-subj-img  { width: 110px; height: 130px; }
    .sd-mat-grid { padding: 10px 10px 14px; }
    .sd-rec-header { padding: 10px 12px; }
    .sd-rec-embed  { padding: 0 10px 12px; }
    .sd-subject-bar { padding: 10px 10px 0; }
  }

  /* ── Live class banner ── */
  .sd-live-section { margin-bottom: 22px; }
  .sd-live-title { font-size: 13px; font-weight: 700; color: #111; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .sd-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #27956b; animation: sd-pulse 1.4s ease-in-out infinite; flex-shrink: 0; }
  @keyframes sd-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(39,149,107,.5); } 50% { box-shadow: 0 0 0 6px rgba(39,149,107,0); } }
  .sd-live-card {
    background: linear-gradient(135deg, #1a2e24, #1e3a2c); border-radius: 14px;
    padding: 18px 22px; display: flex; align-items: center; gap: 16px;
    box-shadow: 0 4px 20px rgba(39,149,107,.2); margin-bottom: 10px;
  }
  .sd-live-ico { width: 46px; height: 46px; border-radius: 12px; background: rgba(39,149,107,.25); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .sd-live-subject { font-size: 15px; font-weight: 800; color: #000000; margin-bottom: 3px; }
  .sd-live-teacher { font-size: 12px; color: rgba(0, 0, 0, 0.5); }
  .sd-live-time { font-size: 11px; color: rgba(0, 0, 0, 0.4); margin-top: 4px; }
  .sd-join-btn {
    margin-left: auto; flex-shrink: 0; display: flex; align-items: center; gap: 8px;
    background: #27956b; color: #fff; border: none; border-radius: 10px;
    padding: 12px 20px; font-family: inherit; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: background .2s, transform .15s; text-decoration: none;
  }
  .sd-join-btn:hover { background: #1f7a58; transform: translateY(-1px); }
  @media (max-width: 768px) {
    .sd-live-card { flex-direction: column; align-items: flex-start; gap: 12px; }
    .sd-join-btn { margin-left: 0; width: 100%; justify-content: center; }
  }

  /* ── Logout confirm modal ── */
  .sd-confirm-bd {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .sd-confirm-box {
    background: #fff; border-radius: 16px; padding: 32px 28px 24px;
    max-width: 360px; width: 100%; box-shadow: 0 24px 60px rgba(0,0,0,.2);
    text-align: center;
  }
  .sd-confirm-icon {
    width: 52px; height: 52px; border-radius: 50%; background: #fff0f0;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  }
  .sd-confirm-title { font-size: 18px; font-weight: 700; color: #111; margin-bottom: 8px; }
  .sd-confirm-desc  { font-size: 14px; color: #666; line-height: 1.5; margin-bottom: 24px; }
  .sd-confirm-btns  { display: flex; gap: 10px; }
  .sd-confirm-btn-cancel {
    flex: 1; padding: 12px; border-radius: 10px; border: 1.5px solid #e5e7eb;
    background: #fff; font-size: 14px; font-weight: 600; color: #444; cursor: pointer;
    transition: background .15s;
  }
  .sd-confirm-btn-cancel:hover { background: #f5f5f5; }
  .sd-confirm-btn-logout {
    flex: 1; padding: 12px; border-radius: 10px; border: none;
    background: #ff3c2e; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer;
    transition: background .15s;
  }
  .sd-confirm-btn-logout:hover { background: #e03325; }
`;

/* ─── Icons ─── */
const IcoDash = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IcoRec = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/>
  </svg>
);
const IcoMat = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);
const IcoZoom = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/>
    <rect x="1" y="6" width="14" height="12" rx="2"/>
  </svg>
);
const IcoProfile = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

/* ─── Normalize selectedTeachers ─── */
// selectedTeachers may be stored as full objects {id,name,stream,subject}
// OR as plain ID strings — handle both formats transparently.
const getEnrolledIds = (raw) =>
  (raw || []).map(t => (typeof t === 'object' && t !== null ? t.id : t)).filter(Boolean);

/* ─── Main component ─── */
export default function StudentDashboard() {
  const [tab,       setTab]       = useState('dashboard');
  const [records,   setRecords]   = useState([]);
  const [materials, setMaterials] = useState([]);
  const [zoomLinks, setZoomLinks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
   * Enrollment filtering:
   * When a student session exists in localStorage (after login is added),
   * content is automatically filtered to enrolled subjects only.
   * Without a session, all content is shown.
   */
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Guard: redirect to /login if not authenticated.
  // Also re-fetches the student's registration document from Firestore on every
  // session to ensure selectedTeachers and other fields are always up to date,
  // not stale from a previous localStorage snapshot.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        localStorage.removeItem('slk_student');
        navigate('/login');
        return;
      }

      // 1. Hydrate from localStorage immediately for a fast first render.
      try {
        const stored = localStorage.getItem('slk_student');
        if (stored) setStudent(JSON.parse(stored));
      } catch {}

      // 2. Always re-fetch from Firestore so enrolment changes made by the
      //    admin (e.g. adding/removing subjects) are reflected without the
      //    student having to log out and back in.
      try {
        const snap = await getDocs(
          query(collection(db, 'registrations'), where('email', '==', user.email))
        );
        if (!snap.empty) {
          const freshData = { ...snap.docs[0].data(), docId: snap.docs[0].id };
          setStudent(freshData);
          localStorage.setItem('slk_student', JSON.stringify(freshData));
        }
      } catch (err) {
        // Non-fatal: localStorage copy is still usable as a fallback.
        console.error('Could not refresh student data from Firestore:', err);
      }
    });
    return unsub;
  }, [navigate]);

  // Intercept browser back button — show confirm instead of silently navigating away
  useEffect(() => {
    window.history.pushState({ dashboard_guard: true }, '');
    const onPopState = () => {
      window.history.pushState({ dashboard_guard: true }, '');
      setShowLogoutConfirm(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    localStorage.removeItem('slk_student');
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  // Build a set of the student's enrolled teacher IDs.
  // `records`, `materials`, and `zoomLinks` are already scoped to these IDs
  // by the Firestore queries above — this set is used only for UI helpers
  // (subject pills, teacher section headers, sidebar subject counts).
  const enrolledIds = new Set(getEnrolledIds(student?.selectedTeachers));

  // Fetch only the content that belongs to the student's enrolled subjects.
  // Re-runs whenever `student` changes (e.g. after the Firestore refresh above).
  // Uses Firestore `where('teacherId', 'in', [...])` so the database returns
  // only documents for the student's teachers — no client-side leakage.
  useEffect(() => {
    if (!student) return; // wait for auth to resolve

    const enrolled = getEnrolledIds(student.selectedTeachers);

    // Student has no enrolled subjects — clear everything and stop.
    if (!enrolled || enrolled.length === 0) {
      setRecords([]);
      setMaterials([]);
      setZoomLinks([]);
      return;
    }

    const set = new Set(enrolled);

    // Use simple orderBy-only queries (no compound where+orderBy) to avoid
    // requiring composite Firestore indexes. Filter client-side by teacherId.
    const unsub1 = onSnapshot(
      query(collection(db, 'records'), orderBy('uploadedAt', 'desc')),
      snap => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => set.has(d.teacherId))),
      () => {}
    );

    const unsub2 = onSnapshot(
      query(collection(db, 'materials'), orderBy('uploadedAt', 'desc')),
      snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => set.has(d.teacherId))),
      () => {}
    );

    const unsub3 = onSnapshot(
      collection(db, 'zoom_links'),
      snap => setZoomLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => set.has(d.teacherId))),
      () => {}
    );

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [student]);

  // `records` and `materials` are already scoped to the student's enrolled
  // teachers by the Firestore query — no client-side filter needed.
  const displayedRecords   = records;
  const displayedMaterials = materials;

  // Only show the subjects the student is actually enrolled in.
  // Falls back to an empty list if student data hasn't loaded yet.
  const teachersToShow = ALL_TEACHERS.filter(t => enrolledIds.has(t.id));

  const switchTab = (t) => { setTab(t); setSidebarOpen(false); };

  const now     = new Date();
  const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const pageTitle = tab === 'dashboard' ? 'Dashboard' : tab === 'recordings' ? 'Recordings' : tab === 'materials' ? 'Study Materials' : tab === 'zoom' ? 'Live Classes' : tab === 'payment' ? 'Monthly Payment' : 'My Profile';

  /* ── Dashboard tab ── */
  const renderDashboard = () => (
    <>
      {/* Live classes */}
      {(() => {
        // zoomLinks is already scoped to the student's enrolled teachers.
        const liveLinks = zoomLinks.filter(isLiveNow);
        if (!liveLinks.length) return null;
        return (
          <div className="sd-live-section">
            <div className="sd-live-title">
              <span className="sd-live-dot" />
              Live Classes Right Now
            </div>
            {liveLinks.map(z => (
              <div key={z.teacherId} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,.15)' }}>
                    {TEACHER_IMG[z.teacherId]
                      ? <img src={TEACHER_IMG[z.teacherId]} alt={z.teacherName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sd-live-subject">{z.teacherSubject}</div>
                    <div className="sd-live-teacher">{z.teacherName}</div>
                    {fmtSessionDate(z.sessionDate) && (
                      <div className="sd-live-time">{fmtSessionDate(z.sessionDate)}</div>
                    )}
                    <div className="sd-live-time">{z.days?.map(d => DAY_NAMES[d]).join(' · ')} &nbsp;·&nbsp; {z.startTime} – {z.endTime}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={z.zoomLink} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#0b5ccc', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>
                    Join Zoom Class
                  </a>
                  {z.youtubeLink && (
                    <a href={z.youtubeLink} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff0f0', color: '#cc2a1e', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1.5px solid #ffd0cc' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#cc2a1e"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                      Watch on YouTube Live
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="sd-stats">
        <div className="sd-stat">
          <div>
            <div className="sd-stat-lbl">Available Subjects</div>
            <div className="sd-stat-val">{teachersToShow.length}</div>
            <div className="sd-stat-sub">subjects</div>
          </div>
          <div className="sd-stat-ico green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2" strokeLinecap="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
        </div>
        <div className="sd-stat">
          <div>
            <div className="sd-stat-lbl">Class Recordings</div>
            <div className="sd-stat-val">{displayedRecords.length}</div>
            <div className="sd-stat-sub">videos available</div>
          </div>
          <div className="sd-stat-ico red">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ff3c2e">
              <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/>
            </svg>
          </div>
        </div>
        <div className="sd-stat">
          <div>
            <div className="sd-stat-lbl">Study Materials</div>
            <div className="sd-stat-val">{displayedMaterials.length}</div>
            <div className="sd-stat-sub">files available</div>
          </div>
          <div className="sd-stat-ico blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="sd-card">
        <div className="sd-card-hdr">
          <span className="sd-card-title">All Subjects</span>
          <span className="sd-card-badge">{teachersToShow.length} subjects</span>
        </div>
        <div className="sd-subjects">
          {teachersToShow.map(t => {
            const recCount = displayedRecords.filter(r => r.teacherId === t.id).length;
            const matCount = displayedMaterials.filter(m => m.teacherId === t.id).length;
            return (
              <div key={t.id} className="sd-subj-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/subject/' + t.id)}>
                <div className="sd-subj-img">
                  {TEACHER_IMG[t.id]
                    ? <img src={TEACHER_IMG[t.id]} alt={t.name} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: streamBg(t.stream) }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={streamColor(t.stream)} strokeWidth="1.5" strokeLinecap="round" opacity=".5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      </div>
                  }
                </div>
                <div className="sd-subj-body">
                  <div className="sd-subj-name">{t.subject}</div>
                  <div className="sd-subj-teacher">{t.name}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="sd-stream-pill" style={{ background: streamBg(t.stream), color: streamColor(t.stream) }}>{t.stream}</span>
                    {recCount > 0 && <span style={{ fontSize: 10.5, color: '#aaa', background: '#f5f5f5', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>{recCount} video{recCount !== 1 ? 's' : ''}</span>}
                    {matCount > 0 && <span style={{ fontSize: 10.5, color: '#aaa', background: '#f5f5f5', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>{matCount} file{matCount !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  /* ── Live Classes tab ── */
  const renderZoom = () => {
    const enrolledTeachers = ALL_TEACHERS.filter(t => enrolledIds.has(t.id));
    const myZoom = zoomLinks.filter(z => enrolledIds.has(z.teacherId));
    if (myZoom.length === 0) return (
      <div className="sd-card">
        <div className="sd-card-hdr"><span className="sd-card-title">Live Classes</span></div>
        <div className="sd-empty">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round">
            <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/>
          </svg>
          <p>No live class links have been added yet.</p>
        </div>
      </div>
    );
    const liveNow = myZoom.filter(isLiveNow);
    const scheduled = myZoom.filter(z => !isLiveNow(z));
    return (
      <>
        {liveNow.length > 0 && (
          <div className="sd-live-section" style={{ marginBottom: 22 }}>
            <div className="sd-live-title"><span className="sd-live-dot" />Live Now</div>
            {liveNow.map(z => {
              const t = enrolledTeachers.find(t => t.id === z.teacherId);
              return (
                <div key={z.teacherId} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
                  {/* Teacher info row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,.15)' }}>
                      {TEACHER_IMG[z.teacherId]
                        ? <img src={TEACHER_IMG[z.teacherId]} alt={z.teacherName || t?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg></div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sd-live-subject">{z.teacherSubject || t?.subject}</div>
                      <div className="sd-live-teacher">{z.teacherName || t?.name}</div>
                      {fmtSessionDate(z.sessionDate) && (
                        <div className="sd-live-time">{fmtSessionDate(z.sessionDate)}</div>
                      )}
                      <div className="sd-live-time">{z.days?.map(d => DAY_NAMES[d]).join(' · ')} · {z.startTime} – {z.endTime}</div>
                    </div>
                  </div>
                  {/* Link buttons — separate rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <a href={z.zoomLink} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#0b5ccc', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>
                      Join Zoom Class
                    </a>
                    {z.youtubeLink && (
                      <a href={z.youtubeLink} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff0f0', color: '#cc2a1e', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 700, textDecoration: 'none', border: '1.5px solid #ffd0cc' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#cc2a1e"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                        Watch on YouTube Live
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="sd-card">
          <div className="sd-card-hdr">
            <span className="sd-card-title">Class Schedule</span>
            <span className="sd-card-badge">{myZoom.length} class{myZoom.length !== 1 ? 'es' : ''}</span>
          </div>
          <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(scheduled.length > 0 ? scheduled : myZoom).map(z => {
              const t = enrolledTeachers.find(t => t.id === z.teacherId);
              const live = isLiveNow(z);
              return (
                <div key={z.teacherId} style={{ border: `1.5px solid ${live ? '#27956b' : '#eee'}`, borderRadius: 14, overflow: 'hidden', background: live ? 'rgba(39,149,107,.03)' : '#fff' }}>
                  {/* Teacher info row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', border: `2px solid ${live ? '#27956b' : '#eee'}` }}>
                      {TEACHER_IMG[z.teacherId]
                        ? <img src={TEACHER_IMG[z.teacherId]} alt={z.teacherName || t?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg></div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111', marginBottom: 2 }}>{z.teacherSubject || t?.subject}</div>
                      <div style={{ fontSize: 12, color: '#777' }}>{z.teacherName || t?.name}</div>
                      {fmtSessionDate(z.sessionDate) && (
                        <div style={{ fontSize: 11, color: '#2680c7', marginTop: 2, fontWeight: 600 }}>{fmtSessionDate(z.sessionDate)}</div>
                      )}
                      <div style={{ fontSize: 11.5, color: '#bbb', marginTop: 3 }}>{z.days?.map(d => DAY_NAMES[d]).join(', ')} · {z.startTime} – {z.endTime}</div>
                    </div>
                    {live && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#27956b', background: '#e8f8f0', padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>● LIVE</span>
                    )}
                  </div>
                  {/* Link buttons — separate full-width rows */}
                  <div style={{ borderTop: `1px solid ${live ? 'rgba(39,149,107,.15)' : '#f5f5f5'}`, display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <a href={z.zoomLink} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', textDecoration: 'none', borderBottom: z.youtubeLink ? `1px solid ${live ? 'rgba(39,149,107,.12)' : '#f5f5f5'}` : 'none', background: live ? 'rgba(39,149,107,.06)' : '#fafafa' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: live ? '#27956b' : '#e8f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={live ? '#fff' : '#2680c7'} strokeWidth="2.5"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: live ? '#27956b' : '#2680c7' }}>Join Zoom Class</div>
                        <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>zoom.us meeting</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </a>
                    {z.youtubeLink && (
                      <a href={z.youtubeLink} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', textDecoration: 'none', background: '#fafafa' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#cc2a1e"><path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.78 3 12 3 12 3s-2.78 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4C4.12 8.09 4 10 4 12s.12 3.91.41 5.31a4.83 4.83 0 0 0 3.4 3.4C9.22 21 12 21 12 21s2.78 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4C19.88 15.91 20 14 20 12s-.12-3.91-.41-5.31zM10 15.5v-7l6 3.5-6 3.5z"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cc2a1e' }}>Watch YouTube Live</div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 1 }}>youtube.com live stream</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <style>{css}</style>

      {/* ── Logout confirmation modal ── */}
      {showLogoutConfirm && (
        <div className="sd-confirm-bd">
          <div className="sd-confirm-box">
            <div className="sd-confirm-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div className="sd-confirm-title">Log Out?</div>
            <div className="sd-confirm-desc">Are you sure you want to log out of your student account?</div>
            <div className="sd-confirm-btns">
              <button className="sd-confirm-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Stay</button>
              <button className="sd-confirm-btn-logout" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}

      <div
        className="sd-root"
        onContextMenu={e => e.preventDefault()}
        onDragStart={e => e.preventDefault()}
      >

        {/* ── Mobile sidebar overlay ── */}
        <div className={`sd-sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <div className={`sd-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sd-brand">
            <img src="/AL.lk%20Logo.webp" alt="AL.LK" className="sd-brand-icon" />
            <div>
              <div className="sd-brand-title">Student Learning<br />Management System</div>
              <div className="sd-brand-sub">AL.LK</div>
            </div>
          </div>
          <div className="sd-nav">
            <div className="sd-nav-lbl">Main Menu</div>
            <button className={`sd-nav-btn${tab === 'dashboard'  ? ' on' : ''}`} onClick={() => switchTab('dashboard')}>
              <IcoDash /> Dashboard
            </button>
            <button className={`sd-nav-btn${tab === 'recordings' ? ' on' : ''}`} onClick={() => switchTab('recordings')}>
              <IcoRec /> Recordings
            </button>
            <button className={`sd-nav-btn${tab === 'materials'  ? ' on' : ''}`} onClick={() => switchTab('materials')}>
              <IcoMat /> Study Materials
            </button>
            <button className={`sd-nav-btn${tab === 'zoom' ? ' on' : ''}`} onClick={() => switchTab('zoom')}>
              <IcoZoom /> Live Classes
              {zoomLinks.filter(isLiveNow).length > 0 && (
                <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#27956b', flexShrink: 0, boxShadow: '0 0 0 2px rgba(39,149,107,.3)' }} />
              )}
            </button>
            <button className={`sd-nav-btn${tab === 'payment' ? ' on' : ''}`} onClick={() => switchTab('payment')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Monthly Payment
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 10px' }} />
            <div className="sd-nav-lbl">Account</div>
            <button className={`sd-nav-btn${tab === 'profile' ? ' on' : ''}`} onClick={() => switchTab('profile')}>
              <IcoProfile /> My Profile
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '8px 10px' }} />
            <button className="sd-nav-btn" onClick={() => navigate('/')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to Home
            </button>
          </div>
          <div className="sd-user">
            <div className="sd-user-av">
              {student?.photoURL
                ? <img src={student.photoURL} alt={student.studentName || 'Student'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                : (student?.studentName || 'S').charAt(0).toUpperCase()
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sd-user-name">{student?.studentName || 'Student'}</div>
              <div className="sd-user-role">{student?.studentId || 'Student'}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff3c2e'}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="sd-main">
          <div className="sd-topbar">
            <button className="sd-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
              <span /><span /><span />
            </button>
            <div className="sd-page-title">{pageTitle}</div>
            <div className="sd-topbar-right">
              <div className="sd-topbar-day">{dayStr}</div>
              <div className="sd-topbar-date">{dateStr}</div>
            </div>
          </div>
          <div className="sd-body">
            {tab === 'dashboard'  && renderDashboard()}
            {tab === 'recordings' && <StudentRecord student={student} />}
            {tab === 'materials'  && <StudentMaterials student={student} />}
            {tab === 'zoom'       && renderZoom()}
            {tab === 'profile'    && <StudentProfile />}
            {tab === 'payment'    && <MonthlyPayment embedded />}
          </div>
        </div>
      </div>

    </>
  );
}
