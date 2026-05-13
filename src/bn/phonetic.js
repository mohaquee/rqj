// ─────────────────────────────────────────────────────────────────
// Avro-style phonetic Bangla transliteration
// Type the way you pronounce: "amar nam" → "আমার নাম"
//
// Reference: Avro Phonetic by Mehdi Hasan Khan / OmicronLab
//   "ami banglay gan gai" → "আমি বাংলায় গান গাই"
//
// Approach: greedy longest-match pattern table, applied iteratively
// from the start of each word. State tracks whether the previous
// emitted glyph was a consonant (so vowels become kar/marks) or not
// (vowels become independent forms).
// ─────────────────────────────────────────────────────────────────

const HASANTA = "\u09CD"; // ্

// ─── Multi-character vowel patterns (independent forms) ───
const VOWELS_INDEP = [
  ["OU", "ঔ"], ["ou", "ঔ"], ["ow", "ঔ"],
  ["OI", "ঐ"], ["oi", "ঐ"],
  ["aa", "আ"],  ["AA", "আ"],
  ["ii", "ঈ"], ["II", "ঈ"], ["ee", "ঈ"],
  ["uu", "ঊ"], ["oo", "ঊ"], ["UU", "ঊ"],
  ["rri", "ঋ"], ["RRi", "ঋ"],
  ["a", "আ"], ["A", "আ"],
  ["i", "ই"], ["I", "ই"],
  ["u", "উ"], ["U", "উ"],
  ["e", "এ"], ["E", "এ"],
  ["o", "অ"], ["O", "ও"],
];

// ─── Multi-character vowel patterns (kar / dependent forms) ───
const VOWELS_KAR = [
  ["OU", "ৌ"], ["ou", "ৌ"], ["ow", "ৌ"],
  ["OI", "ৈ"], ["oi", "ৈ"],
  ["aa", "া"], ["AA", "া"],
  ["ii", "ী"], ["II", "ী"], ["ee", "ী"],
  ["uu", "ূ"], ["oo", "ূ"], ["UU", "ূ"],
  ["rri", "ৃ"], ["RRi", "ৃ"],
  ["a", "া"], ["A", "া"],
  ["i", "ি"], ["I", "ি"],
  ["u", "ু"], ["U", "ু"],
  ["e", "ে"], ["E", "ে"],
  ["o", "ো"], ["O", "ো"],
];

// ─── Consonants & conjuncts (longest first) ───
// Order matters: longer patterns must come before single chars
const CONSONANTS = [
  // Triple-char / special
  ["NG", "ঙ"],
  ["chh", "ছ"],
  // Aspirated digraphs
  ["kh", "খ"], ["Kh", "খ"],
  ["gh", "ঘ"], ["Gh", "ঘ"],
  ["ch", "চ"], ["Ch", "চ"],
  ["jh", "ঝ"], ["Jh", "ঝ"],
  ["Th", "ঠ"],
  ["Dh", "ঢ"],
  ["th", "থ"],
  ["dh", "ধ"],
  ["ph", "ফ"], ["Ph", "ফ"],
  ["bh", "ভ"], ["Bh", "ভ"],
  ["sh", "শ"],
  ["Sh", "ষ"],
  ["ss", "স"],
  ["ng", "ং"],   // anusvara mid-word / before consonant / at end
  ["rh", "ঢ়"], ["Rh", "ঢ়"],
  ["y'", "য়"],
  // Single-char consonants
  ["k", "ক"], ["K", "ক"], ["q", "ক"], ["Q", "ক"],
  ["g", "গ"], ["G", "গ"],
  ["c", "ক"],  // Avro: bare "c" = ক (as in "kompani"→"company" pattern works because users type "k" for ক)
                // but kept here so "c" also produces ক; "ch" digraph already consumed above.
  ["C", "ছ"],
  ["j", "জ"], ["J", "জ"], ["z", "জ"], ["Z", "জ"],
  ["T", "ট"], ["t", "ত"],
  ["D", "ড"], ["d", "দ"],
  ["n", "ন"], ["N", "ণ"],
  ["p", "প"], ["P", "প"],
  ["f", "ফ"], ["F", "ফ"],
  ["b", "ব"], ["B", "ব"],
  ["v", "ভ"], ["V", "ভ"],
  ["m", "ম"], ["M", "ম"],
  ["y", "য়"], ["Y", "য়"],
  ["r", "র"], ["R", "ড়"],
  ["l", "ল"], ["L", "ল"],
  ["s", "স"], ["S", "শ"],
  ["h", "হ"], ["H", "হ"],
  ["w", "ও"], ["W", "ও"],
  ["x", "ক্স"], ["X", "ক্স"],
  // Punctuation / special
  ["^", "ঁ"], [":", "ঃ"],
  ["``", "়"],
  [".", "."],
];

