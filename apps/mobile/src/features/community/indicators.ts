import { lookupIndicators, reportableIndicators, type Indicators } from '@baitless/detector';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';

/**
 * Phone numbers never leave the phone as numbers: the community list stores the SHA-256 (hex) of
 * the E.164 form. Note: the number space is small, so a hash slows down but does not stop someone
 * determined from guessing a number. It still keeps plain numbers out of the database and logs.
 */
export function hashPhone(e164: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, e164);
}

export type HashedIndicators = { domains: string[]; urls: string[]; phoneHashes: string[] };

async function hashed(i: Indicators): Promise<HashedIndicators> {
  return {
    domains: i.domains,
    urls: i.urls,
    phoneHashes: await Promise.all(i.phones.map(hashPhone)),
  };
}

/** What the analyze function looks up for this message (includes parent domains). */
export const lookupFor = (text: string) => hashed(lookupIndicators(text));

/** What a report of this message adds to the community list. */
export const reportFor = (text: string) => hashed(reportableIndicators(text));
