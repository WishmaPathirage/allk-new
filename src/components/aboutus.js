import { useEffect, useRef } from 'react';
import GroupImg from '../assets/GroupImg.webp';


const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes au-pulseDot {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.7); opacity: 1; }
  }

  /* ── SECTION ── */
  .au-section {
    position: relative;
    background: #fff;
    padding: 28px 0 48px;
    overflow: hidden;
    z-index: 1;
  }

  .au-section::before {
    content: '';
    position: absolute;
    width: 560px; height: 560px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.05) 0%, transparent 68%);
    top: -180px; left: -160px;
    pointer-events: none;
  }
  .au-section::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.04) 0%, transparent 68%);
    bottom: -120px; right: -100px;
    pointer-events: none;
  }

  .au-container {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 40px;
    position: relative;
    z-index: 1;
  }

  /* ── EYEBROW ── */
  .au-eyebrow-wrap {
    margin-bottom: 16px;
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .au-eyebrow-wrap.au-visible { opacity: 1; transform: translateY(0); }
  .au-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,60,46,0.08);
    border: 1px solid rgba(255,60,46,0.18);
    border-radius: 999px;
    padding: 6px 16px;
  }
  .au-eyebrow-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ff3c2e;
    animation: au-pulseDot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .au-eyebrow-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #ff3c2e;
  }

  /* ── FULL-WIDTH TITLE ── */
  .au-title-full {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    font-weight: 400;
    line-height: 1.1;
    color: #111;
    margin-bottom: 32px;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s;
  }
  .au-title-full.au-visible { opacity: 1; transform: translateY(0); }
  .au-title-full em { color: #ff3c2e; font-style: normal; }

  /* ── GRID: text LEFT, image RIGHT ── */
  .au-grid {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
    gap: 72px;
    align-items: center;
  }

  /* ── LEFT: TEXT BLOCK ── */
  .au-text-col {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s;
  }
  .au-text-col.au-visible { opacity: 1; transform: translateX(0); }

  .au-subheading {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #666;
    line-height: 1.75;
    margin-bottom: 28px;
    max-width: 480px;
  }

  /* ── STATS ROW (above checklist) ── */
  .au-stats-row {
    display: flex;
    gap: 0;
    margin-bottom: 28px;
    border-top: 1.5px solid #f0f0f0;
    border-bottom: 1.5px solid #f0f0f0;
    padding: 16px 0;
  }
  .au-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-right: 20px;
  }
  .au-stat + .au-stat {
    padding-left: 20px;
    border-left: 1.5px solid #f0f0f0;
  }
  .au-stat-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px; color: #ff3c2e; line-height: 1;
  }
  .au-stat-lbl {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 500;
    color: #888; margin-top: 2px;
  }

  .au-desc {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #555;
    line-height: 1.65;
    margin-bottom: 16px;
  }

  /* ── CHECKLIST with ⦿ bullet ── */
  .au-checks {
    list-style: none;
    margin: 0 0 28px;
    display: flex;
    flex-direction: column;
    gap: 11px;
  }
  .au-check-item {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateY(20px) scale(0.94);
    transition: opacity 0.45s ease, transform 0.45s cubic-bezier(.22,1,.36,1);
  }
  .au-check-item.au-visible { opacity: 1; transform: translateY(0) scale(1); }
  .au-check-bullet {
    color: #ff3c2e;
    font-size: 17px;
    flex-shrink: 0;
    line-height: 1;
  }
  .au-check-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    color: #222; line-height: 1.35;
  }

  /* ── CTAs ── */
  .au-ctas { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .au-btn-join {
    display: inline-flex; align-items: center; gap: 8px;
    background: #ff3c2e; color: #fff;
    border: none; border-radius: 4px;
    padding: 14px 38px;
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(255,60,46,0.35);
    transition: background 0.22s, transform 0.22s, box-shadow 0.22s;
    text-decoration: none;
  }
  .au-btn-join:hover {
    background: #e03325; transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(255,60,46,0.4);
  }
  .au-btn-join svg {
    width: 15px; height: 15px;
    stroke: #fff; stroke-width: 2.5; fill: none;
    transition: transform 0.2s;
  }
  .au-btn-join:hover svg { transform: translateX(3px); }
  .au-link-contact {
    font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #ff3c2e; text-decoration: none;
    display: inline-flex; align-items: center; gap: 5px;
    border: 1.5px solid #ff3c2e; border-radius: 4px;
    padding: 14px 38px;
    transition: background 0.22s, color 0.22s, transform 0.22s;
  }
  .au-link-contact:hover { background: #ff3c2e; color: #fff; transform: translateY(-2px); }

  /* ── RIGHT: PHOTO BLOCK ── */
  .au-photo-col {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s;
  }
  .au-photo-col.au-visible { opacity: 1; transform: translateX(0); }

  .au-photo-wrap { position: relative; }

  /* background-removed PNG — display naturally, no shadow or border */
  .au-main-img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .au-grid { grid-template-columns: 1fr; gap: 40px; }
    .au-photo-col { max-width: 520px; margin: 0 auto; order: -1; }
    .au-title-full { font-size: clamp(28px, 5vw, 44px); }
  }
  @media (max-width: 600px) {
    .au-section { padding: 40px 0 44px; }
    .au-container { padding: 0 20px; }
    .au-stats-row { flex-wrap: wrap; gap: 16px; }
    .au-ctas { flex-direction: column; align-items: flex-start; }
  }
`;

const checks = [
  'Top Results Across All A/L Streams',
  'Expert Teachers & Structured Syllabus',
  'Live Classes, Recordings & Past Papers',
  'Personal Progress Tracking',
  'Affordable & Accessible Islandwide',
];

export default function AboutUs() {
  const eyebrowRef = useRef(null);
  const titleRef   = useRef(null);
  const photoRef   = useRef(null);
  const textRef    = useRef(null);
  const checksRef  = useRef([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('au-visible');
      }),
      { threshold: 0.15 }
    );

    [eyebrowRef, titleRef, photoRef, textRef].forEach(r => {
      if (r.current) io.observe(r.current);
    });

    const observers = [];
    checksRef.current.forEach((el) => {
      if (!el) return;
      const ck = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('au-visible');
          } else {
            e.target.classList.remove('au-visible');
          }
        }),
        { threshold: 0.2 }
      );
      ck.observe(el);
      observers.push(ck);
    });

    return () => {
      io.disconnect();
      observers.forEach(ck => ck.disconnect());
    };
  }, []);

  return (
    <section className="au-section" id="about">
      <style>{css}</style>

      <div className="au-container">

        {/* eyebrow pill */}
        <div className="au-eyebrow-wrap" ref={eyebrowRef}>
          <div className="au-eyebrow-pill">
            <span className="au-eyebrow-dot" />
            <span className="au-eyebrow-text">Who We Are</span>
          </div>
        </div>

        {/* full-width title */}
        <div className="au-title-full" ref={titleRef}>
          Why A/L.LK Is The <em>Best A/L Platform</em> In Sri Lanka
        </div>

        {/* grid: text LEFT, image RIGHT */}
        <div className="au-grid">

          {/* LEFT: CONTENT */}
          <div className="au-text-col" ref={textRef}>

            <p className="au-subheading">
              A/L.LK is Sri Lanka's most trusted Advanced Level online learning platform,
              built by educators, for students who refuse to settle for less.
            </p>

            {/* stats above checklist */}
            <div className="au-stats-row">
              <div className="au-stat">
                <span className="au-stat-num">44K+</span>
                <span className="au-stat-lbl">Active Students</span>
              </div>
              <div className="au-stat">
                <span className="au-stat-num">10+</span>
                <span className="au-stat-lbl">Years of Excellence</span>
              </div>
              <div className="au-stat">
                <span className="au-stat-num">95%</span>
                <span className="au-stat-lbl">Exam Pass Rate</span>
              </div>
            </div>

            <p className="au-desc">Everything you need to ace your A/Ls, in one place.</p>

            {/* checklist */}
            <ul className="au-checks">
              {checks.map((c, i) => (
                <li
                  key={i}
                  className="au-check-item"
                  ref={el => checksRef.current[i] = el}
                  style={{ transitionDelay: `${0.3 + i * 0.08}s` }}
                >
                  <span className="au-check-bullet">⦿</span>
                  <div className="au-check-text">{c}</div>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            {/* <div className="au-ctas">
              <a href="/signup" className="au-btn-join">
                Join Now
                <svg viewBox="0 0 16 16">
                  <line x1="2" y1="8" x2="13" y2="8"/>
                  <polyline points="9,4 13,8 9,12"/>
                </svg>
              </a>
              <a href="/#contact" className="au-link-contact">Contact Us →</a>
            </div> */}
          </div>

          {/* RIGHT: PHOTO (background-removed PNG) */}
          <div className="au-photo-col" ref={photoRef}>
            <div className="au-photo-wrap">
              <img src={GroupImg} alt="A/L.LK Group of Students" className="au-main-img" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