// Known conjunct consonant clusters in Avro phonetic.
// When two consonants appear adjacent in the user's input (no vowel between),
// we conjunct ONLY if the cluster is in this set. Otherwise an inherent vowel
// is assumed between them. This matches what Avro's dictionary does for
// common Bangla words.
//
// Doubled consonants are always conjuncts (e.g. "kk", "dd", "ll", "mm").
const CONJUNCT_CLUSTERS = new Set([
  // Doubled (handled programmatically by checking same letter)
  // Common Bangla conjuncts (Latin form → expected to conjunct)
  "kt", "kr", "kl", "ks", "ksh", "kkh",
  "gd", "gn", "gr", "gl",
  "ngk", "ngg", "ngch", "ngz",  // ঙ্ক ঙ্গ etc
  "cch",                          // চ্ছ
  "jj", "jn", "jr",
  "ngc", "ngj",
  "tt", "tth", "tn", "tm", "tr", "tw",
  "ddh", "dn", "dm", "dr", "dw", "db",
  "nt", "nth", "nd", "ndh", "nn", "ny", "nch", "nj",
  "pp", "pt", "pn", "pl", "pr", "ps",
  "bd", "bn", "bb", "bj", "bl", "br",
  "mp", "mb", "mm", "mr", "ml",      // mp for kompani
  "yp", "yn",
  "rg", "rk", "rt", "rd", "rn", "rm", "rp", "rb", "rs", "rsh", "rkh", "rgh", // র-fala (reph)
  "lk", "lp", "lb", "lm", "ll",
  "sk", "skh", "st", "sth", "sp", "sph", "sm", "sn", "sl", "sw", "sr",
  "shc", "shr", "shl", "shm", "shn", "shw", "shp",
  "hn", "hm", "hr", "hl", "hb", "hy",
]);

const DIGITS = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

// Pre-compile sorted pattern arrays so longest patterns try first
const VOWEL_INDEP_SORTED = [...VOWELS_INDEP].sort((a, b) => b[0].length - a[0].length);
const VOWEL_KAR_SORTED = [...VOWELS_KAR].sort((a, b) => b[0].length - a[0].length);
const CONSONANT_SORTED = [...CONSONANTS].sort((a, b) => b[0].length - a[0].length);

function isAsciiLetterOrDigit(ch) {
  return /^[A-Za-z0-9]$/.test(ch);
}

/**
 * Transliterate a single ASCII word to Bangla.
 *
 * Strategy: walk through the word, at each position try the longest matching
 * pattern. State `lastWasConsonant` controls whether vowels emit kar form
 * (after consonant) or independent form. Consecutive consonants without an
 * intervening vowel get joined by hasanta (্) to form conjuncts.
 */
