import { describe, expect, it } from 'vitest';

import { AiResult, levelForScore } from './schema.ts';

describe('levelForScore', () => {
  it.each([
    [0, 'safe'],
    [34, 'safe'],
    [35, 'caution'],
    [69, 'caution'],
    [70, 'danger'],
    [100, 'danger'],
  ] as const)('%i -> %s', (score, level) => {
    expect(levelForScore(score)).toBe(level);
  });
});

describe('AiResult', () => {
  it('rejects an unknown category', () => {
    const result = AiResult.safeParse({
      isScam: true,
      confidence: 0.9,
      category: 'crypto-moon',
      redFlagPhrases: [],
      explanation: 'x',
      recommendedAction: 'y',
    });
    expect(result.success).toBe(false);
  });
});
