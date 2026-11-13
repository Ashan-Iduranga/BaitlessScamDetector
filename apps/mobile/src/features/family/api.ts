import { reportableIndicators, ScamCategory, type RiskReport } from '@baitless/detector';
import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import { ensureSession, supabase } from '@/lib/supabase';

export const familyKeys = {
  all: ['family'] as const,
  links: ['family', 'links'] as const,
  alerts: ['family', 'alerts'] as const,
};

const LinkSchema = z.object({
  id: z.number(),
  guardian_id: z.string(),
  protected_id: z.string(),
  protected_name: z.string(),
  guardian_name: z.string(),
  created_at: z.string(),
});
export type FamilyLink = z.infer<typeof LinkSchema>;

const AlertSchema = z.object({
  id: z.number(),
  protected_id: z.string(),
  level: z.enum(['caution', 'danger']),
  category: ScamCategory,
  source: z.enum(['sms', 'check']),
  link: z.string().nullable(),
  created_at: z.string(),
});
export type GuardianAlert = z.infer<typeof AlertSchema>;

export type Family = {
  me: string;
  /** People this user looks after (this user is their guardian). */
  lookingAfter: FamilyLink[];
  /** People looking after this user. */
  guardians: FamilyLink[];
};

// --- Flags kept on the phone, so background work knows whether to do anything at all. ---

/** This user may have guardians (true from creating an invite until the server says none). */
const MAY_HAVE_GUARDIANS = 'family.mayHaveGuardians';
/** This user looks after someone. */
const IS_GUARDIAN = 'family.isGuardian';
/** Until when this user's newest invite code can still be accepted (ms). */
const INVITE_UNTIL = 'family.inviteUntil';

const inviteOpen = () => Number(Storage.getItemSync(INVITE_UNTIL) ?? 0) > Date.now();

const flag = (key: string) => Storage.getItemSync(key) === '1';
const setFlag = (key: string, on: boolean) => Storage.setItemSync(key, on ? '1' : '0');

export const mayHaveGuardians = () => flag(MAY_HAVE_GUARDIANS);
export const isGuardian = () => flag(IS_GUARDIAN);
/** Whether the Family screens need the server at all (no account is created otherwise). */
export const familyInUse = () => mayHaveGuardians() || isGuardian();

// --- Errors ---

export type FamilyFailure =
  | 'invite_not_found'
  | 'invite_own'
  | 'too_many_guardians'
  | 'too_many_invites'
  | 'too_many_protected'
  | 'offline'
  | 'failed';

const KNOWN: FamilyFailure[] = [
  'invite_not_found',
  'invite_own',
  'too_many_guardians',
  'too_many_invites',
  'too_many_protected',
];

export class FamilyError extends Error {
  constructor(readonly reason: FamilyFailure) {
    super(reason);
  }
}

function toFamilyError(error: { message?: string } | null | undefined): FamilyError {
  const message = error?.message ?? '';
  const known = KNOWN.find((k) => message.includes(k));
  if (known) return new FamilyError(known);
  if (/network request failed|fetch failed/i.test(message)) return new FamilyError('offline');
  if (__DEV__) console.warn('family request failed', error);
  return new FamilyError('failed');
}

export const familyFailure = (e: unknown): FamilyFailure =>
  e instanceof FamilyError ? e.reason : 'failed';

async function signedIn(): Promise<string> {
  try {
    await ensureSession();
  } catch {
    throw new FamilyError('offline');
  }
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new FamilyError('failed');
  return id;
}

// --- Requests ---

export async function fetchFamily(): Promise<Family> {
  const me = await signedIn();
  const { data, error } = await supabase.from('family_links').select('*').order('created_at');
  if (error) throw toFamilyError(error);
  const links = z.array(LinkSchema).parse(data);
  const family = {
    me,
    lookingAfter: links.filter((l) => l.guardian_id === me),
    guardians: links.filter((l) => l.protected_id === me),
  };
  setFlag(IS_GUARDIAN, family.lookingAfter.length > 0);
  // Keep "maybe" while an invite could still be accepted on the other phone.
  setFlag(MAY_HAVE_GUARDIANS, family.guardians.length > 0 || inviteOpen());
  return family;
}

/** Alerts from the people this user looks after, newest first (the server keeps 30 days). */
export async function fetchGuardianAlerts(me: string): Promise<GuardianAlert[]> {
  const { data, error } = await supabase
    .from('guardian_alerts')
    .select('*')
    .neq('protected_id', me)
    .order('id', { ascending: false })
    .limit(50);
  if (error) throw toFamilyError(error);
  return z.array(AlertSchema).parse(data);
}

export async function createInvite(name: string): Promise<{ code: string; expiresAt: string }> {
  await signedIn();
  const { data, error } = await supabase.rpc('create_family_invite', {
    p_protected_name: name.trim(),
  });
  if (error) throw toFamilyError(error);
  const row = z.array(z.object({ code: z.string(), expires_at: z.string() })).parse(data)[0];
  if (!row) throw new FamilyError('failed');
  setFlag(MAY_HAVE_GUARDIANS, true);
  Storage.setItemSync(INVITE_UNTIL, String(Date.parse(row.expires_at)));
  return { code: row.code, expiresAt: row.expires_at };
}

/** Returns the name the protected person chose for themselves. */
export async function acceptInvite(code: string, guardianName: string): Promise<string> {
  await signedIn();
  const { data, error } = await supabase.rpc('accept_family_invite', {
    p_code: code,
    p_guardian_name: guardianName.trim(),
  });
  if (error) throw toFamilyError(error);
  setFlag(IS_GUARDIAN, true);
  return z.string().parse(data);
}

export async function removeLink(id: number): Promise<void> {
  const { error } = await supabase.from('family_links').delete().eq('id', id);
  if (error) throw toFamilyError(error);
}

/**
 * Tells this user's guardians about a likely scam: level, type, where it came from and the scam
 * link. Never the message text. Only for "danger", so guardians are not flooded.
 */
export async function sendGuardianAlert(
  report: RiskReport,
  text: string,
  source: 'sms' | 'check',
): Promise<void> {
  if (report.level !== 'danger' || !mayHaveGuardians()) return;
  try {
    await ensureSession();
    const { domains, urls } = reportableIndicators(text);
    const { error } = await supabase.from('guardian_alerts').insert({
      level: report.level,
      category: report.category,
      source,
      link: domains[0] ?? urls[0] ?? null,
    });
    // Refused: nobody is linked. Stop trying, unless an invite code may still be accepted.
    if (error?.code === '42501') setFlag(MAY_HAVE_GUARDIANS, inviteOpen());
    else if (error && __DEV__) console.warn('guardian alert failed', error);
  } catch (e) {
    if (__DEV__) console.warn('guardian alert failed', e);
  }
}
