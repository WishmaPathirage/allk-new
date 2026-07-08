import { useState } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  .ft {
    background: linear-gradient(135deg, #c0000a 0%, #e8000d 35%, #b5000b 70%, #8a0008 100%);
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* concentric circle watermark */
  .ft-rings {
    position: absolute;
    right: -80px; top: 50%;
    transform: translateY(-50%);
    width: 520px; height: 520px;
    pointer-events: none;
    opacity: .10;
  }
  .ft-rings circle {
    fill: none;
    stroke: #fff;
    stroke-width: 1.2;
  }

  .ft-main {
    max-width: 1200px; margin: 0 auto;
    padding: 52px 56px 0;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 40px;
    position: relative; z-index: 1;
    align-items: start;
  }

  /* LEFT — brand */
  .ft-brand {}
  .ft-logo {
    display: inline-flex; align-items: center; justify-content: center;
    width: 40px; height: 40px; border-radius: 8px;
    background: rgba(255,255,255,.18);
    backdrop-filter: blur(6px);
    margin-bottom: 18px;
    border: 1px solid rgba(255,255,255,.22);
  }
  .ft-logo svg { display: block; }

  .ft-name {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 900;
    color: #fff; letter-spacing: -.02em;
    margin-bottom: 12px;
    line-height: 1;
  }

  .ft-desc {
    font-size: 13px; line-height: 1.65;
    color: rgba(255,255,255,.55);
    max-width: 280px;
    font-weight: 400;
  }

  .ft-socials {
    display: flex; align-items: center; gap: 14px;
    margin-top: 28px;
  }
  .ft-social-link {
    display: flex; align-items: center; justify-content: center;
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.75);
    text-decoration: none;
    transition: background .25s, color .25s, transform .25s cubic-bezier(.22,1,.36,1), border-color .25s;
  }
  .ft-social-link:hover {
    background: rgba(255,255,255,.28);
    color: #fff;
    border-color: rgba(255,255,255,.4);
    transform: translateY(-3px);
  }
  .ft-social-link svg { display: block; }

  /* RIGHT — nav links */
  .ft-nav {
    display: flex; flex-direction: column;
    gap: 10px;
    padding-top: 6px;
    align-items: flex-end;
  }
  .ft-nav-link {
    font-size: 14px; font-weight: 500;
    color: rgba(255,255,255,.7);
    text-decoration: none;
    letter-spacing: .01em;
    transition: color .22s, letter-spacing .22s;
    position: relative;
  }
  .ft-nav-link::after {
    content: '';
    position: absolute; bottom: -2px; right: 0;
    width: 0; height: 1px;
    background: #fff;
    transition: width .28s cubic-bezier(.22,1,.36,1);
  }
  .ft-nav-link:hover { color: #fff; letter-spacing: .04em; }
  .ft-nav-link:hover::after { width: 100%; }

  /* BOTTOM BAR */
  .ft-bottom {
    max-width: 1200px; margin: 0 auto;
    padding: 24px 56px 28px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 1;
    border-top: 1px solid rgba(255,255,255,.12);
    margin-top: 40px;
  }
  .ft-copy {
    font-size: 12px; color: rgba(255,255,255,.4);
    font-weight: 400;
  }
  .ft-legal {
    display: flex; align-items: center; gap: 6px;
  }
  .ft-legal-btn {
    font-size: 12px; color: rgba(255,255,255,.4);
    background: none; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    padding: 0;
    transition: color .22s;
  }
  .ft-legal-btn:hover { color: rgba(255,255,255,.85); }
  .ft-legal-sep {
    width: 3px; height: 3px; border-radius: 50%;
    background: rgba(255,255,255,.3);
  }

  /* ── Legal Modal ── */
  .ft-modal-bd {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(0,0,0,.6); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ft-modal-box {
    background: #fff; border-radius: 20px; width: 100%; max-width: 680px;
    max-height: 85vh; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 32px 90px rgba(0,0,0,.3);
    animation: ft-modal-in .3s cubic-bezier(.22,1,.36,1);
  }
  @keyframes ft-modal-in {
    from { opacity: 0; transform: scale(.95) translateY(16px); }
    to   { opacity: 1; transform: scale(1)  translateY(0); }
  }
  .ft-modal-hdr {
    padding: 20px 26px 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .ft-modal-title { font-size: 17px; font-weight: 700; color: #111; font-family: 'DM Sans', sans-serif; }
  .ft-modal-close {
    width: 34px; height: 34px; border-radius: 9px; background: #f5f5f5;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #777; transition: all .2s; flex-shrink: 0;
  }
  .ft-modal-close:hover { background: #ff3c2e; color: #fff; transform: rotate(90deg); }
  .ft-modal-body {
    flex: 1; overflow-y: auto; padding: 24px 26px 30px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #444; line-height: 1.75;
  }
  .ft-modal-body h2 {
    font-size: 15px; font-weight: 700; color: #111; margin: 20px 0 8px;
  }
  .ft-modal-body h2:first-child { margin-top: 0; }
  .ft-modal-body p { margin-bottom: 10px; }
  .ft-modal-body ul { padding-left: 20px; margin-bottom: 10px; }
  .ft-modal-body li { margin-bottom: 5px; }
  .ft-modal-footer {
    padding: 14px 26px; border-top: 1px solid #f0f0f0; flex-shrink: 0;
    display: flex; justify-content: flex-end;
  }
  .ft-modal-close-btn {
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 700;
    color: #fff; background: #ff3c2e; border: none; border-radius: 10px;
    padding: 11px 26px; cursor: pointer; transition: background .2s;
  }
  .ft-modal-close-btn:hover { background: #e03325; }

  @media (max-width: 680px) {
    .ft-main { grid-template-columns: 1fr; padding: 40px 24px 0; }
    .ft-nav { align-items: flex-start; }
    .ft-bottom { padding: 20px 24px 24px; flex-direction: column; gap: 12px; align-items: flex-start; }
    .ft-modal-box { border-radius: 14px; }
    .ft-modal-hdr, .ft-modal-footer { padding: 14px 18px; }
    .ft-modal-body { padding: 18px 18px 24px; }
  }
`;

const NAV_LINKS = [
  { label: "About",         href: "/#about"        },
  { label: "Social Stats",  href: "/#social-stats"  },
  { label: "Teachers",      href: "/#teachers"      },
  { label: "Podcasts",      href: "/#podcasts"      },
  { label: "Contact",       href: "/#contact"       },
  { label: "FAQ",           href: "/#faq"           },
];

const PRIVACY_POLICY = (
  <>
    <h2>1. Information We Collect</h2>
    <p>When you register or use AL.LK, we collect personal information such as your full name, email address, phone number, residential address, and academic stream/subjects. Payment slip images or PDFs are collected when you submit monthly payments.</p>

    <h2>2. How We Use Your Information</h2>
    <p>Your information is used to:</p>
    <ul>
      <li>Process and manage your class registration</li>
      <li>Assign and communicate your Student ID</li>
      <li>Verify monthly payment submissions</li>
      <li>Grant access to study materials, Zoom links, and class records</li>
      <li>Contact you regarding your enrollment or account</li>
    </ul>

    <h2>3. Data Storage</h2>
    <p>All data is stored securely using Google Firebase (Firestore and Firebase Storage). Payment slips are stored in Firebase Storage and are accessible only to authorised administrators.</p>

    <h2>4. Data Sharing</h2>
    <p>We do not sell, trade, or share your personal information with third parties. Student data is only accessible to AL.LK administrators and relevant teachers for the purpose of managing classes.</p>

    <h2>5. Data Retention</h2>
    <p>Student records are retained for the duration of enrolment. Upon admin deletion of a student account, associated data is removed from our active systems.</p>

    <h2>6. Cookies</h2>
    <p>This platform uses browser local storage and session storage to maintain your login state. No third-party tracking cookies are used.</p>

    <h2>7. Your Rights</h2>
    <p>You have the right to request access to your personal data or ask for corrections. Please contact the administrator via the Contact section on the home page.</p>

    <h2>8. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. Continued use of the platform constitutes acceptance of any changes.</p>

    <p style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>Last updated: May 2026</p>
  </>
);

const TERMS_AND_CONDITIONS = (
  <>
    <h2>1. Acceptance of Terms</h2>
    <p>By registering for and using AL.LK ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Platform.</p>

    <h2>2. Eligibility</h2>
    <p>The Platform is intended for students enrolled in A/L classes offered by AL.LK with Rashmika Soorya Bandara. Registration requires admin approval before access is granted.</p>

    <h2>3. Account Responsibilities</h2>
    <ul>
      <li>You are responsible for maintaining the confidentiality of your Student ID and account password.</li>
      <li>You must not share your login credentials with others.</li>
      <li>Any activity under your account is your responsibility.</li>
    </ul>

    <h2>4. Payment Policy</h2>
    <ul>
      <li>Monthly payments must be submitted on time via the Monthly Payment page.</li>
      <li>Payment slips must be genuine and accurate. Fraudulent submissions will result in account suspension.</li>
      <li>Payments are reviewed and approved by administrators.</li>
    </ul>

    <h2>5. Content Usage</h2>
    <p>All study materials, class recordings, and Zoom session links provided on the Platform are for personal educational use only. You may not:</p>
    <ul>
      <li>Distribute, sell, or share materials with non-enrolled individuals.</li>
      <li>Record or repost class sessions without explicit permission.</li>
      <li>Use content for any commercial purpose.</li>
    </ul>

    <h2>6. Code of Conduct</h2>
    <p>Students are expected to maintain respectful behaviour during all live sessions and interactions on the Platform. Disruptive or inappropriate behaviour may result in removal from the Platform.</p>

    <h2>7. Termination</h2>
    <p>Administrators reserve the right to suspend or terminate a student's account at any time for violations of these terms, non-payment, or any conduct deemed harmful to the Platform or its community.</p>

    <h2>8. Limitation of Liability</h2>
    <p>AL.LK is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Service availability is not guaranteed at all times.</p>

    <h2>9. Governing Law</h2>
    <p>These Terms are governed by the laws of Sri Lanka. Any disputes shall be resolved through appropriate channels in Sri Lanka.</p>

    <h2>10. Contact</h2>
    <p>For any questions regarding these Terms, please use the Contact section on the home page.</p>

    <p style={{ marginTop: 20, fontSize: 12, color: '#aaa' }}>Last updated: May 2026</p>
  </>
);

// SVG icons
const IconYouTube = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 0-3.4-3.4C14.68 3 12 3 12 3s-2.68 0-4.19.29a4.83 4.83 0 0 0-3.4 3.4A50.94 50.94 0 0 0 4 12a50.94 50.94 0 0 0 .41 5.31 4.83 4.83 0 0 0 3.4 3.4C9.32 21 12 21 12 21s2.68 0 4.19-.29a4.83 4.83 0 0 0 3.4-3.4A50.94 50.94 0 0 0 20 12a50.94 50.94 0 0 0-.41-5.31zM10 15V9l5 3-5 3z"/>
  </svg>
);
const IconFacebook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const IconTikTok = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z"/>
  </svg>
);

function LegalModal({ title, children, onClose }) {
  return (
    <div className="ft-modal-bd" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ft-modal-box">
        <div className="ft-modal-hdr">
          <span className="ft-modal-title">{title}</span>
          <button className="ft-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="ft-modal-body">{children}</div>
        <div className="ft-modal-footer">
          <button className="ft-modal-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [modal, setModal] = useState(null); // null | 'privacy' | 'terms'

  return (
    <footer className="ft">
      <style>{css}</style>

      {/* concentric rings watermark */}
      <svg className="ft-rings" viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">
        {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480].map(r => (
          <circle key={r} cx="260" cy="260" r={r} />
        ))}
      </svg>

      <div className="ft-main">
        {/* LEFT */}
        <div className="ft-brand">
          <div className="ft-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="ft-name">A/L.lk with Rashmika Soorya Bandara</div>
          <p className="ft-desc">
            Providing structured tuition classes focused on strong fundamentals, clear understanding, and consistent academic progress.
          </p>
          <div className="ft-socials">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="ft-social-link" aria-label="YouTube"><IconYouTube /></a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="ft-social-link" aria-label="Facebook"><IconFacebook /></a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="ft-social-link" aria-label="Instagram"><IconInstagram /></a>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="ft-social-link" aria-label="TikTok"><IconTikTok /></a>
          </div>
        </div>

        {/* RIGHT */}
        <nav className="ft-nav">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} className="ft-nav-link">{link.label}</a>
          ))}
        </nav>
      </div>

      <div className="ft-bottom">
        <span className="ft-copy">© 2026 AL.lk with Rashmika Soorya Bandara. All rights reserved.</span>
        <div className="ft-legal">
          <button className="ft-legal-btn" onClick={() => setModal('privacy')}>Privacy Policy</button>
          <span className="ft-legal-sep" />
          <button className="ft-legal-btn" onClick={() => setModal('terms')}>Terms &amp; Conditions</button>
        </div>
      </div>

      {modal === 'privacy' && (
        <LegalModal title="Privacy Policy" onClose={() => setModal(null)}>
          {PRIVACY_POLICY}
        </LegalModal>
      )}
      {modal === 'terms' && (
        <LegalModal title="Terms & Conditions" onClose={() => setModal(null)}>
          {TERMS_AND_CONDITIONS}
        </LegalModal>
      )}
    </footer>
  );
}
