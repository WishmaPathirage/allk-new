import { useState, useMemo } from 'react';
import Teacher1 from '../../../assets/ACCOUNTING.webp';
import RegistrationModal from '../../../components/RegistrationModal';

const ALL_CLASSES = [
  { id: 1, title: "Accounting", batch: "2026 A/L Batch", grade: "2026 A/L Batch", time: "4:00 PM – 6:00 PM", days: ["Tuesday", "Friday"], location: "Sinhaya · Maharagama", pattern: "a" },
  { id: 2, title: "Accounting", batch: "2027 A/L Batch", grade: "2027 A/L Batch", time: "4:00 PM – 6:00 PM", days: ["Tuesday", "Friday"], location: "Sinhaya · Maharagama", pattern: "b" },
  { id: 3, title: "Accounting", batch: "2028 A/L Batch", grade: "2028 A/L Batch", time: "4:00 PM – 6:00 PM", days: ["Tuesday", "Friday"], location: "Sinhaya · Maharagama", pattern: "c" },

];

const GRADES = ["All Grades","2026 A/L","2027 A/L","2028 A/L",];
const DAYS   = ["All Days","Tuesday","Wednesday","Friday","Saturday"];
const TEACHER_INFO = { id: 'accounting', name: 'Prabhath Ariyasinghe', subject: 'Accounting', stream: 'Commerce' };

