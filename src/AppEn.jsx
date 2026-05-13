import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api, getToken } from "./api.js";

// ─── FIRM INFO ─────────────────────────────────────────────────
const FIRM = {
  name: "Ruhul Quddus & Jurists",
  tagline: "Leading Law Firm in Bangladesh",
  address: "Delvista Fuljhuri, Level-10, Plot No.59, Sat Mosjid Road, Dhanmondi, Dhaka",
  phone: "+880 1713-141149",
  email: "ruhul70@yahoo.com",
};

// Employees
const EMPLOYEES = [
  { id: "e1",  name: "Ruhul Quddus Kazal",   shortName: "RQ Kazal",   role: "Founder & Head of Chambers", tier: "Senior Advocate", category: "head",      avatar: "RQ" },
  { id: "e2",  name: "Akter Rasul Murad",    shortName: "AR Murad",   role: "Senior Associate",            tier: "Advocate",        category: "senior",    avatar: "AM" },
  { id: "e3",  name: "Md. Mosaddek Billah",  shortName: "M Billah",   role: "Senior Associate",            tier: "Advocate",        category: "senior",    avatar: "MB" },
  { id: "e4",  name: "Md. Anwar Hossain",    shortName: "A Hossain",  role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "AH" },
  { id: "e5",  name: "Md. Salahuddin",       shortName: "S Tuhin",    role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "ST" },
  { id: "e6",  name: "Syful Islam",          shortName: "S Islam",    role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "SI" },
  { id: "e7",  name: "Dulon Chapa",          shortName: "D Chapa",    role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "DC" },
  { id: "e8",  name: "Israt Jahan Monika",   shortName: "IJ Monika",  role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "IM" },
  { id: "e9",  name: "Habibur Rahman",       shortName: "H Rahman",   role: "Associate",                   tier: "Advocate",        category: "associate", avatar: "HR" },
  { id: "e10", name: "Md. Muzahidul Islam",  shortName: "M Islam",    role: "Research Associate",          tier: "Researcher",      category: "research",  avatar: "MI" },
  { id: "e11", name: "Mohammad Gias Uddin",  shortName: "G Uddin",    role: "Advocate's Assistant",        tier: "Support",         category: "support",   avatar: "GU" },
  { id: "e12", name: "Mizanur Rahman Masum", shortName: "M Masum",    role: "Office Assistant",            tier: "Support",         category: "support",   avatar: "MM" },
  { id: "e13", name: "Md Zahid Hassan",      shortName: "Z Hassan",   role: "Clerk",                       tier: "Support",         category: "support",   avatar: "ZH" },
  { id: "e14", name: "Md. Jahid",            shortName: "M Jahid",    role: "IT Support",                  tier: "Support",         category: "support",   avatar: "MJ" },
];

// Login credentials — username/password mapped to employee IDs
// In production these would be hashed and stored on the server.
// 'director' role sees everything; 'employee' role sees only their own data.
const USERS = [
  { username: "director",   password: "rq2026",      employeeId: "e1",  role: "director", displayName: "Ruhul Quddus Kazal", displayRole: "Director" },
  { username: "ar.murad",   password: "murad2026",   employeeId: "e2",  role: "employee", displayName: "Akter Rasul Murad",  displayRole: "Senior Associate" },
  { username: "m.billah",   password: "billah2026",  employeeId: "e3",  role: "employee", displayName: "Md. Mosaddek Billah",displayRole: "Senior Associate" },
  { username: "a.hossain",  password: "hossain2026", employeeId: "e4",  role: "employee", displayName: "Md. Anwar Hossain",  displayRole: "Associate" },
  { username: "s.tuhin",    password: "tuhin2026",   employeeId: "e5",  role: "employee", displayName: "Md. Salahuddin",     displayRole: "Associate" },
  { username: "s.islam",    password: "islam2026",   employeeId: "e6",  role: "employee", displayName: "Syful Islam",        displayRole: "Associate" },
  { username: "d.chapa",    password: "chapa2026",   employeeId: "e7",  role: "employee", displayName: "Dulon Chapa",        displayRole: "Associate" },
  { username: "i.monika",   password: "monika2026",  employeeId: "e8",  role: "employee", displayName: "Israt Jahan Monika", displayRole: "Associate" },
  { username: "h.rahman",   password: "rahman2026",  employeeId: "e9",  role: "employee", displayName: "Habibur Rahman",     displayRole: "Associate" },
  { username: "m.islam",    password: "research2026",employeeId: "e10", role: "employee", displayName: "Md. Muzahidul Islam",displayRole: "Research Associate" },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NOW = new Date();

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (n) => "\u09F3" + Number(n || 0).toLocaleString("en-BD");

// Module-level helper: returns props for a modal-overlay div that only closes the modal
// when the user clicks (not when they release a text-drag started inside the modal).
// Tracks the mousedown target on the DOM element itself, so it works without a hook.
function overlayDismiss(onDismiss) {
  return {
    onMouseDown: (e) => {
      // Mark the element if mousedown happened directly on it
      e.currentTarget.dataset.downOk = e.target === e.currentTarget ? "1" : "0";
    },
    onMouseUp: (e) => {
      const ok = e.currentTarget.dataset.downOk === "1" && e.target === e.currentTarget;
      e.currentTarget.dataset.downOk = "0";
      if (ok) onDismiss();
    },
  };
}
const formatNumber = (n) => Number(n || 0).toLocaleString("en-BD");

const statusLabel = (status) => ({
  paid: "Paid",
  sent: "Sent",
  outstanding: "Outstanding",
  overdue: "Overdue",
}[status] || status);

// Auto-compute invoice status:
// < 2 weeks: sent | 2 weeks – 2 months: outstanding | > 2 months: overdue
function computeInvoiceStatus(issueDate, paid, amount, asOfDate = NOW) {
  if (paid >= amount) return "paid";
  const issued = new Date(issueDate);
  const daysDiff = Math.floor((asOfDate - issued) / (1000 * 60 * 60 * 24));
  if (daysDiff < 14) return "sent";
  if (daysDiff < 60) return "outstanding";
  return "overdue";
}

function generateSeedData() {
  // Production: start with empty data so each deployment is clean.
  // The director adds clients first, then creates invoices.
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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
:root{--bg:#f5f5f7;--surface:#fff;--surface-alt:#fbfbfd;--text:#1d1d1f;--text-secondary:#86868b;--text-tertiary:#afafb2;--border:#e8e8ed;--border-light:#f0f0f5;--accent:#0071e3;--accent-light:#e8f2fe;--accent-hover:#0077ED;--green:#28cd41;--green-light:#e6f9ea;--red:#ff3b30;--red-light:#ffe5e3;--orange:#ff9500;--orange-light:#fff4e5;--purple:#af52de;--shadow-sm:0 1px 3px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.02);--shadow-md:0 4px 12px rgba(0,0,0,.06),0 1px 4px rgba(0,0,0,.04);--shadow-lg:0 12px 40px rgba(0,0,0,.08),0 4px 12px rgba(0,0,0,.04);--radius-sm:10px;--radius-md:14px;--radius-lg:20px;--radius-xl:24px;--font:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;--transition:.2s cubic-bezier(.25,.46,.45,.94)}
*{margin:0;padding:0;box-sizing:border-box}body,html,#root{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;height:100%}
.app{display:flex;height:100vh;overflow:hidden}
.sidebar{width:260px;background:rgba(255,255,255,.82);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:10;flex-shrink:0}
.sidebar-brand{padding:28px 24px 20px;border-bottom:1px solid var(--border-light)}.sidebar-brand h1{font-size:15px;font-weight:700;letter-spacing:-.3px;line-height:1.2}.sidebar-brand p{font-size:11px;color:var(--text-tertiary);margin-top:4px;font-weight:500;text-transform:uppercase;letter-spacing:.8px}
.sidebar-nav{flex:1;padding:16px 12px;overflow-y:auto}.nav-section{margin-bottom:24px}.nav-section-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-tertiary);padding:0 12px;margin-bottom:6px}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition);font-size:13.5px;font-weight:500;color:var(--text-secondary);margin-bottom:2px}.nav-item:hover{background:rgba(0,0,0,.04);color:var(--text)}.nav-item.active{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(0,113,227,.3)}
.nav-item .badge{margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;min-width:20px;text-align:center}.nav-item.active .badge{background:rgba(255,255,255,.3)}
.sidebar-footer{padding:16px 20px;border-top:1px solid var(--border-light)}.sidebar-user{display:flex;align-items:center;gap:10px}.sidebar-user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0}.sidebar-user-info h4{font-size:12.5px;font-weight:600}.sidebar-user-info p{font-size:10.5px;color:var(--text-tertiary)}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}.topbar{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.72);backdrop-filter:blur(20px);flex-shrink:0}.topbar-title{font-size:18px;font-weight:700;letter-spacing:-.4px}.content{flex:1;overflow-y:auto;padding:28px 32px;scroll-behavior:smooth}
.card{background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);box-shadow:var(--shadow-sm);overflow:hidden;transition:box-shadow var(--transition)}.card:hover{box-shadow:var(--shadow-md)}.card-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0}.card-header h3{font-size:15px;font-weight:700;letter-spacing:-.2px}.card-body{padding:16px 24px 24px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:28px}.stat-card{background:var(--surface);border-radius:var(--radius-lg);border:1px solid var(--border);padding:22px 24px;box-shadow:var(--shadow-sm);transition:all var(--transition)}.stat-card:hover{box-shadow:var(--shadow-md);transform:translateY(-1px)}.stat-label{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--text-tertiary);margin-bottom:10px}.stat-value{font-size:28px;font-weight:700;letter-spacing:-1px;line-height:1}.stat-sub{font-size:12px;color:var(--text-secondary);margin-top:8px;display:flex;align-items:center;gap:4px}.stat-change{display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 8px;border-radius:6px}.stat-change.up{background:var(--green-light);color:#1a8f2d}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;font-family:var(--font);cursor:pointer;transition:all var(--transition);border:none;white-space:nowrap}.btn-primary{background:var(--accent);color:#fff;box-shadow:0 1px 4px rgba(0,113,227,.25)}.btn-primary:hover{background:var(--accent-hover);box-shadow:0 2px 8px rgba(0,113,227,.35)}.btn-secondary{background:var(--bg);color:var(--text);border:1px solid var(--border)}.btn-secondary:hover{background:#ededf0}.btn-ghost{background:transparent;color:var(--accent)}.btn-ghost:hover{background:var(--accent-light)}.btn-sm{padding:5px 12px;font-size:12px}
table{width:100%;border-collapse:separate;border-spacing:0}thead th{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-tertiary);text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);white-space:nowrap;position:sticky;top:0;background:var(--surface)}tbody td{padding:14px 16px;font-size:13.5px;border-bottom:1px solid var(--border-light);vertical-align:middle}tbody tr{transition:background var(--transition);cursor:pointer}tbody tr:hover{background:var(--surface-alt)}tbody tr:last-child td{border-bottom:none}
.badge-status{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:8px;font-size:11.5px;font-weight:600;white-space:nowrap}.badge-paid{background:var(--green-light);color:#1a8f2d}.badge-sent{background:var(--accent-light);color:var(--accent)}.badge-outstanding{background:var(--orange-light);color:#b36b00}.badge-overdue{background:var(--red-light);color:var(--red)}
.avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:700;color:#fff;flex-shrink:0}.avatar.head{background:linear-gradient(135deg,#1d1d1f,#48484a)}.avatar.senior{background:linear-gradient(135deg,#0071e3,#40a9ff)}.avatar.associate{background:linear-gradient(135deg,#34c759,#30d158)}.avatar.research{background:linear-gradient(135deg,#af52de,#bf5af2)}.avatar.support{background:linear-gradient(135deg,#ff9500,#ff9f0a)}
.progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}.progress-fill{height:100%;border-radius:3px;transition:width .6s ease}
.mini-chart{display:flex;align-items:flex-end;gap:3px;height:50px;padding-top:4px}.mini-bar{flex:1;border-radius:3px 3px 0 0;min-height:4px;transition:all var(--transition)}.mini-bar:hover{opacity:.8}
.form-group{margin-bottom:16px}.form-label{font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:block}.form-input,.form-select,.form-textarea{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13.5px;font-family:var(--font);color:var(--text);background:var(--surface);transition:border-color var(--transition),box-shadow var(--transition);outline:none}.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,113,227,.12)}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn .2s ease}.modal{background:var(--surface);border-radius:var(--radius-xl);width:90%;max-width:560px;max-height:85vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:slideUp .3s ease}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:24px 28px 0}.modal-header h2{font-size:18px;font-weight:700;letter-spacing:-.3px}.modal-body{padding:20px 28px 28px}.modal-close{background:var(--bg);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:all var(--transition)}.modal-close:hover{background:#e5e5ea;color:var(--text)}
.tabs{display:flex;gap:2px;background:var(--bg);padding:3px;border-radius:var(--radius-sm);margin-bottom:24px;width:fit-content}.tab{padding:7px 16px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--text-secondary);cursor:pointer;transition:all var(--transition);border:none;background:transparent;font-family:var(--font)}.tab.active{background:var(--surface);color:var(--text);box-shadow:var(--shadow-sm)}.tab:hover:not(.active){color:var(--text)}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--bg);border-radius:var(--radius-sm);padding:0 14px;border:1px solid transparent;transition:all var(--transition)}.search-bar:focus-within{border-color:var(--accent);background:var(--surface);box-shadow:0 0 0 3px rgba(0,113,227,.1)}.search-bar input{border:none;background:transparent;padding:9px 0;font-size:13px;font-family:var(--font);color:var(--text);outline:none;width:220px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.month-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-light)}.month-row:last-child{border-bottom:none}.month-label{width:50px;font-size:12px;font-weight:600;color:var(--text-secondary);flex-shrink:0}.month-bar-wrap{flex:1;height:28px;border-radius:6px;overflow:hidden;background:var(--border-light);position:relative}.month-bar-fill{background:var(--accent);height:100%;transition:width .5s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;font-size:10.5px;font-weight:700;color:#fff;overflow:hidden;border-radius:6px}.month-amount{width:130px;text-align:right;font-size:13px;font-weight:700;flex-shrink:0}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;padding:20px;background:var(--bg);border-radius:var(--radius-md)}.inv-meta-item label{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--text-tertiary);display:block;margin-bottom:4px}.inv-meta-item span{font-size:14px;font-weight:600}.inv-total-row{display:flex;justify-content:space-between;padding:12px 0;border-top:1px solid var(--border)}.inv-total-row.grand{font-size:18px;font-weight:700;border-top:2px solid var(--text);padding-top:16px;margin-top:4px}
.donut-wrap{display:flex;align-items:center;gap:24px}.donut-legend{display:flex;flex-direction:column;gap:8px}.donut-legend-item{display:flex;align-items:center;gap:8px;font-size:12.5px}.donut-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.tooltip-wrap{position:relative}.tooltip-wrap:hover .tooltip{opacity:1;transform:translateY(0);pointer-events:auto}.tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(4px);background:#1d1d1f;color:#fff;padding:6px 12px;border-radius:8px;font-size:11px;font-weight:500;white-space:nowrap;opacity:0;pointer-events:none;transition:all .2s ease;z-index:50}
.empty-state{text-align:center;padding:48px 24px;color:var(--text-tertiary)}.empty-state p{font-size:14px;margin-top:8px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:fadeIn .4s ease}

/* Invoice line items — responsive grid */
.line-item-header{display:grid;grid-template-columns:2fr 1.3fr 1fr 0.3fr;gap:8px;margin-bottom:6px;font-size:10.5px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;padding:0 4px}
.line-item-row{display:grid;grid-template-columns:2fr 1.3fr 1fr 0.3fr;gap:8px;margin-bottom:8px;align-items:center}
.line-item-remove{padding:8px}

/* Page header — title left, actions right (search/buttons) */
.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;gap:12px;flex-wrap:wrap}
.page-header-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d1d1d6;border-radius:3px}::-webkit-scrollbar-thumb:hover{background:#aeaeb2}

/* ═══════════════════════════════════════════════════════════════
   MOBILE & TABLET RESPONSIVE LAYER
   ═══════════════════════════════════════════════════════════════ */

/* Hamburger menu button — only visible on mobile */
.mobile-menu-btn{display:none;width:36px;height:36px;border-radius:8px;border:1px solid var(--border);background:var(--surface);align-items:center;justify-content:center;cursor:pointer;transition:all var(--transition);flex-shrink:0;padding:0}
.mobile-menu-btn:active{background:var(--bg);transform:scale(0.96)}
.mobile-menu-btn svg{width:18px;height:18px;color:var(--text)}

/* Sidebar overlay backdrop on mobile */
.sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:99;animation:fadeIn .2s ease;backdrop-filter:blur(2px)}

