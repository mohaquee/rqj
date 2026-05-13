import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api, getToken } from "./api.js";

// ─── ফার্ম তথ্য ────────────────────────────────────────────────
const FIRM = {
  name: "রুহুল কুদ্দুস অ্যান্ড জুরিস্টস",
  tagline: "বাংলাদেশের শীর্ষস্থানীয় আইনি প্রতিষ্ঠান",
  address: "দেলভিস্তা ফুলঝুরি, লেভেল-১০, প্লট নং-৫৯, সাত মসজিদ রোড, ধানমন্ডি, ঢাকা",
  phone: "+৮৮০ ১৭১৩-১৪১১৪৯",
  email: "ruhul70@yahoo.com",
};

// কর্মীবৃন্দ
const EMPLOYEES = [
  { id: "e1",  name: "রুহুল কুদ্দুস কাজল",       shortName: "রু. কাজল",      role: "প্রতিষ্ঠাতা ও চেম্বার প্রধান", tier: "সিনিয়র অ্যাডভোকেট", category: "head",      avatar: "রুকা" },
  { id: "e2",  name: "আক্তার রসুল মুরাদ",         shortName: "আ. মুরাদ",       role: "সিনিয়র অ্যাসোসিয়েট",          tier: "অ্যাডভোকেট",         category: "senior",    avatar: "আমু" },
  { id: "e3",  name: "মো. মোসাদ্দেক বিল্লাহ",   shortName: "মো. বিল্লাহ",   role: "সিনিয়র অ্যাসোসিয়েট",          tier: "অ্যাডভোকেট",         category: "senior",    avatar: "মোবি" },
  { id: "e4",  name: "মো. আনোয়ার হোসেন",        shortName: "আ. হোসেন",       role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "আহো" },
  { id: "e5",  name: "মো. সালাহউদ্দিন",         shortName: "সালাহউদ্দিন",     role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "সা" },
  { id: "e6",  name: "সাইফুল ইসলাম",             shortName: "সাইফুল ই.",       role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "সাই" },
  { id: "e7",  name: "দুলন চাঁপা",                 shortName: "দু. চাঁপা",         role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "দুচা" },
  { id: "e8",  name: "ইশরাত জাহান মনিকা",       shortName: "ই. মনিকা",       role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "ইম" },
  { id: "e9",  name: "হাবিবুর রহমান",            shortName: "হা. রহমান",       role: "অ্যাসোসিয়েট",                   tier: "অ্যাডভোকেট",         category: "associate", avatar: "হর" },
  { id: "e10", name: "মো. মুজাহিদুল ইসলাম",   shortName: "মু. ইসলাম",      role: "গবেষণা সহযোগী",                  tier: "গবেষক",               category: "research",  avatar: "মুই" },
  { id: "e11", name: "মোহাম্মদ গিয়াস উদ্দিন",  shortName: "গি. উদ্দিন",       role: "অ্যাডভোকেট সহকারী",              tier: "সহায়ক",                category: "support",   avatar: "গিউ" },
  { id: "e12", name: "মিজানুর রহমান মাসুম",    shortName: "মি. মাসুম",       role: "অফিস সহকারী",                    tier: "সহায়ক",                category: "support",   avatar: "মিমা" },
  { id: "e13", name: "মো. জাহিদ হাসান",          shortName: "জা. হাসান",       role: "কেরানি",                          tier: "সহায়ক",                category: "support",   avatar: "জাহা" },
  { id: "e14", name: "মো. জাহিদ",                  shortName: "মো. জাহিদ",       role: "আইটি সাপোর্ট",                    tier: "সহায়ক",                category: "support",   avatar: "জা" },
];

// Login credentials (shared with English version)
const USERS = [
  { username: "director",   password: "rq2026",      employeeId: "e1",  role: "director", displayName: "রুহুল কুদ্দুস কাজল",  displayRole: "পরিচালক" },
  { username: "ar.murad",   password: "murad2026",   employeeId: "e2",  role: "employee", displayName: "আক্তার রসুল মুরাদ",   displayRole: "সিনিয়র অ্যাসোসিয়েট" },
  { username: "m.billah",   password: "billah2026",  employeeId: "e3",  role: "employee", displayName: "মো. মোসাদ্দেক বিল্লাহ", displayRole: "সিনিয়র অ্যাসোসিয়েট" },
  { username: "a.hossain",  password: "hossain2026", employeeId: "e4",  role: "employee", displayName: "মো. আনোয়ার হোসেন",   displayRole: "অ্যাসোসিয়েট" },
  { username: "s.tuhin",    password: "tuhin2026",   employeeId: "e5",  role: "employee", displayName: "মো. সালাহউদ্দিন",     displayRole: "অ্যাসোসিয়েট" },
  { username: "s.islam",    password: "islam2026",   employeeId: "e6",  role: "employee", displayName: "সাইফুল ইসলাম",        displayRole: "অ্যাসোসিয়েট" },
  { username: "d.chapa",    password: "chapa2026",   employeeId: "e7",  role: "employee", displayName: "দুলন চাপা",            displayRole: "অ্যাসোসিয়েট" },
  { username: "i.monika",   password: "monika2026",  employeeId: "e8",  role: "employee", displayName: "ইসরাত জাহান মনিকা",  displayRole: "অ্যাসোসিয়েট" },
  { username: "h.rahman",   password: "rahman2026",  employeeId: "e9",  role: "employee", displayName: "হাবিবুর রহমান",        displayRole: "অ্যাসোসিয়েট" },
  { username: "m.islam",    password: "research2026",employeeId: "e10", role: "employee", displayName: "মো. মুজাহিদুল ইসলাম", displayRole: "রিসার্চ অ্যাসোসিয়েট" },
];

const MONTHS = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const NOW = new Date();

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (n) => "\u09F3" + Number(n || 0).toLocaleString("bn-BD");
const formatNumber = (n) => Number(n || 0).toLocaleString("bn-BD");

// স্ট্যাটাস অনুবাদ
const statusLabel = (status) => ({
  paid: "পরিশোধিত",
  sent: "প্রেরিত",
  outstanding: "বকেয়া",
  overdue: "মেয়াদোত্তীর্ণ",
}[status] || status);

// স্বয়ংক্রিয়ভাবে চালানের অবস্থা নির্ণয়:
// ২ সপ্তাহ পর্যন্ত: প্রেরিত | ২ সপ্তাহ - ২ মাস: বকেয়া | ২ মাসের বেশি: মেয়াদোত্তীর্ণ
// সম্পূর্ণ পরিশোধিত হলে: পরিশোধিত
function computeInvoiceStatus(issueDate, paid, amount, asOfDate = NOW) {
  if (paid >= amount) return "paid";
  const issued = new Date(issueDate);
  const daysDiff = Math.floor((asOfDate - issued) / (1000 * 60 * 60 * 24));
  if (daysDiff < 14) return "sent";          // ২ সপ্তাহের কম
  if (daysDiff < 60) return "outstanding";   // ২ সপ্তাহ - ২ মাস
  return "overdue";                           // ২ মাসের বেশি
}

function generateSeedData() {
  // প্রোডাকশন: প্রতিটি ডিপ্লয়মেন্ট খালি ডেটা দিয়ে শুরু হয়।
  // পরিচালক প্রথমে মক্কেল যোগ করেন, তারপর চালান তৈরি করেন।
  return { clients: [], invoices: [] };
}


