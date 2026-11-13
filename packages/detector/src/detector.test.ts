import { describe, expect, it } from 'vitest';

import {
  analyzeText,
  buildReport,
  extractPhones,
  extractUrls,
  maskPii,
  normalizePhone,
  urlSignals,
} from './index.ts';

describe('extractUrls / urlSignals', () => {
  it('finds http, www and bare-domain links and trims punctuation', () => {
    const urls = extractUrls(
      'Go to http://boc-verify.top/login. Or www.example.com, or bit.ly/abc!',
    );
    expect(urls.map((u) => u.raw)).toEqual([
      'http://boc-verify.top/login',
      'www.example.com',
      'bit.ly/abc',
    ]);
  });

  it('flags a brand lookalike but not the real domain', () => {
    const [fake] = extractUrls('https://boc-secure.lk/login');
    const [real] = extractUrls('https://www.boc.lk/personal');
    expect(urlSignals(fake!)).toContain('brand_lookalike');
    expect(urlSignals(real!)).not.toContain('brand_lookalike');
  });

  it('flags shorteners, IP hosts and risky TLDs', () => {
    expect(urlSignals(extractUrls('https://bit.ly/x')[0]!)).toContain('shortener');
    expect(urlSignals(extractUrls('http://203.0.113.9/pay')[0]!)).toContain('ip_host');
    expect(urlSignals(extractUrls('https://parcel-track.xyz/a')[0]!)).toContain('risky_tld');
  });
});

describe('phones', () => {
  it.each([
    ['0771234567', '+94771234567'],
    ['077 123 4567', '+94771234567'],
    ['+94 77-123-4567', '+94771234567'],
    ['0094771234567', '+94771234567'],
    ['0112345678', '+94112345678'],
  ])('%s -> %s', (input, e164) => {
    expect(normalizePhone(input)).toBe(e164);
  });

  it('marks mobiles', () => {
    const [mobile, land] = extractPhones('call 0771234567 or 0112345678');
    expect(mobile?.mobile).toBe(true);
    expect(land?.mobile).toBe(false);
  });
});

describe('maskPii', () => {
  const cases: [string, string[]][] = [
    ['Your OTP for BOC Smart transaction of Rs. 4,500.00 is 482913. Do not share.', ['482913']],
    ['Card 4111 1111 1111 1111 was charged', ['4111 1111 1111 1111']],
    ['NIC 199012345678 and old 901234567V', ['199012345678', '901234567V']],
    [
      'Call me on 077 123 4567 or mail kamal.perera@gmail.com',
      ['077 123 4567', 'kamal.perera@gmail.com'],
    ],
    ['Account 0012345678901 credited', ['0012345678901']],
    ['Dear Kamal, your parcel is ready', ['Kamal']],
    ['ඔබගේ OTP කේතය 739201 වේ', ['739201']],
  ];

  it.each(cases)('removes secrets from: %s', (text, secrets) => {
    const { masked, count } = maskPii(text);
    for (const secret of secrets) expect(masked).not.toContain(secret);
    expect(count).toBeGreaterThan(0);
  });

  it('keeps money amounts and links', () => {
    const { masked } = maskPii('Pay Rs. 4500 at https://pay.example.test/x now');
    expect(masked).toContain('Rs. 4500');
    expect(masked).toContain('https://pay.example.test/x');
  });

  it('does not treat "Dear Customer" as a name', () => {
    expect(maskPii('Dear Customer, hello').masked).toBe('Dear Customer, hello');
  });
});

describe('analyzeText', () => {
  it('scores a classic bank phishing SMS as danger', () => {
    const r = analyzeText(
      'Your BOC account has been blocked. Verify your details within 24 hours: http://boc-verify.top/login',
    );
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.category).toBe('bank');
    expect(r.flags.map((f) => f.ruleId)).toEqual(
      expect.arrayContaining([
        'account_threat',
        'credential_request',
        'urgency',
        'url_brand_lookalike',
      ]),
    );
  });

  it('keeps a genuine OTP message in the safe band', () => {
    const r = analyzeText(
      'Your OTP is 482913. Do not share this code with anyone, including bank staff.',
    );
    expect(r.score).toBeLessThan(35);
  });

  it('red-flag offsets point at the matched text', () => {
    const text = 'Congratulations! You have won a prize.';
    const flag = analyzeText(text).flags.find((f) => f.ruleId === 'prize')!;
    expect(text.slice(flag.start, flag.end).toLowerCase()).toContain('congratulations');
  });

  it('detects Sinhala and Tamil scams', () => {
    expect(
      analyzeText('සුබ පැතුම්! ඔබ ත්‍යාගයක් දිනා ඇත. රු. 3,000ක ගාස්තුවක් ගෙවන්න').score,
    ).toBeGreaterThanOrEqual(35);
    expect(
      analyzeText('வாழ்த்துக்கள்! நீங்கள் பரிசு வென்றுள்ளீர்கள். கட்டணம் செலுத்துங்கள்').score,
    ).toBeGreaterThanOrEqual(35);
  });
});

describe('buildReport', () => {
  const rules = analyzeText('Congratulations, you won! Pay the processing fee.');

  it('marks rules-only reports as offline', () => {
    const report = buildReport(rules, null);
    expect(report.offline).toBe(true);
    expect(report.score).toBe(rules.score);
  });

  it('a Safe Browsing hit forces danger', () => {
    const report = buildReport(analyzeText('hello'), {
      ai: null,
      unsafeUrls: ['http://x.test'],
      communityHits: [],
    });
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.level).toBe('danger');
  });

  it('blends the AI verdict with the rules', () => {
    const report = buildReport(rules, {
      ai: {
        isScam: true,
        confidence: 1,
        category: 'lottery_prize',
        redFlagPhrases: [],
        explanation: 'Prize scams ask for a fee.',
        recommendedAction: 'Do not pay.',
      },
      unsafeUrls: [],
      communityHits: [],
    });
    expect(report.score).toBe(Math.round(0.5 * rules.score + 50));
    expect(report.explanation).toBe('Prize scams ask for a fee.');
    expect(report.sources.ai).toBe(true);
  });
});

describe('job offers in Sinhala and Tamil', () => {
  const flagged = (text: string) => analyzeText(text).flags.some((f) => f.ruleId === 'job_offer');

  it('finds part-time job offers whether or not the words are joined', () => {
    expect(flagged('අර්ධකාලීන රැකියාවක්! නිවසේ සිට දිනකට රු. 15,000ක් උපයන්න')).toBe(true);
    expect(flagged('பகுதிநேர வேலை! வீட்டிலிருந்தே நாளொன்றுக்கு ரூ. 15,000 சம்பாதியுங்கள்')).toBe(true);
    expect(flagged('பகுதி நேர வேலை, தினமும் ரூ 5000')).toBe(true);
  });

  it('does not flag an ordinary message about home', () => {
    expect(flagged('நான் வீட்டில் இருக்கிறேன், மாலை சந்திப்போம்')).toBe(false);
  });
});
