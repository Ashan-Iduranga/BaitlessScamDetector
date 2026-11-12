import { extractPhones } from './phone.ts';
import { DAMPENERS, isNegated, TEXT_RULES } from './rules.ts';
import {
  levelForScore,
  type AiResult,
  type RedFlag,
  type RiskReport,
  type RuleResult,
  type ScamCategory,
} from './schema.ts';
import { extractUrls, urlSignals, type UrlSignal } from './url.ts';

/** Evidence weights for link features. */
const URL_WEIGHTS: Record<UrlSignal, { weight: number; reason: string }> = {
  brand_lookalike: { weight: 0.55, reason: 'Link pretends to be a well-known company' },
  ip_host: { weight: 0.45, reason: 'Link uses a raw IP address' },
  punycode: { weight: 0.45, reason: 'Link uses look-alike letters' },
  shortener: { weight: 0.25, reason: 'Link is shortened so you cannot see where it goes' },
  risky_tld: { weight: 0.3, reason: 'Link uses a domain ending common in scams' },
  no_https: { weight: 0.15, reason: 'Link is not secure (no https)' },
  many_subdomains: { weight: 0.2, reason: 'Link has an unusually long address' },
  messaging_link: { weight: 0.1, reason: 'Moves the chat to WhatsApp or Telegram' },
};

/** Any link at all is weak evidence: most genuine SMS from banks don't contain links. */
const ANY_LINK = { weight: 0.15, reason: 'Contains a link' };

/** Combine independent evidence: 1 - Π(1 - w). */
function combine(weights: number[]): number {
  return 1 - weights.reduce((acc, w) => acc * (1 - w), 1);
}

/** Runs the on-device checks. Fast, offline, and never sends anything anywhere. */
export function analyzeText(text: string): RuleResult {
  const flags: RedFlag[] = [];
  const weights: number[] = [];
  const categoryWeight = new Map<ScamCategory, number>();

  for (const rule of TEXT_RULES) {
    let hit: RedFlag | null = null;
    for (const pattern of rule.patterns) {
      const re = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
      );
      for (const m of text.matchAll(re)) {
        const start = m.index ?? 0;
        if (rule.negatable && isNegated(text, start)) continue;
        hit = { ruleId: rule.id, start, end: start + m[0].length, reason: rule.reason };
        break;
      }
      if (hit) break;
    }
    if (!hit) continue;
    flags.push(hit);
    weights.push(rule.weight);
    if (rule.category)
      categoryWeight.set(rule.category, (categoryWeight.get(rule.category) ?? 0) + rule.weight);
  }

  const urls = extractUrls(text);
  if (urls.length) weights.push(ANY_LINK.weight);
  for (const url of urls) {
    const signals = urlSignals(url);
    // Count each signal once per message, at the strongest link.
    for (const signal of signals) {
      if (flags.some((f) => f.ruleId === `url_${signal}`)) continue;
      const { weight, reason } = URL_WEIGHTS[signal];
      flags.push({ ruleId: `url_${signal}`, start: url.start, end: url.end, reason });
      weights.push(weight);
    }
  }
  if (urls.length && !flags.some((f) => f.ruleId.startsWith('url_'))) {
    const [first] = urls;
    if (first)
      flags.push({
        ruleId: 'url_any',
        start: first.start,
        end: first.end,
        reason: ANY_LINK.reason,
      });
  }

  let score = combine(weights);
  for (const d of DAMPENERS) {
    if (d.patterns.some((p) => p.test(text))) score *= d.factor;
  }

  // Bank-themed threats are the most common SL scam; credential requests alone imply bank too.
  let category: ScamCategory = 'none';
  let best = 0;
  for (const [cat, w] of categoryWeight) {
    if (w > best) {
      best = w;
      category = cat;
    }
  }
  if (category === 'none' && score >= 0.35) category = 'other';

  return {
    score: Math.round(score * 100),
    category,
    flags: flags.sort((a, b) => a.start - b.start),
    urls: urls.map((u) => u.raw),
    phoneNumbers: [...new Set(extractPhones(text).map((p) => p.e164))],
  };
}

export type ServerSignals = {
  ai: AiResult | null;
  /** URLs that Google Safe Browsing reported as dangerous. */
  unsafeUrls: string[];
  /** Phone numbers or domains confirmed as scams by the community (Phase 2). */
  communityHits: string[];
};

/**
 * Merges on-device rules with server results into the report the user sees.
 * Pass `server: null` when offline or when the server call failed.
 */
export function buildReport(rules: RuleResult, server: ServerSignals | null): RiskReport {
  if (!server) {
    return {
      score: rules.score,
      level: levelForScore(rules.score),
      category: rules.category,
      flags: rules.flags,
      explanation: '',
      recommendedAction: '',
      offline: true,
      sources: { rules: true, safeBrowsing: false, community: false, ai: false },
    };
  }

  const { ai, unsafeUrls, communityHits } = server;
  let score = rules.score;
  if (ai) {
    const aiScore = ai.isScam ? 50 + ai.confidence * 50 : 50 - ai.confidence * 50;
    // The AI understands context the rules miss; the rules are predictable. Weight them evenly.
    score = Math.round(0.5 * rules.score + 0.5 * aiScore);
  }
  // Hard evidence overrides everything.
  if (unsafeUrls.length || communityHits.length) score = Math.max(score, 90);

  const category = ai && ai.category !== 'none' && ai.isScam ? ai.category : rules.category;

  return {
    score,
    level: levelForScore(score),
    category: levelForScore(score) === 'safe' ? 'none' : category,
    flags: rules.flags,
    explanation: ai?.explanation ?? '',
    recommendedAction: ai?.recommendedAction ?? '',
    offline: false,
    sources: {
      rules: true,
      safeBrowsing: unsafeUrls.length > 0,
      community: communityHits.length > 0,
      ai: Boolean(ai),
    },
  };
}
