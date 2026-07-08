import { useState, useEffect, useRef } from "react";

import faqVector from "../assets/faqvector.webp";

const RED = "#ff3c2e";

const faqs = [
  {
    stream: "Enrollment",
    q: "How do I choose and enroll with a teacher?",
    a: "Browse teacher profiles filtered by your A/L subject stream. Each profile shows qualifications, experience, student ratings, and a free sample class. Once you decide, enroll in one click and get instant access to your dashboard.",
    si: "ඔබේ A/L ධාරාවට ගැලපෙන ගුරුවරුන් බලා ඔබට ගැලපෙන කෙනෙකු තෝරා ගන්න. ලියාපදිංචි වූ ගමන් ඩෑෂ්බෝඩ් ලැබේ.",
  },
  {
    stream: "Live Classes",
    q: "How do live Zoom classes work?",
    a: "After enrolling you receive a Zoom link on your student dashboard before every scheduled class. Sessions are instructor-led with real-time Q&A. You also get calendar reminders so you never miss a session.",
    si: "ලියාපදිංචි වූ පසු සෑම පන්තියකටම පෙර Zoom link එක ඩෑෂ්බෝඩ් හරහා ලැබේ. ගුරුවරයා සජීවීව ඉගැන්වීම කරන අතර ප්‍රශ්න ද අසා ගත හැකිය.",
  },
  {
    stream: "Recordings",
    q: "What if I miss a live class?",
    a: "Every class is recorded and published to your dashboard within a few hours. Watch, pause, and rewind at your own pace. All recordings remain accessible for the full duration of your enrollment.",
    si: "සෑම පන්තියක්ම record වේ. මඟ හැරුණත් පැය කිහිපයකින් ඩෑෂ්බෝඩ් හරහා නරඹා ගත හැකිය.",
  },
  {
    stream: "Materials",
    q: "What learning materials will I receive?",
    a: "Teachers upload lesson notes, past papers, model answers, and revision guides — all organised by topic. Download them anytime and study fully offline from any device.",
    si: "ගුරුවරු notes, past papers සහ model answers ඩෑෂ්බෝඩ් හරහා upload කරයි. ඕනෑ වේලාවක download කර offline ද ඉගෙන ගත හැකිය.",
  },
  {
    stream: "Payment",
    q: "How does monthly payment work?",
    a: "Pay a monthly fee per teacher per subject. Payment is processed securely online and access activates instantly. No long-term contracts — cancel or switch teachers freely each month.",
    si: "එක් ගුරුවරයෙකුට මාසිකව ගෙවන්න. දිගු ගිවිසුම් නොමැත — ඕනෑ වේලාවක cancel කළ හැකිය.",
  },
];

