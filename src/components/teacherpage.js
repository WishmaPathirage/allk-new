import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
//import Teacher1 from '../assets/ET.webp';
//import Teacher2 from '../assets/SFT.webp';
//import Teacher3 from '../assets/ACCOUNTING.webp';
import Teacher4 from '../assets/ECON.webp';
import Teacher5 from '../assets/GEOGRAPHY.webp';
//import Teacher6 from '../assets/ICT.webp'
//import Teacher7 from '../assets/BS.webp'
import Teacher8 from '../assets/POLITICAL.webp'
import Teacher9 from '../assets/MEDIA.webp'
import Teacher10 from '../assets/SINHALA.webp'

const teachers = [
  //{ name: 'Mr. Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology', img: Teacher1 },
  //{ name: 'Mr. Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology', img: Teacher2 },
  //{ name: 'Mr. Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce',   img: Teacher3 },
  { name: 'Mr. Krishan Kasthuriarachchi',         subject: 'Economics',              stream: 'Arts & Commerce',   img: Teacher4 },
  { name: 'Mr. Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts',       img: Teacher5 },
  //{ name: 'Mr. Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology', img: Teacher6 },
  //{ name: 'Mr. Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce',   img: Teacher7 },
  { name: 'Mr. Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts',       img: Teacher8 },
  { name: 'Mr. Praveen Kumarage',        subject: 'Media',                  stream: 'Arts',       img: Teacher9 },
  { name: 'Mr. Pathum Sandanuwan',       subject: 'Sinhala',                stream: 'Arts',       img: Teacher10 },
];

