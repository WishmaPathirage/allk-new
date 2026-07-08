import P1 from '../assets/podcast1.jpg';
import P2 from '../assets/podcast2.jpg';
import P3 from '../assets/podcast3.jpg';
import P4 from '../assets/podcast4.jpg';
import P5 from '../assets/podcast5.jpg';

const PODCASTS = [
  { id: 1, duration: "1:24:38", thumb: P1, episode: "EP 01", title: "වඅපේ කතාව | ගුරු ගෝල (ප්‍රවීන් කුමාරගේ මීඩියා ) | AL.LK with Rashmika Soorya Bandara Live Stream", youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_EP01" },
  { id: 2, duration: "58:12",   thumb: P2, episode: "EP 02", title: "අපේ කතාව | අයියලා කියන්නෙත් තාත්තලා එක කුසේ උපන්න.. | AL.LK with Rashmika Soorya Bandara Live Stream",                youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_EP02" },
  { id: 3, duration: "45:07",   thumb: P3, episode: "EP 03", title: "අපේ කතාව | නුවර කොල්ලෝ දෙන්නෙක්... | AL.LK with Rashmika Soorya Bandara Live Stream",                                              youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_EP03" },
  { id: 4, duration: "37:55",   thumb: P4, episode: "EP 04", title: "අපේ කතාව | පෙරියමුල්ලෙ කොල්ලෙක් ... | AL.LK with Rashmika Soorya Bandara Live Stream",                                              youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_EP04" },
  { id: 5, duration: "42:18",   thumb: P5, episode: "EP 05", title: "අපේ කතාව | ගස්වලට කතා කරපු මනුස්සයෙක්... | AL.LK with Rashmika Soorya Bandara Live Stream",                                          youtubeUrl: "https://www.youtube.com/watch?v=REPLACE_EP05" },
];

const CHANNEL_URL = "https://www.youtube.com/@REPLACE_CHANNEL";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  @keyframes ps-in      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ps-ripple  { to{transform:scale(5);opacity:0} }
  @keyframes ps-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.6)} }

  .ps {
    background: #ffffff;
    font-family: 'DM Sans', sans-serif;
    padding: 36px 0 52px;
    overflow: hidden;
    position: relative;
  }

  .ps-inner {
    max-width: 1160px; margin: 0 auto;
    padding: 0 48px;
    position: relative; z-index: 1;
  }

  /* ── HEADER — centred, matches FAQ style ── */
  .ps-header {
    text-align: center;
    margin-bottom: 40px;
    animation: ps-in .6s cubic-bezier(.22,1,.36,1) both;
  }

  /* pill eyebrow — matches FAQ */
  .ps-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fff0f0; border: 1.5px solid #ffd5d5;
    border-radius: 100px; padding: 7px 18px;
    margin-bottom: 20px;
  }
  .ps-eyebrow-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #ff3c2e;
    animation: ps-pulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ps-eyebrow-text {
    font-size: 11px; font-weight: 700; color: #ff3c2e;
    letter-spacing: .14em; text-transform: uppercase;
  }

  /* main heading — matches FAQ h1 */
  .ps-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    color: #0d0d0d; line-height: 1.08; font-weight: 400;
    letter-spacing: -.025em;
    margin: 0 0 16px;
  }
  .ps-title em {
    font-style: normal;
    color: #ff3c2e;
  }
  .ps-subtitle {
    font-size: 17px; color: #888;
    line-height: 1.7; font-weight: 400;
    max-width: 520px; margin: 0 auto;
  }

  /* GRID — row 1: 3 cards full width · row 2: 2 cards centred */
  .ps-grid {
    display: flex; flex-direction: column; gap: 18px;
    animation: ps-in .6s cubic-bezier(.22,1,.36,1) .1s both;
  }
  .ps-grid-row {
    display: flex; gap: 18px; justify-content: center;
  }
  /* 1/3 each → row 1 fills full width, row 2 is 2/3 centred */
  .ps-grid-row .ps-card {
    flex: 0 0 calc((100% - 36px) / 3);
    max-width: calc((100% - 36px) / 3);
  }

  /* ── CARD ── */
  .ps-card {
    border-radius: 18px; overflow: hidden;
    position: relative; cursor: pointer;
    background: #fafafa;
    border: 1.5px solid #efefef;
    display: flex; flex-direction: column;
    transition:
      box-shadow .45s cubic-bezier(.22,1,.36,1),
      transform .45s cubic-bezier(.22,1,.36,1),
      border-color .3s;
  }
  .ps-card:hover {
    box-shadow: 0 24px 56px rgba(255,60,46,.16), 0 0 0 1.5px rgba(255,60,46,.28);
    transform: translateY(-8px);
    border-color: rgba(255,60,46,.3);
  }

  /* thumbnail — 16:9 for proper video proportions */
  .ps-card-thumb {
    position: relative;
    aspect-ratio: 16/9;
    overflow: hidden;
    flex-shrink: 0;
    background: #111;
  }
  .ps-card-thumb img {
    width: 100%; height: 100%; object-fit: cover; object-position: center top;
    display: block;
    transition: transform .7s cubic-bezier(.22,1,.36,1), filter .45s;
    filter: brightness(.92);
  }
  .ps-card:hover .ps-card-thumb img {
    transform: scale(1.08);
    filter: brightness(.45) saturate(.8);
  }
  .ps-card-thumb-grad {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%);
    z-index: 2; transition: opacity .35s;
  }
  .ps-card:hover .ps-card-thumb-grad { opacity: 0; }

  /* play button */
  .ps-card-play {
    position: absolute; top: 50%; left: 50%; z-index: 5;
    transform: translate(-50%,-50%) scale(.45) rotate(-15deg);
    opacity: 0;
    width: 56px; height: 56px; border-radius: 50%;
    background: #ff3c2e;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 16px rgba(255,60,46,.14), 0 14px 36px rgba(255,60,46,.55);
    transition: transform .42s cubic-bezier(.22,1,.36,1), opacity .3s;
  }
  .ps-card-play::before {
    content: ''; position: absolute; inset: 0; border-radius: 50%;
    background: linear-gradient(135deg, rgba(255,255,255,.22), transparent 60%);
  }
  .ps-card-play svg { margin-left: 4px; position: relative; z-index: 1; }
  .ps-card:hover .ps-card-play { opacity: 1; transform: translate(-50%,-50%) scale(1) rotate(0deg); }

  /* episode + duration strip */
  .ps-card-thumb-footer {
    position: absolute; bottom: 0; left: 0; right: 0; z-index: 4;
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px;
  }
  .ps-card-ep-badge {
    font-size: 9px; font-weight: 700; letter-spacing: .2em;
    text-transform: uppercase; color: #ff3c2e;
    display: flex; align-items: center; gap: 6px;
  }
  .ps-card-ep-line { width: 12px; height: 1px; background: #ff3c2e; }
  .ps-card-dur-pill {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,.9);
    background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 5px; padding: 3px 8px;
    transition: background .3s;
  }
  .ps-card:hover .ps-card-dur-pill { background: rgba(255,60,46,.82); }

  /* ── CARD BODY ── */
  .ps-card-body {
    padding: 16px 18px 20px;
    flex: 1; display: flex; flex-direction: column; gap: 10px;
    background: #fff;
  }
  .ps-card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 15px; font-weight: 400; color: #111;
    line-height: 1.45;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color .28s;
  }
  .ps-card:hover .ps-card-title { color: #ff3c2e; }

  /* ── FOOTER ── */
  .ps-footer {
    display: flex; justify-content: center;
    margin-top: 52px;
    animation: ps-in .6s cubic-bezier(.22,1,.36,1) .22s both;
  }
  .ps-view-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: .12em;
    text-transform: uppercase; color: #111;
    background: transparent;
    border: 1.5px solid rgba(0,0,0,.2);
    border-radius: 50px; padding: 14px 44px;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 10px;
    position: relative; overflow: hidden;
    transition: border-color .35s, letter-spacing .3s,
      transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s;
  }
  .ps-view-btn::before {
    content: ''; position: absolute; inset: 0;
    background: #ff3c2e; border-radius: 50px;
    transform: scaleX(0); transform-origin: left;
    transition: transform .42s cubic-bezier(.22,1,.36,1);
    z-index: 0;
  }
  .ps-view-btn:hover::before { transform: scaleX(1); }
  .ps-view-btn:hover {
    border-color: #ff3c2e; color: #fff;
    box-shadow: 0 12px 36px rgba(255,60,46,.3);
    transform: translateY(-3px); letter-spacing: .2em;
  }
  .ps-view-btn:active { transform: translateY(-1px); }
  .ps-view-btn > * { position: relative; z-index: 1; }
  .ps-view-btn svg { transition: transform .35s cubic-bezier(.22,1,.36,1); }
  .ps-view-btn:hover svg { transform: translateX(5px); }

  .ps-ripple {
    position: absolute; border-radius: 50%;
    background: rgba(255,255,255,.25);
    transform: scale(0); animation: ps-ripple .7s linear;
    pointer-events: none; z-index: 0;
  }

  @media (max-width: 900px) {
    .ps-inner { padding: 0 24px; }
    .ps-grid-row .ps-card {
      flex: 0 0 calc(50% - 9px);
      max-width: calc(50% - 9px);
    }
  }
  @media (max-width: 560px) {
    .ps-inner { padding: 0 16px; }
    .ps-grid-row { flex-wrap: wrap; }
    .ps-grid-row .ps-card { flex: 0 0 100%; max-width: 100%; }
  }