/* TABLET (≤ 1024px): tighter spacing, smaller sidebar */
@media (max-width: 1024px){
  .sidebar{width:220px}
  .topbar{padding:0 20px}
  .content{padding:20px}
  .stats-grid{gap:12px}
}

/* MOBILE (≤ 768px): everything stacks, sidebar slides out */
@media (max-width: 768px){
  .app{position:relative}

  /* Sidebar slides out from left, overlay style */
  .sidebar{position:fixed;top:0;left:0;height:100vh;width:280px;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:100;box-shadow:8px 0 32px rgba(0,0,0,.12);background:rgba(255,255,255,.98)}
  .sidebar.open{transform:translateX(0)}
  .sidebar-backdrop.open{display:block}
  .mobile-menu-btn{display:inline-flex}

  /* Main area takes full width */
  .main{width:100vw}
  .topbar{height:54px;padding:0 14px;gap:10px}
  .topbar-title{font-size:15px;letter-spacing:-.2px}
  .content{padding:16px 14px;-webkit-overflow-scrolling:touch}

  /* Stat cards: ALWAYS one per row on mobile */
  .stats-grid{grid-template-columns:1fr !important;gap:10px;margin-bottom:18px}
  .stat-card{padding:16px 18px}
  .stat-value{font-size:22px;letter-spacing:-.5px}
  .stat-label{font-size:10.5px;margin-bottom:6px}
  .stat-sub{font-size:11px;margin-top:6px}

  /* Two-column grids stack */
  .grid-2{grid-template-columns:1fr;gap:14px}
  .form-row{grid-template-columns:1fr;gap:10px}

  /* Cards on mobile */
  .card{border-radius:12px}
  .card-header{padding:14px 16px;flex-wrap:wrap;gap:8px}
  .card-header h3{font-size:14px}
  .card-body{padding:14px 16px}

  /* Tables get horizontal scroll on mobile so they're readable */
  .data-table-wrap,.card-body{overflow-x:auto;-webkit-overflow-scrolling:touch}
  table{font-size:12px;min-width:520px}
  table th,table td{padding:10px 8px;white-space:nowrap}

  /* Modals fill the screen on mobile, no centering */
  .modal-overlay{padding:0;align-items:flex-end}
  .modal{max-width:100% !important;width:100%;max-height:90vh;border-radius:18px 18px 0 0;animation:slideUp .3s ease}
  .modal-header{padding:16px 18px}
  .modal-header h2{font-size:17px}
  .modal-body{padding:16px 18px}

  /* Forms — bigger touch targets, no zoom on iOS focus */
  .form-input,.form-select,.form-textarea{font-size:16px;padding:11px 14px;border-radius:10px}
  .form-label{font-size:12.5px}

  /* Buttons */
  .btn{font-size:13px;padding:10px 14px;border-radius:10px}
  .btn-sm{font-size:12px;padding:7px 10px}

  /* Invoice meta grid stacks */
  .inv-meta{grid-template-columns:1fr;gap:14px;padding:16px}

  /* Sidebar inside the slide-out — make user/buttons more prominent */
  .sidebar-brand{padding:20px 22px 16px}
  .sidebar-brand h1{font-size:17px}
  .sidebar-nav{padding:14px 10px}
  .nav-item{padding:11px 14px;font-size:14px}

  /* Reconciliation cash/bKash panels stack */
  .reconcile-grid{grid-template-columns:1fr !important}

  /* Invoice line items: header hides, row becomes a card with labels */
  .line-item-header{display:none}
  .line-item-row{grid-template-columns:1fr;gap:10px;padding:14px;background:var(--bg);border-radius:10px;border:1px solid var(--border-light);position:relative;margin-bottom:10px}
  .line-item-row .line-item-remove{position:absolute;top:10px;right:10px;width:32px;height:32px;padding:0 !important}

  /* Force inv-meta to stack even with inline override */
  .inv-meta[style]{grid-template-columns:1fr !important}

  /* Tabs strip — horizontal scroll if too wide */
  .tabs{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .tabs::-webkit-scrollbar{display:none}
  .tab{flex-shrink:0}

  /* Page header stacks on mobile, actions go full-width */
  .page-header{flex-direction:column;align-items:stretch;margin-bottom:18px}
  .page-header-actions{width:100%;flex-direction:column;gap:8px}
  .page-header-actions .search-bar{width:100%}
  .page-header-actions .btn{width:100%;justify-content:center}

  /* Donut chart wrap stacks legend below the chart */
  .donut-wrap{flex-direction:column;align-items:center;gap:16px}
  .donut-legend{width:100%}

  /* Mini bar chart can scroll horizontally if needed */
  .mini-chart{min-width:0}

  /* Login screen — keep readable on small phones */
  body{font-size:14px}
}

/* SMALL PHONES (≤ 380px): even tighter */
@media (max-width: 380px){
  .topbar{padding:0 10px;gap:6px}
  .topbar-title{font-size:14px}
  .topbar-date{display:none}
  .content{padding:14px 10px}
  .stat-value{font-size:20px}
  .modal-header h2{font-size:16px}
  .btn{padding:9px 12px;font-size:12.5px}
}
`;

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - 12; const c = 2 * Math.PI * r; let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => { const pct = total > 0 ? d.value / total : 0; const dash = c * pct; const gap = c - dash; const o = offset; offset += dash; return <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={d.color} strokeWidth={20} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-o} strokeLinecap="butt" style={{ transition: "all 0.6s ease" }}/>; })}
      <text x={size/2} y={size/2-6} textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--text)">{formatCurrency(total)}</text>
      <text x={size/2} y={size/2+12} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)" fontWeight="500">TOTAL</text>
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
//  INVOICES PAGE
// ═══════════════════════════════════════════════════════════════
function InvoicesPage({ invoices, setInvoices, clients, setClients, selectedInvoice, setSelectedInvoice, totalRevenue, totalOutstanding, totalOverdue, setPaymentModal, setPaymentAmount, currentUser, refreshData, setInvoiceReceiptData }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [amendModal, setAmendModal] = useState(null); // null | { invoiceId }
  const [amendForm, setAmendForm] = useState({ newAmount: "", reason: "" });
  const [amendBusy, setAmendBusy] = useState(false);
  const isDirector = currentUser?.role === "director";

  const openAmendModal = useCallback((inv) => {
    setAmendForm({ newAmount: String(inv.amount), reason: "" });
    setAmendModal({ invoiceId: inv.id });
  }, []);

  const submitAmendment = useCallback(async () => {
    if (!amendModal) return;
    const amt = Number(amendForm.newAmount);
    if (!Number.isFinite(amt) || amt < 0) { alert("Enter a valid amount."); return; }
    if (!amendForm.reason.trim() || amendForm.reason.trim().length < 3) { alert("Reason is required (audit trail)."); return; }
    setAmendBusy(true);
    try {
      const updated = await api.amendInvoice(amendModal.invoiceId, amt, amendForm.reason.trim());
      // Refresh local cache so the detail view re-renders with new amount + new amendment in history
      setInvoices(prev => prev.map(i => i.id === amendModal.invoiceId ? updated : i));
      setAmendModal(null);
      setAmendForm({ newAmount: "", reason: "" });
      refreshData?.();
    } catch (err) {
      alert(err?.message || "Could not amend invoice.");
    } finally {
      setAmendBusy(false);
    }
  }, [amendModal, amendForm, setInvoices, refreshData]);


  if (selectedInvoice) {
    const inv = invoices.find(i => i.id === selectedInvoice);
    if (!inv) return null;
    const client = clients.find(c => c.id === inv.clientId);
    const paidPct = inv.amount > 0 ? (inv.paid / inv.amount * 100) : 0;
    return (
      <div className="fade-in">
        <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)} style={{ marginBottom: 20 }}><Icon name="back" size={16} /> Back to Invoices</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div><h2 style={{ fontSize: 24, fontWeight: 700 }}>{inv.invoiceNo}</h2><p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>{inv.clientName}</p></div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className={`badge-status badge-${inv.status}`}>{statusLabel(inv.status)}</span>
            {isDirector && <button className="btn btn-secondary btn-sm" onClick={() => openAmendModal(inv)} title="Revise the invoice amount with audit trail"><Icon name="edit" size={14} /> Amend</button>}
            {inv.status !== "paid" && <button className="btn btn-primary btn-sm" onClick={() => { setPaymentModal(inv.id); setPaymentAmount(""); }}>Record Payment</button>}
          </div>
        </div>
        <div className="inv-meta" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="inv-meta-item"><label>Issue Date</label><span>{inv.issueDate}</span></div>
          <div className="inv-meta-item"><label>Client Contact</label><span>{client?.contact}</span></div>
          <div className="inv-meta-item"><label>Client Email</label><span>{client?.email}</span></div>
        </div>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3>Payment Progress</h3></div>
          <div className="card-body">
            <div className="progress-bar" style={{ height: 12, marginBottom: 12, borderRadius: 6 }}><div className="progress-fill" style={{ width: `${paidPct}%`, background: paidPct >= 100 ? "var(--green)" : "var(--accent)", borderRadius: 6 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span><strong>{formatCurrency(inv.paid)}</strong> paid</span><span style={{ color: inv.outstanding > 0 ? "var(--red)" : "var(--green)" }}><strong>{formatCurrency(inv.outstanding)}</strong> remaining</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Invoice Items</h3></div>
          <div className="card-body">
            <table>
              <thead><tr><th>Description</th><th>Handled By</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
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
              <div className="inv-total-row">
                <span>{inv.amendments?.length > 0 ? "Current Total" : "Total Agreed"}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</span>
              </div>
              {inv.amendments?.length > 0 && (() => {
                // The earliest amendment's previousAmount IS the original invoice amount
                const sorted = [...inv.amendments].sort((a, b) => new Date(a.amendedAt) - new Date(b.amendedAt));
                const originalAmount = sorted[0].previousAmount;
                const delta = inv.amount - originalAmount;
                return (
                  <div className="inv-total-row" style={{ fontSize: 12, color: "var(--text-tertiary)", borderTop: "1px dashed var(--border-light)" }}>
                    <span>Originally <span style={{ textDecoration: "line-through" }}>{formatCurrency(originalAmount)}</span> · revised by {delta >= 0 ? "+" : ""}{formatCurrency(delta)}</span>
                    <span></span>
                  </div>
                );
              })()}
              <div className="inv-total-row"><span>Paid</span><span style={{ fontWeight: 600, color: "var(--green)" }}>-{formatCurrency(inv.paid)}</span></div>
              <div className="inv-total-row grand"><span>Balance Due</span><span>{formatCurrency(inv.outstanding)}</span></div>
            </div>
          </div>
        </div>

        {inv.amendments?.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3>Amendment History</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{inv.amendments.length} {inv.amendments.length === 1 ? "revision" : "revisions"} · audit trail (append-only)</span>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {inv.amendments.map((a) => {
                  const up = a.delta > 0;
                  const dateStr = new Date(a.amendedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={a.id} style={{ display: "flex", gap: 12, padding: 12, background: "var(--bg)", borderRadius: 10, borderLeft: `3px solid ${up ? "var(--orange)" : "var(--green)"}` }}>
                      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 8, background: up ? "rgba(255,149,0,0.12)" : "rgba(30,138,58,0.12)", color: up ? "var(--orange)" : "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                        {up ? "▲" : "▼"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                            {formatCurrency(a.previousAmount)} → <span style={{ color: "var(--accent)" }}>{formatCurrency(a.newAmount)}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: up ? "var(--orange)" : "var(--green)", marginLeft: 8 }}>
                              ({up ? "+" : ""}{formatCurrency(a.delta)})
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{dateStr}</div>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.45 }}>{a.reason}</div>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>by <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{a.amendedByName}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {amendModal && (() => {
          const aInv = invoices.find(i => i.id === amendModal.invoiceId);
          if (!aInv) return null;
          const currentAmount = aInv.amount;
          const newAmt = Number(amendForm.newAmount);
          const delta = Number.isFinite(newAmt) ? newAmt - currentAmount : 0;
          const newOutstanding = Number.isFinite(newAmt) ? Math.max(0, newAmt - aInv.paid) : aInv.outstanding;
          const belowPaid = Number.isFinite(newAmt) && newAmt < aInv.paid;
          return (
            <div className="modal-overlay" {...overlayDismiss(() => setAmendModal(null))}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                  <div>
                    <h2 style={{ marginBottom: 2 }}>Amend Invoice</h2>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{aInv.invoiceNo} · {aInv.clientName}</p>
                  </div>
                  <button className="modal-close" onClick={() => setAmendModal(null)}><Icon name="x" size={16} /></button>
                </div>
                <div className="modal-body">
                  <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "var(--accent)", lineHeight: 1.5 }}>
                    <strong>Audit trail:</strong> Every amendment is permanently recorded with the reason, the new amount, the time, and your name. Past amendments cannot be edited or deleted.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Current Amount</label>
                      <div className="form-input" style={{ background: "var(--bg)", color: "var(--text-secondary)", cursor: "not-allowed", fontWeight: 600 }}>{formatCurrency(currentAmount)}</div>
                    </div>
                    <div>
                      <label className="form-label">Already Paid</label>
                      <div className="form-input" style={{ background: "var(--bg)", color: "var(--text-secondary)", cursor: "not-allowed", fontWeight: 600 }}>{formatCurrency(aInv.paid)}</div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Amount (BDT) <span style={{ color: "var(--red)" }}>*</span></label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="e.g. 450000"
                      value={amendForm.newAmount}
                      onChange={e => setAmendForm(p => ({ ...p, newAmount: e.target.value }))}
                      style={{ fontSize: 18, fontWeight: 600, color: belowPaid ? "var(--red)" : "var(--text)" }}
                      autoFocus
                    />
                    {belowPaid && <div style={{ fontSize: 11.5, color: "var(--red)", marginTop: 6 }}>Cannot revise below the amount already paid ({formatCurrency(aInv.paid)})</div>}
                  </div>

                  {Number.isFinite(newAmt) && newAmt > 0 && newAmt !== currentAmount && !belowPaid && (
                    <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", color: "var(--text-secondary)" }}>
                        <span>Change</span>
                        <span style={{ fontWeight: 700, color: delta >= 0 ? "var(--orange)" : "var(--green)" }}>{delta >= 0 ? "+" : ""}{formatCurrency(delta)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        <span>New balance due</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(newOutstanding)}</span>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Reason <span style={{ color: "var(--red)" }}>*</span></label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Client renegotiated lower fee; scope reduced to single jurisdiction."
                      value={amendForm.reason}
                      onChange={e => setAmendForm(p => ({ ...p, reason: e.target.value }))}
                      rows={3}
                      style={{ resize: "vertical", minHeight: 70 }}
                    />
                    <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 4 }}>This will appear in the permanent audit trail for this invoice.</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setAmendModal(null)} disabled={amendBusy}>Cancel</button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: "center", padding: "10px 0", opacity: amendBusy ? 0.7 : 1 }}
                      onClick={submitAmendment}
                      disabled={amendBusy || belowPaid || !Number.isFinite(newAmt) || newAmt === currentAmount || amendForm.reason.trim().length < 3}
                    >{amendBusy ? "Saving…" : "Save Amendment"}</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  const filteredInvoices = invoices.filter(i => {
    if (tab === "outstanding") return i.status === "outstanding" || i.status === "sent";
    if (tab === "overdue") return i.status === "overdue";
    if (tab === "paid") return i.status === "paid";
    return true;
  }).filter(i => i.clientName.toLowerCase().includes(search.toLowerCase()) || i.invoiceNo.toLowerCase().includes(search.toLowerCase()));

  const tabLabels = { all: "All", outstanding: "Outstanding", overdue: "Overdue", paid: "Paid" };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>Invoices</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Manage invoices, payments, and outstanding balances</p></div>
        <div className="page-header-actions">
          <div className="search-bar"><Icon name="search" size={16} /><input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}><Icon name="plus" size={16} /> New Invoice</button>
        </div>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="stat-card"><div className="stat-label">Total Invoiced</div><div className="stat-value" style={{ fontSize: 22 }}>{formatCurrency(invoices.reduce((s,i) => s + i.amount, 0))}</div></div>
        <div className="stat-card"><div className="stat-label">Collected</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(totalRevenue)}</div></div>
        <div className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value" style={{ fontSize: 22, color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div></div>
        <div className="stat-card"><div className="stat-label">Overdue</div><div className="stat-value" style={{ fontSize: 22, color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div></div>
      </div>
      <div className="tabs">{["all","outstanding","overdue","paid"].map(t => <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{tabLabels[t]}</button>)}</div>
      <div className="card"><div className="card-body" style={{ padding: "0 24px" }}>
        <table><thead><tr><th>Invoice No.</th><th>Client</th><th>Issue Date</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead>
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
      {createModal && <InvoiceModal clients={clients} setClients={setClients} currentUser={currentUser} onClose={() => setCreateModal(false)} onSave={(inv) => {
        setInvoices(prev => [inv, ...prev]);
        setCreateModal(false);
        refreshData?.();
        // Build the invoice receipt payload — same idea as a payment receipt but for invoice issuance.
        const client = clients.find(c => c.id === inv.clientId);
        const now = new Date();
        setInvoiceReceiptData?.({
          invoiceNo: inv.invoiceNo,
          issueDate: inv.issueDate,
          issuedAt: now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          preparedBy: currentUser?.displayName || "",
          preparedByRole: currentUser?.displayRole || "",
          client: client ? {
            name: client.name,
            address: client.address,
            contact: client.contact,
            email: client.email,
            phone: client.phone,
          } : { name: inv.clientName, address: "", contact: "", email: "", phone: "" },
          items: inv.items || [],
          amount: inv.amount,
          status: inv.status,
        });
      }} />}

      {amendModal && (() => {
        const inv = invoices.find(i => i.id === amendModal.invoiceId);
        if (!inv) return null;
        const currentAmount = inv.amount;
        const newAmt = Number(amendForm.newAmount);
        const delta = Number.isFinite(newAmt) ? newAmt - currentAmount : 0;
        const newOutstanding = Number.isFinite(newAmt) ? Math.max(0, newAmt - inv.paid) : inv.outstanding;
        const belowPaid = Number.isFinite(newAmt) && newAmt < inv.paid;
        return (
          <div className="modal-overlay" {...overlayDismiss(() => setAmendModal(null))}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className="modal-header">
                <div>
                  <h2 style={{ marginBottom: 2 }}>Amend Invoice</h2>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{inv.invoiceNo} · {inv.clientName}</p>
                </div>
                <button className="modal-close" onClick={() => setAmendModal(null)}><Icon name="x" size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "var(--accent)", lineHeight: 1.5 }}>
                  <strong>Audit trail:</strong> Every amendment is permanently recorded with the reason, the new amount, the time, and your name. Past amendments cannot be edited or deleted.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label className="form-label">Current Amount</label>
                    <div className="form-input" style={{ background: "var(--bg)", color: "var(--text-secondary)", cursor: "not-allowed", fontWeight: 600 }}>{formatCurrency(currentAmount)}</div>
                  </div>
                  <div>
                    <label className="form-label">Already Paid</label>
                    <div className="form-input" style={{ background: "var(--bg)", color: "var(--text-secondary)", cursor: "not-allowed", fontWeight: 600 }}>{formatCurrency(inv.paid)}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Amount (BDT) <span style={{ color: "var(--red)" }}>*</span></label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 450000"
                    value={amendForm.newAmount}
                    onChange={e => setAmendForm(p => ({ ...p, newAmount: e.target.value }))}
                    style={{ fontSize: 18, fontWeight: 600, color: belowPaid ? "var(--red)" : "var(--text)" }}
                    autoFocus
                  />
                  {belowPaid && <div style={{ fontSize: 11.5, color: "var(--red)", marginTop: 6 }}>Cannot revise below the amount already paid ({formatCurrency(inv.paid)})</div>}
                </div>

                {Number.isFinite(newAmt) && newAmt > 0 && newAmt !== currentAmount && !belowPaid && (
                  <div style={{ background: "var(--bg)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", color: "var(--text-secondary)" }}>
                      <span>Change</span>
                      <span style={{ fontWeight: 700, color: delta >= 0 ? "var(--orange)" : "var(--green)" }}>{delta >= 0 ? "+" : ""}{formatCurrency(delta)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <span>New balance due</span>
                      <span style={{ fontWeight: 700 }}>{formatCurrency(newOutstanding)}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Reason <span style={{ color: "var(--red)" }}>*</span></label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Client renegotiated lower fee; scope reduced to single jurisdiction."
                    value={amendForm.reason}
                    onChange={e => setAmendForm(p => ({ ...p, reason: e.target.value }))}
                    rows={3}
                    style={{ resize: "vertical", minHeight: 70 }}
                  />
                  <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 4 }}>This will appear in the permanent audit trail for this invoice.</div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                  <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setAmendModal(null)} disabled={amendBusy}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center", padding: "10px 0", opacity: amendBusy ? 0.7 : 1 }}
                    onClick={submitAmendment}
                    disabled={amendBusy || belowPaid || !Number.isFinite(newAmt) || newAmt === currentAmount || amendForm.reason.trim().length < 3}
                  >{amendBusy ? "Saving…" : "Save Amendment"}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function InvoiceModal({ clients, setClients, currentUser, onClose, onSave }) {
  const isDirector = currentUser?.role === "director";
  const billableEmployees = EMPLOYEES.filter(e => e.category !== "support");
  // For employees: their own ID is the only valid choice
  const defaultEmpId = isDirector ? (billableEmployees[0]?.id || "") : currentUser.employeeId;
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [issueDate, setIssueDate] = useState(NOW.toISOString().split("T")[0]);
  const [items, setItems] = useState([{ description: "", employeeId: defaultEmpId, amount: 0 }]);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", address: "", contact: "", email: "", phone: "" });

  const addItem = () => setItems(prev => [...prev, { description: "", employeeId: defaultEmpId, amount: 0 }]);
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
        name,
        address,
        contact,
        email: newClient.email.trim(),
        phone,
      });
      // Push into the local clients cache so the dropdown updates immediately
      setClients(prev => [...prev, created]);
      setClientId(created.id);
      setNewClient({ name: "", address: "", contact: "", email: "", phone: "" });
      setAddClientOpen(false);
    } catch (err) {
      alert(err?.message || "Could not save client.");
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
      alert(err?.message || "Could not create invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const dismiss = overlayDismiss(onClose);

  return (
    <div className="modal-overlay" {...dismiss}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-header"><h2>Create Invoice</h2><button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button></div>
        <div className="modal-body">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label">Client</label>
              <div style={{ display: "flex", gap: 6 }}>
                <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)} style={{ flex: 1 }}>
                  {clients.length === 0 && <option value="">No clients yet</option>}
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddClientOpen(true)} style={{ flexShrink: 0, padding: "0 12px" }} title="Add new client"><Icon name="plus" size={14} /></button>
              </div>
            </div>
            <div className="form-group" style={{ margin: 0 }}><label className="form-label">Issue Date</label><input type="date" className="form-input" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setAddClientOpen(true)} style={{ width: "100%", justifyContent: "center", padding: "9px 0" }}><Icon name="plus" size={14} /> Add Client</button>
            </div>
          </div>

          <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 11.5, color: "var(--accent)" }}>
            <strong>Auto-status:</strong> Sent for first 2 weeks · Outstanding from 2 weeks to 2 months · Overdue after 2 months
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Line Items</label>
            <div className="line-item-header">
              <span>Description</span><span>Handled By</span><span>Amount (BDT)</span><span></span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="line-item-row">
                <input className="form-input" placeholder="e.g. Contract drafting for Q2" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} />
                <select className="form-select" value={item.employeeId} onChange={e => updateItem(i, "employeeId", e.target.value)} disabled={!isDirector} title={isDirector ? "" : "Employees can only assign work to themselves"}>
                  {(isDirector ? billableEmployees : billableEmployees.filter(emp => emp.id === currentUser.employeeId)).map(emp => <option key={emp.id} value={emp.id}>{emp.shortName}</option>)}
                </select>
                <input className="form-input" type="number" placeholder="0" value={item.amount || ""} onChange={e => updateItem(i, "amount", e.target.value)} />
                <button className="btn btn-secondary btn-sm line-item-remove" onClick={() => removeItem(i)} disabled={items.length === 1}><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost btn-sm" onClick={addItem} style={{ marginBottom: 12 }}><Icon name="plus" size={14} /> Add Item</button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "2px solid var(--text)", marginTop: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span><span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(total)}</span>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0", marginTop: 8, opacity: saving ? 0.7 : 1 }} onClick={handleSave} disabled={validItems.length === 0 || !clientId || saving}>{saving ? "Creating…" : "Create Invoice"}</button>
        </div>
      </div>

      {/* Add Client modal */}
      {addClientOpen && (
        <div className="modal-overlay" {...overlayDismiss(() => setAddClientOpen(false))} style={{ zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2>Add New Client</h2><button className="modal-close" onClick={() => setAddClientOpen(false)}><Icon name="x" size={16} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Company Name <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" placeholder="e.g. ABC Corporation Ltd." value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Address <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea className="form-textarea" placeholder="Full address" value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} rows={3} style={{ resize: "vertical", minHeight: 70 }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person <span style={{ color: "var(--red)" }}>*</span></label>
                  <input className="form-input" placeholder="e.g. Legal Department" value={newClient.contact} onChange={e => setNewClient(p => ({ ...p, contact: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 11 }}>(optional)</span></label>
                  <input className="form-input" type="email" placeholder="contact@company.com" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number <span style={{ color: "var(--red)" }}>*</span></label>
                <input className="form-input" type="tel" placeholder="+880-2-XXXXXXX" value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => { setNewClient({ name: "", address: "", contact: "", email: "", phone: "" }); setAddClientOpen(false); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={handleAddClient} disabled={!newClient.name.trim() || !newClient.address.trim() || !newClient.contact.trim() || !newClient.phone.trim()}>Save Client</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  OUTSTANDING PAGE
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
      <div style={{ marginBottom: 24 }}><h2 style={{ fontSize: 22, fontWeight: 700 }}>Outstanding Tracker</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Monitor outstanding and overdue amounts by client</p></div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat-card"><div className="stat-label">Total Outstanding</div><div className="stat-value" style={{ fontSize: 24, color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div><div className="stat-sub">{formatNumber(outstandingInvoices.length)} invoices</div></div>
        <div className="stat-card"><div className="stat-label">Total Overdue</div><div className="stat-value" style={{ fontSize: 24, color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div><div className="stat-sub">{formatNumber(overdueCount)} invoices past due</div></div>
        <div className="stat-card"><div className="stat-label">Clients with Balance</div><div className="stat-value" style={{ fontSize: 24 }}>{formatNumber(clientList.length)}</div></div>
      </div>
      {clientList.map(({ client, invoices: cInvoices, total }) => (
        <div className="card" key={client?.id} style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div><h3>{client?.name}</h3><span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{client?.email} · {formatNumber(cInvoices.length)} invoice(s)</span></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700, color: "var(--red)" }}>{formatCurrency(total)}</div><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>total outstanding</span></div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {cInvoices.map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedInvoice(inv.id); navigateTo("invoices"); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`badge-status badge-${inv.status}`}>{statusLabel(inv.status)}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{inv.invoiceNo}</span>
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Issued {inv.issueDate}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${inv.amount > 0 ? (inv.paid / inv.amount * 100) : 0}%`, background: "var(--green)" }} /></div>
                  <span style={{ fontWeight: 700, fontSize: 13, width: 110, textAlign: "right" }}>{formatCurrency(inv.outstanding)}</span>
                  <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); setPaymentModal(inv.id); setPaymentAmount(""); }}>Pay</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {clientList.length === 0 && <div className="card"><div className="empty-state"><Icon name="check" size={40} /><p>All invoices have been paid!</p></div></div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════
// Storage layer — persists invoices and clients to localStorage so data survives reloads.
// Both EN and BN apps share the same keys so switching language preserves data.
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
//  LOGIN SCREEN
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
      setError("Username and password are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await api.login(username.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
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
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, marginBottom: 4 }}>Ruhul Quddus & Jurists</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Practice Management Portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              autoComplete="username"
              placeholder="e.g. director or ar.murad"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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
            {busy ? "Signing in…" : "Sign In"}
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
            🌐 বাংলায় দেখুন
          </button>
          <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            For login credentials, please contact the firm administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App({ onLanguageToggle }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount, if a token is present in localStorage, validate it via /api/auth/me
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
        // Token invalid/expired — getToken cleared it inside the api wrapper
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
        Loading…
      </div>
    );
  }

  // Not logged in → show login screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onLanguageToggle={onLanguageToggle} />;
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} onLanguageToggle={onLanguageToggle} />;
}

