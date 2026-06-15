// Respectful auto-formatter for community stories.
// Goal: never change wording, never sanitize voice. Only fix presentation
// issues: ALL-CAPS shouting, wall-of-text, runaway whitespace.
//
// The author's exact original text is always preserved separately in
// `stories.original_content` so the admin keeps the unedited copy.

const SENTENCE_END = /([.!?]+)(\s+|$)/g;

/** True if a chunk is dominated by uppercase letters (shouting). */
function isShouting(s: string): boolean {
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length < 20) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.7;
}

/** Convert a shouted chunk to sentence case while preserving punctuation. */
function softenCaps(s: string): string {
  const lower = s.toLowerCase();
  // Capitalize first letter of each sentence.
  let out = lower.replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase());
  // Always-capitalized: standalone I, common proper-noun-ish words can't be
  // recovered safely without changing meaning, so we leave them. Restoring
  // the pronoun "I" is the one safe universal fix.
  out = out.replace(/\bi\b/g, "I");
  out = out.replace(/\bi'(m|ve|ll|d|re)\b/g, (_m, suf) => "I'" + suf);
  return out;
}

/** Re-flow into readable paragraphs without dropping or changing words. */
export function formatStoryContent(input: string): string {
  if (!input) return input;
  let text = input.replace(/\r\n?/g, "\n").trim();

  // Collapse 3+ blank lines down to a single paragraph break.
  text = text.replace(/\n{3,}/g, "\n\n");

  // Split on existing paragraph breaks; process each.
  const paragraphs = text.split(/\n{2,}/).map((para) => {
    let p = para.trim();
    if (!p) return p;

    // Collapse single newlines inside a paragraph into spaces (so soft wraps
    // from a phone keyboard don't fragment the prose).
    p = p.replace(/\n+/g, " ").replace(/\s{2,}/g, " ");

    if (isShouting(p)) p = softenCaps(p);

    // If the paragraph is a wall of text (no breaks, many sentences),
    // group every ~3 sentences into its own paragraph for readability.
    const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [p];
    if (sentences.length >= 6 && p.length > 600) {
      const groups: string[] = [];
      for (let i = 0; i < sentences.length; i += 3) {
        groups.push(sentences.slice(i, i + 3).join("").trim());
      }
      return groups.join("\n\n");
    }
    return p;
  });

  return paragraphs.filter(Boolean).join("\n\n");
}