`;

function PodcastCard({ pod }) {
  return (
    <a
      className="ps-card"
      href={pod.youtubeUrl}
      target="_blank"
      rel="noreferrer"
      style={{ textDecoration: 'none' }}
    >
      <div className="ps-card-thumb">
        <img src={pod.thumb} alt={pod.episode} />
        <div className="ps-card-thumb-grad" />
        <div className="ps-card-play">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <div className="ps-card-thumb-footer">
          <div className="ps-card-ep-badge">
            <span className="ps-card-ep-line" />
            {pod.episode}
          </div>
          <span className="ps-card-dur-pill">{pod.duration}</span>
        </div>
      </div>
      <div className="ps-card-body">
        <div className="ps-card-title">{pod.title}</div>
      </div>
    </a>
  );
}

export default function PodcastSection() {
  const handleRipple = (e) => {
    const btn = e.currentTarget;
    const r = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    r.className = 'ps-ripple';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 750);
  };

  const row1 = PODCASTS.slice(0, 3);
  const row2 = PODCASTS.slice(3, 5);

  return (
    <section className="ps" id="podcasts">
      <style>{css}</style>

      <div className="ps-inner">
        <div className="ps-header">
          <div className="ps-eyebrow-pill">
            <span className="ps-eyebrow-dot" />
            <span className="ps-eyebrow-text">Watch &amp; Listen</span>
          </div>
          <h2 className="ps-title">Our <em>Podcasts</em></h2>
          <p className="ps-subtitle">In-depth conversations, exam strategies and expert insights — all in one place.</p>
        </div>

        <div className="ps-grid">
          <div className="ps-grid-row">
            {row1.map(pod => <PodcastCard key={pod.id} pod={pod} />)}
          </div>
          <div className="ps-grid-row">
            {row2.map(pod => <PodcastCard key={pod.id} pod={pod} />)}
          </div>
        </div>

        <div className="ps-footer">
          <a
            className="ps-view-btn"
            href={CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: 'none' }}
            onClick={handleRipple}
          >
            <span>View All Podcasts</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}