function AppShell({ currentUser, onLogout, onLanguageToggle }) {
  const isDirector = currentUser.role === "director";

  // Data is owned by the server. We hold a local cache in component state and
  // refresh it on load + after every mutation + via polling for cross-device sync.
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptData, setReceiptData] = useState(null);
  const [invoiceReceiptData, setInvoiceReceiptData] = useState(null);
  const [clientModal, setClientModal] = useState(null); // null | { mode: "add" } | { mode: "edit", clientId }
  const [clientForm, setClientForm] = useState({ name: "", address: "", contact: "", email: "", phone: "" });
  const [selectedAnalyticsDate, setSelectedAnalyticsDate] = useState(() => {
    const d = NOW;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
  // Time-range for Analytics page (1, 3, 6, 9, or 12 months)
  const [analyticsMonths, setAnalyticsMonths] = useState(6);
  // Reconciliation date (separate from selectedAnalyticsDate so the chart and tool can be independent)
  const [reconcileDate, setReconcileDate] = useState(() => {
    const d = NOW;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
  // Manual cash-in-hand count (per session — not persisted)
  const [countedCash, setCountedCash] = useState("");
  const [countedBkash, setCountedBkash] = useState("");

  // Refresh data from the API. Silent unless an error occurs.
  const refreshData = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([api.getClients(), api.getInvoices()]);
      setClients(c);
      setInvoices(i);
      setLoadError("");
    } catch (err) {
      // 401 = token expired → bounce to login
      if (err?.status === 401) {
        onLogout();
        return;
      }
      console.error("Refresh failed:", err);
      setLoadError(err?.message || "Could not reach the server. Retrying…");
    }
  }, [onLogout]);

  // Initial load + polling every 15 seconds for cross-device sync
  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, 15_000);
    return () => clearInterval(id);
  }, [refreshData]);

  // Cross-tab sync — when another tab logs out, this tab logs out too.
  // (Data sync is handled by the server now, no need to listen for data changes here.)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "rqj_auth_token_v1" && !e.newValue) {
        onLogout();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [onLogout]);

  // Derived user info for legacy code paths (recordedBy, receipts, etc.)
  const userInfo = useMemo(() => ({
    name: currentUser.displayName,
    role: currentUser.displayRole,
  }), [currentUser]);

  const navigate = useCallback((pg) => { setPage(pg); setSelectedEmployee(null); setSelectedInvoice(null); setSearch(""); setSidebarOpen(false); }, []);

  const currentMonth = NOW.getMonth();
  const currentYear = NOW.getFullYear();

  // ROLE-BASED VISIBILITY: filter invoices based on logged-in user
  // Director sees all invoices. Employees only see invoices where they handled at least one line item.
  const visibleInvoices = useMemo(() => {
    if (isDirector) return invoices;
    return invoices.filter(inv => inv.items?.some(item => item.employeeId === currentUser.employeeId));
  }, [invoices, isDirector, currentUser.employeeId]);

  const totalRevenue = useMemo(() => visibleInvoices.reduce((s, i) => s + i.paid, 0), [visibleInvoices]);
  const totalOutstanding = useMemo(() => visibleInvoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.outstanding, 0), [visibleInvoices]);
  const totalOverdue = useMemo(() => visibleInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.outstanding, 0), [visibleInvoices]);
  const overdueCount = useMemo(() => visibleInvoices.filter(i => i.status === "overdue").length, [visibleInvoices]);

  // Build N-month aggregation for a single employee. Default 6 months for back-compat.
  const getEmployeeMonthlyData = useCallback((empId, monthsBack = 6) => {
    const result = [];
    for (let m = monthsBack - 1; m >= 0; m--) {
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

  // Build N-month firm-wide revenue trend. Default 6 months.
  const buildMonthlyRevenueData = useCallback((monthsBack = 6) => {
    const result = [];
    for (let m = monthsBack - 1; m >= 0; m--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - m, 1);
      result.push({
        label: MONTHS[d.getMonth()],
        value: visibleInvoices.filter(i => i.month === d.getMonth() && i.year === d.getFullYear()).reduce((s, i) => s + i.paid, 0),
        color: m === 0 ? "var(--accent)" : "rgba(0,113,227,0.25)",
      });
    }
    return result;
  }, [visibleInvoices]);

  // Dashboard's revenue trend is fixed at 6 months
  const getMonthlyRevenueData = useMemo(() => buildMonthlyRevenueData(6), [buildMonthlyRevenueData]);

  const recordPayment = useCallback(async (invoiceId, amount, method) => {
    try {
      const result = await api.recordPayment(invoiceId, amount, method);
      // Server returns the receipt and the updated invoice
      setReceiptData(result.receipt);
      // Update local cache so the UI reflects the new payment immediately,
      // even before the next polling tick
      setInvoices(prev => prev.map(i => i.id === invoiceId ? result.invoice : i));
      // Trigger a clients refresh so outstanding balances update
      refreshData();
    } catch (err) {
      alert(err?.message || "Could not record payment. Please try again.");
    }
  }, [refreshData]);

  // ── CLIENT MANAGEMENT ──
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
      alert(err?.message || "Could not save client. Please try again.");
    }
  }, [clientForm, clientModal, refreshData]);

  const greeting = NOW.getHours() < 12 ? "Good Morning" : NOW.getHours() < 17 ? "Good Afternoon" : "Good Evening";
  // Skip honorifics like "Md." for a more natural greeting (e.g. "Anwar" instead of "Md.")
  const friendlyFirstName = useMemo(() => {
    const parts = userInfo.name.split(" ").filter(Boolean);
    const honorifics = new Set(["Md.", "Md", "Mohammad", "Mohd.", "Mohd", "Mr.", "Mrs.", "Ms.", "Dr."]);
    const skipped = parts.find(p => !honorifics.has(p));
    return skipped || parts[0] || userInfo.name;
  }, [userInfo.name]);

  // ── DASHBOARD ──
  const renderDashboard = () => (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>{greeting}, {friendlyFirstName}</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>{isDirector ? `Here's your firm's performance overview — ${MONTHS[currentMonth]} ${currentYear}` : `Your invoices and outstanding balances — ${MONTHS[currentMonth]} ${currentYear}`}</p>
      </div>

      {isDirector && invoices.length === 0 && clients.length === 0 && (
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, #f0f7ff, #e8f4ff)", border: "1px solid #d0e2ff" }}>
          <div className="card-body" style={{ padding: "28px 32px" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Welcome to your practice management system</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              Your firm's data starts empty. To get started, add your clients first, then create invoices.
              Each invoice can have multiple line items, and you can assign each item to a handling employee — they will see their own invoices when they log in.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate("clients")}>
                <Icon name="plus" size={14} /> Add a Client
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("invoices")}>
                <Icon name="invoice" size={14} /> Create an Invoice
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <strong>Note on data sharing:</strong> All data is stored locally in this browser. Other tabs and windows on this same computer will sync in real time. Different computers (e.g. director's PC vs. employee's laptop) will have separate copies of the data — talk to your IT administrator about a shared backend if multi-device sync is required.
            </p>
          </div>
        </div>
      )}

      {!isDirector && visibleInvoices.length === 0 && (
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, #fffbf0, #fff5e0)", border: "1px solid #ffe4b3" }}>
          <div className="card-body" style={{ padding: "24px 28px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No invoices assigned to you yet</h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              When the director assigns you to invoice line items, they will appear here automatically.
              You will be able to see the invoices you handle and their outstanding balances.
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid" style={!isDirector ? { gridTemplateColumns: "repeat(3, 1fr)" } : undefined}>
        <div className="stat-card"><div className="stat-label">{isDirector ? "Total Revenue Collected" : "Revenue Collected"}</div><div className="stat-value">{formatCurrency(totalRevenue)}</div><div className="stat-sub">From {formatNumber(visibleInvoices.length)} invoice{visibleInvoices.length === 1 ? "" : "s"}</div></div>
        <div className="stat-card" onClick={() => navigate("invoices")} style={{ cursor: "pointer" }}><div className="stat-label">Outstanding</div><div className="stat-value" style={{ color: "var(--orange)" }}>{formatCurrency(totalOutstanding)}</div><div className="stat-sub">{formatNumber(visibleInvoices.filter(i => i.status === "outstanding" || i.status === "sent").length)} pending</div></div>
        <div className="stat-card" onClick={() => navigate("outstanding")} style={{ cursor: "pointer" }}><div className="stat-label">Overdue</div><div className="stat-value" style={{ color: "var(--red)" }}>{formatCurrency(totalOverdue)}</div><div className="stat-sub">{formatNumber(overdueCount)} overdue</div></div>
        {isDirector && <div className="stat-card" onClick={() => navigate("employees")} style={{ cursor: "pointer" }}><div className="stat-label">Team Size</div><div className="stat-value" style={{ color: "var(--purple)" }}>{formatNumber(EMPLOYEES.length)}</div><div className="stat-sub">{formatNumber(EMPLOYEES.filter(e => e.category !== "support").length)} fee earners</div></div>}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Revenue Trend</h3><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Last 6 months</span></div>
          <div className="card-body">
            <MiniBarChart data={getMonthlyRevenueData} height={80} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>{getMonthlyRevenueData.map((d, i) => <span key={i} style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", flex: 1 }}>{d.label}</span>)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Invoice Breakdown</h3></div>
          <div className="card-body">
            <div className="donut-wrap">
              <DonutChart data={[
                { value: totalRevenue, color: "var(--green)" },
                { value: Math.max(0, totalOutstanding - totalOverdue), color: "var(--orange)" },
                { value: totalOverdue, color: "var(--red)" },
              ]} size={130} />
              <div className="donut-legend">
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--green)" }} /><div><div style={{ fontWeight: 600 }}>Paid</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(totalRevenue)}</div></div></div>
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--orange)" }} /><div><div style={{ fontWeight: 600 }}>Outstanding</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(Math.max(0, totalOutstanding - totalOverdue))}</div></div></div>
                <div className="donut-legend-item"><div className="donut-dot" style={{ background: "var(--red)" }} /><div><div style={{ fontWeight: 600 }}>Overdue</div><div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>{formatCurrency(totalOverdue)}</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {isDirector ? (
          <div className="card">
            <div className="card-header"><h3>Top Performers (6M)</h3><button className="btn btn-ghost btn-sm" onClick={() => navigate("employees")}>View All</button></div>
            <div className="card-body">
              {EMPLOYEES.filter(e => e.category !== "support").map(emp => {
                const data = getEmployeeMonthlyData(emp.id);
                const totalRev = data.reduce((s, d) => s + d.revenue, 0);
                const totalCount = data.reduce((s, d) => s + d.count, 0);
                return { emp, totalRev, totalCount };
              }).sort((a,b) => b.totalRev - a.totalRev).slice(0, 5).map(({ emp, totalRev, totalCount }) => (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedEmployee(emp.id); setPage("employees"); }}>
                  <div className={`avatar ${emp.category}`}>{emp.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{emp.shortName}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formatNumber(totalCount)} cases handled</div></div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(totalRev)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header"><h3>Your Performance (6M)</h3><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Cases you handled</span></div>
            <div className="card-body">
              {(() => {
                const data = getEmployeeMonthlyData(currentUser.employeeId);
                const totalRev = data.reduce((s, d) => s + d.revenue, 0);
                const totalCount = data.reduce((s, d) => s + d.count, 0);
                const avgPerMonth = Math.round(totalRev / 6);
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Cases handled</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(totalCount)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 10px", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Total revenue brought in</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(totalRev)}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Average per month</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>{formatCurrency(avgPerMonth)}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        <div className="card">
          <div className="card-header"><h3>Overdue Invoices</h3><button className="btn btn-ghost btn-sm" onClick={() => navigate("outstanding")}>View All</button></div>
          <div className="card-body">
            {visibleInvoices.filter(i => i.status === "overdue").slice(0, 5).map(inv => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedInvoice(inv.id); setPage("invoices"); }}>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>{inv.clientName}</div><div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{inv.invoiceNo} · Issued {inv.issueDate}</div></div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>{formatCurrency(inv.outstanding)}</div>
              </div>
            ))}
            {visibleInvoices.filter(i => i.status === "overdue").length === 0 && <div className="empty-state"><p>No overdue invoices</p></div>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── EMPLOYEES ──
  const renderEmployees = () => {
    if (selectedEmployee) {
      const emp = EMPLOYEES.find(e => e.id === selectedEmployee);
      if (!emp) return null;
      const monthlyData = getEmployeeMonthlyData(emp.id);
      const totalRev = monthlyData.reduce((s, d) => s + d.revenue, 0);
      const totalCount = monthlyData.reduce((s, d) => s + d.count, 0);
      const avgPerMonth = totalCount > 0 ? Math.round(totalRev / 6) : 0;
      const maxRev = Math.max(...monthlyData.map(d => d.revenue), 1);
      // Collect all invoice line items handled by this employee
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
          <button className="btn btn-ghost" onClick={() => setSelectedEmployee(null)} style={{ marginBottom: 20 }}><Icon name="back" size={16} /> Back to Team</button>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div className={`avatar ${emp.category}`} style={{ width: 72, height: 72, fontSize: 24 }}>{emp.avatar}</div>
            <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>{emp.name}</h2><p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{emp.role} · {emp.tier}</p></div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card"><div className="stat-label">Revenue Brought In (6M)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>{formatCurrency(totalRev)}</div></div>
            <div className="stat-card"><div className="stat-label">Cases Handled (6M)</div><div className="stat-value" style={{ fontSize: 22 }}>{formatNumber(totalCount)}</div></div>
            <div className="stat-card"><div className="stat-label">Avg. Monthly Revenue</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(avgPerMonth)}</div></div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3>Monthly Revenue Brought In</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Last 6 months</span>
            </div>
            <div className="card-body">
              {monthlyData.map((d, i) => (
                <div className="month-row" key={i}>
                  <div className="month-label">{d.month}</div>
                  <div className="month-bar-wrap">
                    <div className="month-bar-fill" style={{ width: `${(d.revenue / maxRev) * 100}%` }}>{d.revenue > 0 && (d.revenue / maxRev) > 0.18 ? `${formatNumber(d.count)} cases` : ""}</div>
                  </div>
                  <div className="month-amount">{formatCurrency(d.revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Recent Invoice Items</h3></div>
            <div className="card-body">
              <table>
                <thead><tr><th>Invoice Date</th><th>Description</th><th>Client</th><th>Invoice No.</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
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
                  {recentItems.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-tertiary)" }}>No invoice items yet</td></tr>}
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
        <div className="page-header">
          <div><h2 style={{ fontSize: 22, fontWeight: 700 }}>Team Members</h2><p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{formatNumber(EMPLOYEES.length)} team members · {formatNumber(EMPLOYEES.filter(e => e.category !== "support").length)} fee earners</p></div>
          <div className="page-header-actions">
            <div className="search-bar"><Icon name="search" size={16} /><input placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: "0 24px" }}>
            <table>
              <thead><tr><th>Employee</th><th>Role</th><th>This Month Cases</th><th>This Month Revenue</th><th>6M Revenue</th></tr></thead>
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

  // ── CLIENTS ──
  const renderClients = () => (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Clients</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{formatNumber(clients.length)} active clients</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddClient}>
            <Icon name="plus" size={14} /> Add Client
          </button>
        </div>
      </div>
      <div className="card"><div className="card-body" style={{ padding: "0 24px" }}>
        <table>
          <thead><tr><th>Client</th><th>Address</th><th>Contact</th><th>Email</th><th>Phone</th><th>Total Invoiced</th><th>Outstanding</th><th style={{ width: 80, textAlign: "center" }}>Actions</th></tr></thead>
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
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditClient(c)} title="Edit client" style={{ padding: "5px 10px" }}>
                    <Icon name="edit" size={13} /> Edit
                  </button>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div></div>
    </div>
  );

  // ── ANALYTICS ──
  const renderAnalytics = () => {
    // Compute the cutoff date for the Analytics window (N months back, inclusive of current month)
    const windowStart = new Date(NOW.getFullYear(), NOW.getMonth() - (analyticsMonths - 1), 1);
    const inWindow = (inv) => {
      const d = new Date(inv.year, inv.month, 1);
      return d >= windowStart;
    };
    const windowedInvoices = visibleInvoices.filter(inWindow);

    const clientRevenue = {};
    windowedInvoices.forEach(inv => {
      if (!clientRevenue[inv.clientId]) clientRevenue[inv.clientId] = { name: inv.clientName, paid: 0, outstanding: 0, total: 0 };
      clientRevenue[inv.clientId].paid += inv.paid;
      clientRevenue[inv.clientId].outstanding += inv.outstanding;
      clientRevenue[inv.clientId].total += inv.amount;
    });
    const clientData = Object.values(clientRevenue).sort((a,b) => b.total - a.total);

    // Build last 7 days of payments split by method
    // IMPORTANT: format dates from local components, NOT via toISOString() which converts to UTC.
    // For users in non-UTC timezones (e.g. Bangladesh UTC+6), midnight local time becomes the
    // previous date in UTC, so toISOString() would silently shift "today" by one day.
    const formatDateLocal = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dailyPayments = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - d);
      const dayStr = formatDateLocal(day);
      let cash = 0, bkash = 0;
      visibleInvoices.forEach(inv => {
        (inv.payments || []).forEach(p => {
          if (p.dateOnly === dayStr) {
            if (p.method === "bkash") bkash += p.amount;
            else cash += p.amount;
          }
        });
      });
      dailyPayments.push({
        dateLabel: `${day.getDate()} ${MONTHS[day.getMonth()]}`,
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

    // Director sees ranking of all fee earners; employee sees only themselves
    const empData = (isDirector ? EMPLOYEES.filter(e => e.category !== "support") : EMPLOYEES.filter(e => e.id === currentUser.employeeId)).map(emp => {
      const data = getEmployeeMonthlyData(emp.id, analyticsMonths);
      return { emp, totalRev: data.reduce((s,d) => s + d.revenue, 0), totalCount: data.reduce((s,d) => s + d.count, 0) };
    }).sort((a,b) => b.totalRev - a.totalRev);

    const windowedRevenue = windowedInvoices.reduce((s, i) => s + i.paid, 0);
    const windowedInvoiced = windowedInvoices.reduce((s, i) => s + i.amount, 0);
    const collectionRate = windowedInvoiced > 0 ? Math.round((windowedRevenue / windowedInvoiced) * 100) : 0;

    // Daily reconciliation data — payments recorded by the user on the selected reconcile date.
    // For director: per-employee breakdown of who collected what.
    // For employees: their own collections to compare against cash in hand.
    const reconcileData = (() => {
      const all = [];
      invoices.forEach(inv => {
        (inv.payments || []).forEach(p => {
          if (p.dateOnly === reconcileDate) {
            all.push({ ...p, invoiceNo: inv.invoiceNo, clientName: inv.clientName });
          }
        });
      });
      return all;
    })();
    // Group by recordedBy for the director's view
    const reconcileByReceiver = (() => {
      const map = {};
      reconcileData.forEach(p => {
        const name = p.recordedBy || "Unknown";
        if (!map[name]) map[name] = { name, cash: 0, bkash: 0, total: 0, count: 0 };
        if (p.method === "bkash") map[name].bkash += p.amount;
        else map[name].cash += p.amount;
        map[name].total += p.amount;
        map[name].count += 1;
      });
      return Object.values(map).sort((a, b) => b.total - a.total);
    })();
    // For employees: only payments they recorded
    const myReconcile = reconcileData.filter(p => p.recordedBy === userInfo.name);
    const mySystemCash = myReconcile.filter(p => p.method !== "bkash").reduce((s, p) => s + p.amount, 0);
    const mySystemBkash = myReconcile.filter(p => p.method === "bkash").reduce((s, p) => s + p.amount, 0);
    const cashCount = parseFloat(countedCash) || 0;
    const bkashCount = parseFloat(countedBkash) || 0;
    const cashVariance = cashCount - mySystemCash;
    const bkashVariance = bkashCount - mySystemBkash;
    const friendlyDate = (() => {
      const d = new Date(reconcileDate + "T00:00:00");
      return d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    })();

    return (
      <div className="fade-in">
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>Analytics</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
              {isDirector ? "Firm-wide performance insights" : "Your performance insights"} — Last {analyticsMonths} {analyticsMonths === 1 ? "month" : "months"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Time range:</label>
            <select
              className="form-select"
              value={analyticsMonths}
              onChange={e => setAnalyticsMonths(Number(e.target.value))}
              style={{ minWidth: 160, fontSize: 13, fontWeight: 600 }}
            >
              <option value={1}>Last 1 month</option>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={9}>Last 9 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="stat-card"><div className="stat-label">Revenue Collected ({analyticsMonths}M)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--green)" }}>{formatCurrency(windowedRevenue)}</div></div>
          <div className="stat-card"><div className="stat-label">Total Invoiced ({analyticsMonths}M)</div><div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>{formatCurrency(windowedInvoiced)}</div></div>
          <div className="stat-card"><div className="stat-label">Collection Rate</div><div className="stat-value" style={{ fontSize: 22, color: collectionRate >= 70 ? "var(--green)" : collectionRate >= 50 ? "var(--orange)" : "var(--red)" }}>{formatNumber(collectionRate)}%</div></div>
        </div>

        {/* ─── Daily Reconciliation ─── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3>{isDirector ? "Daily Collections — Per Employee" : "Daily Reconciliation"}</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{friendlyDate}</span>
            </div>
            <input
              type="date"
              className="form-input"
              value={reconcileDate}
              onChange={e => setReconcileDate(e.target.value)}
              style={{ maxWidth: 180, fontSize: 13 }}
            />
          </div>
          <div className="card-body">
            {isDirector ? (
              // ─── DIRECTOR: per-employee breakdown ───
              reconcileByReceiver.length === 0 ? (
                <div className="empty-state"><p>No payments recorded on {friendlyDate}</p></div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recorded By</th>
                      <th style={{ textAlign: "right" }}>Cash</th>
                      <th style={{ textAlign: "right" }}>bKash</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "right" }}>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconcileByReceiver.map(r => (
                      <tr key={r.name}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(r.cash)}</td>
                        <td style={{ textAlign: "right", color: "#E2136E" }}>{formatCurrency(r.bkash)}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(r.total)}</td>
                        <td style={{ textAlign: "right", color: "var(--text-tertiary)" }}>{formatNumber(r.count)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid var(--border)", fontWeight: 700, background: "var(--bg)" }}>
                      <td>Firm Total</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(reconcileByReceiver.reduce((s, r) => s + r.cash, 0))}</td>
                      <td style={{ textAlign: "right", color: "#E2136E" }}>{formatCurrency(reconcileByReceiver.reduce((s, r) => s + r.bkash, 0))}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(reconcileByReceiver.reduce((s, r) => s + r.total, 0))}</td>
                      <td style={{ textAlign: "right" }}>{formatNumber(reconcileByReceiver.reduce((s, r) => s + r.count, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              )
            ) : (
              // ─── EMPLOYEE: personal reconciliation tool ───
              <div>
                <div className="reconcile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
                  {/* CASH PANEL */}
                  <div style={{ padding: 16, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--accent)", marginBottom: 12 }}>Cash</div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>System total (recorded)</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(mySystemCash)}</span>
                    </div>
                    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <label style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Cash in hand (counted)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter your physical cash count"
                        value={countedCash}
                        onChange={e => setCountedCash(e.target.value)}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", alignItems: "center" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>Variance</span>
                      <span style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: countedCash === "" ? "var(--text-tertiary)"
                              : cashVariance === 0 ? "var(--green)"
                              : "var(--red)",
                      }}>
                        {countedCash === "" ? "—" : (cashVariance === 0 ? `✓ ${formatCurrency(0)}` : `${cashVariance > 0 ? "+" : ""}${formatCurrency(cashVariance)}`)}
                      </span>
                    </div>
                  </div>
                  {/* BKASH PANEL */}
                  <div style={{ padding: 16, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#E2136E", marginBottom: 12 }}>bKash</div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>System total (recorded)</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(mySystemBkash)}</span>
                    </div>
                    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <label style={{ fontSize: 12.5, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>bKash balance (counted)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter your bKash balance"
                        value={countedBkash}
                        onChange={e => setCountedBkash(e.target.value)}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", alignItems: "center" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>Variance</span>
                      <span style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: countedBkash === "" ? "var(--text-tertiary)"
                              : bkashVariance === 0 ? "var(--green)"
                              : "var(--red)",
                      }}>
                        {countedBkash === "" ? "—" : (bkashVariance === 0 ? `✓ ${formatCurrency(0)}` : `${bkashVariance > 0 ? "+" : ""}${formatCurrency(bkashVariance)}`)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed transaction list */}
                {myReconcile.length === 0 ? (
                  <div className="empty-state" style={{ marginTop: 8 }}>
                    <p>No payments recorded by you on {friendlyDate}</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--text-tertiary)", marginBottom: 8 }}>Transactions you recorded ({myReconcile.length})</div>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Client</th>
                          <th>Method</th>
                          <th style={{ textAlign: "right" }}>Amount</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myReconcile.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.invoiceNo}</td>
                            <td>{p.clientName}</td>
                            <td><span className="badge-status" style={{ background: p.method === "bkash" ? "rgba(226,19,110,0.1)" : "var(--accent-light)", color: p.method === "bkash" ? "#E2136E" : "var(--accent)" }}>{p.method === "bkash" ? "bKash" : "Cash"}</span></td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                            <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text-tertiary)" }}>{p.receiptNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--accent-light)", borderRadius: 10, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--accent)" }}>How to reconcile:</strong> Count your physical cash and check your bKash balance, then enter both above. The variance shows the difference between your record and the system. A variance of zero means everything matches; a non-zero variance means a payment may not have been recorded, or you may have spent some of the collected money.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Daily Payments Received — Last 7 Days */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <h3>Daily Payments Received</h3>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Last 7 days · Total: {formatCurrency(total7d)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11.5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                Cash <strong style={{ marginLeft: 4 }}>{formatCurrency(totalCash7d)}</strong>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E2136E", display: "inline-block" }} />
                bKash <strong style={{ marginLeft: 4 }}>{formatCurrency(totalBkash7d)}</strong>
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: "20px 24px 24px" }}>
            {(() => {
              const CHART_H = 280;
              return (
                <div style={{ display: "flex", position: "relative" }}>
                  <div style={{ width: 75, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", height: CHART_H, paddingRight: 10 }}>
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
                              Cash: {formatCurrency(d.cash)}<br/>
                              bKash: {formatCurrency(d.bkash)}<br/>
                              <strong>Total: {formatCurrency(d.total)}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div style={{ display: "flex", marginTop: 14, paddingLeft: 75 }}>
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

        {/* Daily Receiver Breakdown — accountability chart */}
        {(() => {
          // Aggregate payments on the selected date by receiver
          const receiverMap = {};
          invoices.forEach(inv => {
            (inv.payments || []).forEach(p => {
              if (p.dateOnly === selectedAnalyticsDate) {
                const name = p.recordedBy || "Unknown";
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
          const niceDate = selectedDateObj.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

          return (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3>Daily Receiver Accountability</h3>
                  <span style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>Who received how much on a specific day</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>Select Date:</label>
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
                {/* Date summary */}
                <div style={{ background: "var(--bg)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Showing payments for</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{niceDate}</div>
                  </div>
                  <div style={{ display: "flex", gap: 28 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>Total Received</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(dayTotal)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>Receivers</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(receivers.length)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>Transactions</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{formatNumber(totalPayments)}</div>
                    </div>
                  </div>
                </div>

                {receivers.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <p>No payments recorded on this date.</p>
                  </div>
                ) : (
                  <>
                    {/* Method legend */}
                    <div style={{ display: "flex", gap: 16, fontSize: 11.5, marginBottom: 14 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--accent)", display: "inline-block" }} />
                        Cash <strong style={{ marginLeft: 4 }}>{formatCurrency(dayCash)}</strong>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E2136E", display: "inline-block" }} />
                        bKash <strong style={{ marginLeft: 4 }}>{formatCurrency(dayBkash)}</strong>
                      </span>
                    </div>

                    {/* Horizontal bars per receiver */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {receivers.map((r, i) => {
                        const widthPct = (r.total / maxReceiverTotal) * 100;
                        const cashPct = r.total > 0 ? (r.cash / r.total) * widthPct : 0;
                        const bkashPct = r.total > 0 ? (r.bkash / r.total) * widthPct : 0;
                        return (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>
                                  {r.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                                  <div style={{ fontSize: 10.5, color: "var(--text-tertiary)" }}>{formatNumber(r.count)} transaction{r.count > 1 ? "s" : ""}</div>
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
          <div className="card-header"><h3>Revenue by Client</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--green)", display: "inline-block" }} /> Collected</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--red)", display: "inline-block" }} /> Outstanding</span>
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
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Collected: {formatCurrency(c.paid)} ({paidPct.toFixed(0)}%)</span>
                    <span style={{ fontSize: 10, color: c.outstanding > 0 ? "var(--red)" : "var(--text-tertiary)" }}>Outstanding: {formatCurrency(c.outstanding)} ({outPct.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>{isDirector ? "Employee Performance Ranking" : "Your Performance"}</h3><span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Revenue brought in ({analyticsMonths}M)</span></div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {empData.map(({ emp, totalRev, totalCount }, i) => {
              const avgPerCase = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;
              return (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-light)", cursor: "pointer" }} onClick={() => { setSelectedEmployee(emp.id); setPage("employees"); }}>
                  <span style={{ width: 22, fontSize: 13, fontWeight: 800, color: i < 3 ? "var(--accent)" : "var(--text-tertiary)", textAlign: "center" }}>{i + 1}</span>
                  <div className={`avatar ${emp.category}`} style={{ width: 34, height: 34, fontSize: 11 }}>{emp.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{emp.shortName}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{emp.role} · {formatNumber(totalCount)} cases</div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 20 }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Avg / Case</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{formatCurrency(avgPerCase)}</div>
                  </div>
                  <div style={{ textAlign: "right", width: 130 }}>
                    <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Total Revenue</div>
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

  const pageTitle = { dashboard: "Dashboard", employees: "Team", invoices: "Invoices", outstanding: "Outstanding", clients: "Clients", analytics: "Analytics" };

  const renderPage = () => {
    // Block employees from accessing director-only pages
    if (!isDirector && (page === "employees" || page === "clients")) {
      return renderDashboard();
    }
    switch (page) {
      case "dashboard": return renderDashboard();
      case "employees": return renderEmployees();
      case "invoices": return <InvoicesPage invoices={visibleInvoices} setInvoices={setInvoices} clients={clients} setClients={setClients} selectedInvoice={selectedInvoice} setSelectedInvoice={setSelectedInvoice} totalRevenue={totalRevenue} totalOutstanding={totalOutstanding} totalOverdue={totalOverdue} setPaymentModal={setPaymentModal} setPaymentAmount={setPaymentAmount} currentUser={currentUser} refreshData={refreshData} setInvoiceReceiptData={setInvoiceReceiptData} />;
      case "outstanding": return <OutstandingPage invoices={visibleInvoices} clients={clients} totalOutstanding={totalOutstanding} totalOverdue={totalOverdue} overdueCount={overdueCount} setPaymentModal={setPaymentModal} setPaymentAmount={setPaymentAmount} setSelectedInvoice={setSelectedInvoice} navigateTo={(pg) => setPage(pg)} />;
      case "clients": return renderClients();
      case "analytics": return renderAnalytics();
      default: return renderDashboard();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className={`sidebar-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand"><h1>Ruhul Quddus<br/>& Jurists</h1><p>Practice Management</p></div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">Overview</div>
              <div className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => navigate("dashboard")}><Icon name="dashboard" /> Dashboard</div>
              <div className={`nav-item ${page === "analytics" ? "active" : ""}`} onClick={() => navigate("analytics")}><Icon name="chart" /> Analytics</div>
            </div>
            {isDirector && (
              <div className="nav-section">
                <div className="nav-section-title">Management</div>
                <div className={`nav-item ${page === "employees" ? "active" : ""}`} onClick={() => navigate("employees")}><Icon name="people" /> Team</div>
                <div className={`nav-item ${page === "clients" ? "active" : ""}`} onClick={() => navigate("clients")}><Icon name="people" /> Clients</div>
              </div>
            )}
            <div className="nav-section">
              <div className="nav-section-title">Billing</div>
              <div className={`nav-item ${page === "invoices" ? "active" : ""}`} onClick={() => navigate("invoices")}><Icon name="invoice" /> Invoices</div>
              <div className={`nav-item ${page === "outstanding" ? "active" : ""}`} onClick={() => navigate("outstanding")}><Icon name="alert" /> Outstanding{overdueCount > 0 && <span className="badge">{formatNumber(overdueCount)}</span>}</div>
            </div>
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user" style={{ marginBottom: 12 }}>
              <div className="sidebar-user-avatar">{(EMPLOYEES.find(e => e.id === currentUser.employeeId)?.avatar) || userInfo.name.split(" ").map(s => s[0]).slice(0,2).join("")}</div>
              <div className="sidebar-user-info"><h4>{userInfo.name}</h4><p>{userInfo.role}</p></div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={onLanguageToggle}
                style={{
                  flex: 1,
                  padding: "8px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                title="Switch language"
              >
                🌐 বাংলা
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  padding: "8px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--red-light)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>
        <div className="main">
          <header className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <h2 className="topbar-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageTitle[page]}</h2>
            </div>
            <span className="topbar-date" style={{ fontSize: 12, color: "var(--text-tertiary)", flexShrink: 0 }}>{MONTHS[currentMonth]} {currentYear}</span>
          </header>
          <div className="content">{renderPage()}</div>
        </div>
      </div>
      {paymentModal && (
        <div className="modal-overlay" {...overlayDismiss(() => setPaymentModal(null))}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header"><h2>Record Payment</h2><button className="modal-close" onClick={() => setPaymentModal(null)}><Icon name="x" size={16} /></button></div>
            <div className="modal-body">{(() => {
              const inv = invoices.find(i => i.id === paymentModal);
              if (!inv) return null;
              return (
                <>
                  <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>{inv.invoiceNo}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{inv.clientName}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Outstanding: <strong style={{ color: "var(--red)" }}>{formatCurrency(inv.outstanding)}</strong></div>
                  </div>
                  <div className="form-group"><label className="form-label">Payment Amount (BDT)</label><input type="number" className="form-input" placeholder="Enter amount" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={inv.outstanding} /></div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPaymentAmount(String(Math.floor(inv.outstanding / 2)))}>50%</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setPaymentAmount(String(inv.outstanding))}>Full Amount</button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
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
                        💵 Cash
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
                        📱 bKash
                      </button>
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "12px 0" }} onClick={() => { const amt = Number(paymentAmount); if (amt > 0 && amt <= inv.outstanding) { recordPayment(paymentModal, amt, paymentMethod); setPaymentModal(null); setPaymentMethod("cash"); } }}>Confirm Payment</button>
                </>
              );
            })()}</div>
          </div>
        </div>
      )}

      {receiptData && (
        <div className="modal-overlay" {...overlayDismiss(() => setReceiptData(null))}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ paddingBottom: 8 }}>
              <div>
                <h2 style={{ marginBottom: 2 }}>Payment Receipt</h2>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>Receipt No. {receiptData.receiptNo}</p>
              </div>
              <button className="modal-close" onClick={() => setReceiptData(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              {/* Success banner */}
              <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="check" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1a8f2d" }}>Payment recorded successfully</div>
                  <div style={{ fontSize: 11.5, color: "#1a8f2d", marginTop: 2 }}>Receipt issued · {receiptData.date}</div>
                </div>
              </div>

              {/* Firm letterhead */}
              <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px solid var(--text)", marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{FIRM.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 4 }}>{FIRM.address}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 2 }}>{FIRM.phone} · {FIRM.email}</div>
              </div>

              {/* Receipt rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Received From</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.clientName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Against Invoice</span>
                  <span style={{ fontWeight: 600, color: "var(--accent)" }}>{receiptData.invoiceNo}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Date & Time</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.date}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Received By</span>
                  <span style={{ fontWeight: 600 }}>{receiptData.receivedBy} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>· {receiptData.receivedByRole}</span></span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Payment Method</span>
                  <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {receiptData.method === "bkash" ? <span style={{ color: "#E2136E" }}>📱 bKash</span> : <span>💵 Cash</span>}
                  </span>
                </div>
              </div>

              {/* Amount block */}
              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Amount Outstanding (Before Payment)</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(receiptData.amountBefore)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>Payment Received</span>
                  <span style={{ fontWeight: 700, color: "var(--green)", fontSize: 15 }}>{formatCurrency(receiptData.paymentAmount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "10px 0 4px" }}>
                  <span style={{ fontWeight: 700 }}>Remaining Outstanding</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: receiptData.remainingOutstanding > 0 ? "var(--red)" : "var(--green)" }}>{formatCurrency(receiptData.remainingOutstanding)}</span>
                </div>
              </div>

              {receiptData.remainingOutstanding === 0 && (
                <div style={{ background: "var(--green-light)", border: "1px solid var(--green)", borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: "#1a8f2d", textAlign: "center", fontWeight: 600 }}>
                  ✓ Invoice fully settled
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => window.print()}>Print Receipt</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setReceiptData(null)}>Done</button>
              </div>

              <p style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 14 }}>This is a computer-generated receipt and does not require a signature.</p>
            </div>
          </div>
        </div>
      )}

      {invoiceReceiptData && (
        <div className="modal-overlay" {...overlayDismiss(() => setInvoiceReceiptData(null))}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header" style={{ paddingBottom: 8 }}>
              <div>
                <h2 style={{ marginBottom: 2 }}>Invoice</h2>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>Invoice No. {invoiceReceiptData.invoiceNo}</p>
              </div>
              <button className="modal-close" onClick={() => setInvoiceReceiptData(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              {/* Success banner — blue for invoice (vs green for payment receipt) */}
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="check" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--accent)" }}>Invoice created successfully</div>
                  <div style={{ fontSize: 11.5, color: "var(--accent)", marginTop: 2 }}>Issued · {invoiceReceiptData.issuedAt}</div>
                </div>
              </div>

              {/* Firm letterhead */}
              <div style={{ textAlign: "center", paddingBottom: 16, borderBottom: "2px solid var(--text)", marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{FIRM.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 4 }}>{FIRM.address}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", marginTop: 2 }}>{FIRM.phone} · {FIRM.email}</div>
              </div>

              {/* INVOICE label + meta row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-tertiary)", marginBottom: 4 }}>Invoice</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>{invoiceReceiptData.invoiceNo}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-tertiary)", marginBottom: 4 }}>Issue Date</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{invoiceReceiptData.issueDate}</div>
                </div>
              </div>

              {/* Bill To block */}
              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-tertiary)", marginBottom: 6 }}>Bill To</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{invoiceReceiptData.client.name}</div>
                {invoiceReceiptData.client.address && <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{invoiceReceiptData.client.address}</div>}
                {(invoiceReceiptData.client.contact || invoiceReceiptData.client.phone || invoiceReceiptData.client.email) && (
                  <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 6 }}>
                    {invoiceReceiptData.client.contact}
                    {invoiceReceiptData.client.phone ? ` · ${invoiceReceiptData.client.phone}` : ""}
                    {invoiceReceiptData.client.email ? ` · ${invoiceReceiptData.client.email}` : ""}
                  </div>
                )}
              </div>

              {/* Line items table */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--text-tertiary)", marginBottom: 8, padding: "0 4px" }}>Particulars</div>
                <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px", padding: "10px 14px", background: "var(--bg)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-tertiary)", borderBottom: "1px solid var(--border)" }}>
                    <span>Description</span>
                    <span style={{ textAlign: "left" }}>Handled By</span>
                    <span style={{ textAlign: "right" }}>Amount</span>
                  </div>
                  {invoiceReceiptData.items.map((it, idx) => {
                    const emp = EMPLOYEES.find(e => e.id === it.employeeId);
                    return (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px", padding: "11px 14px", fontSize: 12.5, borderBottom: idx < invoiceReceiptData.items.length - 1 ? "1px solid var(--border-light)" : "none", alignItems: "start", gap: 8 }}>
                        <span style={{ lineHeight: 1.4 }}>{it.description}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{emp ? emp.shortName : "—"}</span>
                        <span style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(it.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total block */}
              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", color: "var(--text-secondary)" }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{formatCurrency(invoiceReceiptData.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)" }}>
                  <span>Tax / VAT</span>
                  <span style={{ fontWeight: 600, color: "var(--text-tertiary)" }}>—</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, padding: "12px 0 4px", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700 }}>Total Due</span>
                  <span style={{ fontWeight: 700, fontSize: 20, color: "var(--accent)", letterSpacing: -0.4 }}>{formatCurrency(invoiceReceiptData.amount)}</span>
                </div>
              </div>

              {/* Footer meta */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-tertiary)", padding: "8px 0", marginBottom: 12, borderTop: "1px solid var(--border-light)" }}>
                <span>Prepared by: <strong style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{invoiceReceiptData.preparedBy}</strong> · {invoiceReceiptData.preparedByRole}</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => window.print()}>Print Invoice</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setInvoiceReceiptData(null)}>Done</button>
              </div>

              <p style={{ fontSize: 10, color: "var(--text-tertiary)", textAlign: "center", marginTop: 14 }}>This is a computer-generated invoice. Payment instructions will be provided separately.</p>
            </div>
          </div>
        </div>
      )}

      {clientModal && (
        <div className="modal-overlay" {...overlayDismiss(() => setClientModal(null))}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{clientModal.mode === "add" ? "Add New Client" : "Edit Client"}</h2>
              <button className="modal-close" onClick={() => setClientModal(null)}><Icon name="x" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Company Name <span style={{ color: "var(--red)" }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. ABC Corporation Ltd."
                  value={clientForm.name}
                  onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address <span style={{ color: "var(--red)" }}>*</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Full address"
                  value={clientForm.address}
                  onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))}
                  rows={3}
                  style={{ resize: "vertical", minHeight: 70 }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person <span style={{ color: "var(--red)" }}>*</span></label>
                  <input
                    className="form-input"
                    placeholder="e.g. Legal Department"
                    value={clientForm.contact}
                    onChange={e => setClientForm(p => ({ ...p, contact: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: 11 }}>(optional)</span></label>
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
                <label className="form-label">Mobile Number <span style={{ color: "var(--red)" }}>*</span></label>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+880-2-XXXXXXX"
                  value={clientForm.phone}
                  onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px 0" }} onClick={() => setClientModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", padding: "10px 0" }}
                  onClick={saveClient}
                  disabled={!clientForm.name.trim() || !clientForm.address.trim() || !clientForm.contact.trim() || !clientForm.phone.trim()}
                >
                  {clientModal.mode === "add" ? "Add Client" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
