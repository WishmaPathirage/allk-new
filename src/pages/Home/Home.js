import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import HeroImage from '../../assets/Hero.webp';
import HeroVideo from '../../assets/HeroVideo.mp4';
import AboutUs from '../../components/aboutus';
import SocialMedia from '../../components/socialmediastatbar';
import FAQ from '../../components/faq';
import TeacherGallery from '../../components/teacherpage';
import Podcasts from '../../components/podcasts';
import ContactUs from '../Contact/Contact';
import Footer from '../../components/footer';
import RegistrationModal from '../../components/RegistrationModal';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');

  /* ── KEYFRAMES ── */
  @keyframes hp-fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hp-fadeLeft {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes hp-fadeRight {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes hp-revealBar {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes hp-floatY {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-16px); }
  }
  @keyframes hp-driftA {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(55px,-42px) scale(1.07); }
    66%     { transform: translate(-35px,28px) scale(0.95); }
  }
  @keyframes hp-driftB {
    0%,100% { transform: translate(0,0) scale(1); }
    33%     { transform: translate(-48px,38px) scale(1.05); }
    66%     { transform: translate(40px,-26px) scale(0.97); }
  }
  @keyframes hp-rotateSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes hp-rotateRev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes hp-scanLine {
    0%   { top: -4px; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes hp-pulseDot {
    0%,100% { transform: scale(1);   opacity: 0.5; }
    50%      { transform: scale(1.7); opacity: 1; }
  }
  @keyframes hp-floatLine {
    0%,100% { transform: translateY(0) rotate(var(--r)); opacity: var(--op); }
    50%      { transform: translateY(-18px) rotate(var(--r)); opacity: calc(var(--op)*0.35); }
  }
  @keyframes hp-morphBlob {
    0%,100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
    33%      { border-radius: 40% 60% 45% 55% / 60% 40% 60% 40%; }
    66%      { border-radius: 55% 45% 60% 40% / 40% 55% 45% 60%; }
  }
  @keyframes hp-shimmerBadge {
    0%   { left: -80%; opacity: 0; }
    15%  { opacity: 1; }
    100% { left: 130%; opacity: 0; }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── PAGE ── */
  .hp {
    min-height: 100vh;
    background: #fff;
    font-family: 'Inter', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* ── BACKGROUND ── */
  .hp-bg {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0;
    overflow: hidden;
  }
  .hp-orb-1 {
    position: absolute; width: 720px; height: 720px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.10) 0%, transparent 65%);
    top: -260px; right: -200px;
    animation: hp-driftA 20s ease-in-out infinite;
  }
  .hp-orb-2 {
    position: absolute; width: 520px; height: 520px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.07) 0%, transparent 65%);
    bottom: -170px; left: -130px;
    animation: hp-driftB 26s ease-in-out infinite;
  }
  .hp-blob {
    position: absolute; width: 230px; height: 230px;
    background: rgba(255,60,46,0.05);
    top: 32%; left: 62%;
    filter: blur(2px);
    animation: hp-morphBlob 14s ease-in-out infinite, hp-driftA 22s ease-in-out infinite 3s;
  }
  .hp-ring-1 {
    position: absolute; width: 480px; height: 480px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.10);
    top: -90px; right: -90px;
    animation: hp-rotateSlow 40s linear infinite;
  }
  .hp-ring-1::after {
    content: ''; position: absolute; inset: 55px; border-radius: 50%;
    border: 1px solid rgba(255,60,46,0.06);
  }
  .hp-ring-2 {
    position: absolute; width: 340px; height: 340px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.09);
    bottom: 6%; left: 3%;
    animation: hp-rotateRev 32s linear infinite;
  }
  .hp-ring-3 {
    position: absolute; width: 190px; height: 190px; border-radius: 50%;
    border: 1px dashed rgba(255,60,46,0.13);
    top: 52%; left: 46%;
    animation: hp-rotateSlow 22s linear infinite;
  }
  .hp-dots {
    position: absolute;
    background-image: radial-gradient(circle, rgba(255,60,46,0.16) 1.5px, transparent 1.5px);
    background-size: 22px 22px;
  }
  .hp-dots-1 { width: 210px; height: 210px; top: 7%; right: 4%; animation: hp-driftA 26s ease-in-out infinite 1s; }
  .hp-dots-2 { width: 160px; height: 160px; bottom: 14%; left: 5%; animation: hp-driftB 21s ease-in-out infinite 2s; }
  .hp-dots-3 { width: 130px; height: 130px; top: 42%; left: 50%; opacity: 0.6; animation: hp-driftA 18s ease-in-out infinite 4s; }
  /* ── SRI LANKA MAP ── */
  .hero-map-wrap {
    position: absolute;
    left: 32%; top: 14%;
    transform: rotate(-4deg);
    width: 270px;
    pointer-events: none;
    z-index: 0;
  }
  .hero-map-img {
    width: 100%; height: auto;
    display: block;
    mix-blend-mode: multiply;
    opacity: 0.18;
  }
  .hero-map-dot {
    position: absolute;
    width: 6px; height: 6px; border-radius: 50%;
    background: #ff3c2e;
    transform: translate(-50%, -50%);
    opacity: 0.7;
  }
  .hero-map-dot::after {
    content: '';
    position: absolute; inset: -5px; border-radius: 50%;
    border: 1.5px solid rgba(255,60,46,0.55);
    animation: hp-pulseDot 2.5s ease-in-out infinite;
  }
  .hmd-label {
    position: absolute;
    left: 10px; top: -5px;
    font-family: 'Inter', sans-serif;
    font-size: 7px; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: #ff3c2e;
    white-space: nowrap; opacity: 0.8;
  }
  .hp-scan {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.12), transparent);
    animation: hp-scanLine 9s ease-in-out infinite;
  }
  .hp-scan-2 {
    position: absolute; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.07), transparent);
    animation: hp-scanLine 14s ease-in-out infinite 5s;
  }
  .hp-fline {
    position: absolute; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,60,46,0.18), transparent);
    transform-origin: left center;
    animation: hp-floatLine var(--dur) ease-in-out infinite var(--delay);
  }

  /* ── CONTENT LAYER ── */
  .hp-content { position: relative; z-index: 1; }

  /* ── HERO ── */
  .hero {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .hero-sizer {
    width: 100%;
    height: auto;
    display: block;
    visibility: hidden;
    pointer-events: none;
  }
  .hero-slide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transition: opacity 1s ease;
  }
  .hero-slide-active { opacity: 1; z-index: 1; }
  .hero-slide-inactive { opacity: 0; z-index: 0; }
  .hero-slide img,
  .hero-slide video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .hero-btns {
    position: absolute;
    bottom: 8%;
    left: 0; right: 0;
    z-index: 3;
    display: flex;
    gap: 16px;
    justify-content: center;
    padding: 0 32px;
  }
  .hero-btn-primary {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #ff3c2e; background: #fff;
    border: 2px solid #fff; border-radius: 4px;
    padding: 15px 48px; cursor: pointer;
    transition: background 0.22s, color 0.22s;
  }
  .hero-btn-primary:hover { background: #f0f0f0; }
  .hero-btn-outline {
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #fff; background: #111;
    border: 2px solid #fff; border-radius: 4px;
    padding: 15px 48px; cursor: pointer;
    transition: background 0.22s, color 0.22s;
    text-decoration: none;
  }
  .hero-btn-outline:hover { background: #fff; color: #111; }
  .hero-dots {
    position: absolute;
    bottom: 3%;
    left: 0; right: 0;
    z-index: 3;
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  .hero-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: rgba(255,255,255,0.40);
    border: 2px solid rgba(255,255,255,0.75);
    padding: 0; cursor: pointer;
    transition: background 0.3s, transform 0.3s;
  }
  .hero-dot.active {
    background: #ff3c2e;
    border-color: #ff3c2e;
    transform: scale(1.25);
  }

  @media (max-width: 600px) {
    .hero-btns { gap: 8px; padding: 0 16px; bottom: 6%; }
    .hero-btn-primary, .hero-btn-outline { padding: 10px 20px; font-size: 10px; }
    .hero-dots { bottom: 2%; }
    .hero-dot { width: 8px; height: 8px; }
  }
`;

const flines = [
  { w: 290, top: '16%', left: '54%', r: '-8deg',  op: 0.55, dur: '10s', delay: '0s'  },
  { w: 210, top: '74%', left: '5%',  r: '5deg',   op: 0.45, dur: '12s', delay: '2s'  },
  { w: 250, top: '40%', left: '68%', r: '-6deg',  op: 0.50, dur: '14s', delay: '1s'  },
  { w: 160, top: '86%', left: '38%', r: '9deg',   op: 0.38, dur: '11s', delay: '3s'  },
  { w: 180, top: '58%', left: '80%', r: '-4deg',  op: 0.42, dur: '13s', delay: '1.5s'},
];

export default function Home() {
  const [showReg, setShowReg] = useState(false);
  const [slide, setSlide] = useState(0);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const [searchParams] = useSearchParams();
  useEffect(() => { if (searchParams.get('register') === '1') setShowReg(true); }, [searchParams]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (slide === 0) {
      document.body.classList.add('hero-video-playing');
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          /* Video autoplay blocked (common on mobile) — switch to image immediately */
          document.body.classList.remove('hero-video-playing');
          setSlide(1);
        });
      }
    } else {
      document.body.classList.remove('hero-video-playing');
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      timerRef.current = setTimeout(() => setSlide(0), 8000);
    }
    return () => {
      clearTimeout(timerRef.current);
      document.body.classList.remove('hero-video-playing');
    };
  }, [slide]);

  return (
    <div className="hp">
      <style>{css}</style>

      {/* ── BACKGROUND ── */}
      <div className="hp-bg">
        <div className="hp-orb-1" />
        <div className="hp-orb-2" />
        <div className="hp-blob" />
        <div className="hp-ring-1" />
        <div className="hp-ring-2" />
        <div className="hp-ring-3" />
        <div className="hp-dots hp-dots-1" />
        <div className="hp-dots hp-dots-2" />
        <div className="hp-dots hp-dots-3" />
        <div className="hp-scan" />
        <div className="hp-scan-2" />
        {flines.map((l, i) => (
          <div
            key={i}
            className="hp-fline"
            style={{ width: l.w, top: l.top, left: l.left, '--r': l.r, '--op': l.op, '--dur': l.dur, '--delay': l.delay }}
          />
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="hp-content">
        <Navbar />

        <section className="hero">
          {/* size driver */}
          <img src={HeroImage} alt="" className="hero-sizer" aria-hidden="true" />

          {/* slide 0 — video */}
          <div className={`hero-slide ${slide === 0 ? 'hero-slide-active' : 'hero-slide-inactive'}`}>
            <video
              ref={videoRef}
              src={HeroVideo}
              muted
              playsInline
              onEnded={() => setSlide(1)}
            />
          </div>

          {/* slide 1 — image */}
          <div className={`hero-slide ${slide === 1 ? 'hero-slide-active' : 'hero-slide-inactive'}`}>
            <img src={HeroImage} alt="Hero" />
          </div>

          {/* buttons */}
          <div className="hero-btns">
            <button className="hero-btn-primary" onClick={() => setShowReg(true)}>Register Now</button>
          </div>

          {/* slide indicators */}
          <div className="hero-dots">
            {[0, 1].map(i => (
              <button
                key={i}
                className={`hero-dot${slide === i ? ' active' : ''}`}
                onClick={() => setSlide(i)}
                aria-label={i === 0 ? 'Show video slide' : 'Show image slide'}
              />
            ))}
          </div>
        </section>

        <AboutUs />
        <SocialMedia />
        <TeacherGallery />
        <Podcasts />
        <FAQ />
        <ContactUs />
        <Footer />
      </div>

      {showReg && <RegistrationModal classInfo={null} onClose={() => setShowReg(false)} />}
    </div>
  );
}