const VIDEOS = [
  { id: 'vVsqqg3PAA4', url: 'https://www.youtube.com/live/vVsqqg3PAA4?si=dYSIqLhBWklBPPYv', title: 'Free Accounting Class 01', duration: '1:34:20' },
  { id: 'S0yGSs6TdAk', url: 'https://youtu.be/S0yGSs6TdAk?si=UX3lq_SoQrr_FRZQ', title: 'Free Accounting Class 02', duration: '58:45' },
  { id: 'Og65iMta2v0', url: 'https://youtu.be/Og65iMta2v0?si=zB_prj4GOwub3VqR', title: 'Free Accounting Class 03', duration: '1:12:30' },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeDown  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer   { from{transform:translateX(-120%) skewX(-12deg)} to{transform:translateX(450%) skewX(-12deg)} }
  @keyframes cardIn    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pillWiggle{ 0%{transform:rotate(0)} 25%{transform:rotate(-4deg)} 75%{transform:rotate(4deg)} 100%{transform:rotate(0)} }
  @keyframes avatarBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes btnPulse  { 0%{box-shadow:0 0 0 0 rgba(255,60,46,.45)} 70%{box-shadow:0 0 0 12px rgba(255,60,46,0)} 100%{box-shadow:0 0 0 0 rgba(255,60,46,0)} }
  @keyframes ripple    { to{transform:scale(4);opacity:0} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .tp {
    min-height:100vh;
    background:#f6f5f3;
    font-family:'DM Sans',sans-serif;
    color:#111;
  }

  /* ══ HERO ══ */
  .tp-hero {
    background:#fff;
    border-bottom:1px solid #ebebeb;
  }

  .tp-breadcrumb {
    max-width:1100px; margin:0 auto;
    padding:20px 44px 0;
    display:flex; align-items:center; gap:8px;
    font-size:13px; font-weight:500; color:#bbb;
    animation:fadeDown .35s ease both;
  }
  .tp-breadcrumb a {
    color:#bbb; text-decoration:none;
    transition:color .2s, letter-spacing .2s;
  }
  .tp-breadcrumb a:hover { color:#ff3c2e; letter-spacing:.02em; }
  .tp-breadcrumb-sep { color:#ddd; }
  .tp-breadcrumb-cur { color:#666; font-weight:600; }

  /* ── Full-width hero layout ── */
  .tp-hero-inner {
    max-width:1100px; margin:0 auto;
    padding:36px 44px 48px;
    display:flex;
    flex-direction:column;
    gap:0;
    animation:fadeUp .5s ease .1s both;
  }

  .tp-hero-top {
    display:flex;
    align-items:flex-start;
    gap:32px;
    margin-bottom:28px;
  }

  /* ── AVATAR ── */
  .tp-avatar-wrap { flex-shrink:0; cursor:pointer; }
  .tp-avatar {
    width:120px; height:120px; border-radius:50%;
    object-fit:cover; object-position:top center;
    display:block;
    border:4px solid #fff;
    box-shadow:0 0 0 3px #ff3c2e, 0 8px 28px rgba(0,0,0,0.12);
    transition:transform .45s cubic-bezier(.22,1,.36,1), box-shadow .35s;
  }
  .tp-avatar-wrap:hover .tp-avatar {
    transform:scale(1.08);
    box-shadow:0 0 0 4px #ff3c2e, 0 16px 36px rgba(255,60,46,0.28);
    animation:avatarBob 1.2s ease-in-out infinite;
  }

  /* ── IDENTITY ── */
  .tp-identity { flex:1; }
  .tp-name {
    font-family:'DM Serif Display',serif;
    font-size:clamp(26px,3.5vw,40px);
    color:#111; line-height:1.1; margin-bottom:12px;
    display:inline-block;
    transition:color .25s;
    cursor:default;
  }
  .tp-name:hover { color:#ff3c2e; }

  .tp-subject-pill {
    display:inline-flex; align-items:center; gap:7px;
    background:#fff5f5; border:1.5px solid #ffd0cd;
    color:#ff3c2e;
    font-size:12px; font-weight:700; letter-spacing:.1em;
    text-transform:uppercase;
    padding:6px 16px; border-radius:99px;
    margin-bottom:16px;
    cursor:pointer;
    transition:background .25s, color .25s, transform .25s, box-shadow .25s;
  }
  .tp-subject-pill:hover {
    background:#ff3c2e; color:#fff;
    box-shadow:0 6px 18px rgba(255,60,46,0.35);
    animation:pillWiggle .4s ease;
  }
  .tp-subject-pill-dot {
    width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.6;
  }

  .tp-degree {
    display:inline-flex; align-items:center; gap:8px;
    background:#fafafa; border:1.5px solid #eee;
    color:#777; font-size:13.5px;
    padding:8px 16px; border-radius:10px;
    cursor:default;
    transition:border-color .25s, color .25s, background .25s, transform .25s;
  }
  .tp-degree:hover {
    border-color:#ff3c2e; color:#111;
    background:#fff5f5; transform:translateX(4px);
  }

  /* ── FULL-WIDTH ABOUT ── */
  .tp-about {
    background:#fff;
    border:1.5px solid #eee;
    border-left:4px solid #ff3c2e;
    border-radius:14px;
    padding:24px 28px;
    width:100%;
    transition:box-shadow .35s, transform .35s cubic-bezier(.22,1,.36,1);
    cursor:default;
  }
  .tp-about:hover {
    box-shadow:0 10px 36px rgba(255,60,46,0.1);
    transform:translateY(-3px);
  }
  .tp-about-label {
    font-size:10px; font-weight:700; letter-spacing:.26em;
    text-transform:uppercase; color:#ff3c2e; margin-bottom:10px;
  }
  .tp-about-text {
    font-size:14.5px; line-height:1.9; color:#666;
    max-width:none;
  }

  /* ══ STATS ROW ══ */
  .tp-stats {
    display:flex; gap:0;
    border:1.5px solid #eee;
    border-radius:14px;
    overflow:hidden;
    background:#fff;
    margin-top:20px;
    width:100%;
  }
  .tp-stat {
    flex:1; padding:18px 24px;
    border-right:1px solid #eee;
    cursor:default;
    transition:background .25s, transform .2s;
    position:relative; overflow:hidden;
  }
  .tp-stat:last-child { border-right:none; }
  .tp-stat::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,#fff5f5,transparent);
    opacity:0; transition:opacity .3s;
  }
  .tp-stat:hover::before { opacity:1; }
  .tp-stat:hover { transform:translateY(-2px); }
  .tp-stat-val {
    font-family:'DM Serif Display',serif;
    font-size:26px; color:#ff3c2e; display:block; line-height:1;
    margin-bottom:4px;
  }
  .tp-stat-lbl { font-size:12px; color:#aaa; font-weight:500; }

  /* ══ TABS ══ */
  .tp-tabs {
    background:#fff; border-bottom:1px solid #eee;
    position:sticky; top:0; z-index:20;
    box-shadow:0 2px 12px rgba(0,0,0,0.04);
  }
  .tp-tabs-inner {
    max-width:1100px; margin:0 auto;
    padding:0 44px; display:flex;
  }
  .tp-tab {
    font-family:'DM Sans',sans-serif;
    font-size:14px; font-weight:600;
    color:#bbb; padding:18px 22px;
    background:none; border:none;
    border-bottom:3px solid transparent;
    cursor:pointer; letter-spacing:.02em;
    display:flex; align-items:center; gap:7px;
    transition:color .2s, border-color .2s, transform .2s;
  }
  .tp-tab:hover { color:#ff3c2e; transform:translateY(-1px); }
  .tp-tab.active { color:#ff3c2e; border-bottom-color:#ff3c2e; }
  .tp-tab-badge {
    width:20px; height:20px; border-radius:99px;
    background:#ff3c2e; color:#fff;
    font-size:10px; font-weight:700;
    display:inline-flex; align-items:center; justify-content:center;
    transition:transform .25s cubic-bezier(.22,1,.36,1);
  }
  .tp-tab:hover .tp-tab-badge { transform:scale(1.2) rotate(-10deg); }

  /* ══ BODY ══ */
  .tp-body {
    max-width:1100px; margin:0 auto;
    padding:36px 44px 80px;
  }

  .tp-toolbar {
    display:flex; align-items:center; gap:12px;
    margin-bottom:28px; flex-wrap:wrap;
    animation:fadeUp .4s ease .15s both;
  }

  .tp-search-wrap { position:relative; flex:1; min-width:200px; max-width:360px; }
  .tp-search {
    width:100%;
    font-family:'DM Sans',sans-serif;
    font-size:14px; color:#333;
    background:#fff; border:1.5px solid #eee;
    border-radius:12px;
    padding:12px 46px 12px 16px;
    outline:none;
    transition:border-color .25s, box-shadow .25s;
  }
  .tp-search::placeholder { color:#ccc; }
  .tp-search:focus { border-color:#ff3c2e; box-shadow:0 0 0 4px rgba(255,60,46,.07); }

  .tp-search-btn {
    position:absolute; right:9px; top:50%; transform:translateY(-50%);
    width:32px; height:32px; border-radius:9px;
    background:#ff3c2e; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    color:#fff;
    transition:background .2s, transform .25s cubic-bezier(.22,1,.36,1);
  }
  .tp-search-btn:hover { background:#111; transform:translateY(-50%) rotate(15deg) scale(1.1); }

  .tp-select {
    font-family:'DM Sans',sans-serif;
    font-size:13.5px; font-weight:600; color:#555;
    background:#fff; border:1.5px solid #eee;
    border-radius:12px;
    padding:12px 38px 12px 15px;
    outline:none; cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 13px center;
    transition:border-color .2s, box-shadow .2s, transform .2s;
  }
  .tp-select:hover { transform:translateY(-1px); }
  .tp-select:focus { border-color:#ff3c2e; box-shadow:0 0 0 4px rgba(255,60,46,.07); }
  .tp-select.on { border-color:#ff3c2e; color:#ff3c2e; }

  .tp-clear {
    font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:600;
    color:#ff3c2e; background:#fff5f5;
    border:1.5px solid #ffd0cd;
    border-radius:10px; padding:11px 16px;
    cursor:pointer;
    transition:background .2s, color .2s, transform .25s cubic-bezier(.22,1,.36,1);
  }
  .tp-clear:hover { background:#ff3c2e; color:#fff; transform:scale(1.05); }

  .tp-count {
    margin-left:auto;
    font-size:13px; font-weight:500; color:#bbb;
  }
  .tp-count strong { color:#ff3c2e; }

  /* ══ CARDS ══ */
  .tp-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(300px,1fr));
    gap:20px;
  }

  .tp-card {
    background:#fff;
    border-radius:20px;
    border:1.5px solid #eee;
    overflow:hidden;
    cursor:pointer;
    animation:cardIn .5s cubic-bezier(.22,1,.36,1) both;
    transition:transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s, border-color .25s;
    display:flex; flex-direction:column;
  }
  .tp-card:hover {
    transform:translateY(-6px);
    box-shadow:0 20px 48px rgba(255,60,46,.11), 0 4px 14px rgba(0,0,0,.06);
    border-color:#ff3c2e;
  }

  /* top accent bar — thin red line only */
  .tp-card-accent {
    height:4px;
    background:#ff3c2e;
    flex-shrink:0;
    transition:height .25s;
  }
  .tp-card:hover .tp-card-accent { height:5px; }

  /* card inner padding */
  .tp-card-inner { padding:24px 24px 22px; flex:1; display:flex; flex-direction:column; }

  /* top row: grade badge + number */
  .tp-card-top {
    display:flex; align-items:center; justify-content:space-between;
    margin-bottom:16px;
  }
  .tp-card-grade {
    display:inline-flex; align-items:center; gap:6px;
    font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
    color:#444; background:#f2f2f2;
    border:1.5px solid #e8e8e8;
    border-radius:99px; padding:4px 12px;
    transition:background .2s, color .2s, border-color .2s;
  }
  .tp-card-grade::before {
    content:''; width:6px; height:6px; border-radius:50%;
    background:#ff3c2e; flex-shrink:0;
  }
  .tp-card:hover .tp-card-grade { background:#111; color:#fff; border-color:#111; }
  .tp-card:hover .tp-card-grade::before { background:#fff; }

  .tp-card-num {
    font-size:11px; font-weight:600; color:#ddd; letter-spacing:.06em;
  }

  /* title */
  .tp-card-title {
    font-family:'DM Serif Display',serif;
    font-size:21px; color:#111; line-height:1.25;
    margin-bottom:20px; flex:1;
    transition:color .25s;
  }
  .tp-card:hover .tp-card-title { color:#111; }

  /* time row */
  .tp-card-time {
    display:flex; align-items:center; gap:8px;
    font-size:13px; color:#666; font-weight:500;
    background:#f7f7f7; border:1px solid #efefef;
    border-radius:10px; padding:10px 14px;
    margin-bottom:12px;
    transition:border-color .2s, background .2s;
  }
  .tp-card:hover .tp-card-time { border-color:#ddd; background:#f2f2f2; }

  /* days row */
  .tp-card-days { display:flex; align-items:center; gap:7px; margin-bottom:20px; flex-wrap:wrap; }
  .tp-day-pill {
    font-size:11.5px; font-weight:700; letter-spacing:.04em;
    background:#f2f2f2; color:#555;
    border:1.5px solid #e8e8e8;
    border-radius:8px; padding:4px 12px;
    transition:background .2s, color .2s, transform .2s, border-color .2s;
  }
  .tp-card:hover .tp-day-pill { background:#111; color:#fff; border-color:#111; transform:translateY(-1px); }

  /* ══ REGISTER BUTTON — spreads from centre outward ══ */
  .tp-reg-btn {
    width:100%;
    font-family:'DM Sans',sans-serif;
    font-size:13.5px; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:#fff;
    background:#ff3c2e;
    border:2px solid #ff3c2e; border-radius:12px;
    padding:14px 20px; cursor:pointer;
    position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:color .38s ease, transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
    box-shadow:0 4px 16px rgba(255,60,46,.28);
  }
  /* single panel — collapses to centre, expands to both sides on hover */
  .tp-reg-btn::before {
    content:'';
    position:absolute; inset:0;
    background:#fff;
    transform:scaleX(0);
    transform-origin:center;
    transition:transform .42s cubic-bezier(.77,0,.175,1);
    z-index:0;
  }
  .tp-reg-btn:hover::before { transform:scaleX(1); }
  /* keep text above the panel */
  .tp-reg-btn > * { position:relative; z-index:1; }
  .tp-reg-btn:hover {
    color:#ff3c2e;
    transform:translateY(-3px) scale(1.02);
    box-shadow:0 10px 28px rgba(255,60,46,.22);
  }
  .tp-reg-btn:active { transform:translateY(-1px) scale(.99); }

  .tp-reg-btn-icon {
    width:18px; height:18px; border-radius:50%;
    background:rgba(255,255,255,.22);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0;
    transition:transform .3s cubic-bezier(.22,1,.36,1), background .25s;
  }
  .tp-reg-btn:hover .tp-reg-btn-icon {
    transform:translateX(4px);
    background:rgba(255,60,46,.1);
  }

  /* ripple */
  .tp-ripple {
    position:absolute; border-radius:50%;
    background:rgba(255,255,255,.35);
    transform:scale(0);
    animation:ripple .6s linear;
    pointer-events:none;
  }

  .tp-empty {
    grid-column:1/-1; text-align:center; padding:80px 0; color:#ccc;
  }
  .tp-empty p { font-size:15px; margin-top:12px; }
  .tp-empty-clear {
    margin-top:16px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
    color:#ff3c2e; background:#fff5f5; border:1.5px solid #ffd0cd;
    border-radius:10px; padding:10px 20px; cursor:pointer;
    transition:background .2s, color .2s, transform .2s;
  }
  .tp-empty-clear:hover { background:#ff3c2e; color:#fff; transform:scale(1.04); }

  .tp-videos-empty { text-align:center; padding:100px 0; color:#ccc; }
  .tp-videos-empty p { font-size:15px; margin-top:14px; }

  /* ── VIDEO CARDS ── */
  .tp-vid-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;animation:cardIn .5s cubic-bezier(.22,1,.36,1) both}
  .tp-vid-card{border-radius:18px;overflow:hidden;cursor:pointer;background:#fafafa;border:1.5px solid #efefef;display:flex;flex-direction:column;text-decoration:none;color:inherit;transition:box-shadow .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1),border-color .3s}
  .tp-vid-card:hover{box-shadow:0 24px 56px rgba(255,60,46,.16),0 0 0 1.5px rgba(255,60,46,.28);transform:translateY(-8px);border-color:rgba(255,60,46,.3)}
  .tp-vid-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;flex-shrink:0;background:#111}
  .tp-vid-thumb img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block;transition:transform .7s cubic-bezier(.22,1,.36,1),filter .45s;filter:brightness(.92)}
  .tp-vid-card:hover .tp-vid-thumb img{transform:scale(1.08);filter:brightness(.45) saturate(.8)}
  .tp-vid-thumb-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.6) 0%,transparent 55%);z-index:2;transition:opacity .35s}
  .tp-vid-card:hover .tp-vid-thumb-grad{opacity:0}
  .tp-vid-play{position:absolute;top:50%;left:50%;z-index:5;transform:translate(-50%,-50%) scale(.45) rotate(-15deg);opacity:0;width:56px;height:56px;border-radius:50%;background:#ff3c2e;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 16px rgba(255,60,46,.14),0 14px 36px rgba(255,60,46,.55);transition:transform .42s cubic-bezier(.22,1,.36,1),opacity .3s}
  .tp-vid-play::before{content:'';position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,.22),transparent 60%)}
  .tp-vid-card:hover .tp-vid-play{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0deg)}
  .tp-vid-footer{position:absolute;bottom:0;left:0;right:0;z-index:4;display:flex;align-items:center;justify-content:flex-end;padding:8px 12px}
  .tp-vid-dur-pill{font-size:10px;font-weight:600;color:rgba(255,255,255,.9);background:rgba(0,0,0,.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.1);border-radius:5px;padding:3px 8px;transition:background .3s}
  .tp-vid-card:hover .tp-vid-dur-pill{background:rgba(255,60,46,.82)}
  .tp-vid-body{padding:16px 18px 20px;flex:1;display:flex;flex-direction:column;background:#fff}
  .tp-vid-title{font-family:'DM Serif Display',serif;font-size:15px;font-weight:400;color:#111;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;transition:color .28s}
  .tp-vid-card:hover .tp-vid-title{color:#ff3c2e}

  @media (max-width:768px) {
    .tp-hero-inner { padding:24px 20px 32px; }
    .tp-breadcrumb,.tp-tabs-inner,.tp-body { padding-left:20px; padding-right:20px; }
    .tp-hero-top { gap:20px; }
    .tp-stats { flex-wrap:wrap; }
    .tp-stat { min-width:50%; }
    .tp-toolbar { gap:10px; }
    .tp-count { width:100%; margin-left:0; }
  }
  @media (max-width:480px) {
    .tp-hero-top { flex-direction:column; }
    .tp-avatar { width:90px; height:90px; }
  }
`;

function VideoCard({ video }) {
  return (
    <a className="tp-vid-card" href={video.url} target="_blank" rel="noopener noreferrer">
      <div className="tp-vid-thumb">
        <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} alt={video.title} />
        <div className="tp-vid-thumb-grad" />
        <div className="tp-vid-play">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{marginLeft:'4px',position:'relative',zIndex:1}}><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div className="tp-vid-footer">
          <span className="tp-vid-dur-pill">{video.duration}</span>
        </div>
      </div>
      <div className="tp-vid-body">
        <div className="tp-vid-title">{video.title}</div>
      </div>
    </a>
  );
}

function ClassCard({ cls, index, onRegister, teacherInfo }) {
  const handleRipple = (e) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
    ripple.className = 'tp-ripple';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  };

  return (
    <div className="tp-card" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
      <div className="tp-card-accent" />
      <div className="tp-card-inner">
        <div className="tp-card-top">
          <span className="tp-card-grade">{cls.grade}</span>
          <span className="tp-card-num">#{String(index + 1).padStart(2, '0')}</span>
        </div>

        <p className="tp-card-title">{cls.title}</p>

        <div className="tp-card-time">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          {cls.time}
        </div>

        <div className="tp-card-days">
          {cls.days.map(d => <span key={d} className="tp-day-pill">{d}</span>)}
        </div>

        <button className="tp-reg-btn" onClick={(e) => { handleRipple(e); onRegister({ ...cls, teacher: teacherInfo }); }}>
          <span>Register Now</span>
          <span className="tp-reg-btn-icon">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </button>
      </div>
    </div>
  );
}

export default function TeacherProfilePage() {
  const [tab, setTab]       = useState('timetable');
  const [search, setSearch] = useState('');
  const [grade, setGrade]   = useState('All Grades');
  const [day, setDay]       = useState('All Days');
  const [regModal, setRegModal] = useState(null);

  const filtered = useMemo(() => ALL_CLASSES.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) &&
    (grade === 'All Grades' || c.grade === grade) &&
    (day   === 'All Days'   || c.days.includes(day))
  ), [search, grade, day]);

  const isFiltered = search || grade !== 'All Grades' || day !== 'All Days';
  const clear = () => { setSearch(''); setGrade('All Grades'); setDay('All Days'); };

  return (
    <div className="tp">
      <style>{css}</style>

      <div className="tp-hero">
        <nav className="tp-breadcrumb">
          <a href="/">Home</a>
          <span className="tp-breadcrumb-sep">›</span>
          <span className="tp-breadcrumb-cur">Prabhath Ariyasinghe</span>
        </nav>

        <div className="tp-hero-inner">
          {/* top row: avatar + identity */}
          <div className="tp-hero-top">
            <div className="tp-avatar-wrap">
              <img src={Teacher1} alt="Prabhath" className="tp-avatar" />
            </div>

            <div className="tp-identity">
              <h1 className="tp-name">Prabhath Ariyasinghe</h1>
              <div style={{ marginBottom: 16 }}>
                <span className="tp-subject-pill">
                  <span className="tp-subject-pill-dot" />
                  A/L Accounting
                </span>
              </div>
              <span className="tp-degree">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                Bachelor of Commerce  · University of Sri Jayewardenepura
              </span>
            </div>
          </div>

          {/* full-width about block */}
          <div className="tp-about">
            <p className="tp-about-label">About</p>
            <p className="tp-about-text">
              ශ්‍රී ජයවර්ධනපුර විශ්ව විද්‍යාලයේ උපාධිධාරියෙකි.
වසර 14 ක පළපුරුද්ද සහිත ගුරුවරයෙකි.
            </p>
          </div>

        </div>
      </div>

      <div className="tp-tabs">
        <div className="tp-tabs-inner">
          <button className={`tp-tab${tab === 'timetable' ? ' active' : ''}`} onClick={() => setTab('timetable')}>
            Time Table <span className="tp-tab-badge">{ALL_CLASSES.length}</span>
          </button>
          <button className={`tp-tab${tab === 'videos' ? ' active' : ''}`} onClick={() => setTab('videos')}>
            Videos <span className="tp-tab-badge">{VIDEOS.length}</span>
          </button>
        </div>
      </div>

      <div className="tp-body">
        {tab === 'timetable' && (
          <>
            <div className="tp-toolbar">
              <div className="tp-search-wrap">
                <input className="tp-search" placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} />
                <button className="tp-search-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </div>
              <select className={`tp-select${grade !== 'All Grades' ? ' on' : ''}`} value={grade} onChange={e => setGrade(e.target.value)}>
                {GRADES.map(g => <option key={g}>{g}</option>)}
              </select>
              <select className={`tp-select${day !== 'All Days' ? ' on' : ''}`} value={day} onChange={e => setDay(e.target.value)}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
              {isFiltered && <button className="tp-clear" onClick={clear}>Clear</button>}
              <span className="tp-count"><strong>{filtered.length}</strong> of {ALL_CLASSES.length} classes</span>
            </div>

            <div className="tp-grid">
              {filtered.length > 0
                ? filtered.map((c, i) => <ClassCard key={c.id} cls={c} index={i} onRegister={setRegModal} teacherInfo={TEACHER_INFO} />)
                : (
                  <div className="tp-empty">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <p>No classes match your filters</p>
                    <button className="tp-empty-clear" onClick={clear}>Clear Filters</button>
                  </div>
                )}
            </div>
          </>
        )}
        {tab === 'videos' && (
          <div className="tp-vid-grid">
            {VIDEOS.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </div>
      {regModal && <RegistrationModal classInfo={regModal} onClose={() => setRegModal(null)} />}
    </div>
  );
}