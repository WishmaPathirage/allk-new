import { useEffect, useRef, useState } from 'react';

const stats = [
  {
    value: "44K+", label: "Facebook Followers", count: 82, suffix: "K+",
    accent: "#4F8EF7",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>),
  },
  {
    value: "22K+", label: "YT Subscribers", count: 44, suffix: "K+",
    accent: "#ff3c2e",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff"/></svg>),
  },
  {
    value: "2.1M+", label: "YouTube Views", count: 4.7, suffix: "M+",
    accent: "#FF8C00",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>),
  },
  {
    value: "15K+", label: "TikTok Followers", count: 15, suffix: "K+",
    accent: "#fe2c55",
    icon: (<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.54V6.79a4.85 4.85 0 0 1-1.02-.1z"/></svg>),
  },
  {
    value: "1.2K+", label: "LMS Users", count: 24, suffix: "K+",
    accent: "#A855F7",
    icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  },
];

function useCountUp(target, suffix, duration = 1600, start = false) {
  const [display, setDisplay] = useState('0' + suffix);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const isDecimal = target % 1 !== 0;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = eased * target;
      setDisplay((isDecimal ? cur.toFixed(1) : Math.floor(cur)) + suffix);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, suffix, duration]);
  return display;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tickerScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes numSlotUp {
    0%   { opacity: 0; transform: translateY(100%); }
    100% { opacity: 1; transform: translateY(0%); }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes dotAppear {
    0%   { transform: translateY(-50%) scale(0); opacity: 0; }
    60%  { transform: translateY(-50%) scale(1.4); opacity: 1; }
    100% { transform: translateY(-50%) scale(1); opacity: 1; }
  }
  @keyframes iconBounce {
    0%   { transform: translateY(0px) scale(1); }
    30%  { transform: translateY(-6px) scale(1.1); }
    55%  { transform: translateY(2px) scale(0.97); }
    75%  { transform: translateY(-2px) scale(1.02); }
    100% { transform: translateY(0px) scale(1); }
  }
  @keyframes ssPulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: .45; transform: scale(1.55); }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ss-section {
    font-family: 'DM Sans', sans-serif;
    background: #fff;
    padding: 36px 0 0;
    overflow: hidden;
    position: relative;
  }

  .ss-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    padding: 0 48px 40px;
  }

  /* ── HEADING — matches FAQ style ── */
  .ss-heading {
    text-align: center;
    margin-bottom: 40px;
  }

  /* pill eyebrow */
  .ss-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff0f0; border: 1.5px solid #ffd5d5;
    border-radius: 100px; padding: 7px 18px;
    margin-bottom: 20px;
  }
  .ss-eyebrow-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ff3c2e;
    animation: ssPulse 1.8s ease-in-out infinite; flex-shrink: 0;
  }
  .ss-eyebrow-text {
    font-size: 11px; font-weight: 700; color: #ff3c2e;
    letter-spacing: .14em; text-transform: uppercase;
  }

  /* main title — matches FAQ h1 */
  .ss-heading h2 {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    color: #0d0d0d; line-height: 1.08; font-weight: 400;
    letter-spacing: -.025em;
    margin: 0 0 14px;
  }
  .ss-heading h2 em {
    font-style: normal;
    color: #ff3c2e;
  }
  .ss-heading p {
    font-size: 17px; color: #888;
    line-height: 1.7; font-weight: 400;
    max-width: 520px; margin: 0 auto;
  }

  .ss-cards {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  /* ── card ── */
  .ss-card {
    position: relative;
    border-radius: 18px;
    padding: 30px 26px 26px;
    background: #fafafa;
    border: 1.5px solid #efefef;
    overflow: hidden;
    cursor: default;
    opacity: 0;
    transition:
      transform 0.4s cubic-bezier(.22,1,.36,1),
      border-color 0.35s,
      box-shadow 0.4s;
  }
  .ss-card.in {
    animation: cardIn 0.55s cubic-bezier(.22,1,.36,1) both;
  }
  .ss-card:hover {
    transform: translateY(-8px);
    border-color: var(--accent);
    box-shadow: 0 20px 48px rgba(0,0,0,0.08), 0 0 0 1px var(--accent);
  }

  /* corner wash - scales in on hover */
  .ss-wash {
    position: absolute;
    width: 160px; height: 160px; border-radius: 50%;
    background: radial-gradient(circle, var(--accent), transparent 70%);
    bottom: -60px; right: -40px;
    opacity: 0;
    transform: scale(0.6);
    transition: opacity 0.45s ease, transform 0.45s cubic-bezier(.22,1,.36,1);
    pointer-events: none;
  }
  .ss-card:hover .ss-wash {
    opacity: 0.13;
    transform: scale(1);
  }

  /* ── icon ── */
  .ss-icon {
    width: 46px; height: 46px; border-radius: 12px;
    background: #fff; border: 1.5px solid #efefef;
    display: flex; align-items: center; justify-content: center;
    color: var(--accent);
    margin-bottom: 22px;
    transition: background 0.3s, border-color 0.3s, color 0.25s;
  }
  .ss-card:hover .ss-icon {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    animation: iconBounce 0.55s cubic-bezier(.22,1,.36,1) forwards;
  }

  /* ── number: slot machine reveal ── */
  .ss-num-wrap {
    overflow: hidden;
    height: 64px;
    margin-bottom: 4px;
  }
  .ss-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 54px; line-height: 64px;
    letter-spacing: 0.02em; color: #111;
    display: block;
    transition: color 0.3s;
  }
  .ss-num.slot-in {
    animation: numSlotUp 0.5s cubic-bezier(.22,1,.36,1) both;
  }
  .ss-card:hover .ss-num { color: var(--accent); }

  /* label */
  .ss-lbl {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #aaa; margin-bottom: 20px; transition: color 0.3s;
  }
  .ss-card:hover .ss-lbl { color: #666; }

  /* ── bar ── */
  .ss-bar {
    height: 3px; background: #efefef;
    border-radius: 99px; overflow: visible;
  }
  .ss-bar-fill {
    width: var(--bw); height: 100%; border-radius: 99px;
    background: var(--accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: box-shadow 0.35s;
    position: relative;
  }
  .ss-bar-fill.go {
    animation: barGrow 1.1s cubic-bezier(.22,1,.36,1) forwards;
    animation-delay: var(--bd);
  }
  .ss-card:hover .ss-bar-fill { box-shadow: 0 0 8px 2px var(--accent); }

  /* dot at end of bar */
  .ss-bar-fill::after {
    content: '';
    position: absolute; right: -4px; top: 50%;
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--accent);
    border: 2px solid #fff;
    transform: translateY(-50%) scale(0); opacity: 0;
  }
  .ss-bar-fill.go::after {
    animation: dotAppear 0.4s ease forwards;
    animation-delay: calc(var(--bd) + 0.9s);
  }

  /* ── ticker ── */
  .ss-ticker {
    background: #ff3c2e; padding: 13px 0; overflow: hidden;
  }
  .ss-ticker-track {
    display: flex; width: max-content;
    animation: tickerScroll 20s linear infinite;
  }
  .ss-ticker-item {
    display: flex; align-items: center; gap: 10px; padding: 0 36px;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 17px; letter-spacing: 0.1em;
    color: rgba(255,255,255,0.9); white-space: nowrap;
  }
  .ss-ticker-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: rgba(255,255,255,0.4);
  }

  @media (max-width: 1100px) {
    .ss-cards { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 700px) {
    .ss-cards { grid-template-columns: repeat(2, 1fr); }
    .ss-inner { padding: 0 20px 60px; }
  }
  @media (max-width: 400px) {
    .ss-cards { grid-template-columns: 1fr; }
  }
`;

const barWidths = ['78%', '56%', '94%', '40%', '50%'];
const tickerContent = [
  '82K Facebook Followers', '44K YouTube Subscribers', '4.7M YouTube Views', '15K TikTok Followers', '24K LMS Users',
  '82K Facebook Followers', '44K YouTube Subscribers', '4.7M YouTube Views', '15K TikTok Followers', '24K LMS Users',
];

function StatCard({ stat, index }) {
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [barGo,   setBarGo]   = useState(false);
  const [slotIn,  setSlotIn]  = useState(false);
  const cardRef = useRef(null);
  const barRef  = useRef(null);
  const displayed = useCountUp(stat.count, stat.suffix, 1500, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const d = index * 100;
        setTimeout(() => setVisible(true), d);
        setTimeout(() => { setStarted(true); setSlotIn(true); }, d + 200);
        setTimeout(() => setBarGo(true), d + 500);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    const card = cardRef.current;
    if (!card) return;
    obs.observe(card);
    return () => obs.disconnect();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`ss-card${visible ? ' in' : ''}`}
      style={{
        '--accent': stat.accent,
        animationDelay: `${index * 0.08}s`,
        '--bd': `${index * 0.06}s`,
      }}
    >
      <div className="ss-wash" />

      <div className="ss-icon">{stat.icon}</div>

      <div className="ss-num-wrap">
        <span className={`ss-num${slotIn ? ' slot-in' : ''}`}>{displayed}</span>
      </div>

      <div className="ss-lbl">{stat.label}</div>

      <div className="ss-bar">
        <div
          ref={barRef}
          className={`ss-bar-fill${barGo ? ' go' : ''}`}
          style={{ '--bw': barWidths[index] }}
        />
      </div>
    </div>
  );
}

export default function SocialStats() {
  return (
    <section className="ss-section" id="social-stats">
      <style>{css}</style>
      <div className="ss-inner">
        <div className="ss-heading">
          <div className="ss-eyebrow-pill">
            <span className="ss-eyebrow-dot" />
            <span className="ss-eyebrow-text">Our Reach</span>
          </div>
          <h2>Growing <em>Together</em></h2>
          <p>Join thousands of students already learning with Sri Lanka's best A/L teachers.</p>
        </div>
        <div className="ss-cards">
          {stats.map((s, i) => <StatCard key={i} stat={s} index={i} />)}
        </div>
      </div>
      <div className="ss-ticker">
        <div className="ss-ticker-track">
          {[...tickerContent, ...tickerContent].map((item, i) => (
            <span key={i} className="ss-ticker-item">
              <span className="ss-ticker-dot" /> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}