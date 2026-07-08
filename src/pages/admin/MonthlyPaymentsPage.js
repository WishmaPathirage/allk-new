import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, updateDoc, deleteDoc,
  doc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../services/firebase';

const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtTime = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const fmtMonth = (val) => {
  if (!val) return '—';
  const [y, m] = val.split('-');
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const STREAM_COLORS = { Technology: '#2680c7', Commerce: '#27956b', Arts: '#c9720c' };
const STREAM_BG     = { Technology: '#e8f4fd', Commerce: '#e8f8f0', Arts: '#fdf0e8' };

const TYPE_OPTS = ['Paper', 'Tutes'];
const typeCfg = (type) => type === 'Paper'
  ? { bg: '#fdf0e8', color: '#c9720c' }
  : type === 'Tutes'
  ? { bg: '#e8f0fd', color: '#2680c7' }
  : { bg: '#f4f4f4', color: '#aaa' };

/* Returns true if a payment's stored type includes the given option */
const typeActive = (paymentType, opt) =>
  paymentType === opt || paymentType === 'Both';

/* Toggle one type on/off; supports Paper, Tutes, Both, or none */
const toggleType = (current, clicked) => {
  if (current === 'Both') return clicked === 'Paper' ? 'Tutes' : 'Paper';
  if (current === clicked) return null;
  if (current && current !== clicked) return 'Both';
  return clicked;
};

/* ── Status badge ── */
function StatusBadge({ status }) {
  const cfg = {
    pending:  { bg: '#fff8e6', color: '#bf7a00' },
    approved: { bg: '#e8f8f0', color: '#1a7a4a' },
    rejected: { bg: '#fff0f0', color: '#cc2a1e' },
  }[status] || { bg: '#f4f4f4', color: '#aaa' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 99, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Payment slip viewer ── */
function SlipViewer({ payment }) {
  const url  = payment.paymentSlipUrl || payment.slipUrl;
  const name = payment.paymentSlipFileName || payment.slipFileName;
  const [zoom, setZoom] = useState(100);

  if (!url) return <div style={{ color: '#ccc', fontSize: 13 }}>No slip uploaded</div>;
  const isPdf = name?.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <div>
        {/* zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
            −
          </button>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#888', minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
            +
          </button>
          <button
            onClick={() => setZoom(100)}
            style={{ fontSize: 11, fontWeight: 600, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 2 }}>
            Reset
          </button>
          <a href={url} target="_blank" rel="noreferrer"
            style={{ marginLeft: 'auto', fontSize: 11.5, fontWeight: 700, color: '#ff3c2e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Open
          </a>
        </div>
        {/* iframe viewer */}
        <div style={{ overflow: 'auto', border: '1.5px solid #eee', borderRadius: 12, background: '#f8f8f8' }}>
          <iframe
            src={url}
            title={name}
            style={{
              display: 'block',
              width: `${zoom}%`,
              minWidth: zoom < 100 ? '100%' : undefined,
              height: 480,
              border: 'none',
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    );
  }

  /* Image slip */
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button
          onClick={() => setZoom(z => Math.max(30, z - 10))}
          style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
          −
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#888', minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button
          onClick={() => setZoom(z => Math.min(200, z + 10))}
          style={{ width: 30, height: 30, borderRadius: 7, border: '1.5px solid #eee', background: '#fafafa', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
          +
        </button>
        <button
          onClick={() => setZoom(100)}
          style={{ fontSize: 11, fontWeight: 600, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 2 }}>
          Reset
        </button>
      </div>
      <div style={{ overflow: 'auto', border: '1.5px solid #eee', borderRadius: 12 }}>
        <img
          src={url}
          alt="Payment slip"
          style={{ display: 'block', width: `${zoom}%`, minWidth: zoom < 100 ? '100%' : undefined, borderRadius: 10 }}
        />
      </div>
    </div>
  );
}

/* ── Detail modal ── */
function DetailModal({ payment, onClose, onApprove, onReject, onSetType }) {
  if (!payment) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 90px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Monthly Payment — {fmtMonth(payment.month)}</span>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 28px' }}>
          {payment._resolvedStudentId && (
            <div style={{ background: '#e8f8f0', border: '1.5px solid #a8dfc4', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7a4a" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#27956b', marginBottom: 2 }}>Student ID</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a4a32', fontFamily: 'monospace', letterSpacing: '.06em' }}>{payment._resolvedStudentId}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}><StatusBadge status={payment.status} /></div>
            </div>
          )}
          {!payment._resolvedStudentId && (
            <div style={{ background: '#f4f4f4', border: '1.5px solid #e8e8e8', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#aaa', marginBottom: 2 }}>Student ID</div>
                <div style={{ fontSize: 13, color: '#ccc' }}>Not yet assigned (pending approval)</div>
              </div>
              <StatusBadge status={payment.status} />
            </div>
          )}

          <div style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: 11, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Payment Type</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {TYPE_OPTS.map(type => {
                const c = typeCfg(type);
                const active = typeActive(payment.paymentType, type);
                return (
                  <button
                    key={type}
                    onClick={() => onSetType(payment.id, type, payment.paymentType)}
                    style={{
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                      padding: '8px 22px', borderRadius: 99, cursor: 'pointer',
                      border: active ? 'none' : '1.5px solid #eee',
                      background: active ? c.bg : '#f8f8f8',
                      color: active ? c.color : '#aaa',
                      transition: 'all .15s',
                    }}
                  >
                    {active && '✓ '}{type}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            {[
              { lbl: 'Full Name',  val: payment.studentName },
              { lbl: 'Email',      val: payment.email },
              { lbl: 'Phone',      val: payment.phone },
              { lbl: 'Address',    val: payment.address },
              { lbl: 'Month',      val: fmtMonth(payment.month) },
              { lbl: 'Submitted',  val: `${fmtDate(payment.submittedAt)} ${fmtTime(payment.submittedAt)}` },
            ].map(({ lbl, val }) => (
              <div key={lbl} style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: 11, padding: '12px 15px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#222', wordBreak: 'break-word' }}>{val || '—'}</div>
              </div>
            ))}
          </div>

          {payment.selectedTeachers?.length > 0 && (
            <div style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: 11, padding: '12px 15px', marginBottom: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Paying For</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {payment.selectedTeachers.map((t, idx) => {
                  const key = t?.id || idx;
                  const label = t?.subject || t?.name || (typeof t === 'string' ? t : '—');
                  const bg = STREAM_BG[t?.stream] || '#f4f4f4';
                  const color = STREAM_COLORS[t?.stream] || '#555';
                  return (
                    <span key={key} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, background: bg, color }}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 10 }}>Payment Slip</div>
            <SlipViewer payment={payment} />
          </div>
        </div>

        {payment.status === 'pending' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => { onApprove(payment.id); onClose(); }}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#fff', background: '#27956b', border: 'none', borderRadius: 10, padding: 13, cursor: 'pointer' }}>
              ✓ Approve Payment
            </button>
            <button
              onClick={() => { onReject(payment.id); onClose(); }}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#bf7a00', background: '#fff8e6', border: '1.5px solid #f0d080', borderRadius: 10, padding: 13, cursor: 'pointer' }}>
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PDF export ── */
function downloadPDF(students, monthLabel) {
  if (!students.length) return;
  const PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < students.length; i += PER_PAGE)
    pages.push(students.slice(i, i + PER_PAGE));

  const cardHTML = (s, idx) => {
    const subjects  = (s.selectedTeachers || []).map(t => t?.subject || t?.name || (typeof t === 'string' ? t : '')).filter(Boolean).join(', ') || '—';
    const c         = s.paymentType === 'Both' ? { bg: '#f0eafd', color: '#7c3aed' } : typeCfg(s.paymentType);
    const typeLabel = s.paymentType === 'Both' ? 'Paper + Tutes' : s.paymentType || '—';
    const sid       = s._resolvedStudentId || s.studentId || '—';
    return `
    <div class="card">
      <div class="card-num">${idx + 1}</div>
      <div class="card-top">
        <div class="badge">${sid}</div>
        <div class="type-pill" style="background:${c.bg};color:${c.color}">${typeLabel}</div>
      </div>
      <div class="name">${s.studentName || '—'}</div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${s.phone || '—'}</span></div>
      <div class="row"><span class="lbl">Address</span><span class="val">${s.address || '—'}</span></div>
      <div class="row"><span class="lbl">Batch</span><span class="val">${s.batch || '—'}</span></div>
      <div class="row"><span class="lbl">Subjects</span><span class="val subjects">${subjects}</span></div>
      <div class="row"><span class="lbl">Month</span><span class="val">${s._monthLabel || '—'}</span></div>
    </div>`;
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Students — ${monthLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
    .page { width: 210mm; min-height: 297mm; padding: 14mm 14mm 12mm; page-break-after: always; }
    .page:last-child { page-break-after: avoid; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #ff3c2e; padding-bottom: 10px; margin-bottom: 14px; }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .logo { width: 36px; height: 36px; border-radius: 9px; background: #ff3c2e; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 14px; }
    .title { font-size: 17px; font-weight: 800; color: #111; }
    .subtitle { font-size: 11px; color: #aaa; margin-top: 2px; }
    .header-right { text-align: right; font-size: 11px; color: #aaa; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .card { border: 1.5px solid #e8e8e8; border-radius: 10px; padding: 10px 12px; position: relative; background: #fafafa; }
    .card-num { position: absolute; top: 8px; right: 10px; font-size: 9px; font-weight: 700; color: #ccc; }
    .card-top { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; flex-wrap: wrap; }
    .badge { display: inline-block; font-size: 10.5px; font-weight: 700; font-family: monospace; letter-spacing: .05em; background: #fff0f0; color: #ff3c2e; border-radius: 5px; padding: 2px 7px; }
    .type-pill { display: inline-block; font-size: 9.5px; font-weight: 700; border-radius: 99px; padding: 2px 7px; }
    .name { font-size: 12.5px; font-weight: 700; color: #111; margin-bottom: 6px; line-height: 1.3; }
    .row { display: flex; gap: 5px; margin-bottom: 2px; align-items: baseline; }
    .lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #bbb; min-width: 42px; flex-shrink: 0; }
    .val { font-size: 10.5px; color: #444; word-break: break-word; line-height: 1.4; }
    .subjects { font-size: 10px; color: #2680c7; font-weight: 600; }
    .footer { margin-top: 12px; text-align: center; font-size: 10px; color: #ccc; border-top: 1px solid #f0f0f0; padding-top: 8px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { page-break-after: always; } .page:last-child { page-break-after: avoid; } }
  </style></head><body>
  ${pages.map((group, pi) => `
    <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="logo">A</div>
          <div>
            <div class="title">Monthly Payments</div>
            <div class="subtitle">${monthLabel} &nbsp;·&nbsp; ${students.length} student${students.length !== 1 ? 's' : ''} total</div>
          </div>
        </div>
        <div class="header-right">
          Page ${pi + 1} of ${pages.length}<br/>
          Generated ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
        </div>
      </div>
      <div class="grid">
        ${group.map((s, i) => cardHTML(s, pi * PER_PAGE + i)).join('')}
      </div>
      <div class="footer">AL.LK Student Learning Management System &nbsp;—&nbsp; Confidential</div>
    </div>`).join('')}
  </body></html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

/* ── Main ── */
export default function MonthlyPaymentsPage({ toast, regs = [] }) {
  const [payments, setPayments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [detail, setDetail]           = useState(null);
  const [activeTab, setActiveTab]     = useState('all');
  const [statusFilter, setStatus]     = useState('all');
  const [monthFilter, setMonth]       = useState('all');
  const [typeFilters, setTypeFilters] = useState(new Set());
  const [subjectFilter, setSubject]   = useState('all');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, 'monthly_payments'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const findReg = (p) => {
    const byEmail = regs.filter(r => r.email === p.email);
    return byEmail.find(r => r.status === 'approved') || byEmail[0] || null;
  };

  const resolveStudentId = (p) => {
    if (p.studentId) return p.studentId;
    return findReg(p)?.studentId || null;
  };

  const withResolved = (p) => {
    const reg = findReg(p);
    return {
      ...p,
      _resolvedStudentId: p.studentId || reg?.studentId || null,
      address: p.address || reg?.address || null,
      batch:   p.batch   || reg?.batch   || null,
      phone:   p.phone   || reg?.phone   || null,
    };
  };

  const approve = async (id) => {
    await updateDoc(doc(db, 'monthly_payments', id), { status: 'approved', reviewedAt: new Date() });
    toast('Payment approved', 'success');
  };
  const reject = async (id) => {
    await updateDoc(doc(db, 'monthly_payments', id), { status: 'rejected', reviewedAt: new Date() });
    toast('Payment rejected', 'info');
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this payment record permanently?')) return;
    await deleteDoc(doc(db, 'monthly_payments', id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    toast('Deleted', 'info');
  };
  const setType = async (id, clickedOpt, currentType) => {
    const next = toggleType(currentType, clickedOpt);
    await updateDoc(doc(db, 'monthly_payments', id), { paymentType: next || null });
    setDetail(prev => prev?.id === id ? { ...prev, paymentType: next } : prev);
    const label = next === 'Both' ? 'Paper + Tutes' : next || 'None';
    toast(`Type set to ${label}`, 'success');
  };

  const toggleSelect = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const resetSelection = () => setSelected(new Set());

  const toggleTypeFilter = (type) => {
    setTypeFilters(prev => {
      const s = new Set(prev);
      s.has(type) ? s.delete(type) : s.add(type);
      return s;
    });
    resetSelection();
  };

  const allMonths = [...new Set(payments.map(p => p.month).filter(Boolean))].sort().reverse();

  const allSubjects = [...new Set(
    payments.flatMap(p =>
      (p.selectedTeachers || [])
        .map(t => t?.subject || t?.name || (typeof t === 'string' ? t : null))
        .filter(Boolean)
    )
  )].sort();

  const filtered = payments.filter(p => {
    if (activeTab === 'approved' && p.status !== 'approved') return false;
    if (activeTab === 'all' && statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (monthFilter !== 'all' && p.month !== monthFilter) return false;
    if (typeFilters.size > 0 && ![...typeFilters].some(t => typeActive(p.paymentType, t))) return false;
    if (subjectFilter !== 'all') {
      const subjects = (p.selectedTeachers || [])
        .map(t => t?.subject || t?.name || (typeof t === 'string' ? t : null))
        .filter(Boolean);
      if (!subjects.includes(subjectFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const sid = resolveStudentId(p)?.toLowerCase() || '';
      if (!p.studentName?.toLowerCase().includes(q) &&
          !p.email?.toLowerCase().includes(q) &&
          !sid.includes(q)) return false;
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    allFilteredSelected
      ? setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.delete(p.id)); return s; })
      : setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.add(p.id)); return s; });
  };

  const handleDownload = () => {
    let targets = someSelected
      ? filtered.filter(p => selected.has(p.id))
      : filtered.filter(p => p.status === 'approved');
    if (!targets.length) {
      toast(someSelected ? 'No selected records to export' : 'No approved students to export', 'error');
      return;
    }
    const label = monthFilter !== 'all' ? fmtMonth(monthFilter) : 'All Months';
    downloadPDF(targets.map(p => ({ ...withResolved(p), _monthLabel: fmtMonth(p.month) })), label);
  };

  const hasFilters = search || (activeTab === 'all' && statusFilter !== 'all') || monthFilter !== 'all' || typeFilters.size > 0 || subjectFilter !== 'all';
  const clearFilters = () => {
    setSearch(''); setStatus('all'); setMonth('all');
    setTypeFilters(new Set()); setSubject('all'); resetSelection();
  };

  const pending  = payments.filter(p => p.status === 'pending').length;
  const approved = payments.filter(p => p.status === 'approved').length;

  if (loading) return <div style={{ width: 36, height: 36, border: '3px solid #f0f0f0', borderTopColor: '#ff3c2e', borderRadius: '50%', animation: 'ad-spin .7s linear infinite', margin: '80px auto' }} />;

  const th = (label) => (
    <th style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#bbb', letterSpacing: '.07em', textTransform: 'uppercase', padding: '9px 14px', borderBottom: '1px solid #f4f4f4', whiteSpace: 'nowrap' }}>
      {label}
    </th>
  );

  const tabStyle = (tab) => ({
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 700,
    padding: '9px 20px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .15s',
    background: activeTab === tab ? '#ff3c2e' : 'transparent',
    color: activeTab === tab ? '#fff' : '#888',
  });

  return (
    <div>
      {/* stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { lbl: 'Total Payments', val: payments.length, color: '#27956b', bg: '#e8f8f0' },
          { lbl: 'Pending Review', val: pending,         color: '#bf7a00', bg: '#fff8e6' },
          { lbl: 'Approved',       val: approved,        color: '#2680c7', bg: '#e8f0fd' },
        ].map(s => (
          <div key={s.lbl} style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 5px rgba(0,0,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11.5, color: '#aaa', fontWeight: 500, marginBottom: 6 }}>{s.lbl}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#111', lineHeight: 1 }}>{s.val}</div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '6px 8px', marginBottom: 14, display: 'inline-flex', gap: 4, boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
        <button style={tabStyle('all')} onClick={() => { setActiveTab('all'); resetSelection(); }}>
          All Payments
        </button>
        <button style={tabStyle('approved')} onClick={() => { setActiveTab('approved'); resetSelection(); }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Approved Payments
            <span style={{
              fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99,
              background: activeTab === 'approved' ? 'rgba(255,255,255,.25)' : '#e8f8f0',
              color: activeTab === 'approved' ? '#fff' : '#1a7a4a',
            }}>
              {approved}
            </span>
          </span>
        </button>
      </div>

      {/* filters */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '12px 18px', marginBottom: 18, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 1px 5px rgba(0,0,0,.06)' }}>
        <input
          style={{ flex: 1, minWidth: 160, maxWidth: 220, fontFamily: 'inherit', fontSize: 12.5, color: '#333', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9, padding: '8px 12px', outline: 'none' }}
          placeholder="Search name, ID or email…"
          value={search} onChange={e => { setSearch(e.target.value); resetSelection(); }}
        />

        {/* status filter — hidden on approved tab */}
        {activeTab === 'all' && (
          <select
            style={{ fontFamily: 'inherit', fontSize: 12.5, color: '#555', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9, padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
            value={statusFilter} onChange={e => { setStatus(e.target.value); resetSelection(); }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}

        {/* month filter */}
        <select
          style={{ fontFamily: 'inherit', fontSize: 12.5, color: '#555', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9, padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
          value={monthFilter} onChange={e => { setMonth(e.target.value); resetSelection(); }}>
          <option value="all">All Months</option>
          {allMonths.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </select>

        {/* subject filter */}
        <select
          style={{ fontFamily: 'inherit', fontSize: 12.5, color: '#555', background: '#fafafa', border: '1.5px solid #eee', borderRadius: 9, padding: '8px 12px', outline: 'none', cursor: 'pointer' }}
          value={subjectFilter} onChange={e => { setSubject(e.target.value); resetSelection(); }}>
          <option value="all">All Subjects</option>
          {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* type toggle chips */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {TYPE_OPTS.map(type => {
            const c = typeCfg(type);
            const active = typeFilters.has(type);
            return (
              <button key={type} onClick={() => toggleTypeFilter(type)}
                style={{
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '7px 14px',
                  borderRadius: 99, cursor: 'pointer', border: active ? 'none' : '1.5px solid #eee',
                  background: active ? c.bg : '#fafafa', color: active ? c.color : '#aaa',
                  transition: 'all .15s',
                }}>
                {active && '✓ '}{type}
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button onClick={clearFilters}
            style={{ fontSize: 12, fontWeight: 600, color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {someSelected && (
            <span style={{ fontSize: 12, color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {selected.size} selected
            </span>
          )}
          <button onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#fff', background: someSelected ? '#27956b' : '#ff3c2e', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {someSelected ? `Download (${selected.size})` : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 5px rgba(0,0,0,.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #f4f4f4', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
            {activeTab === 'approved' ? 'Approved Payments' : 'Monthly Payment Submissions'}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', background: '#f4f4f4', padding: '3px 9px', borderRadius: 99 }}>{filtered.length}</span>
          {someSelected && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#27956b', background: '#e8f8f0', padding: '3px 9px', borderRadius: 99 }}>
              {selected.size} selected
            </span>
          )}
          {/* active filter pills */}
          {typeFilters.size > 0 && [...typeFilters].map(t => {
            const c = typeCfg(t);
            return (
              <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: c.bg, color: c.color }}>
                {t}
              </span>
            );
          })}
          {subjectFilter !== 'all' && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: '#e8f4fd', color: '#2680c7' }}>
              {subjectFilter}
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ccc' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <p style={{ fontSize: 14, marginTop: 10 }}>No payment submissions found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '9px 8px 9px 18px', borderBottom: '1px solid #f4f4f4', width: 32 }}>
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#ff3c2e' }} />
                  </th>
                  {th('Student')}
                  {th('Month')}
                  {th('Type')}
                  {th('Teachers')}
                  {activeTab === 'all' && th('Status')}
                  {th('Submitted')}
                  {th('Actions')}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sid = resolveStudentId(p);
                  const isSelected = selected.has(p.id);
                  return (
                    <tr key={p.id} style={{ background: isSelected ? '#f6fff8' : 'transparent' }}>
                      <td style={{ padding: '11px 8px 11px 18px', borderBottom: '1px solid #f8f8f8' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(p.id)}
                          style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#ff3c2e' }} />
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8' }}>
                        <div style={{ fontWeight: 600, color: '#111', fontSize: 13 }}>{p.studentName}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{p.email}</div>
                        {sid && (
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#27956b', fontFamily: 'monospace', letterSpacing: '.04em', marginTop: 2 }}>{sid}</div>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#333' }}>{fmtMonth(p.month)}</span>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {TYPE_OPTS.map(type => {
                            const c = typeCfg(type);
                            const active = typeActive(p.paymentType, type);
                            return (
                              <button key={type} onClick={() => setType(p.id, type, p.paymentType)} title={`Toggle ${type}`}
                                style={{ fontFamily: 'inherit', fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 99, cursor: 'pointer', border: active ? 'none' : '1.5px solid #eee', background: active ? c.bg : '#f8f8f8', color: active ? c.color : '#ccc', transition: 'all .15s' }}>
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8' }}>
                        {p.selectedTeachers?.length > 0
                          ? p.selectedTeachers.map((t, idx) => {
                            const key = t?.id || idx;
                            const label = t?.subject || t?.name || (typeof t === 'string' ? t : '?');
                            return (
                              <span key={key} style={{ display: 'inline-block', fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, margin: '2px 2px 2px 0', background: STREAM_BG[t?.stream] || '#f4f4f4', color: STREAM_COLORS[t?.stream] || '#555' }}>
                                {label}
                              </span>
                            );
                          })
                          : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>
                        }
                      </td>
                      {activeTab === 'all' && (
                        <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8' }}>
                          <StatusBadge status={p.status} />
                        </td>
                      )}
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12.5, color: '#333', fontWeight: 500 }}>{fmtDate(p.submittedAt)}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{fmtTime(p.submittedAt)}</div>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f8f8f8' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button title="View" onClick={() => setDetail(withResolved(p))}
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#f0f0f0', color: '#555', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {p.status === 'pending' && <>
                            <button title="Approve" onClick={() => approve(p.id)}
                              style={{ width: 28, height: 28, borderRadius: 7, background: '#e8f8f0', color: '#1a7a4a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            </button>
                            <button title="Reject" onClick={() => reject(p.id)}
                              style={{ width: 28, height: 28, borderRadius: 7, background: '#fff8e6', color: '#bf7a00', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </>}
                          <button title="Delete" onClick={() => remove(p.id)}
                            style={{ width: 28, height: 28, borderRadius: 7, background: '#fff0f0', color: '#cc2a1e', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          payment={detail}
          onClose={() => setDetail(null)}
          onApprove={approve}
          onReject={reject}
          onSetType={setType}
        />
      )}
    </div>
  );
}
