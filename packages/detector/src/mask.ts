/**
 * Removes personal details before any text leaves the phone. Runs on the device.
 *
 * Masked: emails, card numbers, NIC numbers, phone numbers, OTP/PIN codes and account-like digit
 * runs. Links are kept, because the server needs them for Safe Browsing. Names are not reliably
 * detectable and are only masked after a greeting ("Dear Kamal").
 */

type Replacer = { tag: string; re: RegExp };

const BEFORE_OTP: Replacer[] = [
  { tag: '[EMAIL]', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  // 13-19 digit card numbers, optionally grouped in fours.
  { tag: '[CARD]', re: /\b(?:\d[ -]?){12,18}\d\b/g },
  // New NIC (12 digits) and old NIC (9 digits + V/X).
  { tag: '[NIC]', re: /\b(?:\d{12}|\d{9}[vVxX])\b/g },
  // Phone numbers (same shapes as phone.ts).
  { tag: '[PHONE]', re: /(?<![\d+])(?:\+94|0094|94|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g },
];

// Any of these words means short codes in the message are probably secrets.
const SECRET_CONTEXT =
  /\b(otp|one[- ]time|passcode|pin|verification|code)\b|කේත|රහස් අංක|குறியீடு|கடவுச்சொல்/i;
// A standalone 4-8 digit number that is not a money amount ("Rs. 4500", "4,500.00").
const SHORT_CODE = /(?<![\d.,])(?<!rs\.?\s?)(?<!lkr\s?)\d{4,8}(?![\d.,]\d)/gi;

const AFTER_OTP: Replacer[] = [
  // Remaining long digit runs look like account numbers.
  { tag: '[ACCOUNT]', re: /\b\d{8,16}\b/g },
];

// Greeting in any case, followed by a capitalised word.
const GREETING_NAME =
  /\b([Dd]ear|[Hh]i|[Hh]ello|[Mm]rs?\.?|[Mm]s\.?|[Mm]iss)\s+([A-Z][a-z]{2,})(?=[\s,.!]|$)/g;
const NOT_A_NAME = /^(customer|sir|madam|user|friend|all|there|valued|member)$/i;

export function maskPii(text: string): { masked: string; count: number } {
  let count = 0;
  const apply = (input: string, list: Replacer[]) =>
    list.reduce(
      (acc, { tag, re }) =>
        acc.replace(re, () => {
          count++;
          return tag;
        }),
      input,
    );

  let masked = apply(text, BEFORE_OTP);
  if (SECRET_CONTEXT.test(masked)) {
    masked = masked.replace(SHORT_CODE, () => {
      count++;
      return '[OTP]';
    });
  }
  masked = apply(masked, AFTER_OTP);
  masked = masked.replace(GREETING_NAME, (whole, greeting: string, name: string) => {
    if (NOT_A_NAME.test(name)) return whole;
    count++;
    return `${greeting} [NAME]`;
  });
  return { masked, count };
}
