import TextRecognition from '@react-native-ml-kit/text-recognition';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';

import { ensureSession, supabase } from '@/lib/supabase';

/** Below this many characters, a reader found nothing useful. */
export const MIN_READ_LENGTH = 8;

/**
 * Whether on-device text looks like a real message. ML Kit turns Sinhala/Tamil script into short
 * Latin gibberish ("qObsa 0771234567"), so count letters, not characters: digits alone don't count.
 */
export function looksReadable(text: string): boolean {
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  return letters >= 20;
}

/**
 * Reads text from a screenshot on the device with ML Kit. ML Kit reads Latin script only, so
 * Sinhala and Tamil screenshots come back empty or garbled; use `readImageOnline` for those.
 */
export async function recognizeImage(uri: string): Promise<string> {
  const result = await TextRecognition.recognize(uri);
  return result.text.trim();
}

/** Lets the user pick a screenshot. Returns null if they cancel. */
export async function pickScreenshot(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

export type OnlineReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'offline' | 'rate_limited' | 'unavailable' | 'failed' };

// The server allows Gemini 12 s for a picture; the rest covers resizing, upload and sign-in.
const ONLINE_TIMEOUT_MS = 20000;
const Response = z.object({ text: z.string() });

/**
 * Sends the screenshot to the `read-image` Edge Function (Gemini vision), which copies the message
 * text in any script. Only call this after the user has agreed: the picture is sent as it is.
 */
export async function readImageOnline(uri: string): Promise<OnlineReadResult> {
  try {
    // 1080 px wide is enough for phone text and keeps the upload to a few hundred KB.
    const image = await ImageManipulator.manipulate(uri, { maxWidth: 1080 }).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
    if (!saved.base64) return { ok: false, reason: 'failed' };

    await ensureSession();
    const call = supabase.functions.invoke('read-image', {
      body: { image: saved.base64, mimeType: 'image/jpeg' },
    });
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ONLINE_TIMEOUT_MS),
    );
    const { data, error } = await Promise.race([call, timeout]);
    if (error) throw error;
    return { ok: true, text: Response.parse(data).text.trim() };
  } catch (e) {
    if (__DEV__) console.warn('read-image failed', e);
    return { ok: false, reason: await reasonFor(e) };
  }
}

async function reasonFor(
  e: unknown,
): Promise<'offline' | 'rate_limited' | 'unavailable' | 'failed'> {
  if (e instanceof FunctionsHttpError) {
    const status = (e.context as { status?: number } | undefined)?.status;
    if (status === 429) return 'rate_limited';
    if (status === 503) return 'unavailable';
    return 'failed';
  }
  const name = (e as { name?: string })?.name ?? '';
  const message = String((e as { message?: string })?.message ?? '');
  if (name === 'FunctionsFetchError' || /network request failed|fetch failed/i.test(message))
    return 'offline';
  return 'failed';
}