const Icon = ({ name, size = 20 }) => {
  const s = { width: size, height: size, display: "inline-block", verticalAlign: "middle" };
  const icons = {
    dashboard: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
    briefcase: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="3" y1="13" x2="21" y2="13"/></svg>,
    invoice: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>,
    people: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="18" cy="8" r="2.5"/><path d="M21 21v-1.5a3 3 0 00-3-3h-.5"/></svg>,
    chart: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
    alert: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
    plus: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
    search: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit: <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[name] || null;
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Tiro+Bangla:ital@0;1&display=swap');
:root{--bg:#f5f5f7;--surface:#fff;--surface-alt:#fbfbfd;--text:#1d1d1f;--text-secondary:#86868b;--text-tertiary:#afafb2;--border:#e8e8ed;--border-light:#f0f0f5;--accent:#0071e3;--accent-light:#e8f2fe;--accent-hover:#0077ED;--green:#28cd41;--green-light:#e6f9ea;--red:#ff3b30;--red-light:#ffe5e3;--orange:#ff9500;--orange-light:#fff4e5;--purple:#af52de;--shadow-sm:0 1px 3px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.02);--shadow-md:0 4px 12px rgba(0,0,0,.06),0 1px 4px rgba(0,0,0,.04);--shadow-lg:0 12px 40px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.04);--radius-sm:10px;--radius-md:14px;--radius-lg:20px;--radius-xl:24px;--font:'Hind Siliguri',-apple-system,BlinkMacSystemFont,sans-serif;--transition:.2s cubic-bezier(.25,.46,.45,.94)}
*{margin:0;padding:0;box-sizing:border-box}body,html,#root{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;height:100%}
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:260px;background:rgba(255,255,255,.82);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:10;flex-shrink:0}
.sidebar-brand{padding:28px 24px 20px;border-bottom:1px solid var(--border-light)}.sidebar-brand h1{font-size:14px;font-weight:700;letter-spacing:-.2px;line-height:1.3}.sidebar-brand p{font-size:11px;color:var(--text-tertiary);margin-top:4px;font-weight:500;letter-spacing:.4px}
.sidebar-nav{flex:1;padding:16px 12px;overflow-y:auto}.nav-section{margin-bottom:24px}.nav-section-title{font-size:10.5px;font-weight:700;letter-spacing:.5px;color:var(--text-tertiary);padding:0 12px;margin-bottom:6px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition);font-size:13.5px;font-weight:500;color:var(--text-secondary);margin-bottom:2px}.nav-item:hover{background:rgba(0,0,0,.04);color:var(--text)}.nav-item.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(0,113,227,.3)}
.nav-item .badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;min-width:20px;text-align:center}.nav-item.active .badge{background:rgba(255,255,255,.3)}
.sidebar-footer{padding:16px 20px;border-top:1px solid var(--border-light)}.sidebar-user{display:flex;align-items:center;gap:10px}.sidebar-user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0}.sidebar-user-info h4{font-size:12.5px;font-weight:600}.sidebar-user-info p{font-size:10.5px;color:var(--text-tertiary)}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}.topbar{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.72);backdrop-filter:blur(20px);flex-shrink:0}.topbar-title{font-size:18px;font-weight:700;letter-spacing:-.2px}.content{flex:1;overflow-y:auto;padding:28px 32px;scroll-behavior:smooth}
.card{background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);box-shadow:var(--shadow-sm);overflow:hidden;transition:box-shadow var(--transition)}.card:hover{box-shadow:var(--shadow-md)}.card-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0}.card-header h3{font-size:15px;font-weight:700;letter-spacing:-.1px}.card-body{padding:16px 24px 24px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:28px}.stat-card{background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);padding:22px 24px;box-shadow:var(--shadow-sm);transition:all var(--transition)}.stat-card:hover{box-shadow:var(--shadow-md);transform:translateY(-1px)}.stat-label{font-size:11.5px;font-weight:600;letter-spacing:.3px;color:var(--text-tertiary);margin-bottom:10px}.stat-value{font-size:26px;font-weight:700;letter-spacing:-.5px;line-height:1.1}.stat-sub{font-size:12px;color:var(--text-secondary);margin-top:8px;display:flex;align-items:center;gap:4px}.stat-change{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px}.stat-change.up{background:var(--green-light);color:#1a8f2d}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;font-family:var(--font);cursor:pointer;transition:all var(--transition);border:none;white-space:nowrap}.btn-primary{background:var(--accent);color:#fff;box-shadow:0 1px 4px rgba(0,113,227,.25)}.btn-primary:hover{background:var(--accent-hover);box-shadow:0 2px 8px rgba(0,113,227,.35)}.btn-secondary{background:var(--bg);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:#ededf0}.btn-ghost{background:transparent;color:var(--accent)}.btn-ghost:hover{background:var(--accent-light)}.btn-sm{padding:5px 12px;font-size:12px}
table{width:100%;border-collapse:separate;border-spacing:0}thead th{font-size:11px;font-weight:600;letter-spacing:.3px;color:var(--text-tertiary);text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);white-space:nowrap;position:sticky;top:0;background:var(--surface)}tbody td{padding:14px 16px;font-size:13.5px;border-bottom:1px solid var(--border-light);vertical-align:middle}tbody tr{transition:background var(--transition);cursor:pointer}tbody tr:hover{background:var(--surface-alt)}tbody tr:last-child td{border-bottom:none}
.badge-status{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;font-size:11.5px;font-weight:600;white-space:nowrap}.badge-paid{background:var(--green-light);color:#1a8f2d}.badge-sent{background:var(--accent-light);color:var(--accent)}.badge-outstanding{background:var(--orange-light);color:#b36b00}.badge-overdue{background:var(--red-light);color:var(--red)}
.avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;font-family:var(--font)}.avatar.head{background:linear-gradient(135deg,#1d1d1f,#48484a)}.avatar.senior{background:linear-gradient(135deg,#0071e3,#40a9ff)}.avatar.associate{background:linear-gradient(135deg,#34c759,#30d158)}.avatar.research{background:linear-gradient(135deg,#af52de,#bf5af2)}.avatar.support{background:linear-gradient(135deg,#ff9500,#ff9f0a)}
.progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}.progress-fill{height:100%;border-radius:3px;transition:width .6s ease}
.mini-chart{display:flex;align-items:flex-end;gap:3px;height:50px;padding-top:4px}.mini-bar{flex:1;border-radius:3px 3px 0 0;min-height:4px;transition:all var(--transition)}.mini-bar:hover{opacity:.8}
.form-group{margin-bottom:16px}.form-label{font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:block}.form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:var(--font);color:var(--text);background:var(--surface);transition:border-color var(--transition),box-shadow var(--transition);outline:none}.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,113,227,.12)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn .2s ease}.modal{background:var(--surface);border-radius:var(--radius-xl);width:90%;max-width:560px;max-height:85vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:slideUp .3s ease}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 0}.modal-header h2{font-size:18px;font-weight:700;letter-spacing:-.2px}.modal-body{padding:20px 28px 28px}.modal-close{background:var(--bg);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:all var(--transition)}.modal-close:hover{background:#e5e5ea;color:var(--text)}
.tabs{display:flex;gap:2px;background:var(--bg);padding:3px;border-radius:var(--radius-sm);margin-bottom:24px;width:fit-content}.tab{padding:7px 16px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all var(--transition);border:none;background:transparent;font-family:var(--font)}.tab.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-sm)}.tab:hover:not(.active){color:var(--text)}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:var(--radius-sm);padding:0 14px;border:1px solid transparent;transition:all var(--transition)}.search-bar:focus-within{border-color:var(--accent);background:var(--surface);box-shadow:0 0 0 3px rgba(0,113,227,.1)}.search-bar input{border:none;background:transparent;padding:9px 0;font-size:13px;font-family:var(--font);color:var(--text);outline:none;width:220px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.month-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-light)}.month-row:last-child{border-bottom:none}.month-label{width:50px;font-size:12px;font-weight:600;color:var(--text-secondary);flex-shrink:0}.month-bar-wrap{flex:1;height:28px;border-radius:6px;overflow:hidden;background:var(--border-light);position:relative}.month-bar-fill{background:var(--accent);height:100%;transition:width .5s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;font-size:10.5px;font-weight:700;color:#fff;overflow:hidden;border-radius:6px}.month-amount{width:130px;text-align:right;font-size:13px;font-weight:700;flex-shrink:0}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;padding:20px;background:var(--bg);border-radius:var(--radius-md)}.inv-meta-item label{font-size:11px;font-weight:600;letter-spacing:.3px;color:var(--text-tertiary);display:block;margin-bottom:4px}.inv-meta-item span{font-size:14px;font-weight:600}.inv-total-row{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid var(--border)}.inv-total-row.grand{font-size:18px;font-weight:700;border-top:2px solid var(--text);padding-top:16px;margin-top:4px}
.donut-wrap{display:flex;align-items:center;gap:24px}.donut-legend{display:flex;flex-direction:column;gap:8px}.donut-legend-item{display:flex;align-items:center;gap:8px;font-size:12.5px}.donut-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tooltip-wrap{position:relative}.tooltip-wrap:hover .tooltip{opacity:1;transform:translateY(0);pointer-events:auto}.tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(4px);background:#1d1d1f;color:#fff;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:500;white-space:nowrap;opacity:0;pointer-events:none;transition:all .2s ease;z-index:50}
.empty-state{text-align:center;padding:48px 24px;color:var(--text-tertiary)}.empty-state p{font-size:14px;margin-top:8px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .4s ease}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d1d1d6;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#aeaeb2}
`;

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 12; const c = 2 * Math.PI * r; let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => { const pct = total > 0 ? d.value / total : 0; const dash = c * pct; const gap = c - dash; const o = offset; offset += dash; return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={20} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o} strokeLinecap="butt" style={{ transition: "all 0.6s ease" }}/>; })}
      <text x={size/2} y={size/2-6} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="Hind Siliguri">{formatCurrency(total)}</text>
      <text x={size/2} y={size/2+12} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)" fontWeight="500" fontFamily="Hind Siliguri">মোট</text>
    </svg>
  );
}

function MiniBarChart({ data, height = 50 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="mini-chart" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="tooltip-wrap" style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "100%" }}>
          <div className="mini-bar" style={{ height: `${(d.value / max) * 100}%`, background: d.color || "var(--accent)", width: "100%" }}/>
          <div className="tooltip">{d.label}: {formatCurrency(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  চালান পৃষ্ঠা
// ═══════════════════════════════════════════════════════════════
function InvoicesPage({ invoices, setInvoices, clients, setClients, selectedInvoice, setSelectedInvoice, totalRevenue, totalOutstanding, totalOverdue, setPaymentModal, setPaymentAmount }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);

  if (selectedInvoice) {
    const inv = invoices.find(i => i.id === selectedInvoice);
    if (!inv) return null;
    const client = clients.find(c => c.id === inv.clientId);
    const paidPct = inv.amount > 0 ? (inv.paid / inv.amount * 100) : 0;
    return (
      <div className="fade-in">
        <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)} style={{ marginBottom: 20 }}><Icon name="back" size={16} /> চালান তালিকায় ফিরে যান</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div><h2 style={{ fontSize: 24, fontWeight: 700 }}>{inv.invoiceNo}</h2><p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{inv.clientName}</p></div>
          <div style={{ display: "flex", gap: 10 }}>
            <span className={`badge-status badge-${inv.status}`}>{statusLabel(inv.status)}</span>
            {inv.status !== "paid" && <button className="btn btn-primary btn-sm" onClick={() => { setPaymentModal(inv.id); setPaymentAmount(""); }}>পেমেন্ট রেকর্ড করুন</button>}
          </div>
        </div>
        <div className="inv-meta" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="inv-meta-item"><label>ইস্যুর তারিখ</label><span>{inv.issueDate}</span></div>
          <div className="inv-meta-item"><label>মক্কেলের যোগাযোগ</label><span>{client?.contact}</span></div>
          <div className="inv-meta-item"><label>মক্কেলের ইমেইল</label><span>{client?.email}</span></div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>পেমেন্টের অগ্রগতি</h3></div>
          <div className="card-body">
            <div className="progress-bar" style={{ height: 12, marginBottom: 12, borderRadius: 6 }}><div className="progress-fill" style={{ width: `${paidPct}%`, background: paidPct >= 100 ? "var(--green)" : "var(--accent)", borderRadius: 6 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span><strong>{formatCurrency(inv.paid)}</strong> পরিশোধিত</span><span style={{ color: inv.outstanding > 0 ? "var(--red)" : "var(--green)" }}><strong>{formatCurrency(inv.outstanding)}</strong> অবশিষ্ট</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>চালানের আইটেমসমূহ</h3></div>
          <div className="card-body">
            <table>
              <thead><tr><th>বিবরণ</th><th>পরিচালনাকারী</th><th style={{ textAlign: "right" }}>পরিমাণ</th></tr></thead>
              <tbody>{inv.items.map((item, i) => {
                const emp = EMPLOYEES.find(e => e.id === item.employeeId);
                return (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{emp ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className={`avatar ${emp.category}`} style={{ width: 26, height: 26, fontSize: 9 }}>{emp.avatar}</div><span style={{ fontSize: 12.5 }}>{emp.shortName}</span></div> : <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>—</span>}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="inv-total-row"><span>মোট চুক্তিকৃত</span><span style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</span></div>
              <div className="inv-total-row"><span>পরিশোধিত</span><span style={{ fontWeight: 600, color: "var(--green)" }}>-{formatCurrency(inv.paid)}</span></div>
              <div className="inv-total-row grand"><span>বকেয়া</span><span>{formatCurrency(inv.outstanding)}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredInvoices = invoices.filter(i => {
    if (tab === "outstanding") return i.status === "outstanding" || i.status === "sent";
    if (tab === "overdue") return i.status === "overdue";
    if (tab === "paid") return i.status === "paid";
    return true;
  }).filter(i => i.clientName.toLowerCase().includes(search.toLowerCase()) || i.invoiceNo.toLowerCase().includes(search.toLowerCase()));

  const tabLabels = { all: "সকল", outstanding: "বকেয়া", overdue: "মেয়াদোত্তীর্ণ", paid: "পরিশোধিত" };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>চালান</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>চালান, পেমেন্ট ও বকেয়া পরিচালনা করুন</p></div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="search-bar"><Icon name="search" size={16} /><input placeholder="চালান অনুসন্ধান..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}><Icon name="plus" size={16} /> নতুন চালান</button>
        </div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card"><div className="stat-label">মোট চালান</div><div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(invoices.reduce((s,i) => s + i.amount, 0))}</div></div>
        <div className="stat-card"><div className="stat-label">আদায়কৃত</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(totalRevenue)}</div></div>
        <div className="stat-card"><div className="stat-label">বকেয়া</div><div className="stat-value" style={{ fontSize: 22, color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div></div>
        <div className="stat-card"><div className="stat-label">মেয়াদোত্তীর্ণ</div><div className="stat-value" style={{ fontSize: 22, color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div></div>
      </div>
      <div className="tabs">{["all","outstanding","overdue","paid"].map(t => <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{tabLabels[t]}</button>)}</div>
      <div className="card"><div className="card-body" style={{ padding: "0 24px" }}>
        <table><thead><tr><th>চালান নং</th><th>মক্কেল</th><th>ইস্যুর তারিখ</th><th>পরিমাণ</th><th>পরিশোধিত</th><th>বকেয়া</th><th>অবস্থা</th></tr></thead>
          <tbody>{filteredInvoices.sort((a,b) => b.issueDate.localeCompare(a.issueDate)).map(inv => (
            <tr key={inv.id} onClick={() => setSelectedInvoice(inv.id)}>
              <td style={{ fontWeight: 600, color: "var(--accent)" }}>{inv.invoiceNo}</td>
              <td>{inv.clientName}</td><td>{inv.issueDate}</td>
              <td style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</td>
              <td style={{ color: "var(--green)" }}>{formatCurrency(inv.paid)}</td>
              <td style={{ fontWeight: 700, color: inv.outstanding > 0 ? "var(--red)" : "var(--green)" }}>{formatCurrency(inv.outstanding)}</td>
              <td><span className={`badge-status badge-${inv.status}`}>{statusLabel(inv.status)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div></div>
      {createModal && <InvoiceModal clients={clients} setClients={setClients} onClose={() => setCreateModal(false)} onSave={(inv) => { setInvoices(prev => [inv, ...prev]); setCreateModal(false); }} />}
    </div>
  );
}

function InvoiceModal({ clients, setClients, onClose, onSave }) {
  const billableEmployees = EMPLOYEES.filter(e => e.category !== "support");
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [issueDate, setIssueDate] = useState(NOW.toISOString().split("T")[0]);
  const [items, setItems] = useState([{ description: "", employeeId: billableEmployees[0]?.id || "", amount: 0 }]);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", address: "", contact: "", email: "", phone: "" });

  const addItem = () => setItems(prev => [...prev, { description: "", employeeId: billableEmployees[0]?.id || "", amount: 0 }]);
  const updateItem = (idx, field, value) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: field === "amount" ? Number(value) || 0 : value } : it));
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleAddClient = async () => {
    const name = newClient.name.trim();
    const address = newClient.address.trim();
    const contact = newClient.contact.trim();
    const phone = newClient.phone.trim();
    if (!name || !address || !contact || !phone) return;
    try {
      const created = await api.createClient({
        name, address, contact, email: newClient.email.trim(), phone,
      });
      setClients(prev => [...prev, created]);
      setClientId(created.id);
      setNewClient({ name: "", address: "", contact: "", email: "", phone: "" });
      setAddClientOpen(false);
    } catch (err) {
      alert(err?.message || "মক্কেল সংরক্ষণ করা যায়নি।");
    }
  };

  const validItems = items.filter(i => i.amount > 0 && i.description.trim());
  const total = validItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const client = clients.find(c => c.id === clientId);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (validItems.length === 0 || !clientId || saving) return;
    setSaving(true);
    try {
      const created = await api.createInvoice({
        clientId,
        issueDate,
        items: validItems.map(it => ({
          description: it.description,
          employeeId: it.employeeId,
          amount: Number(it.amount) || 0,
        })),
      });
      onSave(created);
    } catch (err) {
      alert(err?.message || "চালান তৈরি করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header"><h2>চালান তৈরি করুন</h2><button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">মক্কেল</label>
              <div style={{ display: "flex", gap: 6 }}>
                <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)} style={{ flex: 1 }}>
                  {clients.length === 0 && <option value="">কোনো মক্কেল নেই</option>}
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddClientOpen(true)} style={{ flexShrink: 0, padding: "0 12px" }} title="নতুন মক্কেল যোগ করুন"><Icon name="plus" size={14} /></button>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">ইস্যুর তারিখ</label><input type="date" className="form-input" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setAddClientOpen(true)} style={{ width: "100%", justifyContent: "center", padding: "9px 0" }}><Icon name="plus" size={14} /> মক্কেল যোগ করুন</button>
            </div>
          </div>

          <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11.5, color: "var(--accent)" }}>
            <strong>স্বয়ংক্রিয় অবস্থা:</strong> ২ সপ্তাহ পর্যন্ত প্রেরিত · ২ সপ্তাহ থেকে ২ মাস বকেয়া · ২ মাসের পর মেয়াদোত্তীর্ণ
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">আইটেমসমূহ</label>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 0.3fr", gap: 8, marginBottom: 6, fontSize: 10.5, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: 0.3, padding: "0 4px" }}>
              <span>বিবরণ</span><span>পরিচালনাকারী</span><span>পরিমাণ (টাকা)</span><span></span>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 0.3fr", gap: 8, marginBottom: 8 }}>
                <input className="form-input" placeholder="যেমন: চুক্তি প্রস্তুতি" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                <select className="form-select" value={item.employeeId} onChange={e => updateItem(i, "employeeId", e.target.value)}>
                  {billableEmployees.map(emp => <option key={emp.id} value={emp.id}>{emp.shortName}</option>)}
                </select>
                <input className="form-input" type="number" placeholder="০" value={item.amount || ""} onChange={e => updateItem(i, "amount", e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={() => removeItem(i)} style={{ padding: "8px" }} disabled={items.length === 1}><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 12 }}><Icon name="plus" size={14} /> আইটেম যোগ করুন</button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "2px solid var(--text)", marginTop: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>মোট</span><span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(total)}</span>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 8, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={validItems.length === 0 || !clientId || saving}>{saving ? "তৈরি হচ্ছে…" : "চালান তৈরি করুন"}</button>
        </div>
      </div>

      {/* মক্কেল যোগ করার মডাল */}
      {addClientOpen && (
        <div className="modal-overlay" onClick={() => setAddClientOpen(false)} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2>নতুন মক্কেল যোগ করুন</h2><button className="modal-close" onClick={() => setAddClientOpen(false)}><Icon name="x" size={16} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">কোম্পানির নাম <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" placeholder="যেমন: এবিসি কর্পোরেশন লিমিটেড" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">ঠিকানা <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea className="form-textarea" placeholder="সম্পূর্ণ ঠিকানা" value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} rows={3} style={{ resize: "vertical", minHeight: 70 }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">যোগাযোগের ব্যক্তি <span style={{ color: "var(--red)" }}>*</span></label>
                  <input className="form-input" placeholder="যেমন: আইন বিভাগ" value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">ইমেইল <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 11 }}>(ঐচ্ছিক)</span></label>
                  <input className="form-input" type="email" placeholder="contact@company.com" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">মোবাইল নম্বর <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" type="tel" placeholder="+৮৮০-২-XXXXXXX" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => { setNewClient({ name: "", address: "", contact: "", email: "", phone: "" }); setAddClientOpen(false); }}>বাতিল</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={handleAddClient} disabled={!newClient.name.trim() || !newClient.address.trim() || !newClient.contact.trim() || !newClient.phone.trim()}>সংরক্ষণ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  বকেয়া পৃষ্ঠা
// ═══════════════════════════════════════════════════════════════
function OutstandingPage({ invoices, clients, totalOutstanding, totalOverdue, overdueCount, setPaymentModal, setPaymentAmount, setSelectedInvoice, navigateTo }) {
  const outstandingInvoices = useMemo(() => invoices.filter(i => i.status !== "paid" && i.outstanding > 0), [invoices]);
  const clientList = useMemo(() => {
    const byClient = {};
    outstandingInvoices.forEach(inv => {
      if (!byClient[inv.clientId]) byClient[inv.clientId] = { client: clients.find(c => c.id === inv.clientId), invoices: [], total: 0 };
      byClient[inv.clientId].invoices.push(inv);
      byClient[inv.clientId].total += inv.outstanding;
    });
    return Object.values(byClient).sort((a, b) => b.total - a.total);
  }, [outstandingInvoices, clients]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 22, fontWeight: 700 }}>বকেয়া ট্র্যাকার</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>মক্কেল অনুযায়ী বকেয়া ও মেয়াদোত্তীর্ণ পরিমাণ পর্যবেক্ষণ করুন</p></div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card"><div className="stat-label">মোট বকেয়া</div><div className="stat-value" style={{ fontSize: 24, color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div><div className="stat-sub">{formatNumber(outstandingInvoices.length)} টি চালান</div></div>
        <div className="stat-card"><div className="stat-label">মোট মেয়াদোত্তীর্ণ</div><div className="stat-value" style={{ fontSize: 24, color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div><div className="stat-sub">{formatNumber(overdueCount)} টি চালান মেয়াদোত্তীর্ণ</div></div>
        <div className="stat-card"><div className="stat-label">বকেয়া সহ মক্কেল</div><div className="stat-value" style={{ fontSize: 24 }}>{formatNumber(clientList.length)}</div></div>
      </div>
      {clientList.map(({ client, invoices: cInvoices, total }) => (
        <div className="card" key={client?.id} style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div><h3>{client?.name}</h3><span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{client?.email} · {formatNumber(cInvoices.length)} টি চালান</span></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700, color: "var(--red)" }}>{formatCurrency(total)}</div><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>মোট বকেয়া</span></div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {cInvoices.map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedInvoice(inv.id); navigateTo("invoices"); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`badge-status badge-${inv.status}`}>{statusLabel(inv.status)}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{inv.invoiceNo}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>ইস্যু {inv.issueDate}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${inv.amount > 0 ? (inv.paid / inv.amount * 100) : 0}%`, background: "var(--green)" }} /></div>
                  <span style={{ fontWeight: 700, fontSize: 13, width: 110, textAlign: "right" }}>{formatCurrency(inv.outstanding)}</span>
                  <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setPaymentModal(inv.id); setPaymentAmount(""); }}>পরিশোধ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {clientList.length === 0 && <div className="card"><div className="empty-state"><Icon name="check" size={40} /><p>সকল চালান পরিশোধ করা হয়েছে!</p></div></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  প্রধান অ্যাপ
// ═══════════════════════════════════════════════════════════════
// স্টোরেজ লেয়ার — চালান ও মক্কেলদের localStorage এ সংরক্ষণ করে যাতে রিলোডে ডেটা থাকে।
const STORAGE_KEY_INVOICES = "rqj_invoices_v1";
const STORAGE_KEY_CLIENTS = "rqj_clients_v1";
const STORAGE_KEY_USER = "rqj_currentUser_v1";

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadObjectFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to persist to localStorage:", e);
  }
}

