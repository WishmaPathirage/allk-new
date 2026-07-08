import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import ET from '../../assets/ET.webp';
import SFT from '../../assets/SFT.webp';
import ICT from '../../assets/ICT.webp';
import ACCOUNTING from '../../assets/ACCOUNTING.webp';
import BS from '../../assets/BS.webp';
import ECON from '../../assets/ECON.webp';
import MEDIA from '../../assets/MEDIA.webp';
import POLITICAL from '../../assets/POLITICAL.webp';
import GEOGRAPHY from '../../assets/GEOGRAPHY.webp'
import SINHALA from '../../assets/SINHALA.webp'


const teachers = [
  { name: "Mr. Sandeepa Kathriarachchi", subject: "ET",               image: ET,         route: "/teacher/et"         },
  { name: "Mr. Shanaka Ranathunga",      subject: "SFT",              image: SFT,        route: "/teacher/sft"        },
  { name: "Mr. Ranishan Dissanayake",    subject: "ICT",              image: ICT,        route: "/teacher/ict"        },
  { name: "Mr. Kasun Weligama",          subject: "Business Studies", image: BS,         route: "/teacher/bs"         },
  { name: "Mr. Harsha Amarakon",         subject: "Econ",             image: ECON,       route: "/teacher/econ"       },
  { name: "Mr. Prabhath Ariyasinghe",    subject: "Accounting",       image: ACCOUNTING, route: "/teacher/accounting" },
  { name: "Mr. Praveen Kumarage",        subject: "Media",            image: MEDIA,      route: "/teacher/media"      },
  { name: "Mr. Amila Nishan Pitiduwa",   subject: "Political Science",image: POLITICAL,  route: "/teacher/political"  },
  { name: "Mr. Sameera Ekanayake",       subject: "Geography",        image: GEOGRAPHY,  route: "/teacher/geo"        },
  { name: "Mr. Pathum Sandanuwan",       subject: "Sinhala",          image: SINHALA,    route: "/teacher/sinhala"    },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

  @keyframes tp-pulseDot {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.7); opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shine {
    0%   { left: -80%; opacity: 0; }
    15%  { opacity: 1; }
    100% { left: 130%; opacity: 0; }
  }

  /* BG ANIMATIONS */
  @keyframes driftA {
    0%,100% { transform: translate(0px,   0px)  scale(1);    }
    33%      { transform: translate(60px, -45px) scale(1.08); }
    66%      { transform: translate(-40px, 30px) scale(0.95); }
  }
  @keyframes driftB {
    0%,100% { transform: translate(0px,   0px)  scale(1);    }
    33%      { transform: translate(-50px, 40px) scale(1.05); }
    66%      { transform: translate(45px, -30px) scale(0.97); }
  }
  @keyframes driftC {
    0%,100% { transform: translate(0px,   0px)  scale(1);    }
    50%      { transform: translate(30px, -55px) scale(1.1);  }
  }
  @keyframes rotateSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes rotateReverse {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes floatLine {
    0%,100% { transform: translateY(0px)   rotate(var(--r)); opacity: var(--op); }
    50%      { transform: translateY(-22px) rotate(var(--r)); opacity: calc(var(--op) * 0.4); }
  }
  @keyframes pulseDot {
    0%,100% { transform: scale(1);   opacity: 0.55; }
    50%      { transform: scale(1.5); opacity: 1; }
  }
  @keyframes morphBlob {
    0%,100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
    33%      { border-radius: 40% 60% 45% 55% / 60% 40% 60% 40%; }
    66%      { border-radius: 55% 45% 60% 40% / 40% 55% 45% 60%; }
  }
  @keyframes scanLine {
    0%   { top: -4px; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .tp-page {
    min-height: 100vh;
    background: #fff;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* ── BG LAYER ── */
  .tp-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  /* big soft orbs */
  .tp-orb-1 {
    position: absolute;
    width: 800px; height: 800px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.13) 0%, transparent 65%);
    top: -250px; right: -220px;
    animation: driftA 18s ease-in-out infinite;
  }
  .tp-orb-2 {
    position: absolute;
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.09) 0%, transparent 65%);
    bottom: -180px; left: -150px;
    animation: driftB 24s ease-in-out infinite;
  }
  .tp-orb-3 {
    position: absolute;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.08) 0%, transparent 65%);
    top: 38%; left: 32%;
    animation: driftC 16s ease-in-out infinite;
  }

  /* morphing blobs */
  .tp-blob-1 {
    position: absolute;
    width: 260px; height: 260px;
    background: rgba(255,60,46,0.06);
    top: 20%; left: 8%;
    animation: morphBlob 12s ease-in-out infinite, driftA 20s ease-in-out infinite 4s;
    filter: blur(1px);
  }
  .tp-blob-2 {
    position: absolute;
    width: 180px; height: 180px;
    background: rgba(255,60,46,0.07);
    bottom: 25%; right: 7%;
    animation: morphBlob 9s ease-in-out infinite reverse, driftB 17s ease-in-out infinite 2s;
    filter: blur(1px);
  }

  /* rotating rings */
  .tp-ring-1 {
    position: absolute;
    width: 480px; height: 480px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.12);
    top: -100px; left: -100px;
    animation: rotateSlow 35s linear infinite;
  }
  .tp-ring-1::after {
    content: '';
    position: absolute; inset: 50px; border-radius: 50%;
    border: 1px solid rgba(255,60,46,0.08);
  }
  .tp-ring-2 {
    position: absolute;
    width: 360px; height: 360px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.1);
    bottom: 5%; right: -80px;
    animation: rotateReverse 28s linear infinite;
  }
  .tp-ring-2::after {
    content: '';
    position: absolute; inset: 40px; border-radius: 50%;
    border: 1px solid rgba(255,60,46,0.07);
  }
  /* small ring mid page */
  .tp-ring-3 {
    position: absolute;
    width: 200px; height: 200px; border-radius: 50%;
    border: 1px dashed rgba(255,60,46,0.14);
    top: 55%; left: 65%;
    animation: rotateSlow 22s linear infinite;
  }

  /* diagonal lines */
  .tp-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.2), transparent);
    transform-origin: left center;
    animation: floatLine var(--dur) ease-in-out infinite var(--delay);
  }

  /* dot grids */
  .tp-dots {
    position: absolute;
    background-image: radial-gradient(circle, rgba(255,60,46,0.18) 1.5px, transparent 1.5px);
    background-size: 24px 24px;
  }
  .tp-dots-1 {
    width: 240px; height: 240px;
    top: 6%; right: 4%;
    animation: driftA 22s ease-in-out infinite 1s;
  }
  .tp-dots-2 {
    width: 180px; height: 180px;
    bottom: 12%; left: 4%;
    animation: driftB 19s ease-in-out infinite 3s;
  }
  .tp-dots-3 {
    width: 140px; height: 140px;
    top: 45%; left: 55%;
    opacity: 0.7;
    animation: driftC 14s ease-in-out infinite 5s;
  }

  /* pulsing corner dots */
  .tp-pulse-dot {
    position: absolute;
    width: 8px; height: 8px; border-radius: 50%;
    background: #ff3c2e;
  }
  .tp-pulse-dot::after {
    content: '';
    position: absolute; inset: -8px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.3);
    animation: pulseDot 2.5s ease-in-out infinite;
  }
  .tp-pd-1 { top: 22%; left: 18%; animation: pulseDot 2.5s ease-in-out infinite; }
  .tp-pd-2 { top: 60%; right: 20%; animation: pulseDot 2.5s ease-in-out infinite 0.8s; }
  .tp-pd-3 { top: 80%; left: 45%; animation: pulseDot 2.5s ease-in-out infinite 1.5s; }

  /* scan line */
  .tp-scan {
    position: absolute; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.15), transparent);
    animation: scanLine 8s ease-in-out infinite;
  }
  .tp-scan-2 {
    position: absolute; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.1), transparent);
    animation: scanLine 12s ease-in-out infinite 4s;
  }

  /* ── CONTENT ── */
  .tp-content { position: relative; z-index: 1; }

  .tp-header {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 122px 48px 44px;
    border-bottom: 1px solid rgba(232,232,232,0.9);
    text-align: center;
  }
  .tp-header-inner { max-width: 1240px; margin: 0 auto; }
  .tp-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,60,46,0.08);
    border: 1px solid rgba(255,60,46,0.18);
    border-radius: 999px;
    padding: 6px 16px;
    margin-bottom: 18px;
  }
  .tp-eyebrow-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #ff3c2e;
    animation: tp-pulseDot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .tp-eyebrow-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #ff3c2e;
  }
  .tp-header h1 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    font-weight: 400;
    color: #111; line-height: 1.1;
    margin-bottom: 12px;
  }
  .tp-header h1 em { font-style: normal; color: #ff3c2e; }
  .tp-header p { font-size: 14px; color: #999; max-width: 420px; line-height: 1.6; margin: 0 auto; }

  .tp-filter {
    max-width: 1240px; margin: 0 auto;
    padding: 32px 48px 0;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .tp-filter-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: #bbb; margin-right: 6px;
  }
  .tp-chip {
    font-family: 'Inter', sans-serif;
    font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
    padding: 6px 15px; border-radius: 50px;
    border: 1.5px solid #e0e0e0;
    background: rgba(255,255,255,0.8); color: #666;
    cursor: pointer; transition: all 0.2s ease;
  }
  .tp-chip:hover { border-color: #ff3c2e; color: #ff3c2e; }
  .tp-chip.active { background: #ff3c2e; border-color: #ff3c2e; color: #fff; }

  .tp-stream-icon {
    display: inline-block;
    margin-right: 5px;
    font-size: 12px;
  }

  .tp-grid {
    max-width: 1240px; margin: 0 auto;
    padding: 32px 48px 100px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
    gap: 22px;
  }

  .tp-card {
    position: relative; border-radius: 14px; overflow: hidden;
    background: #111; height: 380px; cursor: pointer;
    animation: fadeUp 0.5s ease both;
    transition: transform 0.4s cubic-bezier(.22,1,.36,1), box-shadow 0.4s ease;
  }
  .tp-card:hover { transform: translateY(-8px); box-shadow: 0 28px 56px rgba(0,0,0,0.28); }

  .tp-photo {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; object-position: top center;
    transition: transform 0.6s cubic-bezier(.22,1,.36,1), filter 0.4s ease;
  }
  .tp-card:hover .tp-photo { transform: scale(1.06); filter: brightness(0.55); }

  .tp-fallback {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, #2a0a08, #8a1a10);
    display: flex; align-items: center; justify-content: center;
    font-size: 72px; font-weight: 800; color: rgba(255,255,255,0.08);
    transition: transform 0.6s cubic-bezier(.22,1,.36,1);
  }
  .tp-card:hover .tp-fallback { transform: scale(1.06); }

  .tp-scrim {
    position: absolute; inset: 0; z-index: 1;
    background: linear-gradient(to bottom,
      rgba(0,0,0,0.0) 20%, rgba(0,0,0,0.22) 60%,
      rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.6) 80%,
      rgba(0,0,0,0.8) 90%, rgba(0,0,0,0.9) 100%);
  }
  .tp-pill {
    position: absolute; top: 14px; left: 14px; z-index: 4;
    background: #ff3c2e; color: #fff;
    font-size: 8px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 4px;
  }
  .tp-default {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 18px 20px 22px; z-index: 3;
    transition: opacity 0.22s ease, transform 0.28s ease;
  }
  .tp-card:hover .tp-default { opacity: 0; transform: translateY(8px); pointer-events: none; }
  .tp-default-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.35; }

  .tp-curtain {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 152px; background: #ff3c2e; z-index: 2;
    transform: translateY(100%);
    transition: transform 0.46s cubic-bezier(.22,1,.36,1);
    overflow: hidden;
  }
  .tp-card:hover .tp-curtain { transform: translateY(0); }
  .tp-curtain::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 1.5px; background: rgba(255,255,255,0.22);
  }
  .tp-curtain::after {
    content: '';
    position: absolute; top: 0; bottom: 0; left: -80%; width: 55%;
    background: linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.14) 50%, transparent 75%);
    transform: skewX(-10deg); opacity: 0; pointer-events: none;
  }
  .tp-card:hover .tp-curtain::after { animation: shine 0.75s ease 0.28s forwards; }

  .tp-hover {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 152px; padding: 16px 20px 20px; z-index: 3;
    display: flex; flex-direction: column; justify-content: center; gap: 0;
    opacity: 0; transform: translateY(10px);
    transition: opacity 0.26s ease 0.18s, transform 0.26s ease 0.18s;
  }
  .tp-card:hover .tp-hover { opacity: 1; transform: translateY(0); }
  .tp-hover-badge {
    display: inline-block; width: fit-content;
    font-size: 8px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
    color: rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 3px; padding: 3px 8px; margin-bottom: 8px;
  }
  .tp-hover-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 14px; }
  .tp-cta { display: flex; align-items: center; justify-content: space-between; }
  .tp-btn {
    font-family: 'Inter', sans-serif;
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: #ff3c2e; background: #fff;
    border: none; border-radius: 50px; padding: 8px 18px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  }
  .tp-btn:hover { background: #0f0f0f; color: #fff; transform: scale(1.04); }

  @media (max-width: 640px) {
    .tp-header { padding: 106px 20px 32px; }
    .tp-filter  { padding: 24px 20px 0; }
    .tp-grid    { padding: 24px 20px 60px; gap: 14px; }
  }
`;

const lines = [
  { width: 320, top: '14%',  left: '10%',  r: '-10deg', op: 0.7, dur: '9s',  delay: '0s'  },
  { width: 200, top: '32%',  left: '58%',  r: '6deg',   op: 0.5, dur: '11s', delay: '1.5s'},
  { width: 260, top: '58%',  left: '22%',  r: '-5deg',  op: 0.6, dur: '13s', delay: '3s'  },
  { width: 170, top: '72%',  left: '70%',  r: '12deg',  op: 0.45,dur: '10s', delay: '0.8s'},
  { width: 230, top: '48%',  left: '78%',  r: '-7deg',  op: 0.5, dur: '12s', delay: '2.5s'},
  { width: 150, top: '88%',  left: '38%',  r: '4deg',   op: 0.4, dur: '15s', delay: '4s'  },
];

const streamMap = {
  Technology: ['ET', 'SFT', 'ICT'],
  Commerce:   ['Business Studies', 'Econ', 'Accounting'],
  Arts:       ['Media', 'Political Science', 'Geography', 'Sinhala'],
};


const streams = ['All', 'Technology', 'Commerce', 'Arts'];

function TeacherCard({ teacher, index }) {
  const navigate = useNavigate();
  const goToProfile = () => navigate(teacher.route);

  return (
    <div className="tp-card" style={{ animationDelay: `${index * 0.06}s` }} onClick={goToProfile}>
      {teacher.image
        ? <img src={teacher.image} alt={teacher.name} className="tp-photo" />
        : <div className="tp-fallback">{teacher.name[0]}</div>
      }
      <div className="tp-scrim" />
      <span className="tp-pill">{teacher.subject}</span>
      <div className="tp-default">
        <p className="tp-default-name">{teacher.name}</p>
      </div>
      <div className="tp-curtain" />
      <div className="tp-hover">
        <span className="tp-hover-badge">{teacher.subject}</span>
        <p className="tp-hover-name">{teacher.name}</p>
        <div className="tp-cta">
          <button className="tp-btn" onClick={(e) => { e.stopPropagation(); goToProfile(); }}>View Profile</button>
        </div>
      </div>
    </div>
  );
}

export default function TeachersProfile() {
  const [active, setActive] = useState('All');

  const filtered = active === 'All'
    ? teachers
    : teachers.filter(t => streamMap[active]?.includes(t.subject));

  return (
    <div className="tp-page">
      <style>{css}</style>

      {/* ── BACKGROUND ── */}
      <div className="tp-bg">
        {/* orbs */}
        <div className="tp-orb-1" />
        <div className="tp-orb-2" />
        <div className="tp-orb-3" />

        {/* morphing blobs */}
        <div className="tp-blob-1" />
        <div className="tp-blob-2" />

        {/* rings */}
        <div className="tp-ring-1" />
        <div className="tp-ring-2" />
        <div className="tp-ring-3" />

        {/* dot grids */}
        <div className="tp-dots tp-dots-1" />
        <div className="tp-dots tp-dots-2" />
        <div className="tp-dots tp-dots-3" />

        {/* pulsing dots */}
        <div className="tp-pulse-dot tp-pd-1" />
        <div className="tp-pulse-dot tp-pd-2" />
        <div className="tp-pulse-dot tp-pd-3" />

        {/* scan lines */}
        <div className="tp-scan" />
        <div className="tp-scan-2" />

        {/* floating diagonal lines */}
        {lines.map((l, i) => (
          <div
            key={i}
            className="tp-line"
            style={{
              width: l.width,
              top: l.top,
              left: l.left,
              '--r': l.r,
              '--op': l.op,
              '--dur': l.dur,
              '--delay': l.delay,
            }}
          />
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="tp-content">
        <Navbar />
        <header className="tp-header">
          <div className="tp-header-inner">
            <div className="tp-eyebrow-pill">
              <span className="tp-eyebrow-dot" />
              <span className="tp-eyebrow-text">Our Team</span>
            </div>
            <h1>Meet Our <em>Teachers</em></h1>
            <p>Dedicated educators shaping the future, one student at a time.</p>
          </div>
        </header>

        <div className="tp-filter">
          <span className="tp-filter-label">Stream</span>
          {streams.map(s => (
            <button
              key={s}
              className={`tp-chip${active === s ? ' active' : ''}`}
              onClick={() => setActive(s)}
            >
             
              {s === 'All' ? 'All Streams' : s}
            </button>
          ))}
        </div>

        <div className="tp-grid">
          {filtered.map((t, i) => (
            <TeacherCard key={t.subject + i} teacher={t} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}