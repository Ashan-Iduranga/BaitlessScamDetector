/**
 * Community indicators: the links and phone numbers in a message that can be reported or looked up.
 *
 * - Domains are reported by host, and looked up by host plus parent domains, so a report of
 *   "boc-verify.top" also matches "login.boc-verify.top".
 * - Shared hosts (link shorteners, WhatsApp/Telegram links, big platforms) are never reported as a
 *   whole domain, or one scam would flag every bit.ly link. Those are kept as the full URL instead.
 * - Phone numbers are E.164 here. The app hashes them before they leave the phone.
 */
import { extractPhones } from './phone.ts';
import { extractUrls, hostOf } from './url.ts';

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

/** Lower-cased link without scheme, "www." or trailing slash: "bit.ly/abc". */
export function normalizeUrl(raw: string): string {
  const withoutScheme = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const host = hostOf(raw);
  const rest = withoutScheme.slice(withoutScheme.search(/[/?#]|$/));
  return `${host}${rest}`.replace(/\/+$/, '').slice(0, 300);
}

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
  for (const url of extractUrls(text)) {
    if (!url.host || /^\d{1,3}(\.\d{1,3}){3}$/.test(url.host)) {
      urls.push(normalizeUrl(url.raw));
    } else if (isShared(url.host)) {
      urls.push(normalizeUrl(url.raw));
    } else {
      domains.push(url.host);
    }
  }
  return {
    domains: unique(domains),
    urls: unique(urls),
    phones: unique(extractPhones(text).map((p) => p.e164)),
  };
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
