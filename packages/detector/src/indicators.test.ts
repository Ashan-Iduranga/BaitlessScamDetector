import { describe, expect, it } from 'vitest';

import {
  defang,
  domainCandidates,
  hasIndicators,
  lookupIndicators,
  normalizeUrl,
  reportableIndicators,
} from './indicators.ts';

describe('normalizeUrl', () => {
  it('drops scheme, www and trailing slash, lower-cases the host', () => {
    expect(normalizeUrl('https://www.Bit.ly/AbC/')).toBe('bit.ly/AbC');
    expect(normalizeUrl('wa.me/94771234567?text=hi')).toBe('wa.me/94771234567?text=hi');
  });
});

describe('domainCandidates', () => {
  it('walks up to the registrable domain', () => {
    expect(domainCandidates('login.secure.boc-verify.top')).toEqual([
      'login.secure.boc-verify.top',
      'secure.boc-verify.top',
      'boc-verify.top',
    ]);
  });

  it('stops at Sri Lankan second-level suffixes', () => {
    expect(domainCandidates('pay.fakebank.com.lk')).toEqual([
      'pay.fakebank.com.lk',
      'fakebank.com.lk',
    ]);
  });
});

describe('reportableIndicators', () => {
  it('reports scam domains by host, and shared hosts by exact link', () => {
    const i = reportableIndicators(
      'Verify at http://login.boc-verify.top/x or bit.ly/3abcd, or WhatsApp wa.me/94771234567',
    );
    expect(i.domains).toEqual(['login.boc-verify.top']);
    expect(i.urls).toEqual(['bit.ly/3abcd', 'wa.me/94771234567']);
  });

  it('collects Sri Lankan numbers as E.164, once each', () => {
    const i = reportableIndicators('Call 077 123 4567 or +94771234567 now');
    expect(i.phones).toEqual(['+94771234567']);
  });

  it('never reports a whole shared platform', () => {
    const i = reportableIndicators(
      'Form: https://docs.google.com/forms/d/abc and https://x.github.io/',
    );
    expect(i.domains).toEqual([]);
    expect(i.urls).toHaveLength(2);
  });

  it('is empty for a message with no links or numbers', () => {
    expect(hasIndicators(reportableIndicators('Hi, see you at 5'))).toBe(false);
  });
});

describe('lookupIndicators', () => {
  it('adds parent domains for lookups', () => {
    const i = lookupIndicators('Go to https://login.boc-verify.top/');
    expect(i.domains).toEqual(['login.boc-verify.top', 'boc-verify.top']);
  });
});

describe('defang', () => {
  it('breaks every dot so the link cannot be opened', () => {
    expect(defang('boc-verify.top')).toBe('boc-verify[.]top');
    expect(defang('bit.ly/a.b')).toBe('bit[.]ly/a[.]b');
  });
});
