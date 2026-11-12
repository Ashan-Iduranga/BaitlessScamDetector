/** Sri Lankan phone number extraction and normalisation. */

export type FoundPhone = {
  raw: string;
  /** E.164, e.g. +94771234567 */
  e164: string;
  mobile: boolean;
  start: number;
  end: number;
};

// +94 / 0094 / 94 / 0 prefix, then 9 digits, with optional spaces or dashes between groups.
const PHONE_RE = /(?<![\d+])(?:\+94|0094|94|0)[\s-]?(\d{2})[\s-]?(\d{3})[\s-]?(\d{4})(?!\d)/g;

export function extractPhones(text: string): FoundPhone[] {
  const out: FoundPhone[] = [];
  for (const m of text.matchAll(PHONE_RE)) {
    const digits = `${m[1]}${m[2]}${m[3]}`;
    const start = m.index ?? 0;
    out.push({
      raw: m[0],
      e164: `+94${digits}`,
      mobile: digits.startsWith('7'),
      start,
      end: start + m[0].length,
    });
  }
  return out;
}

/** Normalises any SL number format to E.164, or returns null. */
export function normalizePhone(input: string): string | null {
  const [first] = extractPhones(input.trim());
  return first && first.raw.replace(/[\s-]/g, '').length >= 10 ? first.e164 : null;
}