function transliterateWord(word) {
  if (!word) return "";

  // Pre-process: Capital R at word START shouldn't trigger retroflex ড়.
  // (English names like "Ruhul", "Rahim" should map to র, not ড়.)
  // Other capitals (T/N/D/S) at word start ARE meaningful in Avro
  // — they intentionally select retroflex (টাকা = "Taka", ঢাকা = "Dhaka", etc).
  let w = word;
  if (/^R[a-z]/.test(w)) {
    w = "r" + w.slice(1);
  }

  let i = 0;
  let result = "";
  let lastWasConsonant = false;
  let lastConsonantInput = ""; // the Latin source pattern of the last consonant, lowercased

  while (i < w.length) {
    const remaining = w.slice(i);

    // ── Digit ──
    if (DIGITS[remaining[0]]) {
      result += DIGITS[remaining[0]];
      i += 1;
      lastWasConsonant = false;
      continue;
    }

    // ── Special: "ng" at end of word OR before another consonant → anusvara (ং) ──
    if ((remaining.startsWith("ng") || remaining.startsWith("Ng") || remaining.startsWith("NG"))
        && lastWasConsonant === false) {
      // Skip — we'll let this be handled by normal pattern matching
      // Actually: we want "bangla" → "ng" between two vowels to become ang+gla
      // Avro rule: "ang" at word position with consonant following → anusvara
    }
    if (remaining.startsWith("ng")) {
      const after = remaining[2];
      // ng followed by another consonant or end of word → anusvara ং (not ঙ)
      if (!after || /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/.test(after)) {
        if (lastWasConsonant) result += HASANTA; // shouldn't happen normally
        result += "ং";
        i += 2;
        lastWasConsonant = false;
        continue;
      }
      // ng followed by vowel → ঙ + vowel-kar (e.g. "anga" → অঙ্গ)
      // Actually ঙ is N-G, but the m sound here is ŋ. Let it fall through to NG handler below.
      // We'll just emit ঙ-g pattern: ŋ → ঙ + g → হাসন্ত + গ
      // Easier: treat "ng" + vowel as ং+gV — but real Avro produces ঙ্গ here.
      // We default to anusvara (ং) since that's what most users expect for "bangla"-style words.
      if (lastWasConsonant) result += HASANTA;
      result += "ং";
      i += 2;
      lastWasConsonant = false;
      continue;
    }

    // ── Try consonant pattern (longest match) ──
    let matched = null;
    for (const [pat, ch] of CONSONANT_SORTED) {
      if (remaining.startsWith(pat)) {
        // Special case: don't match bare "c" if followed by "h" (we want "ch" digraph)
        if (pat === "c" && remaining[1] === "h") continue;
        matched = [pat, ch];
        break;
      }
    }
    if (matched) {
      const [pat, ch] = matched;
      const patLower = pat.toLowerCase();
      // Conjunct rule: if previous emitted was a consonant, decide whether to:
      //   (a) add hasanta to form a conjunct, OR
      //   (b) assume inherent vowel between the two consonants
      // Conjunct happens when:
      //   - the two letters are the same (doubled, e.g. "kk", "dd", "ll")
      //   - the cluster "lastConsonantInput + patLower" is in CONJUNCT_CLUSTERS
      if (lastWasConsonant) {
        const cluster = lastConsonantInput + patLower;
        const isDoubled = lastConsonantInput === patLower;
        if (isDoubled || CONJUNCT_CLUSTERS.has(cluster)) {
          result += HASANTA;
        }
        // else: leave inherent vowel implicit, just append the next consonant
      }
      result += ch;
      i += pat.length;
      // ং, ঃ, ঁ shouldn't be treated as consonants (no hasanta after them)
      if (ch === "ং" || ch === "ঃ" || ch === "ঁ" || ch === "্") {
        lastWasConsonant = false;
        lastConsonantInput = "";
      } else {
        lastWasConsonant = true;
        lastConsonantInput = patLower;
      }
      continue;
    }

    // ── Try vowel pattern (longest match) ──
    const vowelSet = lastWasConsonant ? VOWEL_KAR_SORTED : VOWEL_INDEP_SORTED;
    let vMatched = null;
    for (const [pat, ch] of vowelSet) {
      if (remaining.startsWith(pat)) {
        vMatched = [pat, ch];
        break;
      }
    }
    if (vMatched) {
      const [pat, ch] = vMatched;
      result += ch;
      i += pat.length;
      lastWasConsonant = false;
      lastConsonantInput = "";
      continue;
    }

    // ── Unmatched: pass through ──
    result += remaining[0];
    i += 1;
    lastWasConsonant = false;
    lastConsonantInput = "";
    continue;
  }

  return result;
}

/**
 * Transliterate a full text string, processing it word by word
 * (whitespace and non-ASCII characters preserved as separators).
 */
export function transliterate(text) {
  if (!text) return "";
  let result = "";
  let buffer = "";
  for (const ch of text) {
    if (isAsciiLetterOrDigit(ch)) {
      buffer += ch;
    } else {
      if (buffer) {
        result += transliterateWord(buffer);
        buffer = "";
      }
      result += ch;
    }
  }
  if (buffer) result += transliterateWord(buffer);
  return result;
}

/**
 * Buffer-mode: given text that may contain previously-typed Bangla followed
 * by new ASCII input, transliterate ONLY the trailing ASCII run (and any
 * spaces between ASCII runs in that trailing region).
 *
 * Examples:
 *   "আমার "         → "আমার "          (no ASCII tail)
 *   "আমার nam"      → "আমার নাম"       (only tail translated)
 *   "amar nam"      → "আমার নাম"       (whole string is ASCII tail)
 */
export function transliterateBuffer(text) {
  if (!text) return "";
  // Walk back from end, skipping ASCII letters/digits and spaces
  let i = text.length - 1;
  while (i >= 0 && (isAsciiLetterOrDigit(text[i]) || text[i] === " ")) i--;
  const head = text.slice(0, i + 1);
  const tail = text.slice(i + 1);
  if (!tail) return head;
  return head + transliterate(tail);
}
