/**
 * Community indicators: the links and phone numbers in a message that can be reported or looked up.
 *
 * - Domains are reported by host, and looked up by host plus parent domains, so a report of
 *   "boc-verify.top" also matches "login.boc-verify.top".
 * - Shared hosts (link shorteners, WhatsApp/Telegram links, big platforms) are never reported as a
 *   whole domain, or one scam would flag every bit.ly link. Those are kept as the full URL instead.
 * - Phone numbers are E.164 here. The app hashes them before they leave the phone. Numbers inside
 *   WhatsApp/Telegram links (wa.me/94771234567) are treated as phone numbers, never as links, so
 *   they are never stored or shown in plain text.
 * - Official sites (banks, telcos, gov.lk) are never reported: scammers often paste the real site
 *   next to their fake one to look genuine.
 */
import { extractPhones, normalizePhone } from './phone.ts';
import { extractUrls, hostOf, isTrustedDomain } from './url.ts';

/** Hosts many unrelated people use. Report the exact link, never the whole domain. */
const SHARED_HOSTS = new Set([
  // Shorteners
  'bit.ly',
  'tinyurl.com',
  'cutt.ly',
  't.ly',
  'is.gd',
  'rb.gy',
  'shorturl.at',
  'ow.ly',
  'tiny.cc',
  'rebrand.ly',
  'goo.gl',
  's.id',
  'u.to',
  // Messaging and social
  'wa.me',
  't.me',
  'chat.whatsapp.com',
  'api.whatsapp.com',
  'facebook.com',
  'm.facebook.com',
  'fb.me',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'x.com',
  'twitter.com',
  'linkedin.com',
  // Hosting and forms
  'google.com',
  'docs.google.com',
  'forms.gle',
  'drive.google.com',
  'sites.google.com',
  'github.io',
  'blogspot.com',
  'wordpress.com',
  'weebly.com',
  'wixsite.com',
  'vercel.app',
  'netlify.app',
  'pages.dev',
  'web.app',
  'firebaseapp.com',
]);

/** Second-level suffixes under which the registrable domain has three labels. */
const SL_SECOND_LEVEL = new Set([
  'com.lk',
  'gov.lk',
  'org.lk',
  'edu.lk',
  'net.lk',
  'ac.lk',
  'sch.lk',
]);

function isShared(host: string): boolean {
  return [...SHARED_HOSTS].some((h) => host === h || host.endsWith(`.${h}`));
}

/**
 * Lower-cased link without scheme, "www.", query string or trailing slash: "bit.ly/abc".
 * Query strings are dropped because they can carry the recipient's own details.
 */
export function normalizeUrl(raw: string): string {
  const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const host = hostOf(raw);
  const rest = withoutScheme.slice(withoutScheme.search(/[/?#]|$/)).replace(/[?#].*$/, '');
  return `${host}${rest}`.replace(/\/+$/, '').slice(0, 300);
}

/** The phone number in a WhatsApp or Telegram chat link, if there is one. */
function messagingNumber(raw: string): string | null {
  const m =
    /wa\.me\/\+?(\d{9,15})/i.exec(raw) ??
    /whatsapp\.com\/send\/?\?(?:[^#\s]*&)?phone=\+?(\d{9,15})/i.exec(raw) ??
    /t\.me\/\+(\d{9,15})/i.exec(raw);
  return m ? normalizePhone(`+${m[1]}`) : null;
}

/** The server only accepts plain ASCII domains; anything else (look-alike letters) goes as a link. */
const PLAIN_DOMAIN = /^[a-z0-9.-]{3,253}$/;

/** The host and its parent domains, down to the registrable domain. */
export function domainCandidates(host: string): string[] {
  const labels = host.split('.').filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join('.');
    if (SL_SECOND_LEVEL.has(candidate)) break;
    out.push(candidate);
  }
  return out;
}

export type Indicators = {
  /** Domains to report (one per link host). */
  domains: string[];
  /** Exact links on shared hosts. */
  urls: string[];
  /** Phone numbers in E.164. */
  phones: string[];
};

const MAX_EACH = 10;

const unique = (values: string[]) => [...new Set(values)].slice(0, MAX_EACH);

/** What a report of this message would add to the community list. */
export function reportableIndicators(text: string): Indicators {
  const domains: string[] = [];
  const urls: string[] = [];
  const phones = extractPhones(text).map((p) => p.e164);
  for (const url of extractUrls(text)) {
    const number = messagingNumber(url.raw);
    if (number) {
      phones.push(number);
    } else if (url.host && isTrustedDomain(url.host)) {
      continue;
    } else if (
      !url.host ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(url.host) ||
      isShared(url.host) ||
      !PLAIN_DOMAIN.test(url.host) ||
      !url.host.includes('.')
    ) {
      const link = normalizeUrl(url.raw);
      // Never send a link that still contains a phone-number-length run of digits.
      if (!/\d{9,}/.test(link)) urls.push(link);
    } else {
      domains.push(url.host);
    }
  }
  return { domains: unique(domains), urls: unique(urls), phones: unique(phones) };
}

/** What to look up for this message: like the report, plus parent domains. */
export function lookupIndicators(text: string): Indicators {
  const reportable = reportableIndicators(text);
  return {
    ...reportable,
    domains: unique(reportable.domains.flatMap(domainCandidates)),
  };
}

export const hasIndicators = (i: Indicators) =>
  i.domains.length + i.urls.length + i.phones.length > 0;

/**
 * Makes a scam link safe to show: dots become "[.]", so it is not tappable and is not turned back
 * into a link by the keyboard, share sheet or chat apps. Still readable for people.
 */
export const defang = (value: string): string => value.replace(/\./g, '[.]');
