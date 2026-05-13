// ─────────────────────────────────────────────────────────────────
// BanglaInput / BanglaTextarea — Avro-style phonetic Bangla input
//
// Type the way you pronounce: "amar nam" → "আমার নাম"
// Toggle button switches modes:
//   "অ"  = Avro phonetic Bangla (default)
//   "EN" = Raw English passthrough
//
// IMPORTANT: the mode is shared across ALL BanglaInput / BanglaTextarea
// instances on the page. Clicking the toggle on one field switches
// every field at the same time. This matches how Avro / Bijoy /
// Ridmik work — there's one global "Bangla mode on/off" state.
// ─────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { transliterateBuffer, transliterate } from "./phonetic.js";

const MODE_KEY = "rqj_bangla_input_mode_v3";

// ── Shared mode store (single source of truth for the whole page) ──
// All BanglaInput/BanglaTextarea instances read from / write to this store,
// so toggling on one field flips every field at once.
const modeStore = (() => {
  let listeners = new Set();
  let mode;
  try { mode = localStorage.getItem(MODE_KEY) || "bn"; } catch { mode = "bn"; }
  return {
    get: () => mode,
    set: (m) => {
      mode = m;
      try { localStorage.setItem(MODE_KEY, m); } catch {}
      listeners.forEach(fn => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
})();

function useSharedMode() {
  return useSyncExternalStore(modeStore.subscribe, modeStore.get, modeStore.get);
}

function toggleSharedMode() {
  modeStore.set(modeStore.get() === "bn" ? "en" : "bn");
}

function ModeToggle({ mode, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseDown={e => e.preventDefault()}
      title={mode === "bn"
        ? "অভ্র ফনেটিক বাংলা — ক্লিক করে ইংরেজিতে স্যুইচ করুন"
        : "English mode — click to type in Bangla (Avro phonetic)"}
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        zIndex: 2,
        width: 34,
        height: 26,
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: mode === "bn" ? "var(--accent)" : "var(--surface)",
        color: mode === "bn" ? "#fff" : "var(--text-secondary)",
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        padding: 0,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font)",
        transition: "all 0.15s ease",
      }}
    >
      {mode === "bn" ? "অ" : "EN"}
    </button>
  );
}

/**
 * Core logic shared by both input and textarea.
 * Phonetic mode: every onChange runs the value through transliterateBuffer,
 * which converts only the trailing ASCII run (so previously-typed Bangla is
 * preserved untouched).
 */
function convertOnChange(rawNew, mode) {
  if (mode === "en") return rawNew;
  return transliterateBuffer(rawNew);
}

export function BanglaInput({ value, onChange, style, ...rest }) {
  const mode = useSharedMode();

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    const converted = convertOnChange(raw, mode);
    onChange({ target: { value: converted } });
  }, [mode, onChange]);

  // When user pastes English text in Bangla mode, transliterate it
  const handlePaste = useCallback((e) => {
    if (mode !== "bn") return;
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;
    // If already Bangla, let it through
    if (/[\u0980-\u09FF]/.test(text)) return;
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart ?? (value || "").length;
    const end = el.selectionEnd ?? start;
    const translated = transliterate(text);
    const newValue = (value || "").slice(0, start) + translated + (value || "").slice(end);
    onChange({ target: { value: newValue } });
    requestAnimationFrame(() => {
      try { el.setSelectionRange(start + translated.length, start + translated.length); } catch {}
    });
  }, [mode, value, onChange]);

  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        value={value || ""}
        onChange={handleChange}
        onPaste={handlePaste}
        style={{ ...style, paddingRight: 44 }}
      />
      <ModeToggle mode={mode} onToggle={toggleSharedMode} />
    </div>
  );
}

export function BanglaTextarea({ value, onChange, style, ...rest }) {
  const mode = useSharedMode();

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    const converted = convertOnChange(raw, mode);
    onChange({ target: { value: converted } });
  }, [mode, onChange]);

  const handlePaste = useCallback((e) => {
    if (mode !== "bn") return;
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;
    if (/[\u0980-\u09FF]/.test(text)) return;
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart ?? (value || "").length;
    const end = el.selectionEnd ?? start;
    const translated = transliterate(text);
    const newValue = (value || "").slice(0, start) + translated + (value || "").slice(end);
    onChange({ target: { value: newValue } });
    requestAnimationFrame(() => {
      try { el.setSelectionRange(start + translated.length, start + translated.length); } catch {}
    });
  }, [mode, value, onChange]);

  return (
    <div style={{ position: "relative" }}>
      <textarea
        {...rest}
        value={value || ""}
        onChange={handleChange}
        onPaste={handlePaste}
        style={{ ...style, paddingRight: 44 }}
      />
      <ModeToggle mode={mode} onToggle={toggleSharedMode} />
    </div>
  );
}