const streamIcons = {
  Enrollment: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  "Live Classes": (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  Recordings: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  Materials: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Payment: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  Subjects: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Support: (col) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
};


function Illustration() {
  return (
    <img src={faqVector} alt="FAQ illustration" style={{ width: "100%", height: "auto", display: "block" }} />
  );
}

function FAQItem({ faq, index, isOpen, onToggle }) {
  const ref = useRef(null);
  const bodyRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [height, setHeight] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setHeight(isOpen && bodyRef.current ? bodyRef.current.scrollHeight : 0);
  }, [isOpen]);

  const IconFn = streamIcons[faq.stream];

  return (
    <div
      ref={ref}
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setToggleHovered(false); }}
      style={{
        borderRadius: 14, overflow: "hidden",
        border: isOpen ? `2px solid ${RED}` : hovered ? "2px solid #ffb3b5" : "2px solid #efefef",
        boxShadow: isOpen
          ? "0 8px 40px rgba(255,60,46,0.13)"
          : hovered ? "0 8px 32px rgba(255,60,46,0.1)"
          : "0 2px 10px rgba(0,0,0,0.04)",
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered && !isOpen ? "translateY(-4px)" : "translateY(0)"
          : "translateY(22px)",
        transition: `opacity 0.5s ease ${index * 50}ms, transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.2s, box-shadow 0.25s`,
        cursor: "pointer",
      }}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "20px 22px",
        background: isOpen ? RED : "#fff",
        transition: "background 0.25s ease",
      }}>

        {/* ── Icon ── */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isOpen ? "rgba(255,255,255,0.18)" : hovered ? "#fff0f0" : "#fafafa",
          border: isOpen ? "1.5px solid rgba(255,255,255,0.3)" : hovered ? `1.5px solid ${RED}` : "1.5px solid #efefef",
          display: "flex", alignItems: "center", justifyContent: "center",
          transform: hovered && !isOpen ? "scale(1.13) translateY(-2px)" : "scale(1)",
          boxShadow: hovered && !isOpen ? "0 8px 20px rgba(255,60,46,0.2)" : "none",
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          {IconFn && IconFn(isOpen ? "#fff" : hovered ? RED : "#aaa")}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: "0 0 4px", fontSize: 13, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: isOpen ? "rgba(255,255,255,0.7)" : "#ccc",
            fontFamily: "'DM Sans', sans-serif", transition: "color 0.25s",
          }}>{faq.stream}</p>
          <p style={{
            margin: 0, fontSize: 19, fontWeight: 800,
            color: isOpen ? "#fff" : hovered ? RED : "#111",
            lineHeight: 1.35, fontFamily: "'DM Sans', sans-serif", transition: "color 0.25s",
          }}>{faq.q}</p>
        </div>

        {/* ── Toggle ( + / × ) ── */}
        <div
          onMouseEnter={e => { e.stopPropagation(); setToggleHovered(true); }}
          onMouseLeave={e => { e.stopPropagation(); setToggleHovered(false); }}
          style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: isOpen ? "rgba(255,255,255,0.22)" : toggleHovered ? "#fff0f0" : "#f2f2f2",
            border: isOpen
              ? "1.5px solid rgba(255,255,255,0.35)"
              : toggleHovered ? `2px solid ${RED}` : "1.5px solid #e8e8e8",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
            transform: isOpen
              ? "rotate(45deg)"
              : toggleHovered ? "scale(1.22) rotate(0deg)" : "rotate(0deg)",
            boxShadow: !isOpen && toggleHovered
              ? `0 0 0 5px rgba(255,60,46,0.1), 0 4px 16px rgba(255,60,46,0.22)`
              : "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1v10M1 6h10"
              stroke={isOpen ? "#fff" : toggleHovered ? RED : "#999"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div style={{ height, overflow: "hidden", transition: "height 0.38s cubic-bezier(0.4,0,0.2,1)", background: "#fff" }}>
        <div ref={bodyRef}>
          <div className="faq-answer-pad" style={{ display: "flex" }}>
            <div style={{
              width: 6, borderRadius: 6, flexShrink: 0,
              background: `linear-gradient(180deg, ${RED} 0%, #ff8875 100%)`,
              alignSelf: "stretch", minHeight: 48, marginRight: 20,
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ margin: 0, fontSize: 16.5, color: "#555", lineHeight: 1.85, fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
                {faq.a}
              </p>
              <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", display: "block", marginBottom: 6 }}>සිංහල</span>
                <p style={{ margin: 0, fontSize: 15.5, color: "#777", lineHeight: 2, fontWeight: 400, fontFamily: "'Noto Sans Sinhala', 'DM Sans', sans-serif" }}>
                  {faq.si}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  return (
    <div id="faq" style={{ minHeight: "100vh", background: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&family=Noto+Sans+Sinhala:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cta-btn {
          background: ${RED}; color: #fff; border: none; border-radius: 12px;
          padding: 15px 32px; font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.02em;
          transition: background 0.15s, transform 0.2s, box-shadow 0.2s; white-space: nowrap;
        }
        .cta-btn:hover { background: #e03325; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,60,46,0.28); }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.8)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }

        .faq-outer { max-width: 1160px; margin: 0 auto; padding: 28px 32px 44px; }
        .faq-two-col {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 56px;
          align-items: start;
        }
        .faq-illust { position: sticky; top: 60px; animation: floatY 6s ease-in-out infinite; }
        .faq-answer-pad { display: flex; padding: 20px 22px 26px 80px; }

        @media (max-width: 900px) {
          .faq-two-col { grid-template-columns: 1fr; gap: 32px; }
          .faq-illust { display: none; }
        }
        @media (max-width: 600px) {
          .faq-outer { padding: 20px 16px 36px; }
          .faq-answer-pad { padding: 16px 16px 22px 16px; }
          .faq-item-header { padding: 16px 16px !important; gap: 10px !important; }
          .faq-item-icon { width: 36px !important; height: 36px !important; border-radius: 10px !important; }
          .faq-item-q { font-size: 16px !important; }
          .faq-toggle { width: 32px !important; height: 32px !important; }
        }
      `}</style>

      <div className="faq-outer">

        {/* ── TOP HEADER ── */}
        <div style={{
          textAlign: "center", marginBottom: 40,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(20px)",
          transition: "all 0.65s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#fff0f0", border: "1.5px solid #ffd5d5",
            borderRadius: 100, padding: "7px 18px", marginBottom: 22,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: RED, display: "inline-block", animation: "pulse 1.8s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: RED, letterSpacing: "0.14em", textTransform: "uppercase" }}>Student Help Center</span>
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(32px, 5.5vw, 64px)",
            fontWeight: 400, lineHeight: 1.08, color: "#0d0d0d",
            margin: "0 0 18px", letterSpacing: "-0.025em",
          }}>
            Frequently Asked <span style={{ color: RED, fontStyle: "normal" }}>Questions</span>
          </h1>

          <p style={{ fontSize: 17, color: "#888", lineHeight: 1.7, maxWidth: 520, margin: "0 auto", fontWeight: 400 }}>
            Everything you need to know about finding a teacher, joining live classes, and accessing your recordings and study materials.
          </p>
        </div>

        {/* ── TWO COLUMN: FAQ left · Illustration right ── */}
        <div
          className="faq-two-col"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease 0.15s" }}
        >
          {/* LEFT — FAQ accordion */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} isOpen={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </div>

          {/* RIGHT — Illustration sticky (hidden on mobile via CSS) */}
          <div className="faq-illust">
            <Illustration />
          </div>
        </div>
      </div>
    </div>
  );
}