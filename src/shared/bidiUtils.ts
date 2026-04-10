const HEBREW_RE = /[\u05B0-\u05EA]/;
export const BIDI_CONTROL_RE = /[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/;
export const BIDI_CONTROL_RE_GLOBAL = /[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069]/g;

/**
 * For a single '/'-delimited segment: reverses characters within each Hebrew word AND
 * reverses the order of Hebrew words, while leaving non-Hebrew content (English, numbers,
 * punctuation, spaces between words) in its original structural positions.
 */
function fixSegment(seg: string): string {
  // Split into alternating Hebrew / non-Hebrew runs, preserving which is which
  const runs: { text: string; isHebrew: boolean }[] = [];
  let current = '';
  let inHebrew = seg.length > 0 && HEBREW_RE.test(seg[0]!);

  for (const ch of seg) {
    const isHeb = HEBREW_RE.test(ch);
    if (isHeb !== inHebrew) {
      runs.push({ text: current, isHebrew: inHebrew });
      current = '';
      inHebrew = isHeb;
    }
    current += ch;
  }
  if (current) runs.push({ text: current, isHebrew: inHebrew });

  // Build fixed Hebrew word list (chars reversed) then reverse word order
  const hebrewWords = runs
    .filter(r => r.isHebrew)
    .map(r => [...r.text].reverse().join(''))
    .reverse();

  // Interleave back: follow the original run structure, substituting fixed Hebrew words
  let hIdx = 0;
  return runs
    .map(r => (r.isHebrew ? hebrewWords[hIdx++]! : r.text))
    .join('');
}

/**
 * Fixes text stored in visual LTR order by bank exports (e.g. with U+202D LEFT-TO-RIGHT OVERRIDE).
 *
 * Algorithm:
 * 1. Strip BiDi control characters.
 * 2. Split on '/'.
 * 3. For each segment: reverse Hebrew word characters AND Hebrew word order;
 *    non-Hebrew content (English, numbers, punctuation) stays in place.
 * 4. Reverse the order of all segments.
 * 5. Rejoin with '/'.
 */
export function fixBidiVisualOrder(text: string): string {
  if (!BIDI_CONTROL_RE.test(text)) return text.trim();
  const stripped = text.replace(BIDI_CONTROL_RE_GLOBAL, '').trim();
  return stripped.split('/').map(fixSegment).reverse().join('/');
}

/** Like fixBidiVisualOrder but skips the control-char guard.
 * Use when the text has already been stripped (e.g. stored in DB) but is still in visual order. */
export function fixBidiVisualOrderForce(text: string): string {
  const stripped = text.replace(BIDI_CONTROL_RE_GLOBAL, '').trim();
  return stripped.split('/').map(fixSegment).reverse().join('/');
}

export function hasBidiControlChars(text: string): boolean {
  return BIDI_CONTROL_RE.test(text);
}

export function shouldSuggestBidiFix(texts: string[]): boolean {
  const hebrewTexts = texts.filter(text => HEBREW_RE.test(text));
  if (hebrewTexts.length === 0) return false;

  const controlMarked = hebrewTexts.filter(hasBidiControlChars).length;
  return controlMarked > 0;
}
