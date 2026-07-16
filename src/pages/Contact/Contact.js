import { useState, useRef } from 'react';
import { sendEmail } from '../../utils/brevo';
import Navbar from '../../components/Navbar/Navbar';

const ADMIN_EMAIL = 'allkwithrashmikasooryabandara@gmail.com';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes ct-fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ct-pulseDot {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50%       { transform: scale(1.7); opacity: 1; }
  }
  @keyframes ct-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes ct-checkPop {
    0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
    70%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ct-page {
    min-height: 100vh;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* soft background orbs */
  .ct-bg {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 0; overflow: hidden;
  }
  .ct-orb-1 {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.07) 0%, transparent 65%);
    top: -220px; right: -180px;
  }
  .ct-orb-2 {
    position: absolute; width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,60,46,0.05) 0%, transparent 65%);
    bottom: -120px; left: -100px;
  }

  /* ── CONTENT ── */
  .ct-content {
    position: relative; z-index: 1;
    padding-top: 70px;
  }

  .ct-hero {
    text-align: center;
    padding: 20px 24px 16px;
    animation: ct-fadeUp 0.7s ease 0.2s both;
  }

  .ct-eyebrow-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,60,46,0.08);
    border: 1px solid rgba(255,60,46,0.18);
    border-radius: 999px;
    padding: 6px 16px;
    margin-bottom: 18px;
  }
  .ct-eyebrow-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #ff3c2e;
    animation: ct-pulseDot 2s ease-in-out infinite;
    flex-shrink: 0;
  }
  .ct-eyebrow-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: #ff3c2e;
  }
  .ct-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(40px, 5.5vw, 64px);
    font-weight: 400;
    color: #111; line-height: 1.1;
    margin-bottom: 14px;
  }
  .ct-title em { font-style: normal; color: #ff3c2e; }

  .ct-subtitle {
    font-size: clamp(14px, 1.6vw, 16px);
    color: #666;
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* ── FORM CARD ── */
  .ct-card {
    max-width: 620px;
    margin: 0 auto 32px;
    padding: 0 24px;
    animation: ct-fadeUp 0.7s ease 0.35s both;
  }
  .ct-form {
    background: #fafafa;
    border: 1.5px solid #efefef;
    border-radius: 20px;
    padding: 40px 40px 36px;
  }

  /* ── FIELD GROUP ── */
  .ct-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .ct-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .ct-field:last-child { margin-bottom: 0; }

  .ct-label {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: #555;
  }
  .ct-input,
  .ct-textarea {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    color: #111;
    background: #fff;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    padding: 12px 16px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .ct-input::placeholder, .ct-textarea::placeholder { color: #bbb; }
  .ct-input:focus, .ct-textarea:focus {
    border-color: #ff3c2e;
    box-shadow: 0 0 0 3px rgba(255,60,46,0.10);
  }
  .ct-textarea {
    resize: vertical;
    min-height: 130px;
    line-height: 1.6;
  }

  /* error state */
  .ct-input.err, .ct-textarea.err {
    border-color: #ff3c2e;
    box-shadow: 0 0 0 3px rgba(255,60,46,0.10);
  }
  .ct-err-msg {
    font-size: 11px; color: #ff3c2e; margin-top: 2px;
  }

  /* ── SUBMIT ── */
  .ct-submit {
    width: 100%; margin-top: 24px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: #ff3c2e; color: #fff;
    border: none; border-radius: 50px;
    padding: 15px 32px;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(255,60,46,0.30);
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .ct-submit:hover:not(:disabled) {
    background: #e03325;
    transform: translateY(-2px);
    box-shadow: 0 14px 32px rgba(255,60,46,0.38);
  }
  .ct-submit:disabled { opacity: 0.65; cursor: not-allowed; }
  .ct-submit svg {
    width: 15px; height: 15px;
    stroke: #fff; stroke-width: 2.5; fill: none;
    transition: transform 0.2s;
  }
  .ct-submit:hover:not(:disabled) svg { transform: translateX(3px); }

  /* spinner */
  .ct-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: ct-spin 0.7s linear infinite;
  }

  /* ── SUCCESS STATE ── */
  .ct-success {
    text-align: center;
    padding: 48px 32px;
    animation: ct-fadeUp 0.5s ease both;
  }
  .ct-success-icon {
    width: 68px; height: 68px;
    background: #ff3c2e;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    animation: ct-checkPop 0.5s cubic-bezier(.22,1,.36,1) both;
    box-shadow: 0 12px 32px rgba(255,60,46,0.35);
  }
  .ct-success-icon svg {
    width: 28px; height: 28px;
    stroke: #fff; stroke-width: 2.5; fill: none;
  }
  .ct-success-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px; letter-spacing: 0.04em; color: #111;
    margin-bottom: 10px;
  }
  .ct-success-text {
    font-size: 14px; color: #666; line-height: 1.7;
    max-width: 360px; margin: 0 auto 28px;
  }
  .ct-success-back {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: #ff3c2e; text-decoration: none;
    border-bottom: 1.5px solid transparent;
    transition: border-color 0.2s;
  }
  .ct-success-back:hover { border-color: #ff3c2e; }

  /* ── GLOBAL ERROR BANNER ── */
  .ct-banner-err {
    background: rgba(255,60,46,0.08);
    border: 1.5px solid rgba(255,60,46,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px; color: #c0291f;
    margin-top: 18px;
    text-align: center;
  }

  @media (max-width: 540px) {
    .ct-row { grid-template-columns: 1fr; }
    .ct-form { padding: 28px 22px 24px; }
  }
`;

export default function Contact() {
  const formRef = useRef(null);
  const [fields, setFields]   = useState({ name: '', email: '', mobile: '', message: '' });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error

  const validate = () => {
    const e = {};
    if (!fields.name.trim())    e.name    = 'Name is required';
    if (!fields.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(fields.email)) e.email = 'Enter a valid email';
    if (!fields.mobile.trim())  e.mobile  = 'Mobile number is required';
    if (!fields.message.trim()) e.message = 'Please enter your message';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('sending');
    try {
      await sendEmail({
        to:      ADMIN_EMAIL,
        toName:  'A/L.lk Admin',
        subject: `New Contact Message from ${fields.name}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>New Contact Message - A/L.lk</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f2f2f5; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100% !important; min-width: 100%; }
    .outer { width: 100%; background: #f2f2f5; padding: 32px 16px; }
    .wrapper { max-width: 580px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #D0182C; padding: 36px 44px 32px; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; bottom: -40px; right: -30px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.07); }
    .header::before { content: ''; position: absolute; top: -50px; right: 60px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.05); }
    .logo { display: inline-block; background: #fff; color: #D0182C; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; padding: 6px 12px; border-radius: 3px; margin-bottom: 20px; position: relative; z-index: 1; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; position: relative; z-index: 1; }
    .header p { color: rgba(255,255,255,0.82); font-size: 14px; margin-top: 6px; position: relative; z-index: 1; }
    .body { padding: 40px 44px; }
    .intro { font-size: 15px; color: #1a1a2e; line-height: 1.7; margin-bottom: 28px; }
    .intro strong { color: #D0182C; }
    .details-card { background: #fff8f8; border: 1.5px solid #D0182C; border-radius: 6px; padding: 32px 20px 24px; margin-bottom: 32px; position: relative; }
    .details-card::before { content: 'CONTACT DETAILS'; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #D0182C; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; padding: 3px 14px; border-radius: 20px; white-space: nowrap; }
    .detail-row { background: #ffffff; border-radius: 4px; padding: 14px 16px; margin-bottom: 12px; border: 1px solid #f0d7d7; }
    .detail-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 5px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #1a1a2e; word-break: break-word; }
    .detail-value a { color: #D0182C; text-decoration: none; }
    .section-title { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #1a1a2e; margin-bottom: 14px; }
    .message-box { background: #f7f7fa; border-left: 3px solid #D0182C; border-radius: 0 4px 4px 0; padding: 18px 20px; font-size: 14px; color: #333; line-height: 1.7; margin-bottom: 28px; white-space: pre-line; word-break: break-word; }
    .cta-wrap { text-align: center; margin: 32px 0 28px; }
    .cta-btn { display: block; background: #D0182C; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 15px 36px; border-radius: 3px; text-align: center; }
    .divider { height: 1px; background: #ebebeb; margin: 28px 0; }
    .note { background: #fffbf0; border-left: 3px solid #f5a623; border-radius: 0 4px 4px 0; padding: 14px 18px; font-size: 13px; color: #6b4f00; line-height: 1.6; }
    .footer { background: #1a1a2e; padding: 28px 44px; text-align: center; }
    .footer-brand { color: rgba(255,255,255,0.7); font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px; }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.8; }
    .footer a { color: #D0182C; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer { padding: 0; } .wrapper { border-radius: 0; box-shadow: none; }
      .header { padding: 24px 20px 20px; } .header h1 { font-size: 17px; } .header p { font-size: 12px; }
      .logo { font-size: 12px; padding: 5px 10px; margin-bottom: 14px; } .body { padding: 24px 18px; }
      .intro { font-size: 14px; margin-bottom: 20px; } .details-card { padding: 28px 12px 18px; margin-bottom: 22px; }
      .detail-row { padding: 12px 14px; } .detail-value { font-size: 13px; } .section-title { font-size: 12px; }
      .message-box { font-size: 13px; padding: 14px 16px; } .cta-wrap { margin: 22px 0 20px; }
      .cta-btn { font-size: 13px; padding: 13px 16px; letter-spacing: 0.06em; } .note { font-size: 12px; padding: 12px 14px; }
      .footer { padding: 22px 18px; } .footer-brand { font-size: 12px; } .footer p { font-size: 11px; }
    }
  </style>
</head>
<body>
<div class="outer">
  <div class="wrapper">
    <div class="header">
      <div class="logo">A/L.lk</div>
      <h1>New website message received</h1>
      <p>Sri Lanka's #1 A/L Learning Platform</p>
    </div>
    <div class="body">
      <p class="intro">You have received a new message from the <strong>A/L.lk</strong> website contact form.</p>
      <div class="details-card">
        <div class="detail-row">
          <div class="detail-label">Name</div>
          <div class="detail-value">${fields.name}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Email</div>
          <div class="detail-value"><a href="mailto:${fields.email}">${fields.email}</a></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Mobile</div>
          <div class="detail-value"><a href="tel:${fields.mobile}">${fields.mobile}</a></div>
        </div>
      </div>
      <div class="section-title">Message</div>
      <div class="message-box">${fields.message}</div>
      <div class="cta-wrap">
        <a href="mailto:${fields.email}" class="cta-btn">Reply to Message</a>
      </div>
      <div class="divider"></div>
      <div class="note">⚠️ <strong>Note:</strong> This message was submitted through your A/L.lk website contact form. Please reply only after verifying the details.</div>
    </div>
    <div class="footer">
      <span class="footer-brand">A/L.lk - Sri Lanka's #1 A/L Platform</span>
      <p>This message was sent from your A/L.lk website contact form.<br>&copy; 2026 A/L.lk. All rights reserved.<br><a href="#">Privacy Policy</a></p>
    </div>
  </div>
</div>
</body>
</html>`,
      });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="ct-page" id="contact">
      <style>{css}</style>

      <div className="ct-bg">
        <div className="ct-orb-1" />
        <div className="ct-orb-2" />
      </div>

      <div className="ct-content">
        <Navbar />

        {/* hero heading */}
        <div className="ct-hero">
          <div className="ct-eyebrow-pill">
            <span className="ct-eyebrow-dot" />
            <span className="ct-eyebrow-text">Get In Touch</span>
          </div>
          <h1 className="ct-title">Connect <em>With Us</em></h1>
          <p className="ct-subtitle">
            Have a question, complaint, or just want to say hello?
            We'd love to hear from you. Drop us a message below.
          </p>
        </div>

        {/* form card */}
        <div className="ct-card">
          <div className="ct-form">
            {status === 'success' ? (
              <div className="ct-success">
                <div className="ct-success-icon">
                  <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="ct-success-title">Message Sent!</div>
                <p className="ct-success-text">
                  Thank you for reaching out. We'll get back to you as soon as possible.
                </p>
                <a href="/" className="ct-success-back">
                  ← Back to Home
                </a>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>

                {/* row: name + email */}
                <div className="ct-row">
                  <div className="ct-field">
                    <label className="ct-label" htmlFor="ct-name">Full Name</label>
                    <input
                      id="ct-name"
                      className={`ct-input${errors.name ? ' err' : ''}`}
                      type="text"
                      name="name"
                      placeholder="John Silva"
                      value={fields.name}
                      onChange={handleChange}
                    />
                    {errors.name && <span className="ct-err-msg">{errors.name}</span>}
                  </div>
                  <div className="ct-field">
                    <label className="ct-label" htmlFor="ct-email">Email Address</label>
                    <input
                      id="ct-email"
                      className={`ct-input${errors.email ? ' err' : ''}`}
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      value={fields.email}
                      onChange={handleChange}
                    />
                    {errors.email && <span className="ct-err-msg">{errors.email}</span>}
                  </div>
                </div>

                {/* mobile */}
                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-mobile">Mobile Number</label>
                  <input
                    id="ct-mobile"
                    className={`ct-input${errors.mobile ? ' err' : ''}`}
                    type="tel"
                    name="mobile"
                    placeholder="+94 77 123 4567"
                    value={fields.mobile}
                    onChange={handleChange}
                  />
                  {errors.mobile && <span className="ct-err-msg">{errors.mobile}</span>}
                </div>

                {/* message */}
                <div className="ct-field">
                  <label className="ct-label" htmlFor="ct-message">Message</label>
                  <textarea
                    id="ct-message"
                    className={`ct-textarea${errors.message ? ' err' : ''}`}
                    name="message"
                    placeholder="Write your question or complaint here…"
                    value={fields.message}
                    onChange={handleChange}
                  />
                  {errors.message && <span className="ct-err-msg">{errors.message}</span>}
                </div>

                <button className="ct-submit" type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? (
                    <><span className="ct-spinner" /> Sending…</>
                  ) : (
                    <>
                      Send Message
                      <svg viewBox="0 0 16 16">
                        <line x1="2" y1="8" x2="13" y2="8"/>
                        <polyline points="9,4 13,8 9,12"/>
                      </svg>
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <div className="ct-banner-err">
                    Something went wrong. Please try again or email us directly.
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
