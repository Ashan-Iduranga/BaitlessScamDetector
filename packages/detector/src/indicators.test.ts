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
  it('drops scheme, www, query string and trailing slash, lower-cases the host', () => {
    expect(normalizeUrl('https://www.Bit.ly/AbC/')).toBe('bit.ly/AbC');
    expect(normalizeUrl('wa.me/94771234567?text=hi')).toBe('wa.me/94771234567');
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
    expect(i.urls).toEqual(['bit.ly/3abcd']);
  });

  it('turns WhatsApp and Telegram chat links into phone numbers, never plain links', () => {
    const i = reportableIndicators(
      'Chat wa.me/94771234567 or https://api.whatsapp.com/send?phone=94761234567&text=hi or t.me/+94711234567',
    );
    expect(i.urls).toEqual([]);
    expect(i.phones).toEqual(['+94771234567', '+94761234567', '+94711234567']);
  });

  it('never reports the real bank or government site a scammer pasted in', () => {
    const i = reportableIndicators('Visit boc.lk/help or www.cbsl.gov.lk, then pay at evil.top/x');
    expect(i.domains).toEqual(['evil.top']);
  });

  it('drops query strings, which can carry the recipient details', () => {
    const i = reportableIndicators('Pay https://bit.ly/abc?ref=kamal&acct=1234 now');
    expect(i.urls).toEqual(['bit.ly/abc']);
  });

  it('reports a look-alike host with non-English letters as an exact link', () => {
    const i = reportableIndicators('Login at https://bоc-secure.top/login');
    expect(i.domains).toEqual([]);
    expect(i.urls).toEqual(['bоc-secure.top/login']);
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
