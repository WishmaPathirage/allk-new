import { useState, useEffect } from "react";

const name = "with Rashmika Soorya Bandara";
const siteName = "A/L.LK";

function useTypewriter(text, speed = 80, startDelay = 0, enabled = false) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let i = 0;
    setDisplayed("");
    setDone(false);
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 300);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [text, speed, startDelay, enabled]);

  return { displayed, done };
}

export default function Preloader({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [siteTypingDone, setSiteTypingDone] = useState(false);

  const { displayed: siteDisplayed, done: siteDone } = useTypewriter(siteName, 90, 0, true);
  const { displayed: nameDisplayed } = useTypewriter(name, 55, 0, siteTypingDone);

  useEffect(() => {
    if (siteDone) setSiteTypingDone(true);
  }, [siteDone]);

  const handleSkip = () => {
    setFadeOut(true);
    sessionStorage.setItem('al_intro_done', '1');
    setTimeout(() => onComplete?.(), 600);
  };

  // Auto-dismiss after typing finishes + a short pause
  useEffect(() => {
    if (!siteTypingDone) return;
    const totalNameTime = name.length * 55 + 800;
    const t = setTimeout(handleSkip, totalNameTime);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteTypingDone]);

  return (
    <>
      <style>{`
        .preloader {
          position: fixed;
          inset: 0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          gap: 18px;
          transition: opacity 0.6s ease;
        }

        .preloader.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .site-name {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: clamp(3.5rem, 12vw, 7rem);
          letter-spacing: 0.15em;
          color: #ff0d00;
          user-select: none;
          min-height: 1.2em;
          text-align: center;
        }

        .divider {
          width: clamp(140px, 35vw, 280px);
          height: 1px;
          background: linear-gradient(to right, transparent, #c8102e, transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .divider.visible { opacity: 1; }

        .person-name {
          font-family: 'EB Garamond', serif;
          font-style: normal;
          font-weight: 600;
          font-size: clamp(1rem, 2.8vw, 1.25rem);
          letter-spacing: 0.22em;
          color: #cc0a00;
          user-select: none;
          text-transform: uppercase;
          min-height: 1.4em;
          text-align: center;
          padding: 0 24px;
        }

        .tw-cursor {
          display: inline-block;
          background: currentColor;
          vertical-align: middle;
          animation: blink 0.7s step-end infinite;
        }

        .site-name .tw-cursor { width: 4px; height: 0.85em; }
        .person-name .tw-cursor { width: 2px; height: 0.75em; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }

        .skip-btn {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          background: none;
          border: none;
          font-family: 'EB Garamond', serif;
          font-style: italic;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          color: #bbb;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.2s ease;
        }

        .skip-btn:hover { color: #ff3c2e; }

        .skip-btn::after {
          content: '';
          display: block;
          height: 1px;
          width: 0;
          background: #ff3c2e;
          transition: width 0.3s ease;
          margin-top: 2px;
        }

        .skip-btn:hover::after { width: 100%; }
      `}</style>

      <div className={`preloader${fadeOut ? " fade-out" : ""}`}>
        <div className="site-name">
          {siteDisplayed}
          {!siteDone && <span className="tw-cursor" />}
        </div>

        <div className={`divider${siteTypingDone ? " visible" : ""}`} />

        <div className="person-name">
          {nameDisplayed}
          {siteTypingDone && nameDisplayed.length < name.length && (
            <span className="tw-cursor" />
          )}
        </div>

        <button className="skip-btn" onClick={handleSkip}>
          skip intro →
        </button>
      </div>
    </>
  );
}