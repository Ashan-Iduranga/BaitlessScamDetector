/** URL extraction and host heuristics. No network access here: Safe Browsing runs on the server. */

export type FoundUrl = {
  /** The URL as written in the message. */
  raw: string;
  /** Lower-cased host without "www.". Empty if it could not be parsed. */
  host: string;
  start: number;
  end: number;
  https: boolean;
};

// Matches http(s) links, www. links and bare domains with a path, plus wa.me / bit.ly style links.
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')]+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}\/[^\s<>"')]*/gi;

const TRAILING_PUNCT = /[.,;:!?]+$/;

export function extractUrls(text: string): FoundUrl[] {
  const found: FoundUrl[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[0].replace(TRAILING_PUNCT, '');
    const start = m.index ?? 0;
    found.push({
      raw,
      host: hostOf(raw),
      start,
      end: start + raw.length,
      https: /^https:/i.test(raw),
    });
  }
  return found;
}

// scheme? userinfo@? host :port? — parsed by hand because React Native's URL is incomplete.
const HOST_RE = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/?#\s]*@)?(\[[^\]]+\]|[^:/?#\s]+)/i;

export function hostOf(raw: string): string {
  const host = HOST_RE.exec(raw)?.[1] ?? '';
  return host
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '');
}

const SHORTENERS = new Set([
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
]);

/** TLDs that are cheap, rarely used by Sri Lankan businesses, and common in phishing. */
const RISKY_TLDS = new Set([
  'top',
  'xyz',
  'click',
  'link',
  'icu',
  'buzz',
  'cyou',
  'rest',
  'monster',
  'shop',
  'online',
  'site',
  'live',
  'cfd',
  'sbs',
  'store',
  'info',
  'vip',
  'win',
  'loan',
  'work',
  'support',
]);

/**
 * Brands scammers impersonate, with the domains they really use. A host that names the brand
 * but is not one of these domains (or a subdomain of one) is a lookalike.
 */
export const BRANDS: Record<string, string[]> = {
  boc: ['boc.lk'],
  peoplesbank: ['peoplesbank.lk'],
  sampath: ['sampath.lk', 'sampathbank.com'],
  commercialbank: ['combank.lk', 'combank.net'],
  combank: ['combank.lk', 'combank.net'],
  hnb: ['hnb.lk', 'hnb.net', 'hnbfinance.lk'],
  nsb: ['nsb.lk'],
  seylan: ['seylan.lk'],
  ndb: ['ndbbank.com'],
  dfcc: ['dfcc.lk'],
  dialog: ['dialog.lk'],
  mobitel: ['mobitel.lk'],
  slt: ['slt.lk', 'slt.com.lk'],
  hutch: ['hutch.lk'],
  airtel: ['airtel.lk'],
  slpost: ['slpost.gov.lk'],
  daraz: ['daraz.lk'],
  aswesuma: ['wbb.gov.lk'],
  cbsl: ['cbsl.gov.lk'],
  pickme: ['pickme.lk'],
};

export type UrlSignal =
  | 'shortener'
  | 'ip_host'
  | 'risky_tld'
  | 'brand_lookalike'
  | 'punycode'
  | 'no_https'
  | 'many_subdomains'
  | 'messaging_link';

export function urlSignals(url: FoundUrl): UrlSignal[] {
  const { host } = url;
  const signals: UrlSignal[] = [];
  if (!host) return signals;
  if (SHORTENERS.has(host)) signals.push('shortener');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) signals.push('ip_host');
  const tld = host.split('.').pop() ?? '';
  if (RISKY_TLDS.has(tld)) signals.push('risky_tld');
  if (host.split('.').some((label) => label.startsWith('xn--'))) signals.push('punycode');
  if (!url.https && !/^(wa\.me|t\.me)$/.test(host)) signals.push('no_https');
  if (host.split('.').length > 4) signals.push('many_subdomains');
  if (/^(wa\.me|t\.me|chat\.whatsapp\.com|api\.whatsapp\.com)$/.test(host))
    signals.push('messaging_link');
  if (isBrandLookalike(host)) signals.push('brand_lookalike');
  return signals;
}

/**
 * True for a host that uses a brand name without being that brand's site ("boc-verify.top").
 * Short names (3 letters: boc, hnb, ndb) only count at the start or end of a word, so unrelated
 * words that happen to contain them ("johnbrown", "standby") are not flagged.
 */
export function isBrandLookalike(host: string): boolean {
  if (isTrustedDomain(host)) return false;
  const words = host.split(/[-.]/).filter(Boolean);
  const flat = words.join('');
  for (const brand of Object.keys(BRANDS)) {
    const used =
      brand.length <= 3
        ? words.some((w) => w.startsWith(brand) || w.endsWith(brand))
        : flat.includes(brand);
    if (used) return true;
  }
  return false;
}

/** Official sites of the brands above, plus any *.gov.lk or *.ac.lk site. */
export function isTrustedDomain(host: string): boolean {
  if (
    host === 'gov.lk' ||
    host.endsWith('.gov.lk') ||
    host === 'ac.lk' ||
    host.endsWith('.ac.lk')
  ) {
    return true;
  }
  return Object.values(BRANDS).some((domains) =>
    domains.some((d) => host === d || host.endsWith(`.${d}`)),
  );
}
