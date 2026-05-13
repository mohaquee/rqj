import { useState, useEffect } from "react";
import AppEn from "./AppEn.jsx";
import AppBn from "./AppBn.jsx";

const LANG_KEY = "rqj_language_v1";

export default function App() {
  // Load preferred language from storage; default to English
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      return saved === "bn" ? "bn" : "en";
    } catch {
      return "en";
    }
  });

  // Persist language choice
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);

  const toggleLanguage = () => setLang(l => l === "en" ? "bn" : "en");

  // Render the appropriate language version. Both share data via localStorage.
  return lang === "bn"
    ? <AppBn key="bn" onLanguageToggle={toggleLanguage} />
    : <AppEn key="en" onLanguageToggle={toggleLanguage} />;
}