// ───────────────────────────────────────────────────────────────
//  লগইন স্ক্রিন
// ───────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onLanguageToggle }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError("ব্যবহারকারীর নাম এবং পাসওয়ার্ড আবশ্যক।");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await api.login(username.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err?.message === "Invalid username or password"
        ? "ভুল ব্যবহারকারী নাম বা পাসওয়ার্ড।"
        : (err?.message || "লগইন ব্যর্থ হয়েছে।"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%)",
      fontFamily: "var(--font)",
      padding: 20,
    }}>
      <div style={{
        background: "white",
        borderRadius: 20,
        padding: "40px 36px",
        maxWidth: 420,
        width: "100%",
        boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 16px", borderRadius: 14,
            background: "linear-gradient(135deg, #0071e3, #0077ED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: "white", letterSpacing: -0.5,
          }}>RQ</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginBottom: 4 }}>রুহুল কুদ্দুস অ্যান্ড জুরিস্টস</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>প্র্যাকটিস ম্যানেজমেন্ট পোর্টাল</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ব্যবহারকারীর নাম</label>
            <input
              className="form-input"
              type="text"
              autoComplete="username"
              placeholder="যেমন: director অথবা ar.murad"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">পাসওয়ার্ড</label>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              placeholder="আপনার পাসওয়ার্ড লিখুন"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
            />
          </div>

          {error && (
            <div style={{
              background: "var(--red-light)",
              color: "var(--red)",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 500,
              marginBottom: 14,
            }}>{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 14, fontWeight: 600, opacity: busy ? 0.7 : 1 }}
            disabled={busy}
          >
            {busy ? "সাইন ইন হচ্ছে…" : "সাইন ইন"}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border-light)", textAlign: "center" }}>
          <button
            onClick={onLanguageToggle}
            style={{
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontFamily: "var(--font)",
            }}>
            🌐 View in English
          </button>
          <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            লগইন তথ্যের জন্য, অনুগ্রহ করে ফার্ম প্রশাসকের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App({ onLanguageToggle }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function rehydrate() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setAuthLoading(false);
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) setCurrentUser(me);
      } catch {
        if (!cancelled) setCurrentUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    rehydrate();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = (user) => setCurrentUser(user);

  const handleLogout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font)", color: "var(--text-secondary)" }}>
        লোড হচ্ছে…
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onLanguageToggle={onLanguageToggle} />;
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} onLanguageToggle={onLanguageToggle} />;
}

