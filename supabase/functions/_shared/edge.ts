// Helpers shared by the Edge Functions. Hand-written (unlike schema.ts, which is generated).

// Both functions share the same table and hourly budget (30 per user, 600 overall). The limits
// live in the reserve_ai_request database function.

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Runs `fn` with an AbortSignal that fires after `ms`. */
export async function withTimeout<T>(
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// Structural type for the admin client, so this file does not pin a supabase-js version.
type AdminClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

/**
 * Counts this request before any paid work starts, so parallel or failing calls still count.
 * Returns the usage row id, or a response to send back (over the limit, or the check failed).
 */
export async function reserveRequest(
  admin: AdminClient,
  userId: string,
  kind: 'analyze' | 'read_image',
): Promise<{ requestId: number } | { response: Response }> {
  const { data, error } = await admin.rpc('reserve_ai_request', { p_user: userId, p_kind: kind });
  const row = (data as { request_id: number | null; outcome: string }[] | null)?.[0];
  if (error || !row) return { response: json(500, { error: 'rate_limit_check_failed' }) };
  if (row.outcome === 'user_limit') return { response: json(429, { error: 'rate_limited' }) };
  if (row.outcome !== 'ok' || row.request_id === null) {
    return { response: json(503, { error: 'busy' }) };
  }
  return { requestId: row.request_id };
}

// Tried in order. The free tier sometimes answers 503 "high demand" for one model while another
// still has room, so a second model is the cheapest way to stay up. GEMINI_MODEL pins one model.
const PINNED_MODEL = Deno.env.get('GEMINI_MODEL');
export const GEMINI_MODELS = PINNED_MODEL
  ? [PINNED_MODEL]
  : ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

/**
 * Errors worth trying the next model for: overload, rate limit, server error, our own timeout, and
 * 400/404, which is what a retired or renamed model returns (the main reason to have a fallback).
 */
function isRetryable(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  const status = (e as { status?: number })?.status;
  return (
    status === 400 || status === 404 || status === 429 || (status !== undefined && status >= 500)
  );
}

class GeminiHttpError extends Error {
  constructor(
    readonly status: number,
    body: string,
  ) {
    super(`gemini ${status}: ${body.slice(0, 200)}`);
  }
}

/**
 * Calls Gemini generateContent with a JSON response schema and returns the parsed JSON.
 * `timeoutMs` is the budget for all attempts together: the first model gets 60% of it, and the
 * fallback model gets whatever is left (all of it if the first one failed fast).
 */
export async function geminiJson(opts: {
  key: string;
  timeoutMs: number;
  system: string;
  parts: Record<string, unknown>[];
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  /** Short label for the log line. */
  label: string;
}): Promise<unknown> {
  const deadline = Date.now() + opts.timeoutMs;
  let lastError: unknown;
  for (const [i, model] of GEMINI_MODELS.entries()) {
    const remaining = deadline - Date.now();
    if (remaining < 500) break;
    const isLast = i === GEMINI_MODELS.length - 1;
    const budget = isLast ? remaining : Math.round(remaining * 0.6);
    const started = Date.now();
    try {
      const result = await callModel(model, budget, opts);
      console.log(`gemini ${opts.label} ${model} ok ${Date.now() - started}ms ${result.usage}`);
      return result.json;
    } catch (e) {
      lastError = e;
      const why = e instanceof Error ? e.message.split('\n')[0]!.slice(0, 80) : 'unknown';
      console.warn(`gemini ${opts.label} ${model} failed after ${Date.now() - started}ms: ${why}`);
      if (!isRetryable(e)) break;
    }
  }
  throw lastError ?? new Error('gemini: no time left');
}

async function callModel(
  model: string,
  timeoutMs: number,
  opts: {
    key: string;
    system: string;
    parts: Record<string, unknown>[];
    schema: Record<string, unknown>;
    maxOutputTokens: number;
  },
): Promise<{ json: unknown; usage: string }> {
  const res = await withTimeout(timeoutMs, (signal) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opts.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system }] },
        contents: [{ role: 'user', parts: opts.parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: opts.maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema: opts.schema,
          // Scam checks need speed more than deep reasoning.
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
      }),
    }),
  );
  if (!res.ok) throw new GeminiHttpError(res.status, await res.text());
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    usageMetadata?: Record<string, number>;
  };
  // Token counts only, never content.
  const u = body.usageMetadata ?? {};
  return {
    json: JSON.parse(body.candidates?.[0]?.content?.parts?.[0]?.text ?? ''),
    usage: `in=${u.promptTokenCount} out=${u.candidatesTokenCount} thoughts=${u.thoughtsTokenCount ?? 0}`,
  };
}
