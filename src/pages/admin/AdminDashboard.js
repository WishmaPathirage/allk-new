import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  collection, onSnapshot, updateDoc, deleteDoc, doc,
  query, orderBy, getDocs, //setDoc
} from 'firebase/firestore';
import { sendEmail } from '../../utils/brevo';
import { db, auth } from '../../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';
import RecordsPage from './RecordsPage';
import MaterialsPage from './MaterialsPage';
import MonthlyPaymentsPage from './MonthlyPaymentsPage';
import ZoomLinksPage from './ZoomLinksPage';
import TeacherAccountsPage from './TeacherAccountsPage';

const ALL_TEACHERS = [
  // { id: 'et',         name: 'Sandeepa Kathriarachchi', subject: 'Engineering Technology', stream: 'Technology' },
  // { id: 'sft',        name: 'Shanaka Ranathunga',      subject: 'Science for Technology', stream: 'Technology' },
  // { id: 'ict',        name: 'Ranishan Dissanayake',    subject: 'ICT',                    stream: 'Technology' },
  // { id: 'bs',         name: 'Kasun Weligama',          subject: 'Business Studies',       stream: 'Commerce'   },
  // { id: 'accounting', name: 'Prabhath Ariyasinghe',    subject: 'Accounting',             stream: 'Commerce'   },
  { id: 'econ',       name: 'Harsha Amarakon',         subject: 'Economics',              stream: 'Commerce'   },
  { id: 'geo',        name: 'Sameera Ekanayake',       subject: 'Geography',              stream: 'Arts'       },
  { id: 'sinhala',   name: 'Pathum Sandanuwan with Rashmika Soorya Bandara', subject: 'Sinhala', stream: 'Arts' },
  { id: 'political',  name: 'Amila Nishan Pitiduwa',   subject: 'Political Science',      stream: 'Arts'       },
  { id: 'media',      name: 'Praveen Kumarage',        subject: 'Media',                  stream: 'Arts'       },
];
const HIDDEN_TEACHER_IDS = new Set(['et', 'sft', 'ict', 'bs', 'accounting']);
const isVisibleTeacher = (teacher) => !HIDDEN_TEACHER_IDS.has(teacher?.id ?? teacher);