function AppShell({ currentUser, onLogout, onLanguageToggle }) {
  const isDirector = currentUser.role === "director";

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptData, setReceiptData] = useState(null);
  const [clientModal, setClientModal] = useState(null); // null | { mode: "add" } | { mode: "edit", clientId }
  const [clientForm, setClientForm] = useState({ name: "", address: "", contact: "", email: "", phone: "" });
  const [selectedAnalyticsDate, setSelectedAnalyticsDate] = useState(NOW.toISOString().split("T")[0]);

  // সার্ভার থেকে ডেটা লোড করুন
  const refreshData = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([api.getClients(), api.getInvoices()]);
      setClients(c);
      setInvoices(i);
      setLoadError("");
    } catch (err) {
      if (err?.status === 401) {
        onLogout();
        return;
      }
      console.error("Refresh failed:", err);
      setLoadError(err?.message || "সার্ভারে পৌঁছানো যাচ্ছে না।");
    }
  }, [onLogout]);

  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, 15_000);
    return () => clearInterval(id);
  }, [refreshData]);

  // অন্য ট্যাব থেকে লগআউট হলে এই ট্যাবও লগআউট হবে
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "rqj_auth_token_v1" && !e.newValue) {
        onLogout();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [onLogout]);

  // লগইনকৃত ব্যবহারকারীর তথ্য — receipts ইত্যাদিতে ব্যবহৃত
  const userInfo = useMemo(() => ({
    name: currentUser.displayName,
    role: currentUser.displayRole,
  }), [currentUser]);

  const navigate = useCallback((pg) => { setPage(pg); setSelectedEmployee(null); setSelectedInvoice(null); setSearch(""); }, []);

  const currentMonth = NOW.getMonth();
  const currentYear = NOW.getFullYear();

  // রোল-ভিত্তিক ডেটা ফিল্টার: পরিচালক সব দেখেন, কর্মচারী শুধু নিজের চালান
  const visibleInvoices = useMemo(() => {
    if (isDirector) return invoices;
    return invoices.filter(inv => inv.items?.some(item => item.employeeId === currentUser.employeeId));
  }, [invoices, isDirector, currentUser.employeeId]);

  const totalRevenue = useMemo(() => visibleInvoices.reduce((s, i) => s + i.paid, 0), [visibleInvoices]);
  const totalOutstanding = useMemo(() => visibleInvoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.outstanding, 0), [visibleInvoices]);
  const totalOverdue = useMemo(() => visibleInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.outstanding, 0), [visibleInvoices]);
  const overdueCount = useMemo(() => visibleInvoices.filter(i => i.status === "overdue").length, [visibleInvoices]);

  const getEmployeeMonthlyData = useCallback((empId) => {
    const result = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
      let count = 0;
      let revenue = 0;
      invoices.forEach(inv => {
        if (inv.month !== d.getMonth() || inv.year !== d.getFullYear()) return;
        inv.items.forEach(item => {
          if (item.employeeId === empId) {
            count += 1;
            revenue += item.amount;
          }
        });
      });
      result.push({
        month: MONTHS[d.getMonth()],
        year: d.getFullYear(),
        count,
        revenue,
      });
    }
    return result;
  }, [invoices]);

  const getMonthlyRevenueData = useMemo(() => {
    const result = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
      result.push({
        label: MONTHS[d.getMonth()],
        value: visibleInvoices.filter(i => i.month === d.getMonth() && i.year === d.getFullYear()).reduce((s, i) => s + i.paid, 0),
        color: m === 0 ? "var(--accent)" : "rgba(0,113,227,0.25)",
      });
    }
    return result;
  }, [visibleInvoices]);

  const recordPayment = useCallback(async (invoiceId, amount, method) => {
    try {
      const result = await api.recordPayment(invoiceId, amount, method);
      setReceiptData(result.receipt);
      setInvoices(prev => prev.map(i => i.id === invoiceId ? result.invoice : i));
      refreshData();
    } catch (err) {
      alert(err?.message || "পেমেন্ট রেকর্ড করা যায়নি।");
    }
  }, [refreshData]);

  // ── মক্কেল ব্যবস্থাপনা ──
  const openAddClient = useCallback(() => {
    setClientForm({ name: "", address: "", contact: "", email: "", phone: "" });
    setClientModal({ mode: "add" });
  }, []);

  const openEditClient = useCallback((client) => {
    setClientForm({
      name: client.name || "",
      address: client.address || "",
      contact: client.contact || "",
      email: client.email || "",
      phone: client.phone || "",
    });
    setClientModal({ mode: "edit", clientId: client.id });
  }, []);

  const saveClient = useCallback(async () => {
    if (!clientForm.name.trim()) return;
    const payload = {
      name: clientForm.name.trim(),
      address: clientForm.address.trim(),
      contact: clientForm.contact.trim(),
      email: clientForm.email.trim(),
      phone: clientForm.phone.trim(),
    };
    try {
      if (clientModal?.mode === "add") {
        await api.createClient(payload);
      } else if (clientModal?.mode === "edit") {
        await api.updateClient(clientModal.clientId, payload);
      }
      setClientModal(null);
      refreshData();
    } catch (err) {
      alert(err?.message || "মক্কেল সংরক্ষণ করা যায়নি।");
    }
  }, [clientForm, clientModal, refreshData]);

  const greeting = NOW.getHours() < 12 ? "সুপ্রভাত" : NOW.getHours() < 17 ? "শুভ অপরাহ্ণ" : "শুভ সন্ধ্যা";
  const friendlyFirstName = useMemo(() => {
    const parts = userInfo.name.split(" ").filter(Boolean);
    const honorifics = new Set(["মো.", "মো", "মোঃ", "মোহাম্মদ", "মিঃ", "মিসেস", "ডা.", "ডঃ"]);
    const skipped = parts.find(p => !honorifics.has(p));
    return skipped || parts[0] || userInfo.name;
  }, [userInfo.name]);

  // ── ড্যাশবোর্ড ──
  const renderDashboard = () => (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>{greeting}, {friendlyFirstName}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>{isDirector ? `আপনার ফার্মের কর্মক্ষমতার সংক্ষিপ্ত বিবরণ — ${MONTHS[currentMonth]} ${formatNumber(currentYear)}` : `আপনার চালান ও বকেয়ার অবস্থা — ${MONTHS[currentMonth]} ${formatNumber(currentYear)}`}</p>
      </div>

      {isDirector && invoices.length === 0 && clients.length === 0 && (
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, #f0f7ff, #e8f4ff)", border: "1px solid #d0e2ff" }}>
          <div className="card-body" style={{ padding: "28px 32px" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>আপনার প্র্যাকটিস ম্যানেজমেন্ট সিস্টেমে স্বাগতম</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              আপনার ফার্মের ডেটা এখন খালি। শুরু করতে, প্রথমে আপনার মক্কেলদের যোগ করুন, তারপর চালান তৈরি করুন।
              প্রতিটি চালানে একাধিক লাইন আইটেম থাকতে পারে এবং আপনি প্রতিটি আইটেম একজন কর্মচারীকে অর্পণ করতে পারেন।
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate("clients")}>
                <Icon name="plus" size={14} /> মক্কেল যোগ করুন
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("invoices")}>
                <Icon name="invoice" size={14} /> চালান তৈরি করুন
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <strong>ডেটা শেয়ারিং সম্পর্কে:</strong> সমস্ত ডেটা এই ব্রাউজারে স্থানীয়ভাবে সংরক্ষিত। একই কম্পিউটারের অন্যান্য ট্যাব রিয়েল-টাইমে সিঙ্ক হবে। বিভিন্ন কম্পিউটারে ডেটার আলাদা কপি থাকবে।
            </p>
          </div>
        </div>
      )}

      {!isDirector && visibleInvoices.length === 0 && (
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, #fffbf0, #fff5e0)", border: "1px solid #ffe4b3" }}>
          <div className="card-body" style={{ padding: "24px 28px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>আপনার জন্য কোন চালান বরাদ্দ করা হয়নি</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              পরিচালক আপনাকে চালানের লাইন আইটেমে অর্পণ করলে সেগুলো এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">মোট আদায়কৃত আয়</div><div className="stat-value">{formatCurrency(totalRevenue)}</div><div className="stat-sub">{formatNumber(visibleInvoices.length)} টি চালান থেকে</div></div>
        <div className="stat-card" onClick={() => navigate("invoices")} style={{ cursor: "pointer" }}><div className="stat-label">বকেয়া</div><div className="stat-value" style={{ color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div><div className="stat-sub">{formatNumber(invoices.filter(i => i.status === "outstanding" || i.status === "sent").length)} টি অপেক্ষমাণ</div></div>
        <div className="stat-card" onClick={() => navigate("outstanding")} style={{ cursor: "pointer" }}><div className="stat-label">মেয়াদোত্তীর্ণ</div><div className="stat-value" style={{ color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div><div className="stat-sub">{formatNumber(overdueCount)} টি মেয়াদোত্তীর্ণ</div></div>
        <div className="stat-card" onClick={() => navigate("employees")} style={{ cursor: "pointer" }}><div className="stat-label">টিমের আকার</div><div className="stat-value" style={{ color: "var(--purple)" }}>{formatNumber(EMPLOYEES.length)}</div><div className="stat-sub">{formatNumber(EMPLOYEES.filter(e => e.category !== "support").length)} জন ফি উপার্জনকারী</div></div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>আয়ের প্রবণতা</h3><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>গত ৬ মাস</span></div>
          <div className="card-body">
            <MiniBarChart data={getMonthlyRevenueData} height={80} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>{getMonthlyRevenueData.map((d, i) => <span key={i} style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", flex: 1 }}>{d.label}</span>)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>চালানের বিভাজন</h3></div>
          <div className="card-body">
            <div className="donut-wrap">
              <DonutChart data={[
                { value: invoices.filter(i => i.status === "paid").reduce((s,i) => s + i.paid, 0), color: "var(--green)" },
                { value: totalOutstanding - totalOverdue, color: "var(--orange)" },
                { value: totalOverdue, color: "var(--red)" },
              ]} size={130} />
              <div className="donut-legend">
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--green)" }} /><div><div style={{ fontWeight: 600 }}>পরিশোধিত</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(invoices.filter(i => i.status === "paid").reduce((s,i) => s + i.paid, 0))}</div></div></div>
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--orange)" }} /><div><div style={{ fontWeight: 600 }}>বকেয়া</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(totalOutstanding - totalOverdue)}</div></div></div>
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--red)" }} /><div><div style={{ fontWeight: 600 }}>মেয়াদোত্তীর্ণ</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(totalOverdue)}</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3>শীর্ষ কর্মীগণ (৬ মাস)</h3><button className="btn btn-ghost btn-sm" onClick={() => navigate("employees")}>সব দেখুন</button></div>
          <div className="card-body">
            {EMPLOYEES.filter(e => e.category !== "support").map(emp => {
              const data = getEmployeeMonthlyData(emp.id);
              const totalRev = data.reduce((s, d) => s + d.revenue, 0);
              const totalCount = data.reduce((s, d) => s + d.count, 0);
              return { emp, totalRev, totalCount };
            }).sort((a,b) => b.totalRev - a.totalRev).slice(0, 5).map(({ emp, totalRev, totalCount }) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedEmployee(emp.id); setPage("employees"); }}>
                <div className={`avatar ${emp.category}`}>{emp.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{emp.shortName}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formatNumber(totalCount)} টি মামলা পরিচালিত</div></div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(totalRev)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>মেয়াদোত্তীর্ণ চালান</h3><button className="btn btn-ghost btn-sm" onClick={() => navigate("outstanding")}>সব দেখুন</button></div>
          <div className="card-body">
            {invoices.filter(i => i.status === "overdue").slice(0, 5).map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedInvoice(inv.id); setPage("invoices"); }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{inv.clientName}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{inv.invoiceNo} · ইস্যু {inv.issueDate}</div></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{formatCurrency(inv.outstanding)}</div>
              </div>
            ))}
            {invoices.filter(i => i.status === "overdue").length === 0 && <div className="empty-state"><p>কোনো মেয়াদোত্তীর্ণ চালান নেই</p></div>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── টিম ──
  const renderEmployees = () => {
    if (selectedEmployee) {
      const emp = EMPLOYEES.find(e => e.id === selectedEmployee);
      if (!emp) return null;
      const monthlyData = getEmployeeMonthlyData(emp.id);
      const totalRev = monthlyData.reduce((s, d) => s + d.revenue, 0);
      const totalCount = monthlyData.reduce((s, d) => s + d.count, 0);
      const avgPerMonth = totalCount > 0 ? Math.round(totalRev / 6) : 0;
      const maxRev = Math.max(...monthlyData.map(d => d.revenue), 1);
      // এই কর্মী দ্বারা পরিচালিত সকল চালান আইটেম সংগ্রহ
      const empItems = [];
      invoices.forEach(inv => {
        inv.items.forEach(item => {
          if (item.employeeId === emp.id) {
            empItems.push({
              invoiceId: inv.id,
              invoiceNo: inv.invoiceNo,
              issueDate: inv.issueDate,
              clientName: inv.clientName,
              description: item.description,
              amount: item.amount,
            });
          }
        });
      });
      empItems.sort((a,b) => b.issueDate.localeCompare(a.issueDate));
      const recentItems = empItems.slice(0, 20);

      return (
        <div className="fade-in">
          <button className="btn btn-ghost" onClick={() => setSelectedEmployee(null)} style={{ marginBottom: 20 }}><Icon name="back" size={16} /> টিমে ফিরে যান</button>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div className={`avatar ${emp.category}`} style={{ width: 72, height: 72, fontSize: 20 }}>{emp.avatar}</div>
            <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>{emp.name}</h2><p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{emp.role} · {emp.tier}</p></div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card"><div className="stat-label">আনিত আয় (৬ মাস)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>{formatCurrency(totalRev)}</div></div>
            <div className="stat-card"><div className="stat-label">পরিচালিত মামলা (৬ মাস)</div><div className="stat-value" style={{ fontSize: 22 }}>{formatNumber(totalCount)}</div></div>
            <div className="stat-card"><div className="stat-label">গড় মাসিক আয়</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(avgPerMonth)}</div></div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3>মাসিক আনিত আয়</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>গত ৬ মাস</span>
            </div>
            <div className="card-body">
              {monthlyData.map((d, i) => (
                <div className="month-row" key={i}>
                  <div className="month-label">{d.month}</div>
                  <div className="month-bar-wrap">
                    <div className="month-bar-fill" style={{ width: `${(d.revenue / maxRev) * 100}%` }}>{d.revenue > 0 && (d.revenue / maxRev) > 0.18 ? `${formatNumber(d.count)} মামলা` : ""}</div>
                  </div>
                  <div className="month-amount">{formatCurrency(d.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>সাম্প্রতিক চালান আইটেম</h3></div>
            <div className="card-body">
              <table>
                <thead><tr><th>চালানের তারিখ</th><th>বিবরণ</th><th>মক্কেল</th><th>চালান নং</th><th style={{ textAlign: "right" }}>পরিমাণ</th></tr></thead>
                <tbody>
                  {recentItems.map((item, idx) => (
                    <tr key={idx} onClick={() => { setSelectedInvoice(item.invoiceId); setPage("invoices"); }}>
                      <td style={{ fontWeight: 500 }}>{item.issueDate}</td>
                      <td style={{ fontWeight: 600 }}>{item.description}</td>
                      <td>{item.clientName}</td>
                      <td style={{ color: "var(--accent)", fontWeight: 600 }}>{item.invoiceNo}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  {recentItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>এখনও কোনো চালান আইটেম নেই</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    const filtered = EMPLOYEES.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()));
    return (
      <div className="fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>টিমের সদস্যবৃন্দ</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{formatNumber(EMPLOYEES.length)} জন সদস্য · {formatNumber(EMPLOYEES.filter(e => e.category !== "support").length)} জন ফি উপার্জনকারী</p></div>
          <div className="search-bar"><Icon name="search" size={16} /><input placeholder="কর্মী অনুসন্ধান..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: "0 24px" }}>
            <table>
              <thead><tr><th>কর্মী</th><th>পদ</th><th>এই মাসের মামলা</th><th>এই মাসের আয়</th><th>৬ মাসের আয়</th></tr></thead>
              <tbody>
                {filtered.map(emp => {
                  const data = getEmployeeMonthlyData(emp.id);
                  const cur = data[data.length - 1] || { count: 0, revenue: 0 };
                  const sixM = data.reduce((s, d) => s + d.revenue, 0);
                  return (
                    <tr key={emp.id} onClick={() => setSelectedEmployee(emp.id)}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className={`avatar ${emp.category}`}>{emp.avatar}</div>
                          <div><div style={{ fontWeight: 600 }}>{emp.shortName}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{emp.tier}</div></div>
                        </div>
                      </td>
                      <td>{emp.role}</td>
                      <td>{formatNumber(cur.count)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(cur.revenue)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(sixM)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── মক্কেল ──
  const renderClients = () => (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>মক্কেলগণ</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{formatNumber(clients.length)} জন সক্রিয় মক্কেল</p>
        </div>
        <button className="btn btn-primary" onClick={openAddClient}>
          <Icon name="plus" size={14} /> মক্কেল যোগ করুন
        </button>
      </div>
      <div className="card"><div className="card-body" style={{ padding: "0 24px" }}>
        <table>
          <thead><tr><th>মক্কেল</th><th>ঠিকানা</th><th>যোগাযোগ</th><th>ইমেইল</th><th>ফোন</th><th>মোট চালান</th><th>বকেয়া</th><th style={{ width: 80, textAlign: "center" }}>অ্যাকশন</th></tr></thead>
          <tbody>{clients.map(c => {
            const ti = invoices.filter(i => i.clientId === c.id).reduce((s,i) => s + i.amount, 0);
            return (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 200 }}>{c.address || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                <td>{c.contact || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                <td style={{ color: "var(--accent)" }}>{c.email || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                <td style={{ fontSize: 12.5 }}>{c.phone || <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(ti)}</td>
                <td style={{ fontWeight: 700, color: c.outstanding > 0 ? "var(--red)" : "var(--green)" }}>{formatCurrency(c.outstanding)}</td>
                <td style={{ textAlign: "center" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditClient(c)} title="মক্কেল সম্পাদনা" style={{ padding: "5px 10px" }}>
                    <Icon name="edit" size={13} /> সম্পাদনা
                  </button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div></div>
    </div>
  );

  // ── বিশ্লেষণ ──
  const renderAnalytics = () => {
    const clientRevenue = {};
    invoices.forEach(inv => {
      if (!clientRevenue[inv.clientId]) clientRevenue[inv.clientId] = { name: inv.clientName, paid: 0, outstanding: 0, total: 0 };
      clientRevenue[inv.clientId].paid += inv.paid;
      clientRevenue[inv.clientId].outstanding += inv.outstanding;
      clientRevenue[inv.clientId].total += inv.amount;
    });
    const clientData = Object.values(clientRevenue).sort((a,b) => b.total - a.total);

    // গত ৭ দিনের পেমেন্ট পদ্ধতি অনুযায়ী বিভাজন
    const dayLabels = ["রবি","সোম","মঙ্গল","বুধ","বৃহঃ","শুক্র","শনি"];
    const monthNames = ["জানু","ফেব্রু","মার্চ","এপ্রি","মে","জুন","জুলাই","আগ","সেপ্টে","অক্টো","নভে","ডিসে"];
    const dailyPayments = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - d);
      const dayStr = day.toISOString().split("T")[0];
      let cash = 0, bkash = 0;
      invoices.forEach(inv => {
        (inv.payments || []).forEach(p => {
          if (p.dateOnly === dayStr) {
            if (p.method === "bkash") bkash += p.amount;
            else cash += p.amount;
          }
        });
      });
      dailyPayments.push({
        dateLabel: `${formatNumber(day.getDate())} ${monthNames[day.getMonth()]}`,
        dayLabel: dayLabels[day.getDay()],
        cash,
        bkash,
        total: cash + bkash,
      });
    }
    const maxDayTotal = Math.max(...dailyPayments.map(d => d.total), 1);
    const totalCash7d = dailyPayments.reduce((s, d) => s + d.cash, 0);
    const totalBkash7d = dailyPayments.reduce((s, d) => s + d.bkash, 0);
    const total7d = totalCash7d + totalBkash7d;

    const empData = EMPLOYEES.filter(e => e.category !== "support").map(emp => {
      const data = getEmployeeMonthlyData(emp.id);
      return { emp, totalRev: data.reduce((s,d) => s + d.revenue, 0), totalCount: data.reduce((s,d) => s + d.count, 0) };
    }).sort((a,b) => b.totalRev - a.totalRev);

    const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

    return (
      <div className="fade-in">
        <div style={{ marginBottom: 28 }}><h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>বিশ্লেষণ</h2><p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>ফার্মের কর্মক্ষমতা বিশ্লেষণ — গত ৬ মাস</p></div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat-card"><div className="stat-label">আদায়কৃত আয় (৬ মাস)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(totalRevenue)}</div></div>
          <div className="stat-card"><div className="stat-label">মোট চালান (৬ মাস)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>{formatCurrency(totalInvoiced)}</div></div>
          <div className="stat-card"><div className="stat-label">আদায়ের হার</div><div className="stat-value" style={{ fontSize: 22, color: collectionRate >= 70 ? "var(--green)" : collectionRate >= 50 ? "var(--orange)" : "var(--red)" }}>{formatNumber(collectionRate)}%</div></div>
        </div>

        {/* গত ৭ দিনের প্রাপ্ত পেমেন্ট */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <h3>দৈনিক প্রাপ্ত পেমেন্ট</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>গত ৭ দিন · মোট: {formatCurrency(total7d)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                নগদ <strong style={{ marginLeft: 4 }}>{formatCurrency(totalCash7d)}</strong>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E2136E", display: "inline-block" }} />
                বিকাশ <strong style={{ marginLeft: 4 }}>{formatCurrency(totalBkash7d)}</strong>
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: "20px 24px 24px" }}>
            {(() => {
              const CHART_H = 280;
              return (
                <div style={{ display: "flex", position: "relative" }}>
                  <div style={{ width: 85, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: CHART_H, paddingRight: 10 }}>
                    {[100, 75, 50, 25, 0].map(pct => <div key={pct} style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textAlign: "right", lineHeight: 1 }}>{formatCurrency(Math.round(maxDayTotal * pct / 100))}</div>)}
                  </div>
                  <div style={{ flex: 1, position: "relative", height: CHART_H }}>
                    {[0, 25, 50, 75, 100].map(pct => <div key={pct} style={{ position: "absolute", top: `${100 - pct}%`, left: 0, right: 0, height: 1, background: pct === 0 ? "var(--border)" : "var(--border-light)", zIndex: 0 }} />)}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: "100%", position: "relative", zIndex: 1, padding: "0 12px" }}>
                      {dailyPayments.map((d, i) => {
                        const totalPx = (d.total / maxDayTotal) * CHART_H;
                        const cashPx = d.total > 0 ? (d.cash / d.total) * totalPx : 0;
                        const bkashPx = d.total > 0 ? (d.bkash / d.total) * totalPx : 0;
                        return (
                          <div key={i} className="tooltip-wrap" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text)", marginBottom: 6, whiteSpace: "nowrap" }}>{d.total > 0 ? formatCurrency(d.total) : ""}</div>
                            <div style={{ width: "75%", maxWidth: 70, minWidth: 28, height: totalPx, display: "flex", flexDirection: "column", borderRadius: "10px 10px 0 0", overflow: "hidden", boxShadow: totalPx > 0 ? "0 -4px 16px rgba(0,113,227,0.15)" : "none", transition: "height 0.6s cubic-bezier(0.25,0.46,0.45,0.94)" }}>
                              {bkashPx > 0 && <div style={{ height: bkashPx, background: "linear-gradient(180deg, #E2136E, #c11260)", flexShrink: 0 }} />}
                              {cashPx > 0 && <div style={{ height: cashPx, background: "linear-gradient(180deg, var(--accent), #0077ED)", flexShrink: 0 }} />}
                            </div>
                            <div className="tooltip" style={{ minWidth: 180, textAlign: "left", lineHeight: 1.6 }}>
                              <strong>{d.dayLabel}, {d.dateLabel}</strong><br/>
                              নগদ: {formatCurrency(d.cash)}<br/>
                              বিকাশ: {formatCurrency(d.bkash)}<br/>
                              <strong>মোট: {formatCurrency(d.total)}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{ display: "flex", marginTop: 14, paddingLeft: 85 }}>
              <div style={{ flex: 1, display: "flex", gap: 12, padding: "0 12px" }}>
                {dailyPayments.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{d.dayLabel}</div>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{d.dateLabel}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* দৈনিক গ্রহণকারী জবাবদিহিতা চার্ট */}
        {(() => {
          const receiverMap = {};
          invoices.forEach(inv => {
            (inv.payments || []).forEach(p => {
              if (p.dateOnly === selectedAnalyticsDate) {
                const name = p.recordedBy || "অজানা";
                if (!receiverMap[name]) receiverMap[name] = { name, cash: 0, bkash: 0, total: 0, count: 0 };
                if (p.method === "bkash") receiverMap[name].bkash += p.amount;
                else receiverMap[name].cash += p.amount;
                receiverMap[name].total += p.amount;
                receiverMap[name].count += 1;
              }
            });
          });
          const receivers = Object.values(receiverMap).sort((a, b) => b.total - a.total);
          const maxReceiverTotal = Math.max(...receivers.map(r => r.total), 1);
          const dayTotal = receivers.reduce((s, r) => s + r.total, 0);
          const dayCash = receivers.reduce((s, r) => s + r.cash, 0);
          const dayBkash = receivers.reduce((s, r) => s + r.bkash, 0);
          const totalPayments = receivers.reduce((s, r) => s + r.count, 0);
          const selectedDateObj = new Date(selectedAnalyticsDate);
          const niceDate = selectedDateObj.toLocaleDateString("bn-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

          return (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3>দৈনিক গ্রহণকারী জবাবদিহিতা</h3>
                  <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>নির্দিষ্ট দিনে কে কত পেমেন্ট গ্রহণ করেছেন</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>তারিখ নির্বাচন:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedAnalyticsDate}
                    onChange={e => setSelectedAnalyticsDate(e.target.value)}
                    max={NOW.toISOString().split("T")[0]}
                    style={{ width: 170, padding: "7px 12px", fontSize: 12.5 }}
                  />
                </div>
              </div>
              <div className="card-body" style={{ padding: "16px 24px 24px" }}>
                <div style={{ background: "var(--bg)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: 0.3 }}>পেমেন্ট দেখানো হচ্ছে</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{niceDate}</div>
                  </div>
                  <div style={{ display: "flex", gap: 28 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>মোট প্রাপ্ত</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(dayTotal)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>গ্রহণকারী</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(receivers.length)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>লেনদেন</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(totalPayments)}</div>
                    </div>
                  </div>
                </div>

                {receivers.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <p>এই তারিখে কোনো পেমেন্ট রেকর্ড করা হয়নি।</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 16, fontSize: 11.5, marginBottom: 14 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                        নগদ <strong style={{ marginLeft: 4 }}>{formatCurrency(dayCash)}</strong>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E2136E", display: "inline-block" }} />
                        বিকাশ <strong style={{ marginLeft: 4 }}>{formatCurrency(dayBkash)}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {receivers.map((r, i) => {
                        const widthPct = (r.total / maxReceiverTotal) * 100;
                        const cashPct = r.total > 0 ? (r.cash / r.total) * widthPct : 0;
                        const bkashPct = r.total > 0 ? (r.bkash / r.total) * widthPct : 0;
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                                  {r.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                                  <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{formatNumber(r.count)} টি লেনদেন</div>
                                </div>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(r.total)}</span>
                            </div>
                            <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", background: "var(--border-light)" }}>
                              {cashPct > 0 && <div style={{ width: `${cashPct}%`, background: "linear-gradient(90deg, var(--accent), #0077ED)", height: "100%", transition: "width 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", whiteSpace: "nowrap" }}>{cashPct > 12 ? formatCurrency(r.cash) : ""}</div>}
                              {bkashPct > 0 && <div style={{ width: `${bkashPct}%`, background: "linear-gradient(90deg, #E2136E, #c11260)", height: "100%", transition: "width 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", whiteSpace: "nowrap" }}>{bkashPct > 12 ? formatCurrency(r.bkash) : ""}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>মক্কেল অনুযায়ী আয়</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--green)", display: "inline-block" }} /> আদায়কৃত</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--red)", display: "inline-block" }} /> বকেয়া</span>
            </div>
          </div>
          <div className="card-body">
            {clientData.map((c, i) => {
              const paidPct = c.total > 0 ? (c.paid / c.total) * 100 : 0;
              const outPct = c.total > 0 ? (c.outstanding / c.total) * 100 : 0;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{formatCurrency(c.total)}</span>
                  </div>
                  <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
                    {paidPct > 0 && <div style={{ width: `${paidPct}%`, background: "var(--green)", height: "100%", transition: "width 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden" }}>{paidPct > 18 ? formatCurrency(c.paid) : ""}</div>}
                    {outPct > 0 && <div style={{ width: `${outPct}%`, background: "var(--red)", height: "100%", transition: "width 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#fff", overflow: "hidden" }}>{outPct > 18 ? formatCurrency(c.outstanding) : ""}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>আদায়: {formatCurrency(c.paid)} ({formatNumber(paidPct.toFixed(0))}%)</span>
                    <span style={{ fontSize: 10, color: c.outstanding > 0 ? "var(--red)" : "var(--text-tertiary)" }}>বকেয়া: {formatCurrency(c.outstanding)} ({formatNumber(outPct.toFixed(0))}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>কর্মী পারফরম্যান্স তালিকা</h3><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>আনিত আয় (৬ মাস)</span></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {empData.map(({ emp, totalRev, totalCount }, i) => {
              const avgPerCase = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;
              return (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedEmployee(emp.id); setPage("employees"); }}>
                  <span style={{ width: 26, fontSize: 13, fontWeight: 800, color: i < 3 ? "var(--accent)" : "var(--text-tertiary)", textAlign: "center" }}>{formatNumber(i + 1)}</span>
                  <div className={`avatar ${emp.category}`} style={{ width: 34, height: 34, fontSize: 10 }}>{emp.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{emp.shortName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{emp.role} · {formatNumber(totalCount)} মামলা</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 20 }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>প্রতি মামলা গড়</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{formatCurrency(avgPerCase)}</div>
                  </div>
                  <div style={{ textAlign: "right", width: 130 }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>মোট আয়</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(totalRev)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const pageTitle = { dashboard: "ড্যাশবোর্ড", employees: "টিম", invoices: "চালান", outstanding: "বকেয়া", clients: "মক্কেলগণ", analytics: "বিশ্লেষণ" };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return renderDashboard();
      case "employees": return renderEmployees();
      case "invoices": return <InvoicesPage invoices={invoices} setInvoices={setInvoices} clients={clients} setClients={setClients} selectedInvoice={selectedInvoice} setSelectedInvoice={setSelectedInvoice} totalRevenue={totalRevenue} totalOutstanding={totalOutstanding} totalOverdue={totalOverdue} setPaymentModal={setPaymentModal} setPaymentAmount={setPaymentAmount} />;
      case "outstanding": return <OutstandingPage invoices={invoices} clients={clients} totalOutstanding={totalOutstanding} totalOverdue={totalOverdue} overdueCount={overdueCount} setPaymentModal={setPaymentModal} setPaymentAmount={setPaymentAmount} setSelectedInvoice={setSelectedInvoice} navigateTo={(pg) => setPage(pg)} />;
      case "clients": return renderClients();
      case "analytics": return renderAnalytics();
      default: return renderDashboard();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand"><h1>রুহুল কুদ্দুস<br/>অ্যান্ড জুরিস্টস</h1><p>প্র্যাকটিস ম্যানেজমেন্ট</p></div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">সংক্ষিপ্ত বিবরণ</div>
              <div className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}><Icon name="dashboard" /> ড্যাশবোর্ড</div>
              <div className={`nav-item ${page === "analytics" ? "active" : ""}`} onClick={() => navigate("analytics")}><Icon name="chart" /> বিশ্লেষণ</div>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">ব্যবস্থাপনা</div>
              <div className={`nav-item ${page === "employees" ? "active" : ""}`} onClick={() => navigate("employees")}><Icon name="people" /> টিম</div>
              <div className={`nav-item ${page === "clients" ? "active" : ""}`} onClick={() => navigate("clients")}><Icon name="people" /> মক্কেলগণ</div>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">বিলিং</div>
              <div className={`nav-item ${page === "invoices" ? "active" : ""}`} onClick={() => navigate("invoices")}><Icon name="invoice" /> চালান</div>
              <div className={`nav-item ${page === "outstanding" ? "active" : ""}`} onClick={() => navigate("outstanding")}><Icon name="alert" /> বকেয়া{overdueCount > 0 && <span className="badge">{formatNumber(overdueCount)}</span>}</div>
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user" style={{ marginBottom: 12 }}>
              <div className="sidebar-user-avatar">রুকা</div>
              <div className="sidebar-user-info"><h4>রুহুল কুদ্দুস</h4><p>পরিচালক</p></div>
            </div>
            <button
              onClick={onLanguageToggle}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontFamily: "var(--font)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              🌐 View in English · English
            </button>
          </div>
        </aside>
        <div className="main">
          <header className="topbar"><h2 className="topbar-title">{pageTitle[page]}</h2><span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{MONTHS[currentMonth]} {formatNumber(currentYear)}</span></header>
          <div className="content">{renderPage()}</div>
        </div>
      </div>
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h2>পেমেন্ট রেকর্ড করুন</h2><button className="modal-close" onClick={() => setPaymentModal(null)}><Icon name="x" size={16} /></button></div>
            <div className="modal-body">{(() => {
              const inv = invoices.find(i => i.id === paymentModal);
              if (!inv) return null;
              return (
                <>
                  <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>{inv.invoiceNo}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{inv.clientName}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>বকেয়া: <strong style={{ color: "var(--red)" }}>{formatCurrency(inv.outstanding)}</strong></div>
                  </div>
                  <div className="form-group"><label className="form-label">পেমেন্ট পরিমাণ (টাকা)</label><input type="number" className="form-input" placeholder="পরিমাণ লিখুন" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={inv.outstanding} /></div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPaymentAmount(String(Math.floor(inv.outstanding / 2)))}>৫০%</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPaymentAmount(String(inv.outstanding))}>পুরো পরিমাণ</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">পেমেন্ট পদ্ধতি</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button
                        className="btn"
                        onClick={() => setPaymentMethod("cash")}
                        style={{
                          padding: "12px 0",
                          justifyContent: "center",
                          background: paymentMethod === "cash" ? "var(--accent)" : "var(--bg)",
                          color: paymentMethod === "cash" ? "#fff" : "var(--text)",
                          border: paymentMethod === "cash" ? "1px solid var(--accent)" : "1px solid var(--border)",
                          fontWeight: 600,
                        }}>
                        💵 নগদ
                      </button>
                      <button
                        className="btn"
                        onClick={() => setPaymentMethod("bkash")}
                        style={{
                          padding: "12px 0",
                          justifyContent: "center",
                          background: paymentMethod === "bkash" ? "#E2136E" : "var(--bg)",
                          color: paymentMethod === "bkash" ? "#fff" : "var(--text)",
                          border: paymentMethod === "bkash" ? "1px solid #E2136E" : "1px solid var(--border)",
                          fontWeight: 600,
                        }}>
                        📱 বিকাশ
                      </button>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0" }} onClick={() => { const amt = Number(paymentAmount); if (amt > 0 && amt <= inv.outstanding) { recordPayment(paymentModal, amt, paymentMethod); setPaymentModal(null); setPaymentMethod("cash"); } }}>পেমেন্ট নিশ্চিত করুন</button>
                </>
              );
            })()}</div>
          </div>
        </div>
      )}

      {receiptData && (
        <div className="modal-overlay" onClick={() => setReceiptData(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ paddingBottom: 8 }}>
              <div>
                <h2 style={{ marginBottom: 2 }}>পেমেন্ট রসিদ</h2>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>রসিদ নং {receiptData.receiptNo}</p>
              </div>
              <button className="modal-close" onClick={() => setReceiptData(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="check" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1a8f2d" }}>পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে</div>
                  <div style={{ fontSize: 11.5, color: "#1a8f2d", marginTop: 2 }}>রসিদ ইস্যু · {receiptData.date}</div>
                </div>
              </div>

              <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px solid var(--text)", marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>{FIRM.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 4 }}>{FIRM.address}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 2 }}>{FIRM.phone} · {FIRM.email}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>প্রাপ্ত হয়েছে</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.clientName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>চালান নং</span>
                  <span style={{ fontWeight: 600, color: "var(--accent)" }}>{receiptData.invoiceNo}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>তারিখ ও সময়</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.date}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>গ্রহণকারী</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.receivedBy} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>· {receiptData.receivedByRole}</span></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>পেমেন্ট পদ্ধতি</span>
                  <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {receiptData.method === "bkash" ? <span style={{ color: "#E2136E" }}>📱 বিকাশ</span> : <span>💵 নগদ</span>}
                  </span>
                </div>
              </div>

              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>বকেয়া (পেমেন্টের আগে)</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(receiptData.amountBefore)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>প্রাপ্ত পেমেন্ট</span>
                  <span style={{ fontWeight: 700, color: "var(--green)", fontSize: 15 }}>{formatCurrency(receiptData.paymentAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0 4px" }}>
                  <span style={{ fontWeight: 700 }}>অবশিষ্ট বকেয়া</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: receiptData.remainingOutstanding > 0 ? "var(--red)" : "var(--green)" }}>{formatCurrency(receiptData.remainingOutstanding)}</span>
                </div>
              </div>

              {receiptData.remainingOutstanding === 0 && (
                <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#1a8f2d", textAlign: "center", fontWeight: 600 }}>
                  ✓ চালান সম্পূর্ণ পরিশোধিত
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => window.print()}>রসিদ প্রিন্ট করুন</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setReceiptData(null)}>সম্পন্ন</button>
              </div>

              <p style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 14 }}>এটি একটি কম্পিউটার-জেনারেটেড রসিদ এবং স্বাক্ষরের প্রয়োজন নেই।</p>
            </div>
          </div>
        </div>
      )}

      {clientModal && (
        <div className="modal-overlay" onClick={() => setClientModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{clientModal.mode === "add" ? "নতুন মক্কেল যোগ করুন" : "মক্কেল সম্পাদনা"}</h2>
              <button className="modal-close" onClick={() => setClientModal(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">কোম্পানির নাম <span style={{ color: "var(--red)" }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="যেমন: এবিসি কর্পোরেশন লিমিটেড"
                  value={clientForm.name}
                  onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">ঠিকানা <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="সম্পূর্ণ ঠিকানা"
                  value={clientForm.address}
                  onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))}
                  rows={3}
                  style={{ resize: "vertical", minHeight: 70 }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">যোগাযোগের ব্যক্তি <span style={{ color: "var(--red)" }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="যেমন: আইন বিভাগ"
                    value={clientForm.contact}
                    onChange={e => setClientForm(p => ({ ...p, contact: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ইমেইল <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 11 }}>(ঐচ্ছিক)</span></label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="contact@company.com"
                    value={clientForm.email}
                    onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">মোবাইল নম্বর <span style={{ color: "var(--red)" }}>*</span></label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+৮৮০-২-XXXXXXX"
                  value={clientForm.phone}
                  onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setClientModal(null)}>বাতিল</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", padding: "10px 0" }}
                  onClick={saveClient}
                  disabled={!clientForm.name.trim() || !clientForm.address.trim() || !clientForm.contact.trim() || !clientForm.phone.trim()}
                >
                  {clientModal.mode === "add" ? "যোগ করুন" : "পরিবর্তন সংরক্ষণ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