/* returns -2, -1, 0, 1, 2 relative to current */
function getPos(i, current, n) {
  const diff = ((i - current) % n + n) % n;
  if (diff === 0) return 0;
  if (diff === 1) return 1;
  if (diff === n - 1) return -1;
  if (diff <= Math.floor(n / 2)) return 2;
  return -2;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;600;700&display=swap');

  @keyframes tg-pulseDot {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.7); opacity: 1; }
  }
  @keyframes tg-wipe {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  .tg-section {
    background: #fff;
    padding: 36px 0 44px;
    overflow: hidden;
    position: relative;
    font-family: 'DM Sans', sans-serif;
  }

  /* soft red glow top-right */
  .tg-section::before {
    content: '';
    position: absolute;
    width: 560px; height: 560px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.06) 0%, transparent 68%);
    top: -180px; right: -160px;
    pointer-events: none;
  }
  .tg-section::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.04) 0%, transparent 68%);
    bottom: -120px; left: -100px;
    pointer-events: none;
  }

  .tg-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px;
  }

  /* ── HEADING ── */
  .tg-heading {
    text-align: center;
    margin-bottom: 40px;
  }
  .tg-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,60,46,0.08);
    border: 1px solid rgba(255,60,46,0.18);
    border-radius: 999px;
    padding: 6px 16px;
    margin-bottom: 18px;
  }
  .tg-eyebrow-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ff3c2e;
    animation: tg-pulseDot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .tg-eyebrow-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #ff3c2e;
  }
  .tg-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    font-weight: 400;
    color: #111; line-height: 1.1;
    margin: 0 0 8px;
  }
  .tg-title em { font-style: normal; color: #ff3c2e; }
  .tg-subtitle {
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(14px, 1.4vw, 16px);
    color: #888; margin-top: 8px;
  }

  /* ── STAGE ── */
  .tg-stage {
    position: relative;
    width: 100%;
    height: 520px;
  }

  /* ── SLIDES ── */
  .tg-slide {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 280px;
    transition: transform 0.55s cubic-bezier(.22,1,.36,1),
                opacity   0.55s cubic-bezier(.22,1,.36,1);
    will-change: transform, opacity;
  }

  /* center */
  .tg-slide[data-pos="0"] {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    z-index: 5;
  }
  /* one left */
  .tg-slide[data-pos="-1"] {
    transform: translate(calc(-50% - 310px), -50%) scale(0.75);
    opacity: 0.45;
    z-index: 3;
  }
  /* one right */
  .tg-slide[data-pos="1"] {
    transform: translate(calc(-50% + 310px), -50%) scale(0.75);
    opacity: 0.45;
    z-index: 3;
  }
  /* further — hidden behind center */
  .tg-slide[data-pos="-2"],
  .tg-slide[data-pos="2"] {
    transform: translate(-50%, -50%) scale(0.55);
    opacity: 0;
    z-index: 1;
    pointer-events: none;
  }

  /* ── TEACHER NAME (above image) ── */
  .tg-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 0.05em;
    color: #111;
    text-align: center;
    margin-bottom: 12px;
    line-height: 1;
    transition: opacity 0.4s ease;
    opacity: 0;
  }
  .tg-slide[data-pos="0"] .tg-name { opacity: 1; }

  /* ── PHOTO ── */
  .tg-photo-wrap {
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 16px 48px rgba(0,0,0,0.14);
    border: 1.5px solid #f0f0f0;
  }
  .tg-photo {
    width: 100%;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    object-position: center top;
    display: block;
  }

  /* red bottom gradient overlay on center card */
  .tg-slide[data-pos="0"] .tg-photo-wrap::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(255,60,46,0.22) 0%, transparent 50%);
    border-radius: 14px;
    pointer-events: none;
  }

  /* ── META (below image) ── */
  .tg-meta {
    text-align: center;
    margin-top: 14px;
    line-height: 1.4;
    transition: opacity 0.4s ease;
    opacity: 0;
  }
  .tg-slide[data-pos="0"] .tg-meta { opacity: 1; }
  .tg-subject {
    font-size: 13px;
    font-weight: 700;
    color: #111;
    letter-spacing: 0.05em;
  }
  .tg-stream {
    font-size: 11px;
    font-weight: 600;
    color: #ff3c2e;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-top: 3px;
  }

  /* ── NAV BUTTONS ── */
  .tg-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1.5px solid #efefef;
    background: #fff;
    color: #111;
    font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    transition: background 0.2s, color 0.2s, transform 0.2s, border-color 0.2s;
    line-height: 1;
  }
  .tg-btn:hover {
    background: #ff3c2e;
    border-color: #ff3c2e;
    color: #fff;
    transform: translateY(-50%) scale(1.1);
  }
  .tg-btn-prev { left: calc(50% - 162px); }
  .tg-btn-next { right: calc(50% - 162px); }

  /* ── DOTS ── */
  .tg-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 32px;
  }
  .tg-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ddd;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.3s, transform 0.3s;
  }
  .tg-dot.active {
    background: #ff3c2e;
    transform: scale(1.35);
  }

  /* ── VIEW MORE BUTTON ── */
  .tg-view-more-wrap {
    display: flex;
    justify-content: center;
    margin-top: 36px;
  }
  .tg-view-more {
    position: relative;
    display: inline-flex; align-items: center; gap: 9px;
    padding: 13px 34px;
    border-radius: 50px;
    border: 1.5px solid #ff3c2e;
    background: transparent;
    color: #ff3c2e;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    overflow: hidden;
    transition: color 0.3s ease, border-color 0.3s ease;
    text-decoration: none;
  }
  .tg-view-more::before {
    content: '';
    position: absolute;
    inset: 0;
    background: #ff3c2e;
    border-radius: 50px;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.35s cubic-bezier(.22,1,.36,1);
    z-index: 0;
  }
  .tg-view-more:hover::before { transform: scaleX(1); }
  .tg-view-more:hover { color: #fff; border-color: #ff3c2e; }
  .tg-view-more span { position: relative; z-index: 1; }
  .tg-view-more svg {
    position: relative; z-index: 1;
    width: 15px; height: 15px;
    stroke: currentColor; stroke-width: 2.5;
    fill: none; stroke-linecap: round; stroke-linejoin: round;
    transition: transform 0.2s ease;
  }
  .tg-view-more:hover svg { transform: translateX(3px); }

  @media (max-width: 700px) {
    .tg-stage { height: 420px; }
    .tg-slide { width: 220px; }
    .tg-slide[data-pos="-1"] { transform: translate(calc(-50% - 240px), -50%) scale(0.72); }
    .tg-slide[data-pos="1"]  { transform: translate(calc(-50% + 240px), -50%) scale(0.72); }
    .tg-btn-prev { left: calc(50% - 128px); }
    .tg-btn-next { right: calc(50% - 128px); }
  }
  @media (max-width: 400px) {
    .tg-stage { height: 380px; }
    .tg-slide { width: 180px; }
    .tg-slide[data-pos="-1"] { transform: translate(calc(-50% - 195px), -50%) scale(0.65); opacity: 0.3; }
    .tg-slide[data-pos="1"]  { transform: translate(calc(-50% + 195px), -50%) scale(0.65); opacity: 0.3; }
    .tg-btn   { width: 36px; height: 36px; font-size: 16px; }
    .tg-btn-prev { left: 8px; }
    .tg-btn-next { right: 8px; }
    .tg-name  { font-size: 22px; }
    .tg-inner { padding: 0 8px; }
  }
`;

export default function TeacherGallery() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const n = teachers.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % n), [n]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + n) % n), [n]);

  /* auto-advance every 2 s */
  useEffect(() => {
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="tg-section" id="teachers">
      <style>{css}</style>

      <div className="tg-inner">

        {/* heading */}
        <div className="tg-heading">
          <div className="tg-eyebrow-pill">
            <span className="tg-eyebrow-dot" />
            <span className="tg-eyebrow-text">Our Team</span>
          </div>
          <h2 className="tg-title">Meet Our <em>Teachers</em></h2>
          <p className="tg-subtitle">Expert educators dedicated to your A/L success</p>
        </div>

        {/* stage */}
        <div className="tg-stage">
          {teachers.map((t, i) => {
            const pos = getPos(i, current, n);
            return (
              <div
                key={i}
                className="tg-slide"
                data-pos={String(pos)}
              >
                <div className="tg-name">{t.name}</div>
                <div className="tg-photo-wrap">
                  <img src={t.img} alt={t.name} className="tg-photo" />
                </div>
                <div className="tg-meta">
                  <div className="tg-subject">{t.subject}</div>
                  <div className="tg-stream">{t.stream}</div>
                </div>
              </div>
            );
          })}

          <button className="tg-btn tg-btn-prev" onClick={prev} aria-label="Previous teacher">‹</button>
          <button className="tg-btn tg-btn-next" onClick={next} aria-label="Next teacher">›</button>
        </div>

        {/* dots */}
        <div className="tg-dots">
          {teachers.map((_, i) => (
            <button
              key={i}
              className={`tg-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Go to teacher ${i + 1}`}
            />
          ))}
        </div>

        {/* view more */}
        <div className="tg-view-more-wrap">
          <button className="tg-view-more" onClick={() => navigate('/teacherprofiles')}>
            <span>View All Teachers</span>
            <svg viewBox="0 0 16 16">
              <line x1="2" y1="8" x2="13" y2="8"/>
              <polyline points="9,4 13,8 9,12"/>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