/* ─────────────────── helpers ─────────────────── */
const fmtDate = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtTime = (ts) => {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
const dispId = (i) => `R${String(i + 1).padStart(4, '0')}`;

/* ─────────────────── CSS ─────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ad-root { display: flex; min-height: 100vh; font-family: 'Inter', sans-serif; background: #f2f3f7; }

  /* ── Sidebar ── */
  .ad-sidebar {
    width: 230px; background: #16181f; display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
  }
  .ad-brand {
    padding: 22px 20px 18px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 12px;
  }
  .ad-brand-icon {
    width: 38px; height: 38px; border-radius: 11px; background: #ff3c2e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 15px; color: #fff;
  }
  .ad-brand-title { font-size: 12.5px; font-weight: 700; color: #fff; line-height: 1.35; }
  .ad-brand-sub   { font-size: 10.5px; color: #555; margin-top: 1px; }

  .ad-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
  .ad-nav-lbl {
    font-size: 9.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: #3a3d4a; padding: 6px 12px 8px;
  }
  .ad-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 11px;
    padding: 10px 13px; border-radius: 9px; cursor: pointer; margin-bottom: 3px;
    font-size: 13px; font-weight: 500; color: #6e7282;
    border: none; background: none; font-family: inherit; text-align: left;
    transition: background .18s, color .18s;
  }
  .ad-nav-btn:hover  { background: rgba(255,255,255,.05); color: #ccc; }
  .ad-nav-btn.on     { background: rgba(255,60,46,.14); color: #ff3c2e; font-weight: 600; }
  .ad-nav-btn .ad-cnt {
    margin-left: auto; background: #ff3c2e; color: #fff;
    font-size: 10px; font-weight: 700; min-width: 20px; height: 20px;
    border-radius: 99px; display: flex; align-items: center; justify-content: center; padding: 0 5px;
  }
  .ad-nav-divider { height: 1px; background: rgba(255,255,255,.06); margin: 8px 10px; }

  .ad-user {
    padding: 14px 16px; border-top: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; gap: 11px;
  }
  .ad-user-av {
    width: 36px; height: 36px; border-radius: 50%; background: #ff3c2e; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #fff;
  }
  .ad-user-name { font-size: 12.5px; font-weight: 600; color: #ddd; }
  .ad-user-role { font-size: 11px; color: #555; margin-top: 1px; }

  /* ── Main ── */
  .ad-main { margin-left: 230px; flex: 1; display: flex; flex-direction: column; }
  .ad-topbar {
    background: #fff; padding: 16px 30px;
    border-bottom: 1px solid #ebebeb;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 50;
  }
  .ad-page-title { font-size: 20px; font-weight: 800; color: #111; }
  .ad-topbar-right { text-align: right; }
  .ad-topbar-day  { font-size: 13px; font-weight: 600; color: #333; }
  .ad-topbar-date { font-size: 12px; color: #aaa; margin-top: 1px; }

  .ad-body { padding: 26px 30px 48px; }

  /* ── Stat cards ── */
  .ad-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-bottom: 26px; }
  .ad-stat {
    background: #fff; border-radius: 14px; padding: 20px 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ad-stat-lbl { font-size: 11.5px; color: #aaa; font-weight: 500; margin-bottom: 6px; }
  .ad-stat-val { font-size: 38px; font-weight: 800; color: #111; line-height: 1; }
  .ad-stat-sub { font-size: 11px; color: #ccc; margin-top: 5px; }
  .ad-stat-ico {
    width: 52px; height: 52px; border-radius: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .ad-stat-ico.green  { background: #e8f8f0; }
  .ad-stat-ico.blue   { background: #e8f0fd; }
  .ad-stat-ico.yellow { background: #fff8e6; }

  /* ── Card (table wrapper) ── */
  .ad-card {
    background: #fff; border-radius: 14px; overflow: hidden;
    box-shadow: 0 1px 5px rgba(0,0,0,.06); margin-bottom: 22px;
  }
  .ad-card-hdr {
    padding: 18px 24px 14px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid #f4f4f4;
  }
  .ad-card-hdr-left { display: flex; align-items: center; gap: 10px; }
  .ad-card-title    { font-size: 14.5px; font-weight: 700; color: #111; }
  .ad-card-badge    {
    font-size: 11px; font-weight: 700; color: #aaa;
    background: #f4f4f4; padding: 3px 10px; border-radius: 99px;
  }
  .ad-view-all-btn {
    font-size: 12px; font-weight: 700; color: #fff; background: #ff3c2e;
    border: none; border-radius: 8px; padding: 8px 18px; cursor: pointer;
    transition: background .2s, transform .2s; font-family: inherit;
  }
  .ad-view-all-btn:hover { background: #e03325; transform: translateY(-1px); }

  /* ── Toolbar (filters) ── */
  .ad-toolbar {
    padding: 14px 24px 0; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  }
  .ad-search {
    flex: 1; min-width: 180px; max-width: 280px;
    font-family: inherit; font-size: 13px; color: #333;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 9px;
    padding: 9px 14px; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .ad-search::placeholder { color: #ccc; }
  .ad-search:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.07); }
  .ad-select {
    font-family: inherit; font-size: 13px; font-weight: 500; color: #555;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 9px;
    padding: 9px 30px 9px 13px; outline: none; cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 11px center;
    transition: border-color .2s;
  }
  .ad-select:focus { border-color: #ff3c2e; }

  /* ── Table ── */
  .ad-table-wrap { overflow-x: auto; padding: 12px 0 0; }
  table.ad-tbl { width: 100%; border-collapse: collapse; }
  .ad-tbl th {
    text-align: left; font-size: 11px; font-weight: 700; color: #bbb;
    letter-spacing: .07em; text-transform: uppercase;
    padding: 10px 24px; border-bottom: 1px solid #f4f4f4; white-space: nowrap;
  }
  .ad-tbl td {
    padding: 13px 24px; font-size: 13px; color: #333;
    border-bottom: 1px solid #f8f8f8; vertical-align: middle;
  }
  .ad-tbl tr:last-child td { border-bottom: none; }
  .ad-tbl tr:hover td { background: #fcfcfc; }

  .ad-id    { font-size: 12px; font-weight: 700; color: #bbb; }
  .ad-sname { font-weight: 600; color: #111; }
  .ad-semail{ font-size: 11.5px; color: #aaa; margin-top: 2px; }
  .ad-tname { font-size: 12.5px; color: #555; }
  .ad-tpill {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 9px; border-radius: 99px; margin: 2px 3px 2px 0;
  }
  .ad-tpill.Technology { background: #e8f4fd; color: #2680c7; }
  .ad-tpill.Commerce   { background: #e8f8f0; color: #27956b; }
  .ad-tpill.Arts       { background: #fdf0e8; color: #c9720c; }

  /* Status badges */
  .ad-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 99px;
  }
  .ad-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .ad-badge.pending  { background: #fff8e6; color: #bf7a00; }
  .ad-badge.approved { background: #e8f8f0; color: #1a7a4a; }
  .ad-badge.rejected { background: #fff0f0; color: #cc2a1e; }

  /* Action buttons */
  .ad-acts { display: flex; gap: 7px; align-items: center; }
  .ad-ibtn {
    width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: all .18s;
  }
  .ad-ibtn.view    { background: #f0f0f0; color: #555; }
  .ad-ibtn.view:hover    { background: #e0e0e0; color: #111; }
  .ad-ibtn.approve { background: #e8f8f0; color: #1a7a4a; }
  .ad-ibtn.approve:hover { background: #27956b; color: #fff; }
  .ad-ibtn.reject  { background: #fff8e6; color: #bf7a00; }
  .ad-ibtn.reject:hover  { background: #e59b00; color: #fff; }
  .ad-ibtn.del     { background: #fff0f0; color: #cc2a1e; }
  .ad-ibtn.del:hover     { background: #ff3c2e; color: #fff; }

  /* Empty state */
  .ad-empty { text-align: center; padding: 60px 20px; color: #ccc; }
  .ad-empty p { font-size: 14px; margin-top: 10px; }

  /* Loading */
  @keyframes ad-spin { to{transform:rotate(360deg)} }
  .ad-spinner {
    width: 36px; height: 36px; border: 3px solid #f0f0f0;
    border-top-color: #ff3c2e; border-radius: 50%;
    animation: ad-spin .7s linear infinite; margin: 80px auto;
  }
  .ad-mini-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff; border-radius: 50%;
    animation: ad-spin .6s linear infinite; display: inline-block;
  }

  /* ── Slip / Detail Modal ── */
  .ad-modal-bd {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .ad-modal-box {
    background: #fff; border-radius: 20px; width: 100%; max-width: 680px;
    max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 32px 90px rgba(0,0,0,.25);
  }
  .ad-modal-hdr {
    padding: 18px 24px; border-bottom: 1px solid #f0f0f0;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .ad-modal-title { font-size: 16px; font-weight: 700; color: #111; }
  .ad-modal-close {
    width: 32px; height: 32px; border-radius: 8px; background: #f5f5f5;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #777;
    transition: all .2s;
  }
  .ad-modal-close:hover { background: #ff3c2e; color: #fff; transform: rotate(90deg); }
  .ad-modal-body { flex: 1; overflow-y: auto; padding: 22px 24px 28px; }

  .ad-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .ad-detail-item { background: #fafafa; border: 1.5px solid #eee; border-radius: 11px; padding: 13px 16px; }
  .ad-detail-lbl  { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #bbb; margin-bottom: 5px; }
  .ad-detail-val  { font-size: 13.5px; font-weight: 600; color: #222; word-break: break-word; }
  .ad-detail-full { grid-column: 1 / -1; }

  .ad-slip-section { margin-top: 16px; }
  .ad-slip-lbl { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #bbb; margin-bottom: 10px; }
  .ad-slip-img { width: 100%; border-radius: 12px; display: block; border: 1.5px solid #eee; }
  .ad-slip-pdf-link {
    display: flex; align-items: center; gap: 12px;
    background: #fff5f5; border: 1.5px solid #ffd0cd; border-radius: 12px;
    padding: 16px 20px; text-decoration: none;
    transition: background .2s;
  }
  .ad-slip-pdf-link:hover { background: #ffe8e6; }
  .ad-slip-pdf-text { font-size: 13.5px; font-weight: 600; color: #ff3c2e; }
  .ad-slip-pdf-sub  { font-size: 12px; color: #aaa; margin-top: 2px; }

  .ad-modal-footer {
    padding: 16px 24px; border-top: 1px solid #f0f0f0;
    display: flex; gap: 10px; flex-shrink: 0;
  }
  .ad-modal-approve {
    flex: 1; font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: #fff; background: #27956b;
    border: none; border-radius: 10px; padding: 13px; cursor: pointer;
    transition: background .2s, transform .2s;
  }
  .ad-modal-approve:hover { background: #1e7a57; transform: translateY(-1px); }
  .ad-modal-reject {
    flex: 1; font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: #bf7a00; background: #fff8e6;
    border: 1.5px solid #f0d080; border-radius: 10px; padding: 13px; cursor: pointer;
    transition: all .2s;
  }
  .ad-modal-reject:hover { background: #e59b00; color: #fff; border-color: transparent; }

  /* ── Students / Teachers grouped views ── */
  .ad-group-card {
    background: #fff; border-radius: 14px; padding: 18px 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06); margin-bottom: 14px;
    display: flex; align-items: center; gap: 16px;
    cursor: pointer; transition: box-shadow .2s, transform .2s;
  }
  .ad-group-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); transform: translateY(-2px); }
  .ad-group-av {
    width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; font-weight: 800; color: #fff; background: #ff3c2e;
  }
  .ad-group-name  { font-size: 14px; font-weight: 700; color: #111; }
  .ad-group-meta  { font-size: 12.5px; color: #aaa; margin-top: 3px; }
  .ad-group-right { margin-left: auto; text-align: right; }
  .ad-group-count { font-size: 26px; font-weight: 800; color: #111; line-height: 1; }
  .ad-group-clbl  { font-size: 11px; color: #aaa; }

  /* ── Upload section ── */
  .ad-up-wrap { max-width: 860px; }
  .ad-up-teacher-bar {
    background: #fff; border-radius: 14px; padding: 18px 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06); margin-bottom: 20px;
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .ad-up-teacher-bar label { font-size: 13px; font-weight: 600; color: #555; white-space: nowrap; }
  .ad-up-teacher-select {
    font-family: inherit; font-size: 13.5px; font-weight: 600; color: #111;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 10px;
    padding: 10px 36px 10px 14px; outline: none; cursor: pointer; appearance: none; flex: 1; min-width: 200px;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    transition: border-color .2s;
  }
  .ad-up-teacher-select:focus { border-color: #ff3c2e; }

  .ad-up-form {
    background: #fff; border-radius: 14px; padding: 22px;
    box-shadow: 0 1px 5px rgba(0,0,0,.06); margin-bottom: 20px;
  }
  .ad-up-form-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 16px; }
  .ad-up-field { margin-bottom: 14px; }
  .ad-up-label { font-size: 12px; font-weight: 700; color: #666; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 6px; display: block; }
  .ad-up-input {
    width: 100%; font-family: inherit; font-size: 13.5px; color: #333;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 10px;
    padding: 11px 14px; outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .ad-up-input:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.07); }
  .ad-up-textarea {
    width: 100%; font-family: inherit; font-size: 13.5px; color: #333;
    background: #fafafa; border: 1.5px solid #eee; border-radius: 10px;
    padding: 11px 14px; outline: none; resize: vertical; min-height: 90px;
    transition: border-color .2s, box-shadow .2s;
  }
  .ad-up-textarea:focus { border-color: #ff3c2e; box-shadow: 0 0 0 3px rgba(255,60,46,.07); }

  .ad-dropzone {
    border: 2px dashed #e0e0e0; border-radius: 12px; padding: 28px 20px;
    text-align: center; cursor: pointer; transition: all .2s; background: #fafafa;
  }
  .ad-dropzone:hover, .ad-dropzone.drag { border-color: #ff3c2e; background: #fff5f5; }
  .ad-dropzone.has-file { border-color: #27956b; background: #f0faf5; }
  .ad-dropzone-icon { color: #ccc; margin-bottom: 10px; }
  .ad-dropzone.has-file .ad-dropzone-icon { color: #27956b; }
  .ad-dropzone-text { font-size: 13.5px; font-weight: 600; color: #aaa; }
  .ad-dropzone.has-file .ad-dropzone-text { color: #27956b; }
  .ad-dropzone-sub { font-size: 11.5px; color: #ccc; margin-top: 4px; }

  .ad-up-btn {
    width: 100%; margin-top: 16px; font-family: inherit;
    font-size: 13.5px; font-weight: 700; color: #fff; background: #ff3c2e;
    border: none; border-radius: 11px; padding: 14px; cursor: pointer;
    transition: background .2s, transform .2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .ad-up-btn:hover:not(:disabled) { background: #e03325; transform: translateY(-1px); }
  .ad-up-btn:disabled { opacity: .6; cursor: not-allowed; }

  /* ── File list ── */
  .ad-file-list { background: #fff; border-radius: 14px; box-shadow: 0 1px 5px rgba(0,0,0,.06); overflow: hidden; }
  .ad-file-list-hdr {
    padding: 16px 20px; border-bottom: 1px solid #f4f4f4;
    display: flex; align-items: center; gap: 10px;
  }
  .ad-file-list-title { font-size: 14px; font-weight: 700; color: #111; }
  .ad-file-item {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 20px; border-bottom: 1px solid #f8f8f8;
    transition: background .15s;
  }
  .ad-file-item:last-child { border-bottom: none; }
  .ad-file-item:hover { background: #fcfcfc; }
  .ad-file-ico {
    width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .ad-file-ico.pdf { background: #fff0ef; }
  .ad-file-ico.img { background: #e8f4fd; }
  .ad-file-ico.doc { background: #e8f8f0; }
  .ad-file-name { font-size: 13px; font-weight: 600; color: #111; word-break: break-all; }
  .ad-file-meta { font-size: 11.5px; color: #aaa; margin-top: 2px; }
  .ad-file-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .ad-file-dl {
    font-size: 12px; font-weight: 700; color: #2680c7; background: #e8f0fd;
    border: none; border-radius: 7px; padding: 6px 12px; cursor: pointer;
    text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
    transition: background .2s;
  }
  .ad-file-dl:hover { background: #cce0f8; }
  .ad-file-del {
    width: 30px; height: 30px; border-radius: 7px; background: #fff0f0; color: #cc2a1e;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all .18s;
  }
  .ad-file-del:hover { background: #ff3c2e; color: #fff; }

  /* ── Toast ── */
  @keyframes ad-toast-in  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ad-toast-out { from{opacity:1} to{opacity:0} }
  .ad-toast-wrap {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    display: flex; flex-direction: column; gap: 10px; pointer-events: none;
  }
  .ad-toast {
    pointer-events: all; display: flex; align-items: center; gap: 12px;
    padding: 13px 18px; border-radius: 12px; min-width: 260px; max-width: 360px;
    box-shadow: 0 8px 30px rgba(0,0,0,.15); font-size: 13px; font-weight: 600;
    animation: ad-toast-in .28s ease;
  }
  .ad-toast.success { background: #e8f8f0; color: #1a7a4a; border: 1.5px solid #a8dfc4; }
  .ad-toast.error   { background: #fff0f0; color: #cc2a1e; border: 1.5px solid #ffb0aa; }
  .ad-toast.info    { background: #e8f0fd; color: #2060a7; border: 1.5px solid #a8c4e8; }
  .ad-toast.leaving { animation: ad-toast-out .3s ease forwards; }

  /* ── Hamburger button (hidden on desktop) ── */
  .ad-hamburger {
    display: none; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 9px;
    background: #f5f5f5; border: none; cursor: pointer;
    color: #333; flex-shrink: 0;
    transition: background .18s;
  }
  .ad-hamburger:hover { background: #eee; }

  /* ── Sidebar overlay backdrop ── */
  .ad-sidebar-backdrop {
    display: none; position: fixed; inset: 0; z-index: 99;
    background: rgba(0,0,0,.45);
  }
  .ad-sidebar-backdrop.open { display: block; }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .ad-stats { grid-template-columns: 1fr 1fr; }
    .ad-body { padding: 20px 20px 40px; }
    .ad-topbar { padding: 14px 20px; }
  }
  @media (max-width: 900px) {
    .ad-detail-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .ad-hamburger { display: flex; }
    .ad-sidebar {
      transform: translateX(-100%);
      transition: transform .28s cubic-bezier(.4,0,.2,1);
      z-index: 200;
    }
    .ad-sidebar.open { transform: translateX(0); }
    .ad-main { margin-left: 0; }
    .ad-stats { grid-template-columns: 1fr 1fr; }
    .ad-body { padding: 16px 14px 36px; }
    .ad-topbar { padding: 12px 16px; gap: 10px; }
    .ad-page-title { font-size: 16px; }
    .ad-tbl th, .ad-tbl td { padding: 10px 14px; font-size: 12px; }
    .ad-modal-box { border-radius: 14px; }
    .ad-modal-body { padding: 16px 16px 20px; }
    .ad-modal-hdr { padding: 14px 16px; }
    .ad-modal-footer { padding: 12px 16px; }
  }
  @media (max-width: 480px) {
    .ad-stats { grid-template-columns: 1fr; }
    .ad-stat-val { font-size: 28px; }
    .ad-page-title { font-size: 15px; }
    .ad-topbar-day { font-size: 12px; }
    .ad-topbar-date { font-size: 11px; }
    .ad-toolbar { padding: 10px 14px 0; }
    .ad-search { max-width: 100%; }
  }
`;

/* ─────────────────── Toast ─────────────────── */
function Toast({ toasts }) {
  return (
    <div className="ad-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`ad-toast ${t.type}${t.leaving ? ' leaving' : ''}`}>
          {t.type === 'success' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
          {t.type === 'error'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {t.type === 'info'    && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── sub-components ─────────────────── */
function StatusBadge({ status }) {
  return <span className={`ad-badge ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function PaySlipViewer({ url, name }) {
  const isPdf = name?.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="ad-slip-pdf-link">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="1.8" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div>
          <div className="ad-slip-pdf-text">{name}</div>
          <div className="ad-slip-pdf-sub">Click to open PDF in new tab</div>
        </div>
      </a>
    );
  }
  return <img src={url} alt="Payment slip" className="ad-slip-img" />;
}

function DetailModal({ reg, idx, onClose, onApprove, onReject }) {
  if (!reg) return null;
  return (
    <div className="ad-modal-bd" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ad-modal-box">
        <div className="ad-modal-hdr">
          <span className="ad-modal-title">Registration Details — {dispId(idx)}</span>
          <button className="ad-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="ad-modal-body">
          {reg.studentId && (
            <div style={{ background: '#e8f8f0', border: '1.5px solid #a8dfc4', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a7a4a" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#27956b', marginBottom: 2 }}>Student ID</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#1a4a32', fontFamily: 'monospace', letterSpacing: '.06em' }}>{reg.studentId}</div>
              </div>
            </div>
          )}

          <div className="ad-detail-grid">
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Full Name</div>
              <div className="ad-detail-val">{reg.studentName || '—'}</div>
            </div>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Email</div>
              <div className="ad-detail-val">{reg.email || '—'}</div>
            </div>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Phone</div>
              <div className="ad-detail-val">{reg.phone || '—'}</div>
            </div>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">A/L Batch</div>
              <div className="ad-detail-val">{reg.batch || '—'}</div>
            </div>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Status</div>
              <div className="ad-detail-val"><StatusBadge status={reg.status} /></div>
            </div>
            <div className="ad-detail-item ad-detail-full">
              <div className="ad-detail-lbl">Address</div>
              <div className="ad-detail-val">{reg.address || '—'}</div>
            </div>
          </div>

          {reg.classInfo && (
            <div className="ad-detail-grid">
              <div className="ad-detail-item">
                <div className="ad-detail-lbl">Subject / Class</div>
                <div className="ad-detail-val">{reg.classInfo.title}</div>
              </div>
              <div className="ad-detail-item">
                <div className="ad-detail-lbl">Batch</div>
                <div className="ad-detail-val">{reg.classInfo.grade}</div>
              </div>
              <div className="ad-detail-item">
                <div className="ad-detail-lbl">Class Time</div>
                <div className="ad-detail-val">{reg.classInfo.time}</div>
              </div>
              <div className="ad-detail-item">
                <div className="ad-detail-lbl">Days</div>
                <div className="ad-detail-val">{reg.classInfo.days?.join(', ')}</div>
              </div>
            </div>
          )}

          {reg.selectedTeachers?.filter(isVisibleTeacher).length > 0 && (
            <div className="ad-detail-item" style={{ marginBottom: 14 }}>
              <div className="ad-detail-lbl">Registered Teacher(s)</div>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {reg.selectedTeachers.filter(isVisibleTeacher).map(t => (
                  <span key={t.id} className={`ad-tpill ${t.stream}`} style={{ fontSize: 12.5, padding: '4px 12px' }}>
                    {t.name} · {t.subject}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="ad-detail-grid" style={{ marginBottom: 16 }}>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Registered On</div>
              <div className="ad-detail-val">{fmtDate(reg.registeredAt || reg.submittedAt)}</div>
            </div>
            <div className="ad-detail-item">
              <div className="ad-detail-lbl">Registered At</div>
              <div className="ad-detail-val">{fmtTime(reg.registeredAt || reg.submittedAt)}</div>
            </div>
          </div>

          {reg.paymentSlipUrl && (
            <div className="ad-slip-section">
              <div className="ad-slip-lbl">Payment Slip</div>
              <PaySlipViewer url={reg.paymentSlipUrl} name={reg.paymentSlipFileName} />
            </div>
          )}
        </div>

        {reg.status === 'pending' && (
          <div className="ad-modal-footer">
            <button className="ad-modal-approve" onClick={() => { onApprove(reg.id); onClose(); }}>
              ✓ Approve Registration
            </button>
            <button className="ad-modal-reject" onClick={() => { onReject(reg.id); onClose(); }}>
              ✕ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Registration row ─────────────────── */
function RegRow({ reg, idx, onView, onApprove, onReject, onDelete }) {
  const teachers = (reg.selectedTeachers || []).filter(isVisibleTeacher);
  return (
    <tr>
      <td><span className="ad-id">{dispId(idx)}</span></td>
      <td>
        <div className="ad-sname">{reg.studentName}</div>
        <div className="ad-semail">{reg.email}</div>
      </td>
      <td>
        {teachers.length > 0
          ? teachers.map(t => (
            <span key={t.id} className={`ad-tpill ${t.stream}`}>{t.subject}</span>
          ))
          : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
        }
      </td>
      <td>
        {reg.batch
          ? <span className="ad-tname">{reg.batch}</span>
          : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
        }
      </td>
      <td><StatusBadge status={reg.status} /></td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{fmtDate(reg.registeredAt || reg.submittedAt)}</div>
        <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>{fmtTime(reg.registeredAt || reg.submittedAt)}</div>
      </td>
      <td>
        <div className="ad-acts">
          <button className="ad-ibtn view" title="View details" onClick={() => onView(reg)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          {reg.status === 'pending' && <>
            <button className="ad-ibtn approve" title="Approve" onClick={() => onApprove(reg.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <button className="ad-ibtn reject" title="Reject" onClick={() => onReject(reg.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </>}
          <button className="ad-ibtn del" title="Delete" onClick={() => onDelete(reg.id)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────── Table component ─────────────────── */
function RegTable({ rows, allRegs, onView, onApprove, onReject, onDelete, showViewAll, onViewAll }) {
  return (
    <div className="ad-card">
      <div className="ad-card-hdr">
        <div className="ad-card-hdr-left">
          <span className="ad-card-title">
            {showViewAll ? 'Recent Pending Registrations' : 'All Registrations'}
          </span>
          <span className="ad-card-badge">{rows.length}</span>
        </div>
        {showViewAll && <button className="ad-view-all-btn" onClick={onViewAll}>View All</button>}
      </div>
      <div className="ad-table-wrap">
        {rows.length === 0 ? (
          <div className="ad-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <p>No registrations found</p>
          </div>
        ) : (
          <table className="ad-tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Subject(s)</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const idx = allRegs.findIndex(x => x.id === r.id);
                return (
                  <RegRow key={r.id} reg={r} idx={idx >= 0 ? idx : 0}
                    onView={onView} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


/* ─────────────────── NAV ─────────────────── */
const NAV = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    id: 'registrations', label: 'Registrations',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  },
  {
    id: 'students', label: 'Students',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    id: 'teachers', label: 'Teachers',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  },
  {
    id: 'monthly', label: 'Monthly Payments',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
  },
  {
    id: 'zoom', label: 'Zoom Links',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>
  },
  {
    id: 'records', label: 'Upload Records',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  },
  {
    id: 'materials', label: 'Study Materials',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  },
  {
    id: 'teacher-accounts', label: 'Teacher Accounts',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
  },
];


/* ─────────────────── STUDENTS TAB ─────────────────── */
function StudentsTab({ regs, toast, setTab, setStatusFilter, setSubjectFilter, setSearch, deleteRegs }) {
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStream, setStudentStream] = useState('all');
  const [studentSubject, setStudentSubject] = useState('all');
  const [editStudent, setEditStudent] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const studentMap = new Map();
  regs.filter(r => r.status === 'approved').forEach(r => {
    if (!studentMap.has(r.email)) {
      studentMap.set(r.email, { ...r, allRegs: [r] });
    } else {
      studentMap.get(r.email).allRegs.push(r);
    }
  });
  let studentList = [...studentMap.values()];

  if (studentSearch) {
    const q = studentSearch.toLowerCase();
    studentList = studentList.filter(s =>
      s.studentName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)
    );
  }
  if (studentStream !== 'all') {
    studentList = studentList.filter(s =>
      s.allRegs.some(r => r.selectedTeachers?.filter(isVisibleTeacher).some(t => t.stream === studentStream))
    );
  }
  if (studentSubject !== 'all') {
    studentList = studentList.filter(s =>
      s.allRegs.some(r => r.selectedTeachers?.filter(isVisibleTeacher).some(t => t.subject === studentSubject))
    );
  }

  const streams = ['Technology', 'Commerce', 'Arts'];
  const grouped = { Technology: [], Commerce: [], Arts: [], Other: [] };
  studentList.forEach(s => {
    const studentStreams = [...new Set(
      s.allRegs.flatMap(r => r.selectedTeachers?.filter(isVisibleTeacher).map(t => t.stream) || []).filter(Boolean)
    )];
    if (studentStreams.length === 0) { grouped['Other'].push(s); return; }
    const placed = new Set();
    studentStreams.forEach(st => {
      if (streams.includes(st) && !placed.has(st)) {
        grouped[st].push(s); placed.add(st);
      }
    });
    if (placed.size === 0) grouped['Other'].push(s);
  });

  const streamColors = { Technology: '#2680c7', Commerce: '#27956b', Arts: '#c9720c', Other: '#888' };
  const streamBg = { Technology: '#e8f0fd', Commerce: '#e8f8f0', Arts: '#fdf0e8', Other: '#f4f4f4' };

  const saveSubjectEdit = async () => {
    if (!editStudent) return;
    setEditSaving(true);
    try {
      const studentRegsToUpdate = regs.filter(r => r.email === editStudent.email);
      await Promise.all(studentRegsToUpdate.map(r =>
        updateDoc(doc(db, 'registrations', r.id), {
          selectedTeachers: editStudent.selectedTeachers
        })
      ));
      toast('Student subjects updated successfully', 'success');
      setEditStudent(null);
    } catch (e) {
      toast('Failed to update: ' + e.message, 'error');
    }
    setEditSaving(false);
  };

  const toggleTeacherInEdit = (teacher) => {
    setEditStudent(prev => {
      const exists = prev.selectedTeachers.some(t => t.id === teacher.id);
      return {
        ...prev,
        selectedTeachers: exists
          ? prev.selectedTeachers.filter(t => t.id !== teacher.id)
          : [...prev.selectedTeachers, teacher]
      };
    });
  };

  return (
    <>
      {editStudent && (
        <div className="ad-modal-bd" onClick={e => { if (e.target === e.currentTarget) setEditStudent(null); }}>
          <div className="ad-modal-box" style={{ maxWidth: 520 }}>
            <div className="ad-modal-hdr">
              <span className="ad-modal-title">Edit Subjects — {editStudent.studentName}</span>
              <button className="ad-modal-close" onClick={() => setEditStudent(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="ad-modal-body">
              <p style={{ fontSize: 12.5, color: '#aaa', marginBottom: 16 }}>
                Select which subjects this student is registered for. Changes apply to all their registrations.
              </p>
              {['Technology', 'Commerce', 'Arts'].map(stream => {
                const teachers = ALL_TEACHERS.filter(t => t.stream === stream);
                if (!teachers.length) return null;
                return (
                <div key={stream} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bbb', marginBottom: 8 }}>{stream}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {teachers.map(t => {
                      const selected = editStudent.selectedTeachers.some(x => x.id === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggleTeacherInEdit(t)}
                          style={{
                            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                            padding: '7px 14px', borderRadius: 99, cursor: 'pointer',
                            border: selected ? 'none' : '1.5px solid #eee',
                            background: selected ? streamBg[stream] : '#fafafa',
                            color: selected ? streamColors[stream] : '#aaa',
                            transition: 'all .15s'
                          }}
                        >
                          {selected && '✓ '}{t.subject}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );})}
            </div>
            <div className="ad-modal-footer">
              <button
                className="ad-modal-approve"
                onClick={saveSubjectEdit}
                disabled={editSaving}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {editSaving ? <span className="ad-mini-spinner" /> : '✓'} Save Changes
              </button>
              <button className="ad-modal-reject" onClick={() => setEditStudent(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="ad-search"
          style={{ maxWidth: 260 }}
          placeholder="Search by name, email, or ID…"
          value={studentSearch}
          onChange={e => setStudentSearch(e.target.value)}
        />
        <select className="ad-select" value={studentStream} onChange={e => { setStudentStream(e.target.value); setStudentSubject('all'); }}>
          <option value="all">All Streams</option>
          <option value="Technology">Technology</option>
          <option value="Commerce">Commerce</option>
          <option value="Arts">Arts</option>
        </select>
        <select className="ad-select" value={studentSubject} onChange={e => setStudentSubject(e.target.value)}>
          <option value="all">All Subjects</option>
          {(studentStream === 'all' ? ALL_TEACHERS : ALL_TEACHERS.filter(t => t.stream === studentStream))
            .map(t => <option key={t.id} value={t.subject}>{t.subject}</option>)}
        </select>
        {(studentSearch || studentStream !== 'all' || studentSubject !== 'all') && (
          <button
            onClick={() => { setStudentSearch(''); setStudentStream('all'); setStudentSubject('all'); }}
            style={{ fontSize: 12.5, fontWeight: 600, color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
          >Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#aaa' }}>
          {studentList.length} student{studentList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {studentList.length === 0 ? (
        <div className="ad-empty" style={{ paddingTop: 80 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>No students match your filters</p>
        </div>
      ) : (
        Object.entries(grouped).map(([stream, students]) => {
          if (students.length === 0) return null;
          return (
            <div key={stream} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ background: streamBg[stream], color: streamColors[stream], fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 99 }}>
                  {stream}
                </div>
                <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                <span style={{ fontSize: 12, color: '#bbb', fontWeight: 600 }}>{students.length} student{students.length !== 1 ? 's' : ''}</span>
              </div>

              {students.map((s, i) => {
                const initials = s.studentName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
                const allSubjectsForStudent = [...new Set(
                  s.allRegs.flatMap(r => r.selectedTeachers || []).filter(isVisibleTeacher).map(t => JSON.stringify({ id: t.id, name: t.name, subject: t.subject, stream: t.stream }))
                )].map(x => JSON.parse(x));
                const avatarColors = ['#ff3c2e','#2680c7','#27956b','#c9720c','#7c3aed','#db2777'];

                return (
                  <div key={s.email} className="ad-group-card" style={{ cursor: 'default' }}>
                    <div className="ad-group-av" style={{ background: avatarColors[i % avatarColors.length] }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ad-group-name">{s.studentName}</div>
                      <div className="ad-group-meta">{s.email}{s.phone ? ` · ${s.phone}` : ''}</div>
                      {s.studentId && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#27956b', fontFamily: 'monospace', marginTop: 3 }}>{s.studentId}</div>
                      )}
                      <div style={{ marginTop: 7, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {allSubjectsForStudent.map(t => (
                          <span key={t.id} className={`ad-tpill ${t.stream}`}>{t.subject}</span>
                        ))}
                        {allSubjectsForStudent.length === 0 && (
                          <span style={{ fontSize: 11.5, color: '#ccc' }}>No subjects</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <div className="ad-group-right" style={{ textAlign: 'right' }}>
                        <div className="ad-group-count">{s.allRegs.length}</div>
                        <div className="ad-group-clbl">reg{s.allRegs.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditStudent({ ...s, selectedTeachers: allSubjectsForStudent })}
                          style={{ fontSize: 11.5, fontWeight: 700, color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                          Edit Subjects
                        </button>
                        <button
                          onClick={() => { setStatusFilter('all'); setSubjectFilter('all'); setSearch(s.studentName || ''); setTab('registrations'); }}
                          style={{ fontSize: 11.5, fontWeight: 600, color: '#555', background: '#f4f4f4', border: '1.5px solid #eee', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                          View Regs
                        </button>
                        <button
                          onClick={() => deleteRegs(s.allRegs.map(r => r.id), s.studentName)}
                          style={{ fontSize: 11.5, fontWeight: 700, color: '#cc2a1e', background: '#fff0f0', border: '1.5px solid #ffb0aa', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </>
  );
}

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('dashboard');
  const [tabHistory, setTabHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailReg, setDetailReg] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [streamFilter, setStreamFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  /* toast helper */
  const toast = (message, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320);
    }, 3500);
  };

  /* real-time listener — registrations (ascending = oldest first → R0001 = first ever reg) */
  useEffect(() => {
    const q = query(collection(db, 'registrations'), orderBy('registeredAt', 'asc'));
    const unsub = onSnapshot(q,
      snap => { setRegs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); },
      ()   => setLoading(false)
    );
    return unsub;
  }, []);

  /* real-time listener — monthly payments */
  useEffect(() => {
    const q = query(collection(db, 'monthly_payments'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q,
      snap => setMonthlyPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    return unsub;
  }, []);

  /* actions */
  const approve = async (id) => {
    try {
      const reg = regs.find(r => r.id === id);
      if (!reg) { toast('Registration not found — please refresh and try again', 'error'); return; }

      /* Read all existing studentIds directly from Firestore to avoid stale state */
      const snap = await getDocs(collection(db, 'registrations'));
      const maxSeq = snap.docs
        .map(d => d.data().studentId)
        .filter(Boolean)
        .map(sid => parseInt(sid.slice(8), 10))   // 'ALLK2026' = 8 chars, rest is sequence
        .filter(n => !isNaN(n))
        .reduce((max, n) => (n > max ? n : max), 0);
      const studentId = 'ALLK' + new Date().getFullYear() + String(maxSeq + 1).padStart(4, '0');

      await updateDoc(doc(db, 'registrations', id), {
        status: 'approved',
        reviewedAt: new Date(),
        studentId,
      });

      if (reg.email) {
        const subjectName = (reg.selectedTeachers || []).filter(isVisibleTeacher).map(t => {
          if (typeof t === 'string') return ALL_TEACHERS.find(at => at.id === t)?.subject || t;
          return t.subject || t.name || t.id || t;
        }).join(', ') || '—';

        try {
          await sendEmail({
            to:      reg.email,
            toName:  reg.studentName || 'Student',
            subject: 'Registration Approved — A/L.lk',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Student ID — A/L.lk</title>
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
    .greeting { font-size: 15px; color: #1a1a2e; line-height: 1.7; margin-bottom: 28px; }
    .greeting strong { color: #D0182C; }
    .id-card { background: #fff8f8; border: 1.5px solid #D0182C; border-radius: 6px; padding: 32px 20px 24px; text-align: center; margin-bottom: 32px; position: relative; }
    .id-card::before { content: 'YOUR STUDENT ID'; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #D0182C; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; padding: 3px 14px; border-radius: 20px; white-space: nowrap; }
    .student-id { font-size: 30px; font-weight: 800; letter-spacing: 0.1em; color: #D0182C; font-family: 'Courier New', Courier, monospace; margin-bottom: 8px; word-break: break-all; }
    .id-note { font-size: 12px; color: #888; letter-spacing: 0.04em; }
    .info-row { background: #f7f7fa; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; width: 100%; }
    .info-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .steps-title { font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #1a1a2e; margin-bottom: 16px; }
    .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .step-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #D0182C; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
    .step-text { font-size: 14px; color: #444; line-height: 1.6; }
    .step-text strong { color: #1a1a2e; }
    .step-code { display: inline-block; background: #f2f2f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; font-family: 'Courier New', Courier, monospace; word-break: break-all; }
    .cta-wrap { text-align: center; margin: 32px 0 28px; }
    .cta-btn { display: block; background: #D0182C; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 15px 36px; border-radius: 3px; text-align: center; }
    .divider { height: 1px; background: #ebebeb; margin: 28px 0; }
    .warning { background: #fffbf0; border-left: 3px solid #f5a623; border-radius: 0 4px 4px 0; padding: 14px 18px; font-size: 13px; color: #6b4f00; line-height: 1.6; margin-bottom: 28px; }
    .contact-text { font-size: 13px; color: #888; line-height: 1.7; }
    .contact-text a { color: #D0182C; text-decoration: none; }
    .footer { background: #1a1a2e; padding: 28px 44px; text-align: center; }
    .footer-brand { color: rgba(255,255,255,0.7); font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px; }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.8; }
    .footer a { color: #D0182C; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer { padding: 0; } .wrapper { border-radius: 0; box-shadow: none; }
      .header { padding: 24px 20px 20px; } .header h1 { font-size: 17px; } .header p { font-size: 12px; }
      .logo { font-size: 12px; padding: 5px 10px; margin-bottom: 14px; } .body { padding: 24px 18px; }
      .greeting { font-size: 14px; margin-bottom: 20px; } .id-card { padding: 28px 12px 18px; margin-bottom: 22px; }
      .student-id { font-size: 20px; letter-spacing: 0.05em; } .id-note { font-size: 11px; }
      .info-row { padding: 12px 14px; margin-bottom: 20px; } .info-value { font-size: 13px; }
      .steps-title { font-size: 12px; } .step { gap: 10px; margin-bottom: 14px; }
      .step-num { width: 24px; height: 24px; font-size: 11px; } .step-text { font-size: 13px; } .step-code { font-size: 12px; }
      .cta-wrap { margin: 22px 0 20px; } .cta-btn { font-size: 13px; padding: 13px 16px; letter-spacing: 0.06em; }
      .warning { font-size: 12px; padding: 12px 14px; margin-bottom: 20px; } .contact-text { font-size: 12px; }
      .footer { padding: 22px 18px; } .footer-brand { font-size: 12px; } .footer p { font-size: 11px; }
    }
  </style>
</head>
<body>
<div class="outer">
<div class="wrapper">
  <div class="header">
    <div class="logo">A/L.lk</div>
    <h1>Your enrollment has been approved! 🎉</h1>
    <p>Sri Lanka's #1 A/L Learning Platform</p>
  </div>
  <div class="body">
    <p class="greeting">Hi <strong>${reg.studentName || 'Student'}</strong>,<br><br>Great news — your registration for <strong>A/L.lk</strong> Platform has been reviewed and approved by our team. Your unique Student ID has been generated and is ready to use.</p>
    <div class="id-card">
      <div class="student-id">${studentId}</div>
      <div class="id-note">Keep this ID safe — you'll need it to log in</div>
    </div>
    <div class="info-row">
      <div class="info-label">Enrolled Subject(s)</div>
      <div class="info-value">${subjectName}</div>
    </div>
    <div class="steps-title">How to get started</div>
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text">Click the button below to visit the <strong>Sign Up page</strong>.</div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text">Enter your <strong>Student ID</strong> (<span class="step-code">${studentId}</span>) and your <strong>registered email address</strong>.</div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text">Create a secure <strong>password</strong> and complete your profile to access your dashboard.</div>
    </div>
    <div class="cta-wrap">
      <a href="https://allkwithrashmikasooryabandara.lk/signup" class="cta-btn">Set Up My Account →</a>
    </div>
    <div class="divider"></div>
    <div class="warning">⚠️ <strong>Important:</strong> Do not share your Student ID with anyone. This ID is unique to you and grants access to your enrolled content and personal dashboard.</div>
    <p class="contact-text">If you have any questions or need help, reply to this email or contact us at <a href="mailto:allkwithrashmikasooryabandara@gmail.com">allkwithrashmikasooryabandara@gmail.com</a>.</p>
  </div>
  <div class="footer">
    <span class="footer-brand">A/L.lk — Sri Lanka's #1 A/L Platform</span>
    <p>You're receiving this because you registered on A/L.lk<br>&copy; 2026 A/L.lk. All rights reserved.<br><a href="#">Privacy Policy</a></p>
  </div>
</div>
</div>
</body>
</html>`,
          });
          toast(`Approval email sent to ${reg.email} — Student ID: ${studentId}`, 'success');
        } catch (err) {
          console.error('Brevo approval email failed:', err);
          toast(`Approved (ID: ${studentId}) but email failed: ${err?.message || 'unknown error'}`, 'error');
        }
      } else {
        toast(`Registration approved — Student ID: ${studentId}`, 'success');
      }
    } catch (err) {
      console.error('Approval failed:', err);
      toast(`Approval failed: ${err?.message || 'unknown error'}`, 'error');
    }
  };

  const reject  = async (id) => {
    try {
      const reg = regs.find(r => r.id === id);
      await updateDoc(doc(db, 'registrations', id), { status: 'rejected', reviewedAt: new Date() });

      if (reg?.email) {
        const emailKey = reg.email.replace(/[.#$[\]/]/g, '_');
        // Remove from registered_emails so the student can re-register
        try { await deleteDoc(doc(db, 'registered_emails', emailKey)); } catch (_) {}
        // Send rejection email notification
        const rejSubjectName = (reg.selectedTeachers || []).filter(isVisibleTeacher).map(t => {
          if (typeof t === 'string') return ALL_TEACHERS.find(at => at.id === t)?.subject || t;
          return t.subject || t.name || t.id || t;
        }).join(', ') || '—';
        try {
          await sendEmail({
            to:      reg.email,
            toName:  reg.studentName || 'Student',
            subject: 'Your request has been cancelled — A/L.lk',
            html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Request Cancelled - A/L.lk</title>
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
    .greeting { font-size: 15px; color: #1a1a2e; line-height: 1.7; margin-bottom: 28px; }
    .greeting strong { color: #D0182C; }
    .cancel-card { background: #fff8f8; border: 1.5px solid #D0182C; border-radius: 6px; padding: 32px 20px 24px; text-align: center; margin-bottom: 32px; position: relative; }
    .cancel-card::before { content: 'REQUEST STATUS'; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #D0182C; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; padding: 3px 14px; border-radius: 20px; white-space: nowrap; }
    .status-text { font-size: 28px; font-weight: 800; letter-spacing: 0.05em; color: #D0182C; margin-bottom: 8px; text-transform: uppercase; }
    .status-note { font-size: 12px; color: #888; letter-spacing: 0.04em; line-height: 1.5; }
    .info-row { background: #f7f7fa; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; width: 100%; }
    .info-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #999; margin-bottom: 4px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
    .message-box { background: #fffbf0; border-left: 3px solid #f5a623; border-radius: 0 4px 4px 0; padding: 14px 18px; font-size: 13px; color: #6b4f00; line-height: 1.6; margin-bottom: 28px; }
    .cta-wrap { text-align: center; margin: 32px 0 28px; }
    .cta-btn { display: block; background: #D0182C; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 15px 36px; border-radius: 3px; text-align: center; }
    .divider { height: 1px; background: #ebebeb; margin: 28px 0; }
    .contact-text { font-size: 13px; color: #888; line-height: 1.7; }
    .contact-text a { color: #D0182C; text-decoration: none; font-weight: 600; }
    .footer { background: #1a1a2e; padding: 28px 44px; text-align: center; }
    .footer-brand { color: rgba(255,255,255,0.7); font-weight: 600; font-size: 13px; display: block; margin-bottom: 8px; }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.8; }
    .footer a { color: #D0182C; text-decoration: none; }
    @media only screen and (max-width: 480px) {
      .outer { padding: 0; } .wrapper { border-radius: 0; box-shadow: none; }
      .header { padding: 24px 20px 20px; } .header h1 { font-size: 17px; } .header p { font-size: 12px; }
      .logo { font-size: 12px; padding: 5px 10px; margin-bottom: 14px; } .body { padding: 24px 18px; }
      .greeting { font-size: 14px; margin-bottom: 20px; } .cancel-card { padding: 28px 12px 18px; margin-bottom: 22px; }
      .status-text { font-size: 21px; letter-spacing: 0.04em; } .status-note { font-size: 11px; }
      .info-row { padding: 12px 14px; margin-bottom: 20px; } .info-value { font-size: 13px; }
      .message-box { font-size: 12px; padding: 12px 14px; margin-bottom: 20px; }
      .cta-wrap { margin: 22px 0 20px; } .cta-btn { font-size: 13px; padding: 13px 16px; letter-spacing: 0.06em; }
      .contact-text { font-size: 12px; } .footer { padding: 22px 18px; } .footer-brand { font-size: 12px; } .footer p { font-size: 11px; }
    }
  </style>
</head>
<body>
<div class="outer">
  <div class="wrapper">
    <div class="header">
      <div class="logo">A/L.lk</div>
      <h1>Your request has been cancelled</h1>
      <p>Sri Lanka's #1 A/L Learning Platform</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${reg.studentName || 'Student'}</strong>,<br><br>We regret to inform you that your request for <strong>A/L.lk</strong> Platform has been reviewed and cancelled by our team.</p>
      <div class="cancel-card">
        <div class="status-text">Cancelled</div>
        <div class="status-note">Your request was not approved at this stage</div>
      </div>
      <div class="info-row">
        <div class="info-label">Requested Subject(s)</div>
        <div class="info-value">${rejSubjectName}</div>
      </div>
      <div class="message-box">⚠️ <strong>Important:</strong> To know the reason for declining your request, please contact us through the WhatsApp number below.</div>
      <div class="cta-wrap">
        <a href="https://wa.me/94769739797" class="cta-btn">Contact Us on WhatsApp →</a>
      </div>
      <div class="divider"></div>
      <p class="contact-text">Need help? You can contact us on WhatsApp at <a href="https://wa.me/94769739797">+94769739797</a> or email us at <a href="mailto:allkwithrashmikasooryabandara@gmail.com">allkwithrashmikasooryabandara@gmail.com</a>.</p>
    </div>
    <div class="footer">
      <span class="footer-brand">A/L.lk — Sri Lanka's #1 A/L Platform</span>
      <p>You're receiving this because you registered on A/L.lk<br>&copy; 2026 A/L.lk. All rights reserved.<br><a href="#">Privacy Policy</a></p>
    </div>
  </div>
</div>
</body>
</html>`,
          });
        } catch (emailErr) {
          console.error('Brevo rejection email failed:', emailErr);
        }
      }

      toast('Registration rejected — notification email sent', 'info');
    } catch (err) {
      console.error('Reject failed:', err);
      toast('Reject failed: ' + (err?.message || 'unknown error'), 'error');
    }
  };

  const deleteAuthUser = httpsCallable(getFunctions(), 'deleteAuthUser');

  const remove  = async id => {
    if (window.confirm('Delete this registration permanently? This cannot be undone.')) {
      const reg = regs.find(r => r.id === id);
      await deleteDoc(doc(db, 'registrations', id));
      if (reg?.email) {
        const emailKey = reg.email.replace(/[.#$[\]/]/g, '_');
        try { await deleteDoc(doc(db, 'registered_emails', emailKey)); } catch (_) {}
        try { await deleteDoc(doc(db, 'deleted_students', emailKey)); } catch (_) {}
        try { await deleteAuthUser({ email: reg.email }); } catch (_) {}
      }
      toast('Registration deleted', 'info');
    }
  };

  const deleteStudentRegs = async (ids, name) => {
    if (window.confirm(`Delete ${name || 'this student'} and all their registrations permanently? This cannot be undone.`)) {
      const regDocs = ids.map(id => regs.find(r => r.id === id)).filter(Boolean);
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'registrations', id))));
      const uniqueEmails = [...new Set(regDocs.map(r => r.email).filter(Boolean))];
      await Promise.all(uniqueEmails.map(async email => {
        const emailKey = email.replace(/[.#$[\]/]/g, '_');
        await Promise.all([
          deleteDoc(doc(db, 'registered_emails', emailKey)).catch(() => {}),
          deleteDoc(doc(db, 'deleted_students', emailKey)).catch(() => {}),
          deleteAuthUser({ email }).catch(() => {}),
        ]);
      }));
      toast(`${name || 'Student'} deleted`, 'info');
    }
  };

  /* stats */
  const pending  = regs.filter(r => r.status === 'pending');
  const uniqueStudents = [...new Map(regs.map(r => [r.email, r])).values()];
  const uniqueTeachers = [...new Map(
    regs.flatMap(r => r.selectedTeachers || []).filter(isVisibleTeacher).map(t => [t.id, t])
  ).values()];

  /* filters for registrations tab */
  const allSubjects = ALL_TEACHERS.map(t => t.subject);
  const allBatches  = [...new Set(regs.map(r => r.batch).filter(Boolean))].sort();
  const filtered = regs.filter(r => {
    // 'all' means active only (pending + approved); show rejected only when explicitly filtered
    if (statusFilter === 'all' && r.status === 'rejected') return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && !r.selectedTeachers?.some(t => t.subject === subjectFilter)) return false;
    if (streamFilter  !== 'all' && !r.selectedTeachers?.some(t => t.stream === streamFilter)) return false;
    if (batchFilter   !== 'all' && r.batch !== batchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const nameMatch  = r.studentName?.toLowerCase().includes(q);
      const emailMatch = r.email?.toLowerCase().includes(q);
      const idMatch    = r.studentId?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !idMatch) return false;
    }
    return true;
  });

  /* monthly paid this month count */
  const currentMonthKey = (() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`; })();
  const monthlyPaidThisMonth = monthlyPayments.filter(p => p.month === currentMonthKey && p.status === 'approved').length;

  /* CSV download for registrations tab */
  const downloadRegistrationsCSV = () => {
    if (!filtered.length) { toast('No registrations to export', 'error'); return; }
    const rows = filtered.map(r => [
      `"${String(r.studentName || '').replace(/"/g,'""')}"`,
      `"${String(r.studentId  || '').replace(/"/g,'""')}"`,
    ]);
    const csv  = ['"Student Name","Student ID"', ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `registrations-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('CSV downloaded', 'success');
  };

  /* date display */
  const now = new Date();
  const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const detailIdx = detailReg ? regs.findIndex(r => r.id === detailReg.id) : 0;

  const pageTitle = NAV.find(n => n.id === tab)?.label || 'Dashboard';

  const goToTab = (id) => {
    setTabHistory(h => [...h, tab]);
    setTab(id);
    setSidebarOpen(false);
  };
  const goBack = () => {
    setTabHistory(h => {
      const prev = h[h.length - 1];
      if (prev) setTab(prev);
      return h.slice(0, -1);
    });
  };

  /* ── CSV download: per-teacher student & payment counts ── */
  const downloadTeacherReport = () => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const fmtMonth = (val) => {
      const [y, m] = val.split('-');
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const headers = [
      'Teacher Name', 'Subject', 'Stream',
      'Total Registered', 'Approved', 'Pending', 'Rejected',
      'Monthly Payments (All Time)', 'Monthly Approved', 'Monthly Pending',
      `Paid This Month (${fmtMonth(currentMonth)})`,
    ];

    const rows = ALL_TEACHERS.map(t => {
      const tRegs        = regs.filter(r => r.selectedTeachers?.some(x => x.id === t.id));
      const tApproved    = tRegs.filter(r => r.status === 'approved').length;
      const tPending     = tRegs.filter(r => r.status === 'pending').length;
      const tRejected    = tRegs.filter(r => r.status === 'rejected').length;

      const tMonthly         = monthlyPayments.filter(p => p.selectedTeachers?.some(x => x.id === t.id));
      const tMonthlyApproved = tMonthly.filter(p => p.status === 'approved').length;
      const tMonthlyPending  = tMonthly.filter(p => p.status === 'pending').length;
      const tPaidThisMonth   = tMonthly.filter(p => p.month === currentMonth && p.status === 'approved').length;

      return [
        t.name, t.subject, t.stream,
        tRegs.length, tApproved, tPending, tRejected,
        tMonthly.length, tMonthlyApproved, tMonthlyPending,
        tPaidThisMonth,
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `teacher-report-${today.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report downloaded', 'success');
  };

  /* ── CSV download: single teacher — PII excluded ── */
  const downloadTeacherDetails = (teacher) => {
    const today        = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const fmtTs = (ts) => ts?.toDate ? ts.toDate().toLocaleString('en-GB') : '—';
    const fmtMo = (val) => {
      if (!val) return '—';
      const [y, m] = val.split('-');
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const tRegs    = regs.filter(r => r.selectedTeachers?.some(x => x.id === teacher.id));
    const tMonthly = monthlyPayments.filter(p => p.selectedTeachers?.some(x => x.id === teacher.id));

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const row    = (arr) => arr.map(escape).join(',');

    const lines = [
      row([`Teacher: ${teacher.name}`, `Subject: ${teacher.subject}`, `Stream: ${teacher.stream}`, `Report Date: ${today.toLocaleDateString('en-GB')}`]),
      '',
      row(['--- REGISTERED STUDENTS ---']),
      /* PII removed: email, phone, address excluded from teacher-level export */
      row(['#', 'Student ID', 'Full Name', 'Batch', 'Status', 'Registered Date']),
      ...tRegs.map((r, i) => row([i + 1, r.studentId || '—', r.studentName, r.batch || '—', r.status, fmtTs(r.registeredAt)])),
      tRegs.length === 0 ? row(['No registrations yet']) : '',
      '',
      row(['--- MONTHLY PAYMENTS ---']),
      row(['#', 'Student ID', 'Full Name', 'Month', 'Status', 'Submitted Date']),
      ...tMonthly.map((p, i) => row([i + 1, p.studentId || '—', p.studentName, fmtMo(p.month), p.status, fmtTs(p.submittedAt)])),
      tMonthly.length === 0 ? row(['No monthly payments yet']) : '',
      '',
      row(['--- SUMMARY ---']),
      row(['Total Registered', tRegs.length]),
      row(['Approved Registrations', tRegs.filter(r => r.status === 'approved').length]),
      row(['Pending Registrations',  tRegs.filter(r => r.status === 'pending').length]),
      row(['Monthly Payments (All Time)', tMonthly.length]),
      row(['Monthly Paid (Approved)',     tMonthly.filter(p => p.status === 'approved').length]),
      row([`Paid This Month (${fmtMo(currentMonth)})`, tMonthly.filter(p => p.month === currentMonth && p.status === 'approved').length]),
    ];

    const csv  = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${teacher.name.replace(/\s+/g, '_')}-${today.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded report for ${teacher.name}`, 'success');
  };

  /* ── PDF export: full student data ── */
  const downloadStudentsPDF = () => {
    const rows = filtered;
    if (!rows.length) { toast('No registrations to export', 'error'); return; }

    const fmtTs = (ts) => ts?.toDate ? ts.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const byStream = {};
    rows.forEach(r => {
      const streams = [...new Set((r.selectedTeachers || []).filter(isVisibleTeacher).map(t => t.stream).filter(Boolean))];
      const key = streams.length ? streams.join(' / ') : 'Unspecified';
      if (!byStream[key]) byStream[key] = [];
      byStream[key].push(r);
    });

    const streamSections = Object.entries(byStream).map(([stream, students]) => `
      <div class="section">
        <div class="section-header">${stream} Stream — ${students.length} student${students.length !== 1 ? 's' : ''}</div>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Student ID</th><th>Name</th><th>Email</th>
              <th>Phone</th><th>Batch</th><th>Subjects</th><th>Status</th><th>Registered</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((r, i) => `
              <tr class="${r.status}">
                <td>${i + 1}</td>
                <td>${r.studentId || '—'}</td>
                <td><strong>${r.studentName || '—'}</strong></td>
                <td>${r.email || '—'}</td>
                <td>${r.phone || '—'}</td>
                <td>${r.batch || '—'}</td>
                <td>${(r.selectedTeachers || []).filter(isVisibleTeacher).map(t => t.subject || t).join(', ') || '—'}</td>
                <td><span class="badge ${r.status}">${r.status}</span></td>
                <td>${fmtTs(r.registeredAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Student Records — AL.LK</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #ff3c2e; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; font-weight: 900; color: #ff3c2e; }
    .header .meta { font-size: 10px; color: #888; text-align: right; }
    .summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .summary-box { background: #f8f8f8; border: 1px solid #eee; border-radius: 6px; padding: 10px 16px; min-width: 120px; }
    .summary-box .val { font-size: 22px; font-weight: 700; color: #111; }
    .summary-box .lbl { font-size: 10px; color: #aaa; margin-top: 2px; }
    .section { margin-bottom: 24px; }
    .section-header { background: #16181f; color: #fff; font-size: 11px; font-weight: 700; padding: 8px 12px; border-radius: 4px 4px 0 0; letter-spacing: .05em; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f4f4f4; padding: 7px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #888; border-bottom: 1px solid #eee; }
    td { padding: 7px 10px; border-bottom: 1px solid #f8f8f8; vertical-align: middle; }
    tr:hover td { background: #fcfcfc; }
    tr.approved td { border-left: 2px solid #27956b; }
    tr.rejected td { border-left: 2px solid #cc2a1e; opacity: .7; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 9px; font-weight: 700; }
    .badge.pending  { background: #fff8e6; color: #bf7a00; }
    .badge.approved { background: #e8f8f0; color: #1a7a4a; }
    .badge.rejected { background: #fff0f0; color: #cc2a1e; }
    .footer { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-size: 9px; color: #bbb; text-align: center; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>AL.LK</h1>
      <div style="font-size:11px;color:#555;margin-top:2px;">Student Records Export</div>
    </div>
    <div class="meta">
      Generated: ${new Date().toLocaleString('en-GB')}<br/>
      Total records: ${rows.length}
    </div>
  </div>
  <div class="summary">
    <div class="summary-box"><div class="val">${rows.length}</div><div class="lbl">Total Registrations</div></div>
    <div class="summary-box"><div class="val">${rows.filter(r => r.status === 'approved').length}</div><div class="lbl">Approved</div></div>
    <div class="summary-box"><div class="val">${rows.filter(r => r.status === 'pending').length}</div><div class="lbl">Pending</div></div>
    <div class="summary-box"><div class="val">${rows.filter(r => r.status === 'rejected').length}</div><div class="lbl">Rejected</div></div>
    <div class="summary-box"><div class="val">${Object.keys(byStream).length}</div><div class="lbl">Streams</div></div>
  </div>
  ${streamSections}
  <div class="footer">AL.LK Student Management System &nbsp;·&nbsp; Exported ${new Date().toLocaleDateString('en-GB')}</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    toast('PDF export opened — use Save as PDF in print dialog', 'success');
  };

  if (sessionStorage.getItem('al_admin') !== '1') return <Navigate to="/login" replace />;

  return (
    <>
      <style>{css}</style>
      <div className="ad-root">

        {/* ── Sidebar backdrop (mobile) ── */}
        <div
          className={`ad-sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── Sidebar ── */}
        <aside className={`ad-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="ad-brand">
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flex: 1 }}>
              <div className="ad-brand-icon">
                <img src="/AL.lk Logo.webp" alt="AL.LK" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
              </div>
              <div>
                <div className="ad-brand-title">Student Learning<br />Management System</div>
              </div>
            </a>
          </div>

          <nav className="ad-nav">
            <div className="ad-nav-lbl">Main Menu</div>
            {NAV.slice(0, 5).map(n => (
              <button key={n.id} className={`ad-nav-btn${tab === n.id ? ' on' : ''}`} onClick={() => goToTab(n.id)}>
                {n.icon}
                {n.label}
                {n.id === 'registrations' && pending.length > 0 &&
                  <span className="ad-cnt">{pending.length}</span>
                }
              </button>
            ))}
            <div className="ad-nav-divider" />
            <div className="ad-nav-lbl">Content</div>
            {NAV.slice(5).map(n => (
              <button key={n.id} className={`ad-nav-btn${tab === n.id ? ' on' : ''}`} onClick={() => goToTab(n.id)}>
                {n.icon}
                {n.label}
              </button>
            ))}
          </nav>

          <div className="ad-user">
            <div className="ad-user-av">A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ad-user-name">Admin</div>
              <div className="ad-user-role">Administrator</div>
            </div>
            <button
              onClick={() => { sessionStorage.removeItem('al_admin'); signOut(auth); navigate('/login'); }}
              title="Log out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff3c2e'}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="ad-main">
          <div className="ad-topbar">
            <button className="ad-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Open menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {tabHistory.length > 0 && (
              <button
                onClick={goBack}
                title="Go back"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f4f4f4', border: 'none', borderRadius: 9, padding: '7px 13px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#444', fontFamily: 'inherit', flexShrink: 0, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#ebebeb'}
                onMouseLeave={e => e.currentTarget.style.background = '#f4f4f4'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
            )}
            <h1 className="ad-page-title">{pageTitle}</h1>
            <div className="ad-topbar-right">
              <div className="ad-topbar-day">{dayStr}</div>
              <div className="ad-topbar-date">{dateStr}</div>
            </div>
          </div>

          <div className="ad-body">
            {loading ? (
              <div className="ad-spinner" />
            ) : (
              <>
                {/* ══ DASHBOARD ══ */}
                {tab === 'dashboard' && (
                  <>
                    {/* ── Dashboard banner ── */}
                    <div style={{ background: 'linear-gradient(135deg,#16181f,#2d3347)', borderRadius: 16, padding: '24px 28px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,60,46,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff3c2e" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Admin Dashboard</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>Student Learning Management System — {dayStr}, {dateStr}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#ff3c2e', lineHeight: 1 }}>{pending.length}</div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.4)', marginTop: 3 }}>pending</div>
                      </div>
                    </div>

                    <div className="ad-stats">
                      <div className="ad-stat">
                        <div>
                          <div className="ad-stat-lbl">Total Registrations</div>
                          <div className="ad-stat-val">{regs.length}</div>
                          <div className="ad-stat-sub">All time</div>
                        </div>
                        <div className="ad-stat-ico green">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </div>
                      </div>
                      <div className="ad-stat">
                        <div>
                          <div className="ad-stat-lbl">Total Students</div>
                          <div className="ad-stat-val">{uniqueStudents.length}</div>
                          <div className="ad-stat-sub">Unique students</div>
                        </div>
                        <div className="ad-stat-ico blue">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                      </div>
                      <div className="ad-stat">
                        <div>
                          <div className="ad-stat-lbl">Pending Registrations</div>
                          <div className="ad-stat-val">{pending.length}</div>
                          <div className="ad-stat-sub">Awaiting review</div>
                        </div>
                        <div className="ad-stat-ico yellow">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bf7a00" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                      </div>
                    </div>

                    <RegTable
                      rows={[...pending].reverse().slice(0, 10)}
                      allRegs={regs}
                      onView={setDetailReg}
                      onApprove={approve}
                      onReject={reject}
                      onDelete={remove}
                      showViewAll={regs.length > 10}
                      onViewAll={() => setTab('registrations')}
                    />
                  </>
                )}

                {/* ══ REGISTRATIONS ══ */}
                {tab === 'registrations' && (
                  <>
                    {/* 2 summary boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div className="ad-stat">
                        <div>
                          <div className="ad-stat-lbl">Registered</div>
                          <div className="ad-stat-val">{regs.filter(r => r.status !== 'rejected').length}</div>
                          <div className="ad-stat-sub">All time</div>
                        </div>
                        <div className="ad-stat-ico green">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#27956b" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </div>
                      </div>
                      <div className="ad-stat">
                        <div>
                          <div className="ad-stat-lbl">Monthly Paid (This Month)</div>
                          <div className="ad-stat-val">{monthlyPaidThisMonth}</div>
                          <div className="ad-stat-sub">Approved payments</div>
                        </div>
                        <div className="ad-stat-ico blue">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2680c7" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        </div>
                      </div>
                    </div>

                    <div className="ad-card" style={{ marginBottom: 20 }}>
                      <div className="ad-toolbar" style={{ paddingBottom: 14 }}>
                        <input
                          className="ad-search"
                          placeholder="Search by name, email, or student ID…"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                        />
                        <select className="ad-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <select className="ad-select" value={streamFilter} onChange={e => setStreamFilter(e.target.value)}>
                          <option value="all">All Streams</option>
                          <option value="Technology">Technology</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                        <select className="ad-select" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                          <option value="all">All Subjects</option>
                          {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="ad-select" value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                          <option value="all">All Batches</option>
                          {allBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        {(search || statusFilter !== 'all' || subjectFilter !== 'all' || streamFilter !== 'all' || batchFilter !== 'all') && (
                          <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setSubjectFilter('all'); setStreamFilter('all'); setBatchFilter('all'); }}
                            style={{ fontSize: 12.5, fontWeight: 600, color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >Clear</button>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button
                            onClick={downloadRegistrationsCSV}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#fff', background: '#2680c7', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            CSV
                          </button>
                          <button
                            onClick={downloadStudentsPDF}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#fff', background: '#ff3c2e', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    <RegTable
                      rows={filtered}
                      allRegs={regs}
                      onView={setDetailReg}
                      onApprove={approve}
                      onReject={reject}
                      onDelete={remove}
                      showViewAll={false}
                    />
                  </>
                )}

{/* ══ STUDENTS ══ */}
{tab === 'students' && (
  <StudentsTab
    regs={regs}
    toast={toast}
    setTab={setTab}
    setStatusFilter={setStatusFilter}
    setSubjectFilter={setSubjectFilter}
    setSearch={setSearch}
    deleteRegs={deleteStudentRegs}
  />
)}

                {/* ══ TEACHERS ══ */}
                {tab === 'teachers' && (() => {
                  const STREAMS = ['Technology', 'Commerce', 'Arts'];
                  const streamMeta = {
                    Technology: { color: '#2680c7', bg: '#e8f0fd', avatarColors: ['#2680c7','#0891b2','#7c3aed'] },
                    Commerce:   { color: '#27956b', bg: '#e8f8f0', avatarColors: ['#27956b','#059669','#0d9488'] },
                    Arts:       { color: '#c9720c', bg: '#fdf0e8', avatarColors: ['#c9720c','#db2777','#d97706'] },
                  };
                  const today        = new Date();
                  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

                  return (
                    <>
                      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <span style={{ fontSize: 13, color: '#aaa' }}>
                          {ALL_TEACHERS.length} teachers · {uniqueTeachers.length} with registrations
                        </span>
                        <button
                          onClick={downloadTeacherReport}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#fff', background: '#ff3c2e', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Download Report (CSV)
                        </button>
                      </div>

                      {STREAMS.map(stream => {
                        const streamTeachers = ALL_TEACHERS.filter(t => t.stream === stream);
                        if (!streamTeachers.length) return null;
                        const meta = streamMeta[stream];
                        return (
                          <div key={stream} style={{ marginBottom: 28 }}>
                            {/* stream header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                              <div style={{ background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700, padding: '5px 16px', borderRadius: 99, letterSpacing: '.04em' }}>
                                {stream} Stream
                              </div>
                              <div style={{ flex: 1, height: 1, background: '#f0f0f0' }} />
                              <span style={{ fontSize: 12, color: '#bbb', fontWeight: 600 }}>
                                {streamTeachers.length} teacher{streamTeachers.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {streamTeachers.map((t, i) => {
                              const teacherRegs      = regs.filter(r => r.selectedTeachers?.some(x => x.id === t.id));
                              const approvedRegs     = teacherRegs.filter(r => r.status === 'approved').length;
                              const pendingRegs      = teacherRegs.filter(r => r.status === 'pending').length;
                              const tMonthly         = monthlyPayments.filter(p => p.selectedTeachers?.some(x => x.id === t.id));
                              const tMonthlyApproved = tMonthly.filter(p => p.status === 'approved').length;
                              const tMonthlyPending  = tMonthly.filter(p => p.status === 'pending').length;
                              const tPaidThisMonth   = tMonthly.filter(p => p.month === currentMonth && p.status === 'approved').length;
                              const avatarColor      = meta.avatarColors[i % meta.avatarColors.length];

                              return (
                                <div key={t.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 1px 5px rgba(0,0,0,.06)', marginBottom: 10, borderLeft: `3px solid ${meta.color}` }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                                    <div style={{ width: 46, height: 46, borderRadius: 13, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                      {t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{t.name}</div>
                                      <div style={{ fontSize: 12.5, color: '#aaa', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {t.subject}
                                        <span style={{ background: meta.bg, color: meta.color, fontSize: 10.5, fontWeight: 700, padding: '1px 8px', borderRadius: 99 }}>{stream}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button
                                        onClick={() => { setStatusFilter('all'); setSubjectFilter(t.subject); setSearch(''); setTab('registrations'); }}
                                        style={{ fontSize: 12, fontWeight: 600, color: '#ff3c2e', background: '#fff5f5', border: '1.5px solid #ffd0cd', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                                      >
                                        View Registrations
                                      </button>
                                      <button
                                        onClick={() => downloadTeacherDetails(t)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#2680c7', background: '#e8f0fd', border: '1.5px solid #c0d4f5', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                        Download CSV
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                                    {[
                                      { lbl: 'Registered',      val: teacherRegs.length,  bg: '#f4f4f4',  color: '#333'    },
                                      { lbl: 'Approved',        val: approvedRegs,         bg: '#e8f8f0',  color: '#1a7a4a' },
                                      { lbl: 'Pending',         val: pendingRegs,          bg: '#fff8e6',  color: '#bf7a00' },
                                      { lbl: 'Monthly (All)',   val: tMonthly.length,      bg: '#e8f0fd',  color: '#2680c7' },
                                      { lbl: 'Monthly Paid',    val: tMonthlyApproved,     bg: '#e8f8f0',  color: '#1a7a4a' },
                                      { lbl: 'Paid This Month', val: tPaidThisMonth,       bg: '#f0e8fd',  color: '#7c3aed' },
                                    ].map(s => (
                                      <div key={s.lbl} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                        <div style={{ fontSize: 10.5, color: '#999', marginTop: 4, fontWeight: 600 }}>{s.lbl}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {tMonthlyPending > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                      <span style={{ fontSize: 11, background: '#fff8e6', color: '#bf7a00', borderRadius: 99, padding: '3px 10px', fontWeight: 700 }}>
                                        {tMonthlyPending} monthly payment{tMonthlyPending !== 1 ? 's' : ''} pending review
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}

                {/* ══ MONTHLY PAYMENTS ══ */}
                {tab === 'monthly' && <MonthlyPaymentsPage toast={toast} regs={regs} />}

                {/* ══ ZOOM LINKS ══ */}
                {tab === 'zoom' && <ZoomLinksPage toast={toast} />}

                {/* ══ UPLOAD RECORDS ══ */}
                {tab === 'records' && <RecordsPage toast={toast} />}

                {/* ══ STUDY MATERIALS ══ */}
                {tab === 'materials' && <MaterialsPage toast={toast} />}

                {/* ══ TEACHER ACCOUNTS ══ */}
                {tab === 'teacher-accounts' && <TeacherAccountsPage toast={toast} />}
              </>
            )}
          </div>
        </main>

        {/* ── Detail modal ── */}
        {detailReg && (
          <DetailModal
            reg={detailReg}
            idx={detailIdx}
            onClose={() => setDetailReg(null)}
            onApprove={approve}
            onReject={reject}
          />
        )}
      </div>

      <Toast toasts={toasts} />
    </>
  );
}
